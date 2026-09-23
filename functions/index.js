import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import Stripe from "stripe";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Resend } from "resend";

initializeApp();

// Stored via `firebase functions:secrets:set RESEND_API_KEY` — the same
// Resend account/key already used for the field-owner welcome email in
// the separate atlas-email-sender CLI project.
const resendApiKey = defineSecret("RESEND_API_KEY");

// Every Atlas email (player-facing and field-owner-facing) is signed as
// Michael personally, not "The Atlas team" — same sender identity used
// everywhere across this pipeline.
const ATLAS_EMAIL_FROM = "Michael @ Atlas <welcome@airsoftatlas.app>";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatesDir = path.join(__dirname, "templates");
const signupWelcomeTemplate = readFileSync(path.join(templatesDir, "signup-welcome.html"), "utf-8");
const bookingConfirmationFirstTemplate = readFileSync(path.join(templatesDir, "booking-confirmation-first.html"), "utf-8");
const bookingConfirmationRepeatTemplate = readFileSync(path.join(templatesDir, "booking-confirmation-repeat.html"), "utf-8");

// Plain [token] -> value substitution, same style already proven in
// atlas-email-sender/send.mjs (html.split(token).join(value)) — no
// templating library needed for this.
function fillTemplate(html, replacements) {
  let out = html;
  for (const [token, value] of Object.entries(replacements)) {
    out = out.split(token).join(value ?? "");
  }
  return out;
}

