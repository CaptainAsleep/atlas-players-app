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

// Atlas Standard: $0/month subscription — Atlas's entire revenue on a
// local field is the per-ticket platform fee computed in
// computeStandardFee() below, applied inside createBookingCheckout.
// (The old per-tier Stripe subscription infra — TIER_PRICE_IDS,
// PRICE_ID_TO_TIER, FIELD_CAPS, BILLING_PORTAL_CONFIG_ID — was removed
// 2026-09 when the flat $50/$200/$350 tiers were eliminated; nobody was
// ever a real paying subscriber on them.)

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

// Atlas Standard's platform fee: 3.5% + $1.30, capped at $5.00 total.
// Whether the player pays this on top (feeModel "pass_to_player", the
// default) or it's deducted from the field's payout (feeModel "absorb")
// is decided by the caller — this only computes the fee amount itself,
// same number either way.
function computeStandardFee(entryPriceCents) {
  return Math.min(Math.round(entryPriceCents * 0.035) + 130, 500);
}

// Mirrors distanceMiles() in the player app's src/App.jsx exactly — kept
// in sync manually since functions/ and src/ don't share a module here.
function distanceMilesServer(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// How close a claimed location has to be to the field to count as "at the
// field" for the Walk-On Survivor patch. Generous on purpose — GPS drift
// plus large outdoor properties (parking lots, back fields) both eat into
// this, and the only cost of being too generous is a cosmetic patch
// occasionally going to someone who was in the lot rather than at the
// counter. Too tight just means real walk-ons quietly never get it.
const WALK_ON_RADIUS_MILES = 1;

// Shared by both booking paths — resolves a client-supplied best-effort
// location (or its absence) down to a single boolean. "First-ever
// booking" is deliberately NOT decided here: that's only safe to check
// transactionally, right where each path actually creates its booking
// record, since this function runs well before that (at checkout
// creation, for the paid path — which can sit open for minutes before
// the webhook fires).
function isNearField(location, fieldData) {
  if (!location || typeof location.lat !== "number" || typeof location.lng !== "number") return false;
  if (typeof fieldData?.lat !== "number" || typeof fieldData?.lng !== "number") return false;
  return distanceMilesServer(location.lat, location.lng, fieldData.lat, fieldData.lng) <= WALK_ON_RADIUS_MILES;
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

    // Walk-On Survivor eligibility (proximity only) — computed now, while
    // fieldData is already in hand, and carried through Checkout Session
    // metadata since the webhook that actually creates the booking runs
    // with no browser present at all. "First-ever booking" is checked
    // later, in the webhook's transaction, not here — a checkout session
    // can sit open for minutes before it's paid, so it's the wrong moment
    // to decide something time-sensitive like that.
    const walkOnNearField = isNearField(request.data?.location, fieldData);
    // Atlas Standard's platform fee (3.5% + $1.30, capped at $5) — see
    // computeStandardFee() above. Whether the player pays it on top or
    // it comes out of the field's payout depends on the fee model this
    // owner locked in at sign-up (owners.feeModel); pass-to-player is the
    // default when unset, which also covers any owner mid-onboarding
    // (should be impossible to reach here without one, since the owner
    // app gates further access on picking a fee model, but this keeps
    // the math sane rather than throwing if that ever changes).
    const bookingFeeCents = computeStandardFee(entryPriceCents);
    const passFeeToPlayer = ownerData.feeModel !== "absorb";
    const totalCents = passFeeToPlayer ? entryPriceCents + bookingFeeCents : entryPriceCents;

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
        // Stripe metadata values are strings only — "true"/absent, not a
        // real boolean.
        ...(walkOnNearField ? { walkOnNearField: "true" } : {}),
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

    // Walk-On Survivor: earned by creating an account and completing a
    // first-ever booking while physically at the field — the "extra
    // effort" moment of signing up on the spot rather than ahead of time.
    // The client sends a best-effort location reading (silently omitted
    // if geolocation was denied, unavailable, or timed out — this never
    // blocks booking either way); "first-ever booking" is verified here,
    // not trusted from the client, since it's a one-shot Firestore check
    // anyway and this is the natural place to also do it transactionally.
    let walkOnEligible = false;
    const loc = request.data?.location;
    if (loc) {
      const fieldSnap = await db.collection("fields").doc(eventData.fieldId).get();
      walkOnEligible = isNearField(loc, fieldSnap.data());
    }

    // A real transaction, not just a plain write — the same oversell
    // protection createBookingCheckout's webhook already has, now applied
    // here too: re-checks capacity and "already booked" against the
    // current state right before writing, not whatever was true when this
    // function started.
    await db.runTransaction(async (t) => {
      const [freshEventSnap, existingBooking, priorBookingsSnap] = await Promise.all([
        t.get(eventRef),
        t.get(bookingRef),
        walkOnEligible ? t.get(db.collection("users").doc(uid).collection("bookings").limit(1)) : Promise.resolve(null),
      ]);
      if (existingBooking.exists) {
        throw new HttpsError("already-exists", "Already booked for this event.");
      }
      const freshEventData = freshEventSnap.data();
      if (typeof freshEventData.maxCapacity === "number" && (freshEventData.bookedCount || 0) >= freshEventData.maxCapacity) {
        throw new HttpsError("failed-precondition", "This event is full.");
      }
      // Re-confirmed inside the transaction rather than trusted from a
      // check earlier in the function — this is what actually stops two
      // simultaneous first bookings (two tabs, say) from both counting as
      // "first."
      const isFirstEverBooking = walkOnEligible && priorBookingsSnap.empty;
      const walkOnFields = isFirstEverBooking ? { walkOnEligible: true } : {};
      const now = new Date();
      t.set(bookingRef, {
        uid,
        fieldId: eventData.fieldId,
        teamId: profileData.teamId || null,
        callsign: profileData.callsign || "Player",
        avatarUrl: profileData.avatarUrl || null,
        bookedAt: now,
        ...choiceFields,
        ...walkOnFields,
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
        ...walkOnFields,
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
// source of truth for whether a booking (or a Connect account's payout
// setup) is actually real.
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
        case "checkout.session.completed": {
          const session = event.data.object;
          // Only booking-fee checkouts carry this metadata shape.
          if (session.mode === "payment" && session.metadata?.eventId) {
            const { firebaseUid: uid, eventId, fieldId, bookingFeeCents, selectedChoiceLabel, selectedChoicePriceCents, walkOnNearField } = session.metadata;
            const eventRef = db.collection("events").doc(eventId);
            const userBookingRef = db.collection("users").doc(uid).collection("bookings").doc(eventId);
            const bookingRef = eventRef.collection("bookings").doc(uid);
            const walkOnNear = walkOnNearField === "true";

            // The real, authoritative check — the one in
            // createBookingCheckout only prevents the overwhelming
            // majority of oversells; this transaction is what actually
            // guards against two people finishing checkout at nearly the
            // same instant, since it's the one place that actually
            // creates the booking record.
            await db.runTransaction(async (t) => {
              const [eventSnap, existingBooking, profileSnap, priorBookingsSnap] = await Promise.all([
                t.get(eventRef),
                t.get(bookingRef),
                t.get(db.collection("users").doc(uid)),
                walkOnNear ? t.get(db.collection("users").doc(uid).collection("bookings").limit(1)) : Promise.resolve(null),
              ]);
              if (existingBooking.exists) return; // already booked somehow — don't double up
              const eventData = eventSnap.data();
              const profileData = profileSnap.data() || {};
              const now = new Date();
              // Same "confirm inside the transaction, don't trust an
              // earlier moment" reasoning as bookFreeEvent — this is what
              // actually decides "first-ever," not the proximity flag
              // carried in from checkout creation, which could be minutes
              // stale by the time payment actually completes.
              const walkOnFields = (walkOnNear && priorBookingsSnap.empty) ? { walkOnEligible: true } : {};

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
                ...walkOnFields,
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
                ...walkOnFields,
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
// Stripe webhook to write payoutsEnabled/chargesEnabled/etc. This is
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

    // No field-count cap anymore (removed along with the subscription
    // tiers it used to key off of) — any owner can claim unlimited
    // fields. ownerRef is still needed below to bump claimedFieldCount.
    const ownerRef = db.collection("owners").doc(uid);

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

