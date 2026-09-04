import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import Stripe from "stripe";

initializeApp();

// Stored via `firebase functions:secrets:set STRIPE_SECRET_KEY` and
// `firebase functions:secrets:set STRIPE_WEBHOOK_SECRET` — never hardcoded,
// never in this repo. See the setup steps for exactly how to set these.
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");
// A second, separate signing secret — Connect requires its own webhook
// destination specifically scoped to "Events on connected accounts"
// (discovered this can't be toggled on an existing "Your account"
// destination after creation, only chosen at creation time), and each
// destination gets its own distinct secret from Stripe. Both destinations
// point at this same function, so this function now has to be able to
// verify either one.
const stripeConnectWebhookSecret = defineSecret("STRIPE_CONNECT_WEBHOOK_SECRET");

// Real Stripe Price IDs — created in the Stripe Dashboard under Products,
// one price per tier, monthly AND annual recurring (annual added
// 2026-09-04). Renamed from starter/pro/enterprise to basic/pro/unlimited
// to match the live pricing page and the two-axis (tier + field-count)
// model.
const TIER_PRICE_IDS = {
  basic: { monthly: "price_1UBnGZE1l1o0GwwHp8dTW7o9", annual: "price_1UBnq1E1l1o0GwwHqg73fj0t" },
  pro: { monthly: "price_1U9a8DE1l1o0GwwHeCFO6rPn", annual: "price_1UBnqXE1l1o0GwwHRlpfcGVq" },
  unlimited: { monthly: "price_1UBnHBE1l1o0GwwHuUOp4ZLh", annual: "price_1UBnqzE1l1o0GwwHGmt9zpH7" },
};

// Reverse lookup (Stripe Price id -> tier key), built from the map above.
// The subscription webhook below uses this to read an owner's real
// current tier straight off their subscription's actual Price, rather
// than trusting the tier/billingPeriod stored in subscription metadata
// at checkout time — that metadata never gets touched again if the owner
// later switches plans through Stripe's own Customer Portal (which this
// app's portal config explicitly allows, subscription_update.enabled),
// so it can silently go stale. Deriving from the live Price on every
// webhook event self-heals regardless of which path changed the plan.
const PRICE_ID_TO_TIER = Object.fromEntries(
  Object.entries(TIER_PRICE_IDS).flatMap(([tier, byPeriod]) =>
    Object.values(byPeriod).map((priceId) => [priceId, tier])
  )
);

// How many fields a single account may have claimed at once, by tier —
// the second axis of the pricing model (the first is event/player caps,
// enforced elsewhere). Basic and Pro are single-field plans; Unlimited
// covers up to 3 fields on one account, same flat price. Beyond 3 is
// manual/Discord-only, not self-serve, per the pricing page. Anything
// unrecognized (no subscription yet, a lapsed one) defaults to 1 — a
// first-time owner can always claim their first field before ever
// picking a plan, per the owner app's own onboarding gate.
const FIELD_CAPS = { basic: 1, pro: 1, unlimited: 3 };
const DEFAULT_FIELD_CAP = 1;

// The specific Billing Portal Configuration set up in the Stripe Dashboard
// (Settings -> Billing -> Customer portal) with cancellation and plan
// switching turned on. Pinning this id explicitly means the portal always
// opens with those features enabled, regardless of which configuration
// Stripe happens to have marked as account-wide "default" — that default
// can silently change (e.g. if a second configuration is ever created for
// something else), which would otherwise quietly disable self-serve
// cancel with no error to notice it by.
const BILLING_PORTAL_CONFIG_ID = "bpc_1UBJNRE1l1o0GwwHGZhfRsXy";

