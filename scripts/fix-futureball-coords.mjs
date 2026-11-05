// One-off fix — run locally with: node scripts/fix-futureball-coords.mjs
//
// Futureball (10799 Hi Tech Dr, Whitmore Lake, MI 48189) was geocoded by the
// Census geocoder, which interpolates along address ranges. 10799 is the top
// of its range (10601–10799), so the pin landed at the segment's end
// (42.445112, -83.766169), right where the 10901–11099 range starts, and
// directions resolved to 10971 Hi Tech Dr instead of the field.
//
// Replaced 2026-11-05 with the entrance coordinates Michael dropped by hand
// in Google Maps. geocode-fields.mjs skips fields that already have exact
// coordinates, so a later geocode run won't overwrite this.
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
  await db.collection("fields").doc("futureball").update({
    lat: 42.446418,
    lng: -83.76675,
    precision: "exact",
  });
  console.log("Updated futureball: 42.446418, -83.76675 (exact)");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