// Mirrors formatDate()/formatTimeStr() in the player app's src/App.jsx —
// kept in sync manually since functions/ and src/ don't share a module
// here (same reasoning already documented next to distanceMilesServer
// above).
function formatEventDateForEmail(dateStr, endDateStr) {
  if (!dateStr) return "";
  const opts = { weekday: "short", month: "short", day: "numeric" };
  const start = new Date(dateStr + "T00:00:00");
  const startFmt = start.toLocaleDateString("en-US", opts);
  if (!endDateStr) return startFmt;
  const end = new Date(endDateStr + "T00:00:00");
  return `${startFmt} – ${end.toLocaleDateString("en-US", opts)}`;
}
function formatTimeStrForEmail(t) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t || "");
  if (!m) return t || "";
  let h = parseInt(m[1], 10);
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m[2]} ${suffix}`;
}

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

    // Balance pulled alongside the account status so the owner app can show
    // real pending/available totals (see the Payouts screen's "why haven't
    // I been paid" reassurance) without a second round trip. USD-only sum
    // — Atlas doesn't currently support other currencies anywhere else, so
    // there's nothing to gain from breaking this out per-currency yet.
    const [account, balance] = await Promise.all([
      stripe.accounts.retrieve(accountId),
      stripe.balance.retrieve({}, { stripeAccount: accountId }),
    ]);
    const sumUsdCents = (buckets) =>
      (buckets || []).filter((b) => b.currency === "usd").reduce((sum, b) => sum + b.amount, 0);
    const balanceAvailableCents = sumUsdCents(balance.available);
    const balancePendingCents = sumUsdCents(balance.pending);

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
        balanceAvailableCents,
        balancePendingCents,
        balanceCheckedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return { payoutsEnabled: account.payouts_enabled, balanceAvailableCents, balancePendingCents };
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

// Shared validation for a player's rental-item picks, same trust model as
// resolveEntryPrice above: the client sends only ids (which rentals it
// wants), never a price, and this looks up each one's authoritative
// priceCents straight from the field's own saved rental catalog
// (fieldData.rentals — already fetched by createBookingCheckout, no extra
// read). A rental with no priceCents (saved before this feature existed,
// or a blank/zero price) is treated as unavailable to select rather than
// ever trusting a client-supplied number. Only createBookingCheckout calls
// this — bookFreeEvent never reaches it, since a free event with a rental
// selected has a nonzero total and routes to checkout instead.
function resolveRentalsTotal(fieldData, selectedRentalIds) {
  const ids = Array.isArray(selectedRentalIds) ? selectedRentalIds : [];
  if (ids.length === 0) return { rentalsCents: 0, selectedRentalDetails: [] };
  const catalog = Array.isArray(fieldData.rentals) ? fieldData.rentals : [];
  const selectedRentalDetails = ids.map((id) => {
    const rental = catalog.find((r) => r.id === id && typeof r.priceCents === "number" && r.priceCents > 0);
    if (!rental) {
      throw new HttpsError("invalid-argument", "One of the selected rental items isn't available for this field anymore.");
    }
    return { id: rental.id, name: rental.name, priceCents: rental.priceCents };
  });
  const rentalsCents = selectedRentalDetails.reduce((sum, r) => sum + r.priceCents, 0);
  return { rentalsCents, selectedRentalDetails };
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
    const { rentalsCents, selectedRentalDetails } = resolveRentalsTotal(fieldData, request.data?.selectedRentalIds);
    // Combined, not entry-only — this is what lets a free event become a
    // real checkout the moment a paid rental is added, and what makes
    // Atlas's platform fee below grow with rentals the same way it
    // already does with Price Options.
    const chargeableCents = entryPriceCents + rentalsCents;
    if (!chargeableCents || chargeableCents <= 0) {
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
    const bookingFeeCents = computeStandardFee(chargeableCents);
    const passFeeToPlayer = ownerData.feeModel !== "absorb";
    // Only the entry line item's own price carries the fee (exactly as
    // before) — a rental's cost is a real, hard cost, never something an
    // owner "absorbs" the way Atlas's own fee can be. Each rental gets its
    // own separate Stripe line item below, at its plain, unmarked-up
    // price; the session's total (and therefore amountPaidCents on the
    // eventual booking) ends up as entry + rentals + fee (if passed to
    // the player) automatically, with no separate total to keep in sync.
    const entryLineItemCents = passFeeToPlayer ? entryPriceCents + bookingFeeCents : entryPriceCents;

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
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: eventData.title,
              description: selectedChoice
                ? `Entry to ${eventData.title} at ${eventData.fieldName || fieldData.name} — ${selectedChoice.label}`
                : `Entry to ${eventData.title} at ${eventData.fieldName || fieldData.name}`,
            },
            unit_amount: entryLineItemCents,
          },
          quantity: 1,
        },
        // One line item per selected rental, itemized on the receipt at
        // its own real price — see resolveRentalsTotal above for where
        // that price actually comes from (never the client).
        ...selectedRentalDetails.map((r) => ({
          price_data: {
            currency: "usd",
            product_data: { name: `Rental: ${r.name}` },
            unit_amount: r.priceCents,
          },
          quantity: 1,
        })),
      ],
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
        // Read back by the webhook below and written onto the booking doc
        // as-is. Stripe caps each metadata value at 500 characters — a
        // realistic handful of rental picks stays comfortably under that;
        // this isn't built to scale to a field with dozens of rentals.
        ...(selectedRentalDetails.length > 0 ? { selectedRentals: JSON.stringify(selectedRentalDetails) } : {}),
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

// Owner-triggered cancellation that also settles what's owed to anyone who
// already reserved. Not a Stripe refund — Atlas's booking-fee model is a
// destination charge, so the field owner's cut of a paid booking has
// already settled into their own Connect account by the time this runs;
// reaching back into that account to reverse it is a real money-movement
// risk this doesn't attempt. Instead: every paid booking becomes a
// digital voucher (same amount the player actually paid), redeemable at
// a future event at this same field via bookEventWithVoucher below, and
// every booking (paid or free) gets an in-app notice so the player
// actually finds out. Bookings themselves are never deleted — same
// "keep the real record" choice already made for deleteEvent/canceled
// events elsewhere in this app.
export const cancelEventWithVouchers = onCall(
  { invoker: "public" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in.");
    }
    const uid = request.auth.uid;
    const eventId = request.data?.eventId;
    if (!eventId) {
      throw new HttpsError("invalid-argument", "Missing eventId.");
    }

    const db = getFirestore();
    const eventRef = db.collection("events").doc(eventId);
    const eventSnap = await eventRef.get();
    if (!eventSnap.exists) {
      throw new HttpsError("not-found", "Event not found.");
    }
    const eventData = eventSnap.data();

    const fieldSnap = await db.collection("fields").doc(eventData.fieldId).get();
    if (!fieldSnap.exists || fieldSnap.data().ownerId !== uid) {
      throw new HttpsError("permission-denied", "You don't own this event's field.");
    }
    const fieldData = fieldSnap.data();

    // Needed to back the Atlas platform fee out of each voucher's value —
    // a voucher only replaces the ticket, not the booking fee (Atlas's
    // own service fee stays non-refundable, same as most ticketing
    // platforms' convenience fees). feeModel is locked in for good once
    // an owner picks it, so the current value is safe to use even for a
    // booking made earlier under the same owner.
    const ownerSnap = fieldData.ownerId ? await db.collection("owners").doc(fieldData.ownerId).get() : null;
    const passFeeToPlayer = (ownerSnap?.data()?.feeModel) !== "absorb";

    if (eventData.canceled) {
      // Already canceled — nothing new to do, but don't error the owner
      // app out of a clean UI state over a double-tap.
      return { canceled: true, vouchersIssued: 0 };
    }

    const bookingsSnap = await eventRef.collection("bookings").get();
    const now = new Date();

    // Owner-configurable expiration window, defaulting to 365 days when
    // never set. The value passed with this cancellation both drives the
    // vouchers issued right now and becomes the owner's new saved
    // default for next time (persisted below, after the writes succeed)
    // — so an owner who picks 365 once for The Compound doesn't have to
    // remember to type it again on every future cancellation.
    const rawExpirationDays = Number(request.data?.voucherExpirationDays);
    const savedExpirationDays = ownerSnap?.data()?.voucherExpirationDays;
    const expirationDays = Number.isInteger(rawExpirationDays) && rawExpirationDays >= 1 && rawExpirationDays <= 3650
      ? rawExpirationDays
      : (Number.isInteger(savedExpirationDays) ? savedExpirationDays : 365);
    const expiresAt = new Date(now.getTime() + expirationDays * 86400000);

    // Chunked batches, not one giant batch — each paid booking touches up
    // to 4 docs (voucher, both booking-doc stamps, notice) while a free
    // booking touches just 1 (notice only), so 100 bookings per chunk
    // stays comfortably under Firestore's 500-writes-per-batch cap even
    // for an all-paid roster. The event's own canceled flag rides along
    // in the first chunk (or its own chunk, if there are zero bookings).
    const CHUNK_SIZE = 100;
    let vouchersIssued = 0;
    const docs = bookingsSnap.docs;
    for (let i = 0; i === 0 || i < docs.length; i += CHUNK_SIZE) {
      const batch = db.batch();
      if (i === 0) {
        batch.update(eventRef, { canceled: true, canceledAt: FieldValue.serverTimestamp() });
      }
      const chunk = docs.slice(i, i + CHUNK_SIZE);
      for (const bookingDoc of chunk) {
        const b = bookingDoc.data();
        const playerUid = bookingDoc.id; // booking doc id is the player's uid
        const userBookingRef = db.collection("users").doc(playerUid).collection("bookings").doc(eventId);
        const noticeRef = db.collection("users").doc(playerUid).collection("cancellationNotices").doc();

        let voucherId = null;
        let voucherAmountCents = null;
        if (b.paid === true && typeof b.amountPaidCents === "number" && b.amountPaidCents > 0) {
          const voucherRef = db.collection("users").doc(playerUid).collection("vouchers").doc();
          voucherId = voucherRef.id;
          // Ticket price only — when the player paid the platform fee on
          // top (pass_to_player), that fee is backed out of the voucher's
          // value; when the owner absorbed it, amountPaidCents was
          // already just the ticket price and nothing needs subtracting.
          // Atlas doesn't refund its own booking fee just because the
          // owner canceled.
          const feeCentsOnThisBooking = typeof b.bookingFeeCents === "number" ? b.bookingFeeCents : 0;
          voucherAmountCents = passFeeToPlayer
            ? Math.max(0, b.amountPaidCents - feeCentsOnThisBooking)
            : b.amountPaidCents;
          batch.set(voucherRef, {
            fieldId: eventData.fieldId,
            fieldName: eventData.fieldName || fieldData.name || null,
            amountCents: voucherAmountCents,
            originalAmountCents: voucherAmountCents,
            status: "active",
            sourceEventId: eventId,
            sourceEventTitle: eventData.title || null,
            issuedAt: now,
            expiresAt,
            redeemedAt: null,
            redeemedEventId: null,
            redeemedEventTitle: null,
          });
          batch.update(bookingDoc.ref, { voucherIssuedId: voucherId });
          batch.update(userBookingRef, { voucherIssuedId: voucherId });
          vouchersIssued += 1;
        }

        batch.set(noticeRef, {
          type: "event_canceled",
          eventId,
          eventTitle: eventData.title || null,
          fieldId: eventData.fieldId,
          fieldName: eventData.fieldName || fieldData.name || null,
          voucherId,
          voucherAmountCents,
          createdAt: now,
          acknowledged: false,
        });
      }
      await batch.commit();
      if (docs.length === 0) break;
    }

    // Only ever save a value that was actually used for a real
    // cancellation, never something typed but not submitted.
    if (ownerSnap?.exists && savedExpirationDays !== expirationDays) {
      await ownerSnap.ref.update({ voucherExpirationDays: expirationDays });
    }

    return { canceled: true, vouchersIssued };
  }
);

// Lets an owner give a voucher directly to one specific player who
// already paid for a booking on a still-active (non-canceled) event —
// the "player has a last-minute emergency, we want to make it right"
// case — without canceling the whole event for everyone else. Reuses the
// exact same fee-exclusion math and voucher/notice shapes
// cancelEventWithVouchers already uses, just scoped to a single booking,
// and cancels that one booking (frees the spot) the same way the
// player's own cancelBooking would. The voucher this issues carries
// excludedEventId so it can never be turned around and redeemed on the
// very event the player just backed out of.
export const grantVoucherToPlayer = onCall(
  { invoker: "public" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in.");
    }
    const ownerUid = request.auth.uid;
    const eventId = request.data?.eventId;
    const playerUid = request.data?.uid;
    if (!eventId || !playerUid) {
      throw new HttpsError("invalid-argument", "Missing eventId or uid.");
    }

    const db = getFirestore();
    const eventRef = db.collection("events").doc(eventId);
    const eventSnap = await eventRef.get();
    if (!eventSnap.exists) {
      throw new HttpsError("not-found", "Event not found.");
    }
    const eventData = eventSnap.data();

    const fieldSnap = await db.collection("fields").doc(eventData.fieldId).get();
    if (!fieldSnap.exists || fieldSnap.data().ownerId !== ownerUid) {
      throw new HttpsError("permission-denied", "You don't own this event's field.");
    }
    const fieldData = fieldSnap.data();

    if (eventData.canceled) {
      throw new HttpsError("failed-precondition", "This event is already canceled — the whole roster already got vouchers.");
    }

    const ownerSnap = fieldData.ownerId ? await db.collection("owners").doc(fieldData.ownerId).get() : null;
    const passFeeToPlayer = (ownerSnap?.data()?.feeModel) !== "absorb";
    const savedExpirationDays = ownerSnap?.data()?.voucherExpirationDays;
    const expirationDays = Number.isInteger(savedExpirationDays) && savedExpirationDays >= 1 && savedExpirationDays <= 3650
      ? savedExpirationDays
      : 365;

    const bookingRef = eventRef.collection("bookings").doc(playerUid);
    const userBookingRef = db.collection("users").doc(playerUid).collection("bookings").doc(eventId);
    const voucherRef = db.collection("users").doc(playerUid).collection("vouchers").doc();
    const noticeRef = db.collection("users").doc(playerUid).collection("cancellationNotices").doc();

    let voucherAmountCents = 0;

    await db.runTransaction(async (t) => {
      const [bookingSnap, freshEventSnap] = await Promise.all([t.get(bookingRef), t.get(eventRef)]);
      if (!bookingSnap.exists) {
        throw new HttpsError("not-found", "This player doesn't have a booking on this event.");
      }
      const b = bookingSnap.data();
      if (!(b.paid === true && typeof b.amountPaidCents === "number" && b.amountPaidCents > 0)) {
        throw new HttpsError("failed-precondition", "This player didn't pay for this booking — nothing to voucher.");
      }
      const freshEventData = freshEventSnap.data();
      if (freshEventData.canceled) {
        throw new HttpsError("failed-precondition", "This event is already canceled.");
      }

      // Same ticket-price-only math cancelEventWithVouchers uses — the
      // Atlas platform fee is never refunded or put on a voucher.
      const feeCentsOnThisBooking = typeof b.bookingFeeCents === "number" ? b.bookingFeeCents : 0;
      voucherAmountCents = passFeeToPlayer
        ? Math.max(0, b.amountPaidCents - feeCentsOnThisBooking)
        : b.amountPaidCents;

      const now = new Date();
      const expiresAt = new Date(now.getTime() + expirationDays * 86400000);

      // Frees the spot exactly like the player's own cancelBooking does
      // (useBookings.js), just performed on their behalf with the Admin
      // SDK since an owner can't write to another player's own data.
      t.delete(bookingRef);
      t.delete(userBookingRef);
      t.update(eventRef, { bookedCount: Math.max(0, (freshEventData.bookedCount || 0) - 1) });

      t.set(voucherRef, {
        fieldId: eventData.fieldId,
        fieldName: eventData.fieldName || fieldData.name || null,
        amountCents: voucherAmountCents,
        originalAmountCents: voucherAmountCents,
        status: "active",
        sourceEventId: eventId,
        sourceEventTitle: eventData.title || null,
        issuedAt: now,
        expiresAt,
        // Blocks this exact voucher from being redeemed right back into
        // the event the player just backed out of. Deliberately no
        // player-facing copy anywhere explains this — it's enforced only
        // here and in bookEventWithVoucher's redemption check.
        excludedEventId: eventId,
        grantedManually: true,
        redeemedAt: null,
        redeemedEventId: null,
        redeemedEventTitle: null,
      });
      t.set(noticeRef, {
        type: "voucher_granted",
        eventId,
        eventTitle: eventData.title || null,
        fieldId: eventData.fieldId,
        fieldName: eventData.fieldName || fieldData.name || null,
        voucherId: voucherRef.id,
        voucherAmountCents,
        createdAt: now,
        acknowledged: false,
      });
    });

    return { granted: true, voucherId: voucherRef.id, amountCents: voucherAmountCents };
  }
);

// The redemption side of cancelEventWithVouchers above — lets a player use
// an active, field-scoped voucher to book a future event at that same
// field, entirely without Stripe. Deliberately full-cover-only for now: a
// voucher can only be applied when its balance covers the whole cost of
// this booking (no combining with a card charge, no stacking two
// vouchers) — this keeps the live Stripe Checkout path in
// createBookingCheckout completely untouched by this feature. Any
// leftover balance beyond what this booking costs is kept, not forfeited
// — a bigger voucher just becomes a smaller one, still usable at this
// same field later, rather than disappearing.
export const bookEventWithVoucher = onCall(
  { invoker: "public" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in to book.");
    }
    const uid = request.auth.uid;
    const eventId = request.data?.eventId;
    const voucherId = request.data?.voucherId;
    if (!eventId || !voucherId) {
      throw new HttpsError("invalid-argument", "Missing eventId or voucherId.");
    }

    const db = getFirestore();
    const eventRef = db.collection("events").doc(eventId);
    const bookingRef = eventRef.collection("bookings").doc(uid);
    const userBookingRef = db.collection("users").doc(uid).collection("bookings").doc(eventId);
    const voucherRef = db.collection("users").doc(uid).collection("vouchers").doc(voucherId);

    const eventSnap = await eventRef.get();
    if (!eventSnap.exists) {
      throw new HttpsError("not-found", "Event not found.");
    }
    const eventData = eventSnap.data();

    if (eventData.canceled) {
      throw new HttpsError("failed-precondition", "This event has been canceled.");
    }

    if (eventData.waiver) {
      const sigSnap = await db.collection("waiverSignatures").doc(`${uid}_${eventId}`).get();
      if (!sigSnap.exists) {
        throw new HttpsError("failed-precondition", "Waiver must be signed before booking.");
      }
    }

    if (typeof eventData.maxCapacity === "number" && (eventData.bookedCount || 0) >= eventData.maxCapacity) {
      throw new HttpsError("failed-precondition", "This event is full.");
    }

    const existingBooking = await bookingRef.get();
    if (existingBooking.exists) {
      throw new HttpsError("already-exists", "Already booked for this event.");
    }

    // A voucher redeems against the new event's ticket price ONLY — no
    // Atlas platform fee gets added here, ever. The player already paid
    // a booking fee once, on the original (canceled) event; that fee is
    // what Atlas keeps for having processed that transaction, and it's
    // gone regardless of what happens to the ticket price itself. Making
    // them pay a second fee just to redeem credit for a ticket they
    // never got to use would be charging them twice for one fee. So
    // unlike createBookingCheckout, there's no fee lookup here at all —
    // no field/owner read, no computeStandardFee call — this is compared
    // and paid for in ticket-price terms only, start to finish.
    const { entryPriceCents, selectedChoice } = resolveEntryPrice(eventData, request.data?.selectedChoiceId);
    if (!entryPriceCents || entryPriceCents <= 0) {
      throw new HttpsError("failed-precondition", "This event doesn't have a valid price set — book it as a free event instead.");
    }

    const profileSnap = await db.collection("users").doc(uid).get();
    const profileData = profileSnap.data() || {};
    const choiceFields = selectedChoice ? { selectedChoiceLabel: selectedChoice.label, selectedChoicePriceCents: selectedChoice.priceCents } : {};

    await db.runTransaction(async (t) => {
      const [voucherSnap, freshEventSnap, freshBookingSnap] = await Promise.all([
        t.get(voucherRef),
        t.get(eventRef),
        t.get(bookingRef),
      ]);
      if (!voucherSnap.exists) {
        throw new HttpsError("not-found", "Voucher not found.");
      }
      const voucher = voucherSnap.data();
      if (voucher.status !== "active") {
        throw new HttpsError("failed-precondition", "This voucher has already been used.");
      }
      if (voucher.fieldId !== eventData.fieldId) {
        throw new HttpsError("failed-precondition", "This voucher isn't valid at this field.");
      }
      if (voucher.expiresAt && voucher.expiresAt.toDate() < new Date()) {
        throw new HttpsError("failed-precondition", "This voucher has expired.");
      }
      if (voucher.excludedEventId === eventId) {
        throw new HttpsError("failed-precondition", "This voucher isn't valid for this event — try a different one.");
      }
      if (freshBookingSnap.exists) {
        throw new HttpsError("already-exists", "Already booked for this event.");
      }
      const freshEventData = freshEventSnap.data();
      if (freshEventData.canceled) {
        throw new HttpsError("failed-precondition", "This event has been canceled.");
      }
      if (typeof freshEventData.maxCapacity === "number" && (freshEventData.bookedCount || 0) >= freshEventData.maxCapacity) {
        throw new HttpsError("failed-precondition", "This event is full.");
      }
      if (voucher.amountCents < entryPriceCents) {
        throw new HttpsError(
          "failed-precondition",
          `This voucher ($${(voucher.amountCents / 100).toFixed(2)}) doesn't cover this event's ticket price ($${(entryPriceCents / 100).toFixed(2)}) — book with a card instead.`
        );
      }

      const now = new Date();
      const remainingCents = voucher.amountCents - entryPriceCents;
      t.set(bookingRef, {
        uid,
        fieldId: eventData.fieldId,
        teamId: profileData.teamId || null,
        callsign: profileData.callsign || "Player",
        avatarUrl: profileData.avatarUrl || null,
        bookedAt: now,
        paid: true,
        paidByVoucher: true,
        voucherRedeemedId: voucherId,
        voucherAppliedCents: entryPriceCents,
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
        paid: true,
        paidByVoucher: true,
        voucherRedeemedId: voucherId,
        selectedChoiceLabel: selectedChoice?.label || null,
      });
      t.update(eventRef, { bookedCount: (freshEventData.bookedCount || 0) + 1 });
      t.update(voucherRef, {
        amountCents: remainingCents,
        status: remainingCents > 0 ? "active" : "redeemed",
        redeemedAt: now,
        redeemedEventId: eventId,
        redeemedEventTitle: eventData.title || null,
      });
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
            const { firebaseUid: uid, eventId, fieldId, bookingFeeCents, selectedChoiceLabel, selectedChoicePriceCents, walkOnNearField, selectedRentals } = session.metadata;
            // Written by createBookingCheckout as a JSON string (Stripe
            // metadata values are strings only) — parsed back out here the
            // same defensive way selectedChoiceLabel/Cents are trusted:
            // this function wrote it moments earlier off server-validated
            // data, never anything the player's browser could shape
            // directly, but a malformed/missing value still degrades to
            // "no rentals" rather than failing the whole webhook.
            let parsedRentals = [];
            if (selectedRentals) {
              try {
                parsedRentals = JSON.parse(selectedRentals);
              } catch {
                parsedRentals = [];
              }
            }
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
                // Which rental items (if any) this player picked at
                // checkout — [] rather than omitted when none, so the
                // owner app's Roster screen and any future query can
                // always assume the field is an array. amountPaidCents
                // above already includes their cost (each rental was its
                // own Stripe line item), so no separate rentals-total
                // field is needed for the money side of this.
                selectedRentals: parsedRentals,
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

// ===========================================================================
// Player-facing emails (signup welcome + booking confirmation)
// ===========================================================================
// Both functions below are pure Firestore triggers: they read data after a
// write has already committed and only ever send an email or write one
// unrelated bookkeeping field. Neither one touches createBookingCheckout,
// bookFreeEvent, or stripeWebhook — the actual booking/payment logic is
// completely untouched by this feature.

// Fires once, the moment a brand-new player finishes onboarding
// (completedOnboarding flips false -> true — the same gate
// WelcomeSplashScreen in src/App.jsx already uses for the in-app
// walkthrough). Guarded by welcomeEmailSentAt, written by this function
// itself *before* attempting the send, so a duplicate/retried trigger can
// never cause a duplicate email — worst case on a Resend failure is a
// missed email, never a double one.
export const sendPlayerWelcomeEmail = onDocumentUpdated(
  { document: "users/{userId}", secrets: [resendApiKey] },
  async (event) => {
    const before = event.data.before.data() || {};
    const after = event.data.after.data() || {};
    if (!(before.completedOnboarding === false && after.completedOnboarding === true)) return;
    if (after.welcomeEmailSentAt) return; // already sent
    if (!after.email) {
      console.warn(`sendPlayerWelcomeEmail: skipping ${event.params.userId} — no email on file.`);
      return;
    }

    // Mark as sent before attempting the send — see comment above.
    await event.data.after.ref.update({ welcomeEmailSentAt: FieldValue.serverTimestamp() });

    const callsign = after.callsign || "Player";
    const html = fillTemplate(signupWelcomeTemplate, { "[PLAYER CALLSIGN]": callsign });

    try {
      const resend = new Resend(resendApiKey.value());
      const { error } = await resend.emails.send({
        from: ATLAS_EMAIL_FROM,
        to: after.email,
        subject: `Welcome to Atlas, ${callsign} — here's the rundown before your first game`,
        html,
      });
      if (error) {
        console.error(`sendPlayerWelcomeEmail: Resend error for ${event.params.userId}:`, error);
      }
    } catch (err) {
      console.error(`sendPlayerWelcomeEmail: failed for ${event.params.userId}:`, err);
    }
  }
);

