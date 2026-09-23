// One-off fix — run locally with: node scripts/cancel-stuck-booking.mjs
//
// Michael accidentally booked "Sunday Airsoft" at 21 Mile Airsoft
// (event WaMjygtFvvx3WKBoMHGm, a free event) on 2026-09-23 and couldn't
// self-cancel — the in-app "Cancel Reservation" button errored with
// "Couldn't cancel — try again."
//
// Root cause (confirmed by reading firestore.rules and functions/index.js
// together): bookFreeEvent() never writes a `paid` field at all for a free
// booking — it's omitted, not written as false. firestore.rules' delete
// rule for a booking doc checked `resource.data.paid != true`, a bare
// field access. In the Firestore Rules language, reading a map key that
// was never written via dot notation is a rules-evaluation ERROR, not a
// null — and an error inside `allow delete` silently denies the whole
// request. So *every* free-event self-cancellation was hitting this,
// not just this one booking. Fixed at the source in firestore.rules
// (both the event-side and user-side mirror rules now use
// `resource.data.get('paid', false) != true`, which defaults safely) —
// see the accompanying deploy command. That fix alone would let Michael
// just click "Cancel Reservation" again himself once deployed, but this
// script clears his specific stuck booking immediately, without waiting
// on that deploy.
//
// Deletes both copies of the booking (event-side + the player's own
// mirror) and decrements the event's bookedCount by 1 — exactly what the
// player's own cancelBooking() in useBookings.js does, just run here with
// the Admin SDK since this bypasses the same rules bug it's working
// around.
//
// Requires scripts/serviceAccountKey.json (same file the other scripts use).

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(
  readFileSync(new URL("./serviceAccountKey.json", import.meta.url))
);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
db.settings({ preferRest: true });

const EVENT_ID = "WaMjygtFvvx3WKBoMHGm"; // Sunday Airsoft @ 21 Mile Airsoft
const UID = "lg4HMLTJvsPfSEN1pvNhMV4fbct1"; // Michael's own player account (callsign "Atlas")

async function run() {
  const eventRef = db.collection("events").doc(EVENT_ID);
  const bookingRef = eventRef.collection("bookings").doc(UID);
  const userBookingRef = db.collection("users").doc(UID).collection("bookings").doc(EVENT_ID);

  const bookingSnap = await bookingRef.get();
  if (!bookingSnap.exists) {
    console.log("No booking found at events/" + EVENT_ID + "/bookings/" + UID + " — nothing to do (maybe already canceled?).");
    return;
  }
  const b = bookingSnap.data();
  if (b.paid === true) {
    // Defensive — this script is only meant for the free booking described
    // above. A paid booking needs the voucher path (cancelEventWithVouchers'
    // per-player sibling), not a plain delete.
    throw new Error("This booking is marked paid — stopping. Use the voucher-issuing cancellation path instead, not this script.");
  }

  await db.runTransaction(async (t) => {
    const freshEventSnap = await t.get(eventRef);
    const freshEventData = freshEventSnap.data() || {};
    t.delete(bookingRef);
    t.delete(userBookingRef);
    t.update(eventRef, { bookedCount: FieldValue.increment(-1) });
  });

  console.log("Canceled Michael's stuck 'Sunday Airsoft' booking (uid " + UID + ") and decremented bookedCount.");
}

run().catch((err) => {
  console.error("Fix failed:", err);
  process.exit(1);
});
