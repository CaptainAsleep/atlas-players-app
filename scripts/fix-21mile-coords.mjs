// One-off fix — run locally with: node scripts/fix-21mile-coords.mjs
//
// History: 21 Mile Airsoft (field id 21-mile-airsoft-billings) sits on
// "21 Mile Rd, Billings, MT", a road name that neither the Census geocoder
// nor Nominatim has in its index. The first geocode pass fuzzy-matched it
// to Cherry Hills Rd (wrong). The 2026-09-23 version of this script cleared
// those coords, so the app fell back to address-text directions, but the
// players' map apps also can't resolve "21 Mile Rd" and were sending
// people to Aurora, CO (reported by Michael 2026-11-03).
//
// Fix (2026-11-03): set exact coordinates supplied directly by Michael:
//   46°05'07.2"N 108°33'27.4"W  ->  46.085333, -108.557611
// geocode-fields.mjs skips fields that already have precision "exact", and
// seed-data.mjs writes with merge: true and carries no lat/lng, so neither
// will overwrite these.
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
db.settings({ preferRest: true });

async function run() {
  await db.collection("fields").doc("21-mile-airsoft-billings").update({
    lat: 46.085333,
    lng: -108.557611,
    precision: "exact",
  });
  console.log("Updated 21-mile-airsoft-billings: 46.085333, -108.557611 (exact)");
}

run().catch((err) => {
  console.error("Fix failed:", err);
  process.exit(1);
});