// Called from the owner app (via the Firebase SDK's httpsCallable) once an
// owner picks a tier. request.auth.uid comes from their verified ID token
// — never trust a client-supplied uid for something that creates a real
// charge. Returns a Stripe-hosted Checkout URL; the owner app just
// redirects to it, no custom card form anywhere in this project.
export const createSubscriptionCheckout = onCall(
  { secrets: [stripeSecretKey], invoker: "public" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in to start a subscription.");
    }
    const uid = request.auth.uid;
    const tier = request.data?.tier;
    const billingPeriod = request.data?.billingPeriod === "annual" ? "annual" : "monthly";
    const priceId = TIER_PRICE_IDS[tier]?.[billingPeriod];
    if (!priceId) {
      throw new HttpsError("invalid-argument", `Unknown tier/billing period: ${tier}/${billingPeriod}`);
    }

    const stripe = new Stripe(stripeSecretKey.value());
    const db = getFirestore();
    const ownerRef = db.collection("owners").doc(uid);
    const ownerSnap = await ownerRef.get();
    const ownerData = ownerSnap.data() || {};

    // Reuse an existing Stripe customer for this owner rather than
    // creating a fresh one every time they hit checkout.
    let customerId = ownerData.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: ownerData.email || request.auth.token?.email,
        metadata: { firebaseUid: uid },
      });
      customerId = customer.id;
      await ownerRef.set({ stripeCustomerId: customerId }, { merge: true });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 30, // the "first month free" promise from the pricing page
        metadata: { firebaseUid: uid, tier, billingPeriod },
      },
      success_url: "https://ownerapp.airsoftatlas.app/?checkout=success",
      cancel_url: "https://ownerapp.airsoftatlas.app/?checkout=cancelled",
    });

    return { url: session.url };
  }
);

// Opens Stripe's own hosted Customer Portal — an owner can see invoices,
// switch tiers, update their card, or cancel outright, all on Stripe's
// page, the same self-serve pattern as checkout above. This is what makes
// "I meant to cancel and got charged anyway" no longer possible: there's
// a real button that leads straight to a real cancel flow, not a support
// request that depends on someone reading Discord in time.
//
// One-time setup this depends on: the Customer Portal has to be turned on
// in the Stripe Dashboard first (Settings -> Billing -> Customer portal),
// with "Cancel subscriptions" and "Switch plans" enabled and all six
// tier/billing-period prices (monthly + annual x Basic/Pro/Unlimited)
// added to the portal's list of switchable products — Stripe has no API
// for this, it's a dashboard-only configuration step. Without a price in
// that list, an existing subscriber can't self-switch to it from the
// portal (checkout for a brand-new subscription is unaffected either
// way — that always goes through createSubscriptionCheckout above,
// which doesn't depend on this portal config at all).
export const createBillingPortalSession = onCall(
  { secrets: [stripeSecretKey], invoker: "public" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in.");
    }
    const uid = request.auth.uid;
    const stripe = new Stripe(stripeSecretKey.value());
    const db = getFirestore();
    const ownerSnap = await db.collection("owners").doc(uid).get();
    const customerId = ownerSnap.data()?.stripeCustomerId;
    if (!customerId) {
      throw new HttpsError("failed-precondition", "No billing account on file yet — choose a plan first.");
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      configuration: BILLING_PORTAL_CONFIG_ID,
      return_url: "https://ownerapp.airsoftatlas.app/?billing=return",
    });

    return { url: session.url };
  }
);

// Called from the owner app to start (or resume) Stripe Connect onboarding
// — this is the "get paid for player bookings" flow, entirely separate
// from the subscription checkout above. Creates a real Standard connected
// account for this owner if they don't already have one (matching the
// account architecture decided early on: field owners manage their own
// real Stripe account directly, not something Atlas operates on their
// behalf), then returns a Stripe-hosted onboarding link where they enter
// their own bank details directly with Stripe — this app's code never
// sees that information, same principle as the subscription checkout.
export const createConnectOnboardingLink = onCall(
  { secrets: [stripeSecretKey], invoker: "public" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in.");
    }
    const uid = request.auth.uid;
    const stripe = new Stripe(stripeSecretKey.value());
    const db = getFirestore();
    const ownerRef = db.collection("owners").doc(uid);
    const ownerSnap = await ownerRef.get();
    const ownerData = ownerSnap.data() || {};

    // Reuse an existing connected account for this owner rather than
    // creating a fresh one every time they open this flow.
    let accountId = ownerData.stripeConnectAccountId;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "standard",
        email: ownerData.email || request.auth.token?.email,
        metadata: { firebaseUid: uid },
      });
      accountId = account.id;
      await ownerRef.set({ stripeConnectAccountId: accountId }, { merge: true });
    }

    // Account Links expire quickly and are single-use by design — always
    // generate a fresh one rather than trying to cache or reuse one.
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: "https://ownerapp.airsoftatlas.app/?connect=refresh",
      return_url: "https://ownerapp.airsoftatlas.app/?connect=return",
      type: "account_onboarding",
    });

    return { url: accountLink.url };
  }
);

