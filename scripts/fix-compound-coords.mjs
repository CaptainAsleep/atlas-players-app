// Run once with: node scripts/fix-compound-coords.mjs
//
// One-time correction for The Compound's map pin. geocode-fields.mjs's
// Nominatim fallback silently landed on a city-center match near "Main
// St," Auburn — miles from the real field — instead of the actual rural
// address, and since it already had *some* lat/lng, later runs treated it
// as done and never retried. (geocode-fields.mjs was fixed 2026-09-10 to
// re-attempt anything flagged precision: "approximate" and to try the US
// Census geocoder first, which is what caught this — but this script
// force-corrects the one field already confirmed wrong, rather than
// depending on whatever precision flag happens to already be on its doc.)
//
// Verified 2026-09-10 via the US Census Bureau's geocoder, which matched
// "1154 W Seidlers Rd, Auburn, MI 48611" exactly (Michael also confirmed
// this is the correct, real address for the field).
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
  await db.collection("fields").doc("the-compound").update({
    lat: 43.68275096384,
    lng: -84.093921317396,
    precision: "exact",
  });
  console.log("The Compound's coordinates corrected to 43.68275096384, -84.093921317396 (US Census match for 1154 W Seidlers Rd, Auburn, MI 48611).");
}

run().catch((err) => {
  console.error("Fix failed:", err);
  process.exit(1);
});
