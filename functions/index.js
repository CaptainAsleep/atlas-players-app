import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
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
// one price per tier, monthly recurring. Replace these three placeholders
// with the real "price_..." ids once those products exist. Annual billing
// isn't wired up yet — this is monthly-only for the first real version;
// adding an annual price per tier later just means adding three more ids
// here and a plan-length toggle on the checkout call.
const TIER_PRICE_IDS = {
  starter: "price_1U9a7nE1l1o0GwwHhhRNBvz9",
  pro: "price_1U9a8DE1l1o0GwwHeCFO6rPn",
  enterprise: "price_1U9a8XE1l1o0GwwHEIyDU5Qh",
};

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
    const priceId = TIER_PRICE_IDS[tier];
    if (!priceId) {
      throw new HttpsError("invalid-argument", `Unknown tier: ${tier}`);
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
        metadata: { firebaseUid: uid, tier },
      },
      success_url: "https://ownerapp.airsoftatlas.app/?checkout=success",
      cancel_url: "https://ownerapp.airsoftatlas.app/?checkout=cancelled",
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
    await ownerRef.set(
      {
        payoutsEnabled: account.payouts_enabled,
        chargesEnabled: account.charges_enabled,
        connectOnboardingComplete: account.details_submitted,
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

    const entryPriceCents = Math.round(parseFloat(String(eventData.price || "").replace(/[^0-9.]/g, "")) * 100);
    if (!entryPriceCents || entryPriceCents <= 0) {
      throw new HttpsError("failed-precondition", "This event doesn't have a valid price set.");
    }
    // The real, agreed booking fee: 10% of entry cost, capped at $3.
    const bookingFeeCents = Math.min(Math.round(entryPriceCents * 0.10), 300);
    const totalCents = entryPriceCents + bookingFeeCents;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: request.auth.token?.email,
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: eventData.title,
            description: `Entry to ${eventData.title} at ${eventData.fieldName || fieldData.name}`,
          },
          unit_amount: totalCents,
        },
        quantity: 1,
      }],
      payment_intent_data: {
        application_fee_amount: bookingFeeCents,
        transfer_data: { destination: ownerData.stripeConnectAccountId },
      },
      metadata: { firebaseUid: uid, eventId, fieldId: eventData.fieldId, bookingFeeCents: String(bookingFeeCents) },
      success_url: "https://playerapp.airsoftatlas.app/?booking=success",
      cancel_url: "https://playerapp.airsoftatlas.app/?booking=cancelled",
    });

    return { url: session.url };
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
            await db.collection("owners").doc(uid).set(
              {
                // Stripe's own status values: "trialing", "active",
                // "past_due", "canceled", "unpaid", etc. — stored as-is
                // rather than remapped, so the owner app can react to the
                // exact real state (e.g. show a grace-period banner on
                // "past_due" instead of an instant hard lockout).
                subscriptionStatus: sub.status,
                subscriptionTier: sub.metadata?.tier || null,
                stripeSubscriptionId: sub.id,
                currentPeriodEnd: new Date(sub.current_period_end * 1000),
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
              { subscriptionStatus: "canceled" },
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
            const { firebaseUid: uid, eventId, fieldId, bookingFeeCents } = session.metadata;
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