// A direct, real-time check of an owner's actual Connect status — a
// pragmatic fallback after account.updated proved genuinely unreliable
// here (repeatedly not firing, or arriving as a newer-generation event
// this webhook doesn't verify against). Rather than keep chasing which
// exact webhook event Stripe will send, this just asks Stripe directly
// for the real, current answer and writes it straight to Firestore — no
// webhook involved at all, so nothing here depends on one arriving.
export const checkPayoutsStatus = onCall(
  { secrets: [stripeSecretKey], invoker: "public" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in.");
    }
    const uid = request.auth.uid;
    const stripe = new Stripe(stripeSecretKey.value());
    const db = getFirestore();
    const ownerRef = db.collection("owners").doc(uid);
    const ownerSnap = await ownerRef.get();
    const accountId = ownerSnap.data()?.stripeConnectAccountId;
    if (!accountId) {
      return { payoutsEnabled: false };
    }

    const account = await stripe.accounts.retrieve(accountId);
    // account.settings.payouts.schedule comes back on a plain retrieve, no
    // expand needed — {interval: "daily"|"weekly"|"monthly"|"manual",
    // delay_days, weekly_anchor?, monthly_anchor?}. Cached on the owner doc
    // so the owner app can show a real payout-timing estimate (e.g. on the
    // post-event payout celebration) without a live Stripe call every time.
    await ownerRef.set(
      {
        payoutsEnabled: account.payouts_enabled,
        chargesEnabled: account.charges_enabled,
        connectOnboardingComplete: account.details_submitted,
        payoutSchedule: account.settings?.payouts?.schedule || null,
      },
      { merge: true }
    );

    return { payoutsEnabled: account.payouts_enabled };
  }
);

// Player booking-fee checkout — the actual money-moving transaction, using
// a "destination charge": the player pays the full amount (entry cost +
// Atlas's booking fee) in one transaction, Stripe automatically routes the
// entry-cost portion to the field owner's own connected account, and
// Atlas's application fee is retained automatically. No manual transfer
// step. The booking record itself is NOT created here — only once the
// webhook below confirms payment actually succeeded, since a real booking
// should never exist for a payment that never went through.
// Shared by createBookingCheckout and bookFreeEvent below — resolves the
// real entry price (the event's flat price + whichever Price Options
// choice, if any, was picked) and validates that choice. The only place
// this logic lives, so the paid and free booking paths can never drift
// out of sync with each other on what a given selection actually costs.
function resolveEntryPrice(eventData, selectedChoiceId) {
  const basePriceCents = Math.round(parseFloat(String(eventData.price || "").replace(/[^0-9.]/g, "")) * 100) || 0;
  const priceOptions = eventData.priceOptions;
  let selectedChoice = null;
  if (priceOptions?.choices?.length) {
    selectedChoice = priceOptions.choices.find((c) => c.id === selectedChoiceId) || null;
    if (priceOptions.required && !selectedChoice) {
      throw new HttpsError("invalid-argument", `Choose a valid ${priceOptions.label || "option"} before booking.`);
    }
    if (selectedChoiceId && !selectedChoice) {
      throw new HttpsError("invalid-argument", "That option isn't available for this event anymore.");
    }
  }
  return { entryPriceCents: basePriceCents + (selectedChoice?.priceCents || 0), selectedChoice };
}