// Fires on every booking, paid or free — bookFreeEvent and stripeWebhook's
// checkout.session.completed handler both write the same doc shape here
// (eventTitle, fieldName, date, endDate, paid, bookedAt — confirmed by
// reading both), so this one trigger covers both flows without touching
// either of them. No idempotency flag needed: a booking doc is created
// exactly once, so this listener fires exactly once per booking.
export const sendBookingConfirmationEmail = onDocumentCreated(
  { document: "users/{userId}/bookings/{eventId}", secrets: [resendApiKey] },
  async (event) => {
    const { userId, eventId } = event.params;
    const booking = event.data.data() || {};
    const db = getFirestore();

    const profileSnap = await db.collection("users").doc(userId).get();
    const profile = profileSnap.data() || {};
    if (!profile.email) {
      console.warn(`sendBookingConfirmationEmail: skipping ${userId}/${eventId} — no email on file.`);
      return;
    }
    const callsign = profile.callsign || "Player";

    // startTime isn't denormalized onto this booking mirror (only
    // date/endDate are) — one extra read here rather than touching
    // bookFreeEvent/stripeWebhook's write path just for this.
    const eventSnap = await db.collection("events").doc(eventId).get();
    const eventData = eventSnap.data() || {};

    const isPaid = booking.paid === true;
    let amountPaidCents = null;
    if (isPaid) {
      // amountPaidCents lives on the event-scoped booking doc, not this
      // user-scoped mirror — see stripeWebhook's checkout.session.completed
      // handler above.
      const eventBookingSnap = await db.collection("events").doc(eventId).collection("bookings").doc(userId).get();
      amountPaidCents = eventBookingSnap.data()?.amountPaidCents ?? null;
    }

    // First-ever booking vs. repeat, decided at send time by querying the
    // player's own booking history — not trusted from anything computed at
    // booking-creation time.
    const priorBookingsSnap = await db.collection("users").doc(userId).collection("bookings").limit(2).get();
    const isFirstBooking = priorBookingsSnap.size <= 1;

    const fieldName = booking.fieldName || eventData.fieldName || "your field";
    const eventTitle = booking.eventTitle || eventData.title || "your event";
    const eventDateTime = [
      formatEventDateForEmail(booking.date || eventData.date, booking.endDate || eventData.endDate),
      formatTimeStrForEmail(eventData.startTime),
    ].filter(Boolean).join(", ");

    const commonReplacements = {
      "[PLAYER CALLSIGN]": callsign,
      "[FIELD NAME]": fieldName,
      "[EVENT NAME]": eventTitle,
      "[EVENT DATE], [START TIME]": eventDateTime,
    };

    let html;
    let subject;
    if (isFirstBooking) {
      html = fillTemplate(bookingConfirmationFirstTemplate, commonReplacements);
      subject = `You're locked in at ${fieldName}`;
    } else {
      const amountPaidStr = isPaid && typeof amountPaidCents === "number"
        ? `$${(amountPaidCents / 100).toFixed(2)}`
        : null;
      // Per Michael's call: a repeat FREE booking gets adapted copy, not
      // the paid-only wording the drafts started with — no "your payment"
      // claim, no Amount Paid row, no Stripe-receipt note, when nothing
      // was actually charged.
      const introLine = isPaid
        ? `Hey ${callsign} &mdash; this confirms your payment and your spot. Your waiver's signed, nothing else to do before game day.`
        : `Hey ${callsign} &mdash; this confirms your spot. Your waiver's signed, nothing else to do before game day.`;
      const amountRow = isPaid
        ? `<tr>\n              <td style="padding:6px 0; font-family:Helvetica,Arial,sans-serif; font-size:13px; color:#686C72; width:90px; vertical-align:top;">Amount paid</td>\n              <td style="padding:6px 0; font-family:'Space Grotesk',Helvetica,Arial,sans-serif; font-weight:700; font-size:14px; color:#002C48;">${amountPaidStr}</td>\n            </tr>`
        : "";
      const stripeNote = isPaid
        ? `<p style="margin:12px 0 0; font-size:12px; line-height:1.6; color:#9A9D9F;">\n        A separate receipt for this charge comes from Stripe, our payment processor &mdash; this email is your Atlas booking confirmation.\n      </p>`
        : "";
      html = fillTemplate(bookingConfirmationRepeatTemplate, {
        ...commonReplacements,
        "[INTRO_LINE]": introLine,
        "[AMOUNT_ROW]": amountRow,
        "[STRIPE_NOTE]": stripeNote,
      });
      subject = `You're booked at ${fieldName}`;
    }

    try {
      const resend = new Resend(resendApiKey.value());
      const { error } = await resend.emails.send({
        from: ATLAS_EMAIL_FROM,
        to: profile.email,
        subject,
        html,
      });
      if (error) {
        console.error(`sendBookingConfirmationEmail: Resend error for ${userId}/${eventId}:`, error);
      }
    } catch (err) {
      console.error(`sendBookingConfirmationEmail: failed for ${userId}/${eventId}:`, err);
    }
  }
);

