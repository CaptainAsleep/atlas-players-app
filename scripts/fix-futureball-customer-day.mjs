// One-off (2026-11-05): Futureball's Customer Appreciation Day is free to play
// with your own gear per the 2026 flyer. Removes the old required "BB Weight"
// priceOptions group, which seed-data.mjs (merge: true) can't remove on its own.
// Existing bookings are left untouched; this only prints them for review.
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "fs";
const sa = JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)));
initializeApp({ credential: cert(sa) });
const db = getFirestore();
const ref = db.collection("events").doc("futureball-2026-11-08-customer-day");
const snap = await ref.get();
if (!snap.exists) { console.log("Event not found — nothing changed."); process.exit(1); }
const e = snap.data();
console.log("BEFORE", JSON.stringify({ title: e.title, price: e.price, startTime: e.startTime, endTime: e.endTime, priceOptions: e.priceOptions ?? null, imageUrl: e.imageUrl }));
const bookings = await ref.collection("bookings").get();
console.log(`Existing bookings: ${bookings.size}`);
for (const b of bookings.docs) {
  const d = b.data();
  console.log("  ", b.id, JSON.stringify({ status: d.status, selectedChoiceLabel: d.selectedChoiceLabel ?? null, amountPaidCents: d.amountPaidCents ?? null }));
}
if (e.priceOptions) {
  await ref.update({ priceOptions: FieldValue.delete() });
  console.log("Removed priceOptions.");
} else {
  console.log("No priceOptions on the live event — nothing to remove.");
}