export const createBookingCheckout = onCall(
  { secrets: [stripeSecretKey], invoker: "public" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in to book.");
    }
    const uid = request.auth.uid;
    const eventId = request.data?.eventId;
    if (!eventId) {
      throw new HttpsError("invalid-argument", "Missing eventId.");
    }

    const db = getFirestore();
    const stripe = new Stripe(stripeSecretKey.value());

    const eventSnap = await db.collection("events").doc(eventId).get();
    if (!eventSnap.exists) {
      throw new HttpsError("not-found", "Event not found.");
    }
    const eventData = eventSnap.data();

    if (eventData.canceled) {
      throw new HttpsError("failed-precondition", "This event has been canceled.");
    }

    // Waiver requirement, re-checked server-side — the client already
    // gates this in the UI, but a real payment endpoint can't trust the
    // client alone for something this consequential.
    if (eventData.waiver) {
      const sigSnap = await db.collection("waiverSignatures").doc(`${uid}_${eventId}`).get();
      if (!sigSnap.exists) {
        throw new HttpsError("failed-precondition", "Waiver must be signed before booking.");
      }
    }

    // Capacity check at checkout-creation time. Not a perfect guarantee
    // against two people finishing checkout at nearly the same instant —
    // the webhook below has the real, authoritative check that actually
    // creates the booking — but this stops the overwhelming majority of
    // oversells before someone even starts paying.
    if (typeof eventData.maxCapacity === "number" && (eventData.bookedCount || 0) >= eventData.maxCapacity) {
      throw new HttpsError("failed-precondition", "This event is full.");
    }

    const existingBooking = await db.collection("events").doc(eventId).collection("bookings").doc(uid).get();
    if (existingBooking.exists) {
      throw new HttpsError("already-exists", "Already booked for this event.");
    }

    const fieldSnap = await db.collection("fields").doc(eventData.fieldId).get();
    const fieldData = fieldSnap.data();
    if (!fieldData?.ownerId) {
      throw new HttpsError("failed-precondition", "This field isn't set up to accept payments yet.");
    }
    const ownerSnap = await db.collection("owners").doc(fieldData.ownerId).get();
    const ownerData = ownerSnap.data();
    if (!ownerData?.payoutsEnabled || !ownerData?.stripeConnectAccountId) {
      throw new HttpsError("failed-precondition", "This field hasn't finished payment setup yet.");
    }

    const { entryPriceCents, selectedChoice } = resolveEntryPrice(eventData, request.data?.selectedChoiceId);
    if (!entryPriceCents || entryPriceCents <= 0) {
      throw new HttpsError("failed-precondition", "This event doesn't have a valid price set.");
    }
    // The real, agreed booking fee: 10% of entry cost, capped at $3.
    const bookingFeeCents = Math.min(Math.round(entryPriceCents * 0.10), 300);
    const totalCents = entryPriceCents + bookingFeeCents;

    // A deterministic key, not a random one — the whole point is that a
    // second call for the same player + event (impatient re-tap after the
    // webhook hasn't confirmed yet, an app relaunch, a lost network blip)
    // reuses this exact request instead of creating a second real Stripe
    // Checkout Session. Stripe returns the original session (same URL,
    // same underlying PaymentIntent) for any request repeated with this
    // key within 24 hours, rather than charging the player again — this
    // is what actually closes the "paid twice because the booking hadn't
    // shown up yet" risk, not just the UI-side button-disabling, which a
    // force-quit/relaunch would bypass entirely on its own.
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: request.auth.token?.email,
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: eventData.title,
            description: selectedChoice
              ? `Entry to ${eventData.title} at ${eventData.fieldName || fieldData.name} — ${selectedChoice.label}`
              : `Entry to ${eventData.title} at ${eventData.fieldName || fieldData.name}`,
          },
          unit_amount: totalCents,
        },
        quantity: 1,
      }],
      payment_intent_data: {
        application_fee_amount: bookingFeeCents,
        transfer_data: { destination: ownerData.stripeConnectAccountId },
      },
      metadata: {
        firebaseUid: uid,
        eventId,
        fieldId: eventData.fieldId,
        bookingFeeCents: String(bookingFeeCents),
        ...(selectedChoice ? { selectedChoiceLabel: selectedChoice.label, selectedChoicePriceCents: String(selectedChoice.priceCents) } : {}),
      },
      success_url: "https://playerapp.airsoftatlas.app/?booking=success",
      cancel_url: "https://playerapp.airsoftatlas.app/?booking=cancelled",
    }, {
      idempotencyKey: `booking-checkout:${eventId}:${uid}`,
    });

    return { url: session.url };
  }
);