// ===========================================================================
// Field owner welcome email — automatic version of atlas-email-sender/send.mjs
// ===========================================================================
// Fires the moment a field actually gets a real owner — covers all four ways
// fields/{fieldId}.ownerId can go from unset to set (domain-verified instant
// claim and unverified instant claim, both in
// atlas-owners-app/src/hooks/useOwnerFields.js's claimField(); the
// verifyWebsiteClaim Cloud Function above; and manual admin approval in
// atlas-admin-portal) without touching any of those four write paths.
// Reuses the exact same HTML template and PDF attachments send.mjs already
// sends manually — that script stays available for one-off/manual sends
// (e.g. Michael sending it personally while on a call with a new owner);
// this just adds the automatic path alongside it.

const ownerWelcomeTemplate = readFileSync(path.join(__dirname, "assets", "atlas-welcome-email.html"), "utf-8");
const ownerWelcomeAttachments = [
  { filename: "Atlas_Counter_Cheat_Sheet.pdf", path: path.join(__dirname, "assets", "Atlas_Counter_Cheat_Sheet.pdf") },
  { filename: "Atlas_Quick_Fix_Card.pdf", path: path.join(__dirname, "assets", "Atlas_Quick_Fix_Card.pdf") },
].map((a) => ({ filename: a.filename, content: readFileSync(a.path).toString("base64") }));

