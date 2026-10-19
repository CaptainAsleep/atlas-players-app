// Run once with: node scripts/tag-drug-wars-major.mjs
//
// One-time, targeted update to the live Drug Wars event (Screaming Wombats at
// Bloomingdale): sets the Organizer name and the small MAJOR tag, both
// display-only. Touches only these two fields on this one event doc, so it
// doesn't need the full seed-data.mjs re-seed. (seed-data.mjs carries the
// same two fields so a future re-seed keeps them.)
//
// Requires scripts/serviceAccountKey.json (same file the other scripts use).

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(
  readFileSync(new URL("./serviceAccountKey.json", import.meta.url))
);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function run() {
  const ref = db.collection("events").doc("bloomingdale-airsoft-paintball-2026-10-25-drug-wars");
  const snap = await ref.get();
  if (!snap.exists) {
    console.error("Event not found — has seed-data.mjs been run for it yet?");
    process.exit(1);
  }
  await ref.update({ hostName: "Screaming Wombats", showMajorTag: true });
  console.log(`Updated "${snap.data().title}": hostName + showMajorTag set.`);
}

run().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
