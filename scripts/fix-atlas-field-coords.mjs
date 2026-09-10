// Run once with: node scripts/fix-atlas-field-coords.mjs
//
// One-time coordinate fix for the "Atlas Field" test fixture (aka "Atlas
// Arena," per Michael) — same shape of fix as fix-compound-coords.mjs.
// seed-data.mjs still has this field seeded with no real address at all
// (city: "Test City, MI", no street) since it was originally a pure claim-
// flow test fixture with nothing real to geocode. Michael has since set a
// real address directly in Firestore, "8191 Birch Rd, Saginaw, MI 48609,"
// which is why it never got real coordinates from geocode-fields.mjs (that
// script only fills in lat/lng for fields that already have an `address`
// on file — this one has never had one in the seed data it was written
// from).
//
// This field is also claimed (Michael's own comped test account), so
// re-running seed-data.mjs will never reach it either, per the
// already-claimed skip added 2026-09-08 — a direct one-off update is the
// only way to fix it.
//
// Verified 2026-09-10 via the US Census Bureau's geocoder, which matched
// "8191 Birch Rd, Saginaw, MI 48609" exactly.
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
  await db.collection("fields").doc("atlas-field").update({
    lat: 43.425793263837,
    lng: -84.076129439428,
    precision: "exact",
  });
  console.log("Atlas Field's coordinates set to 43.425793263837, -84.076129439428 (US Census match for 8191 Birch Rd, Saginaw, MI 48609).");
}

run().catch((err) => {
  console.error("Fix failed:", err);
  process.exit(1);
});