export const sendFieldOwnerWelcomeEmail = onDocumentUpdated(
  { document: "fields/{fieldId}", secrets: [resendApiKey] },
  async (event) => {
    const { fieldId } = event.params;
    const before = event.data.before.data() || {};
    const after = event.data.after.data() || {};
    // Only a real "no owner yet" -> "now has an owner" transition — never
    // fires on an already-owned field being edited, and (deliberately, see
    // the plan this shipped from) doesn't re-fire on an unclaim-then-reclaim
    // once ownerWelcomeEmailSentAt is set once.
    if (before.ownerId || !after.ownerId) return;
    if (after.ownerWelcomeEmailSentAt) return; // already sent

    // Mark as sent before attempting the send — same reasoning as
    // sendPlayerWelcomeEmail: a redelivered trigger can never double-send.
    await event.data.after.ref.update({ ownerWelcomeEmailSentAt: FieldValue.serverTimestamp() });

    const db = getFirestore();
    const ownerSnap = await db.collection("owners").doc(after.ownerId).get();
    const ownerEmail = ownerSnap.data()?.email;
    if (!ownerEmail) {
      console.warn(`sendFieldOwnerWelcomeEmail: skipping field ${fieldId} — owner ${after.ownerId} has no email on file.`);
      return;
    }

    const fieldName = after.name || "your field";
    const fieldLink = `https://playerapp.airsoftatlas.app/?field=${encodeURIComponent(fieldId)}`;
    const html = fillTemplate(ownerWelcomeTemplate, {
      "[FIELD NAME]": fieldName,
      "[link to your Atlas field page]": fieldLink,
    });

    try {
      const resend = new Resend(resendApiKey.value());
      const { error } = await resend.emails.send({
        from: ATLAS_EMAIL_FROM,
        to: ownerEmail,
        subject: `Welcome to Atlas, ${fieldName} — here's everything you need`,
        html,
        attachments: ownerWelcomeAttachments,
      });
      if (error) {
        console.error(`sendFieldOwnerWelcomeEmail: Resend error for field ${fieldId}:`, error);
      }
    } catch (err) {
      console.error(`sendFieldOwnerWelcomeEmail: failed for field ${fieldId}:`, err);
    }
  }
);
