// One-off (2026-10-24, per Michael): split The Compound's rental catalog into
// individual line items with real per-event stock, now that rentals support
// quantities + inventory (functions/rentalInventory.js).
//
//   Rental Kit        $30  stock 12  max 1 per person   (unchanged id)
//   Chest Rig         $5   stock 6   max 1 per person   (was "Chest Rig + Mags", same id)
//   Mid-Cap Magazine  $5   stock 6   max 3 per person   (new item)
//
// Refuses to write unless the live catalog still looks exactly like it did
// on 2026-10-24 (2 items, same ids/names/prices), so it can't clobber edits
// the owner made in the owner app since then.
//
// Usage (dry run by default):
//   node fix-compound-rentals.mjs
//   node fix-compound-rentals.mjs --write
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const FIELD_ID = "the-compound";
const write = process.argv.includes("--write");

const EXPECTED = [
  { id: "rental_legacy_0", name: "Rental Kit", priceCents: 3000 },
  { id: "rental_legacy_1", name: "Chest Rig + Mags", priceCents: 500 },
];

const NEXT = [
  {
    id: "rental_legacy_0",
    name: "Rental Kit",
    price: "$30",
    priceCents: 3000,
    includes: "AEG rifle, 1 high-cap magazine, mask",
    availability: "Must pre-pay to hold",
    quantity: 12,
    maxPerPerson: 1,
  },
  {
    id: "rental_legacy_1",
    name: "Chest Rig",
    price: "$5",
    priceCents: 500,
    includes: "Chest rig (size/type may vary)",
    availability: "Must pre-pay to hold",
    quantity: 6,
    maxPerPerson: 1,
  },
  {
    id: "rental_compound_magazine",
    name: "Mid-Cap Magazine",
    price: "$5",
    priceCents: 500,
    includes: "1 mid-cap magazine",
    availability: "Must pre-pay to hold",
    quantity: 6,
    maxPerPerson: 3,
  },
];

initializeApp({ credential: cert(JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)))) });
const db = getFirestore();
const ref = db.collection("fields").doc(FIELD_ID);
const snap = await ref.get();
if (!snap.exists) { console.error(`No such field: ${FIELD_ID}`); process.exit(1); }
const current = Array.isArray(snap.data().rentals) ? snap.data().rentals : [];

console.log(`The Compound — current rentals (${current.length}):`);
current.forEach((r) => console.log(`  ${r.id}  ${r.name}  ${r.price}  priceCents=${r.priceCents}  quantity=${r.quantity ?? "-"}  maxPerPerson=${r.maxPerPerson ?? "-"}`));

const matches = current.length === EXPECTED.length && EXPECTED.every((e, i) =>
  current[i]?.id === e.id && current[i]?.name === e.name && current[i]?.priceCents === e.priceCents);
if (!matches) {
  console.error("\nThe live catalog no longer matches what this script expects (it may have been edited in the owner app). Nothing written — update it in the owner app instead, or adjust this script.");
  process.exit(1);
}

console.log("\nNew rentals:");
NEXT.forEach((r) => console.log(`  ${r.id}  ${r.name}  ${r.price}  stock ${r.quantity}/event  max ${r.maxPerPerson}/person`));

if (!write) {
  console.log("\nDry run — nothing written. Re-run with --write to apply.");
  process.exit(0);
}
await ref.update({ rentals: NEXT });
console.log("\nWritten.");