// The free-event sibling of createBookingCheckout above — for an event
// (or a Price Options choice) that comes out to genuinely $0, never
// touching Stripe at all. This used to be a plain client-side Firestore
// write (bookEvent in useBookings.js, straight from the player app); it's
// server-side now because that client write had no price check behind it
// whatsoever — any signed-in player could call it directly (e.g. from
// browser devtools) for ANY event, including a real paid one, and walk
// away with a free, unpaid "booking" with zero Stripe involvement.
// firestore.rules no longer allows a client to create a booking document
// at all (see the removed create rules there) — every booking, paid or
// free, now goes through a Cloud Function that resolves the real price
// itself before ever writing anything.
export const bookFreeEvent = onCall(
  { invoker: "public" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in to book.");
    }
    const uid = request.auth.uid;
    const eventId = request.data?.eventId;
    if (!eventId) {
      throw new HttpsError("invalid-argument", "Missing eventId.");
    }

    const db = getFirestore();
    const eventRef = db.collection("events").doc(eventId);
    const bookingRef = eventRef.collection("bookings").doc(uid);
    const userBookingRef = db.collection("users").doc(uid).collection("bookings").doc(eventId);

    const eventSnap = await eventRef.get();
    if (!eventSnap.exists) {
      throw new HttpsError("not-found", "Event not found.");
    }
    const eventData = eventSnap.data();

    if (eventData.canceled) {
      throw new HttpsError("failed-precondition", "This event has been canceled.");
    }

    // Waiver requirement, re-checked server-side — the same rule the old
    // client-side create rule used to enforce, now enforced here since
    // that rule is gone.
    if (eventData.waiver) {
      const sigSnap = await db.collection("waiverSignatures").doc(`${uid}_${eventId}`).get();
      if (!sigSnap.exists) {
        throw new HttpsError("failed-precondition", "Waiver must be signed before booking.");
      }
    }

    const { entryPriceCents, selectedChoice } = resolveEntryPrice(eventData, request.data?.selectedChoiceId);
    // The real backstop: if this event (plus whatever was picked) isn't
    // actually free, this is the wrong function to have called —
    // createBookingCheckout is. A well-behaved client never reaches this
    // with a paid total; this is what stops a misbehaving one.
    if (entryPriceCents > 0) {
      throw new HttpsError("failed-precondition", "This event requires payment — use checkout instead.");
    }

    const profileSnap = await db.collection("users").doc(uid).get();
    const profileData = profileSnap.data() || {};
    const choiceFields = selectedChoice ? { selectedChoiceLabel: selectedChoice.label } : {};

    // A real transaction, not just a plain write — the same oversell
    // protection createBookingCheckout's webhook already has, now applied
    // here too: re-checks capacity and "already booked" against the
    // current state right before writing, not whatever was true when this
    // function started.
    await db.runTransaction(async (t) => {
      const [freshEventSnap, existingBooking] = await Promise.all([t.get(eventRef), t.get(bookingRef)]);
      if (existingBooking.exists) {
        throw new HttpsError("already-exists", "Already booked for this event.");
      }
      const freshEventData = freshEventSnap.data();
      if (typeof freshEventData.maxCapacity === "number" && (freshEventData.bookedCount || 0) >= freshEventData.maxCapacity) {
        throw new HttpsError("failed-precondition", "This event is full.");
      }
      const now = new Date();
      t.set(bookingRef, {
        uid,
        fieldId: eventData.fieldId,
        teamId: profileData.teamId || null,
        callsign: profileData.callsign || "Player",
        avatarUrl: profileData.avatarUrl || null,
        bookedAt: now,
        ...choiceFields,
      });
      t.set(userBookingRef, {
        eventId,
        fieldId: eventData.fieldId,
        eventTitle: eventData.title || null,
        fieldName: eventData.fieldName || null,
        date: eventData.date || null,
        endDate: eventData.endDate || null,
        bookedAt: now,
        ...choiceFields,
      });
      t.update(eventRef, { bookedCount: (freshEventData.bookedCount || 0) + 1 });
    });

    return { booked: true };
  }
);

