// Run once with: node scripts/fix-21mile-notes.mjs
//
// One-time removal of the "21 Mile Airsoft" field's `notes` field in
// Firestore. seed-data.mjs's notes text for this field ("Extremely thin
// verification -- essentially no web footprint beyond Michael's own
// information...") was written as an internal research caveat for this
// project's own tracking, not as copy meant for players -- but App.jsx
// renders any field's `notes` value directly on that field's public page
// as a user-facing alert banner (see the `field.notes` block near the top
// of the field detail screen). So this internal note was live on the app,
// visible to every player who opened this field's page. Fixed at the
// source in seed-data.mjs on 2026-09-20 (removed the `notes` line
// entirely for this field), but that alone doesn't touch the field
// document that's already live in Firestore -- same reasoning as
// fix-atlas-field-coords.mjs. This field is not marked as claimed, so a
// future full reseed would eventually pick up the corrected (notes-less)
// seed data too, but this is the direct, immediate fix.
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

async function run() {
  await db.collection("fields").doc("21-mile-airsoft-billings").update({
    notes: FieldValue.delete(),
  });
  console.log("21 Mile Airsoft's internal verification note removed from its live field document.");
}

run().catch((err) => {
  console.error("Fix failed:", err);
  process.exit(1);
});
