// One-off fix — run locally with: node scripts/fix-21mile-coords.mjs
//
// "21 Mile Airsoft" (field id 21-mile-airsoft-billings) is showing players
// a wrong map pin/directions link, reported by Michael 2026-09-23: the
// page's address text correctly says "21 Mile Rd, Billings, MT", but the
// embedded map and "Get Directions" link (LocationCard in App.jsx, which
// always prefers field.lat/field.lng over the address text when present)
// both point to 549/560 Cherry Hills Road instead — a real but entirely
// different residential street nearby.
//
// Root cause, confirmed by directly querying both geocoders this project
// uses, live, on 2026-09-23:
//   - The US Census geocoder returns ZERO matches for "21 Mile Rd,
//     Billings, MT" at all.
//   - Nominatim (OpenStreetMap) also has no "21 Mile Rd" in its Montana
//     road data, so a freeform query for it silently fuzzy-matched to the
//     nearest-sounding indexed road, "Cherry Hills Road" — and whatever
//     geocode pass ran for this field accepted that fuzzy match and wrote
//     it as precision: "exact", which it was not.
//
// This is the same underlying failure mode already found and fixed once
// for Bing Field Road, IL (see fix-bing-field-coords.mjs) — an informal or
// very rural road name that simply isn't in either geocoder's index. The
// difference there was two independent, authoritative sources (a tourism
// listing + a property record) to set real coordinates from directly.
// Neither exists for this field — seed-data.mjs's own dataSource note
// says as much ("no independent website, Facebook page, phone number,
// directory listing, or any other corroborating source could be found for
// this field anywhere in this research"). Rather than guess at a second
// wrong pin, this just clears the bad coordinates — the app falls back to
// plain address-text-based directions (LocationCard's `hasCoords` check),
// which lets each player's own maps app resolve "21 Mile Rd, Billings,
// MT" using its own address data instead of perpetuating this specific
// wrong point. Real coordinates (e.g. a hand-dropped pin, or a cross
// street/landmark) would need to come from Michael directly and can be
// set the same way fix-bing-field-coords.mjs did.
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
db.settings({ preferRest: true });

async function run() {
  await db.collection("fields").doc("21-mile-airsoft-billings").update({
    lat: FieldValue.delete(),
    lng: FieldValue.delete(),
    precision: FieldValue.delete(),
  });
  console.log("21 Mile Airsoft: cleared incorrect lat/lng/precision — the app now falls back to address-text directions until real coordinates are supplied.");
}

run().catch((err) => {
  console.error("Fix failed:", err);
  process.exit(1);
});