// Real Stripe events land here, not the checkout redirect — a person can
// land on the success_url above without payment actually having gone
// through, so the redirect is only ever immediate visual feedback. This
// webhook, verified against Stripe's signature, is the one trustworthy
// source of truth for what an owner's subscription actually is.
export const stripeWebhook = onRequest(
  { secrets: [stripeSecretKey, stripeWebhookSecret, stripeConnectWebhookSecret], invoker: "public" },
  async (req, res) => {
    const stripe = new Stripe(stripeSecretKey.value());
    let event;
    // Try the main "Your account" secret first, then the Connect one —
    // whichever one actually signed this specific request is the only
    // one that will verify successfully; the other will always throw for
    // a request it didn't sign, which is expected and not itself an
    // error worth logging.
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        req.headers["stripe-signature"],
        stripeWebhookSecret.value()
      );
    } catch (mainErr) {
      try {
        event = stripe.webhooks.constructEvent(
          req.rawBody,
          req.headers["stripe-signature"],
          stripeConnectWebhookSecret.value()
        );
      } catch (connectErr) {
        console.error("Webhook signature verification failed against both secrets:", connectErr.message);
        res.status(400).send(`Webhook Error: ${connectErr.message}`);
        return;
      }
    }

    const db = getFirestore();

    try {
      switch (event.type) {
        case "customer.subscription.created":
        case "customer.subscription.updated": {
          const sub = event.data.object;
          const uid = sub.metadata?.firebaseUid;
          if (uid) {
            // Read off the subscription's actual current Price rather
            // than metadata (see the PRICE_ID_TO_TIER comment above) —
            // this self-heals subscriptionTier/billingPeriod even for a
            // plan switch made through Stripe's own Customer Portal.
            const price = sub.items?.data?.[0]?.price;
            const tier = (price && PRICE_ID_TO_TIER[price.id]) || sub.metadata?.tier || null;
            const billingPeriod = price?.recurring?.interval === "year" ? "annual" : "monthly";
            await db.collection("owners").doc(uid).set(
              {
                // Stripe's own status values: "trialing", "active",
                // "past_due", "canceled", "unpaid", etc. — stored as-is
                // rather than remapped, so the owner app can react to the
                // exact real state (e.g. show a grace-period banner on
                // "past_due" instead of an instant hard lockout).
                subscriptionStatus: sub.status,
                subscriptionTier: tier,
                billingPeriod,
                stripeSubscriptionId: sub.id,
                currentPeriodEnd: new Date(sub.current_period_end * 1000),
                // Set the instant someone hits "Cancel" in the Stripe
                // portal — the subscription itself stays "active" (they
                // keep access through what they already paid for, our
                // portal config is "cancel at period end," not immediate)
                // right up until the real customer.subscription.deleted
                // event below fires at the actual period end. Without
                // this flag, the owner app would show "ACTIVE, renews on
                // <date>" with zero indication anything was canceled —
                // exactly the "did my cancellation actually go through?"
                // anxiety this whole billing-portal feature was built to
                // eliminate.
                cancelAtPeriodEnd: !!sub.cancel_at_period_end,
              },
              { merge: true }
            );
          }
          break;
        }
        case "customer.subscription.deleted": {
          const sub = event.data.object;
          const uid = sub.metadata?.firebaseUid;
          if (uid) {
            await db.collection("owners").doc(uid).set(
              { subscriptionStatus: "canceled", cancelAtPeriodEnd: false },
              { merge: true }
            );
          }
          break;
        }
        case "checkout.session.completed": {
          const session = event.data.object;
          // Only booking-fee checkouts carry this metadata shape —
          // subscription checkouts are fully handled by the
          // customer.subscription.* events above, not this one.
          if (session.mode === "payment" && session.metadata?.eventId) {
            const { firebaseUid: uid, eventId, fieldId, bookingFeeCents, selectedChoiceLabel, selectedChoicePriceCents } = session.metadata;
            const eventRef = db.collection("events").doc(eventId);
            const userBookingRef = db.collection("users").doc(uid).collection("bookings").doc(eventId);
            const bookingRef = eventRef.collection("bookings").doc(uid);

            // The real, authoritative check — the one in
            // createBookingCheckout only prevents the overwhelming
            // majority of oversells; this transaction is what actually
            // guards against two people finishing checkout at nearly the
            // same instant, since it's the one place that actually
            // creates the booking record.
            await db.runTransaction(async (t) => {
              const [eventSnap, existingBooking, profileSnap] = await Promise.all([
                t.get(eventRef),
                t.get(bookingRef),
                t.get(db.collection("users").doc(uid)),
              ]);
              if (existingBooking.exists) return; // already booked somehow — don't double up
              const eventData = eventSnap.data();
              const profileData = profileSnap.data() || {};
              const now = new Date();

              t.set(bookingRef, {
                uid,
                fieldId,
                teamId: profileData.teamId || null,
                callsign: profileData.callsign || "Player",
                avatarUrl: profileData.avatarUrl || null,
                bookedAt: now,
                paid: true,
                stripeCheckoutSessionId: session.id,
                amountPaidCents: session.amount_total,
                // Atlas's actual cut of this booking (the Stripe
                // application_fee_amount set at checkout time in
                // createBookingCheckout) — stored explicitly so revenue
                // reporting (admin portal) never has to recompute the fee
                // formula from amountPaidCents. Read straight off checkout
                // metadata since it was already computed once, at checkout
                // creation.
                bookingFeeCents: bookingFeeCents != null ? Number(bookingFeeCents) : null,
                // Which Price Options choice this player picked, if the
                // event has that group — read straight off checkout
                // metadata since it was already validated once, server-
                // side, at checkout creation. Null for an event with no
                // Price Options group at all.
                selectedChoiceLabel: selectedChoiceLabel || null,
                selectedChoicePriceCents: selectedChoicePriceCents != null ? Number(selectedChoicePriceCents) : null,
              });
              t.set(userBookingRef, {
                eventId,
                fieldId,
                eventTitle: eventData?.title || null,
                fieldName: eventData?.fieldName || null,
                date: eventData?.date || null,
                endDate: eventData?.endDate || null,
                bookedAt: now,
                paid: true,
                selectedChoiceLabel: selectedChoiceLabel || null,
              });
              t.update(eventRef, { bookedCount: (eventData?.bookedCount || 0) + 1 });
            });
          }
          break;
        }
        case "account.updated": {
          // The Connect equivalent of the subscription webhook above — an
          // owner's onboarding status can only be trusted once Stripe
          // confirms it here, not from the moment they're redirected back
          // to the app, since that redirect alone doesn't guarantee they
          // actually finished (or passed) onboarding.
          const account = event.data.object;
          const uid = account.metadata?.firebaseUid;
          if (uid) {
            await db.collection("owners").doc(uid).set(
              {
                stripeConnectAccountId: account.id,
                payoutsEnabled: account.payouts_enabled,
                chargesEnabled: account.charges_enabled,
                connectOnboardingComplete: account.details_submitted,
                payoutSchedule: account.settings?.payouts?.schedule || null,
              },
              { merge: true }
            );
          }
          break;
        }
        default:
          break; // every other event type is intentionally ignored for now
      }
      res.json({ received: true });
    } catch (err) {
      console.error("Webhook handler error:", err);
      res.status(500).send("Webhook handler error");
    }
  }
);

