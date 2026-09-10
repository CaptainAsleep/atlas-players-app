// One-off fix — run locally with: node scripts/fix-bing-field-coords.mjs
//
// Bing Field Airsoft & Paintball Park (500 Bing Field Road, Alton, IL
// 62002) never got map coordinates after seeding, for two compounding
// reasons discovered 2026-09-10:
//
//   1. "Bing Field Road" is a private/informal road name that isn't in the
//      US Census Bureau's public address-range data at all (confirmed live
//      — the Census geocoder returns zero matches for this address in any
//      street-suffix spelling: Road, Rd, or Dr).
//   2. geocode-fields.mjs's Nominatim fallback chain has a real bug (fixed
//      in this same commit): its structured/city-only fallback only ever
//      fired for Michigan addresses (a hardcoded "MI" in the regex, left
//      over from before Atlas had any other state). Since Census failed
//      and the two freeform Nominatim attempts also failed for this rural
//      address, the whole geocode() call returned null for this Illinois
//      field instead of falling through to an approximate city-level pin.
//
// With the fallback bug now fixed, re-running geocode-fields.mjs would at
// least get an approximate Alton, IL pin — but real coordinates for this
// exact property were already found and cross-checked from two independent
// sources, so this script sets them directly instead of settling for
// approximate:
//   - Enjoy Illinois's official tourism listing for this business embeds a
//     Google Maps directions link with these exact coordinates.
//   - LoopNet's commercial property record confirms a real 20.25-acre
//     parcel (Madison County APN 19-1-08-18-00-000-016) at this address.
//
// Requires scripts/serviceAccountKey.json (same file the seed script uses).

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
  await db.collection("fields").doc("bing-field").update({
    lat: 38.8429771,
    lng: -90.0333201,
    precision: "exact",
  });
  console.log("Updated bing-field: 38.8429771, -90.0333201 (exact)");
}

run().catch((err) => {
  console.error("Fix failed:", err);
  process.exit(1);
});
