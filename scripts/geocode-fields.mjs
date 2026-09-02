// Run locally with: node scripts/geocode-fields.mjs
//
// Backfills lat/lng onto every field document that has a street address but
// no coordinates yet. Uses OpenStreetMap's free Nominatim geocoder — no API
// key, but their usage policy requires: max 1 request/second, and a real
// identifying User-Agent (not spoofed as a browser). This is a manual,
// occasional maintenance script — it is intentionally NOT part of the
// automated deploy pipeline, both to respect that rate limit and because
// addresses rarely change once seeded.
//
// Requires scripts/serviceAccountKey.json (same file the seed script uses).

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

console.log("[1/5] Script loaded, imports resolved.");

const serviceAccount = JSON.parse(
  readFileSync(new URL("./serviceAccountKey.json", import.meta.url))
);
console.log("[2/5] Service account key read successfully.");

initializeApp({ credential: cert(serviceAccount) });
console.log("[3/5] Firebase app initialized.");

const db = getFirestore();
console.log("[4/5] Firestore client created.");

// Some home routers/ISPs silently hang gRPC's persistent streaming
// connections instead of erroring, which makes an admin SDK call stall
// forever with zero output. Forcing plain REST here avoids that entirely.
db.settings({ preferRest: true });
console.log("[5/5] REST transport forced. Starting main routine…\n");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function nominatimSearch(params) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&${params}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "AtlasAirsoftApp/1.0 (contact: field-owner-project)" },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Nominatim request failed: ${res.status}`);
    const results = await res.json();
    if (!results.length) return null;
    return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
  } finally {
    clearTimeout(timeout);
  }
}

// Nominatim's free instance is occasionally flaky, and a single freeform
// query sometimes comes back empty even for a perfectly normal address that
// works fine seconds later. Four attempts, in increasingly loose forms,
// before actually giving up:
//   1. The address as-is (fast path, works most of the time)
//   2. The exact same query again, in case attempt 1 was just a fluke
//   3. A structured query (separate street/city/state/zip fields), which
//      Nominatim's parser sometimes handles more reliably than one long
//      freeform string, especially with unit/suite numbers in the address
//   4. City + state + zip only, dropping the street entirely — this trades
//      precision for a real result: a pin centered on the town instead of
//      the exact building. Marked so the app/seed data can flag it as
//      approximate rather than pretending it's the exact front door.
async function geocode(address) {
  const freeform = `q=${encodeURIComponent(address)}`;

  let result = await nominatimSearch(freeform);
  if (result) return { ...result, precision: "exact" };

  await sleep(1100);
  result = await nominatimSearch(freeform);
  if (result) return { ...result, precision: "exact" };

  const match = address.match(/^(.*?),\s*([^,]+?),\s*MI\s*(\d{5})/i);
  if (match) {
    const [, street, city, zip] = match;
    const structured = `street=${encodeURIComponent(street)}&city=${encodeURIComponent(city)}&state=Michigan&postalcode=${zip}&country=USA`;
    await sleep(1100);
    result = await nominatimSearch(structured);
    if (result) return { ...result, precision: "exact" };

    // Last resort: city/state/zip only, no street. Approximate, but a
    // pin near the right town beats no pin on the map at all.
    const cityOnly = `city=${encodeURIComponent(city)}&state=Michigan&postalcode=${zip}&country=USA`;
    await sleep(1100);
    result = await nominatimSearch(cityOnly);
    if (result) return { ...result, precision: "approximate" };
  }

  return null;
}

async function run() {
  console.log("Connecting to Firestore…");
  const snap = await db.collection("fields").get();
  console.log(`Connected. Found ${snap.docs.length} field(s) to check.\n`);
  let updated = 0;
  let skipped = 0;

  for (const doc of snap.docs) {
    const field = doc.data();

    if (field.lat && field.lng) {
      console.log(`- ${field.name}: already has coordinates, skipping`);
      skipped++;
      continue;
    }
    if (!field.address) {
      console.log(`- ${field.name}: no street address on file, skipping`);
      skipped++;
      continue;
    }

    try {
      const coords = await geocode(field.address);
      if (!coords) {
        console.log(`! ${field.name}: no geocoding match for "${field.address}"`);
        skipped++;
      } else {
        await doc.ref.update(coords);
        const tag = coords.precision === "approximate" ? " (approximate — city-level only)" : "";
        console.log(`✓ ${field.name}: ${coords.lat}, ${coords.lng}${tag}`);
        updated++;
      }
    } catch (err) {
      console.log(`! ${field.name}: ${err.message}`);
      skipped++;
    }

    await sleep(1100); // stay under Nominatim's 1 req/sec limit with margin
  }

  console.log(`\nDone. Geocoded ${updated} field(s), skipped ${skipped}.`);
}

run().catch((err) => {
  console.error("Geocoding failed:", err);
  process.exit(1);
});