// --- Field claim verification: "prove you own this website" flow ---
//
// When a field has no ownerEmailDomain on file (so the domain-match path
// in firestore.rules can't apply) but the claiming owner does have a real
// website for their field, they can prove ownership the same way Google
// Search Console or Shopify domain verification works: generate a
// one-time code, ask them to paste it somewhere on their own site, then
// fetch that page server-side and confirm the code is actually there.
// Both functions below use the Admin SDK, which bypasses Firestore
// security rules entirely — the same trust model already used by the
// Stripe webhook to write subscriptionStatus/payoutsEnabled/etc. This is
// deliberate: a client-side security rule can't safely grant "you now own
// this field" on its own, since nothing stops any signed-in user from
// writing whatever they want to a document they don't yet own — the
// actual proof-of-ownership check has to happen server-side.

function generateClaimCode() {
  // Short, human-typeable, unambiguous: uppercase letters + digits with
  // 0/O/1/I left out so a misread character can't cause a mismatch.
  const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  let code = "atlas-verify-";
  for (let i = 0; i < 8; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

// Step 1: the owner asks for a code to paste on their own site. Requesting
// a code grants nothing by itself — it just stores the code (and who
// asked for it) on the field doc so step 2 below has something to check
// against; only a confirmed match in verifyWebsiteClaim actually hands
// over ownership.
export const requestFieldClaimCode = onCall(
  { invoker: "public" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in.");
    }
    const uid = request.auth.uid;
    const fieldId = request.data?.fieldId;
    if (!fieldId) {
      throw new HttpsError("invalid-argument", "Missing fieldId.");
    }

    const db = getFirestore();
    const fieldRef = db.collection("fields").doc(fieldId);
    const fieldSnap = await fieldRef.get();
    if (!fieldSnap.exists) {
      throw new HttpsError("not-found", "Field not found.");
    }
    const fieldData = fieldSnap.data();
    if (fieldData.ownerId) {
      throw new HttpsError("failed-precondition", "This field has already been claimed.");
    }
    if (!fieldData.website) {
      throw new HttpsError(
        "failed-precondition",
        "This field has no website on file to verify against."
      );
    }

    const code = generateClaimCode();
    await fieldRef.update({
      claimVerificationCode: code,
      claimVerificationRequestedBy: uid,
      claimVerificationRequestedAt: FieldValue.serverTimestamp(),
    });

    return { code, website: fieldData.website };
  }
);

// Step 2: the owner says they've pasted the code on their site — fetch it
// server-side and look for the code. Real ownership check happens here,
// never trusting the client's word that the code is actually live.
export const verifyWebsiteClaim = onCall(
  { invoker: "public" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in.");
    }
    const uid = request.auth.uid;
    const fieldId = request.data?.fieldId;
    if (!fieldId) {
      throw new HttpsError("invalid-argument", "Missing fieldId.");
    }

    const db = getFirestore();
    const fieldRef = db.collection("fields").doc(fieldId);
    const fieldSnap = await fieldRef.get();
    if (!fieldSnap.exists) {
      throw new HttpsError("not-found", "Field not found.");
    }
    const fieldData = fieldSnap.data();
    if (fieldData.ownerId) {
      throw new HttpsError("failed-precondition", "This field has already been claimed.");
    }
    if (fieldData.claimVerificationRequestedBy !== uid || !fieldData.claimVerificationCode) {
      throw new HttpsError(
        "failed-precondition",
        "Request a verification code for this field first."
      );
    }

    // Field-count cap — this path writes via the Admin SDK, so it
    // bypasses firestore.rules entirely; the same check has to be done
    // explicitly here (the two plain-client claim paths get theirs from
    // the rules themselves).
    const ownerRef = db.collection("owners").doc(uid);
    const ownerSnap = await ownerRef.get();
    const ownerData = ownerSnap.data() || {};
    const fieldCap = FIELD_CAPS[ownerData.subscriptionTier] ?? DEFAULT_FIELD_CAP;
    const claimedFieldCount = ownerData.claimedFieldCount || 0;
    if (claimedFieldCount >= fieldCap) {
      throw new HttpsError(
        "resource-exhausted",
        "Your current plan doesn't include another field — upgrade your plan, or reach out on Discord, to claim more."
      );
    }

    let pageText;
    try {
      const res = await fetch(fieldData.website, {
        redirect: "follow",
        signal: AbortSignal.timeout(10000),
      });
      pageText = await res.text();
    } catch (err) {
      console.error("verifyWebsiteClaim fetch error:", err);
      throw new HttpsError(
        "unavailable",
        `Couldn't reach ${fieldData.website} — check the site is up and try again.`
      );
    }

    if (!pageText.includes(fieldData.claimVerificationCode)) {
      return { verified: false };
    }

    await fieldRef.update({
      ownerId: uid,
      claimed: true,
      claimVerification: "website",
      claimVerificationCode: FieldValue.delete(),
      claimVerificationRequestedBy: FieldValue.delete(),
      claimVerificationRequestedAt: FieldValue.delete(),
    });
    await ownerRef.update({ claimedFieldCount: FieldValue.increment(1) });

    return { verified: true };
  }
);

