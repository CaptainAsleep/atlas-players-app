// One-off: sets bookingOpensAt on The Compound's October 24th event, per
// Michael's request — the player app now shows a "Bookings will begin
// starting <date>" banner before this date, and "Bookings are now open
// for this event" once localDateStr() >= bookingOpensAt (see
// EventDetailScreen in src/App.jsx). This field is generic — any event can
// carry it — so this script is just the one-time write for this one event,
// not a new platform feature that needs its own owner-app UI yet.
//
// Run locally with:
//   node scripts/set-compound-oct24-booking-opens.mjs
//
// Requires the same scripts/serviceAccountKey.json as the other one-off
// scripts in this folder.

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(
  readFileSync(new URL("./serviceAccountKey.json", import.meta.url))
);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const EVENT_ID = "the-compound-2026-10-24-open-play";
const BOOKING_OPENS_AT = "2026-10-01";

async function run() {
  const ref = db.collection("events").doc(EVENT_ID);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new Error(`Event ${EVENT_ID} not found — did the id change?`);
  }
  const data = snap.data();
  console.log(`Found "${data.title}" at ${data.fieldName} (${data.date}). Current bookingOpensAt: ${data.bookingOpensAt ?? "(none)"}`);

  await ref.update({ bookingOpensAt: BOOKING_OPENS_AT });
  console.log(`Set bookingOpensAt = "${BOOKING_OPENS_AT}" on ${EVENT_ID}.`);
}

run().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
