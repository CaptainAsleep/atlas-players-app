// Run once with: node scripts/fix-strip-internal-field-notes.mjs
//
// Removes internal, non-player-facing research/verification notes from
// every live field document in Firestore. seed-data.mjs's `notes` field
// was being used for two very different things: (a) internal notes about
// how confident this project is in a field's sourced data ("no
// independent website could be found," "per Michael, confirmed
// 2026-09-08," etc.), and (b) genuine status information players actually
// need (a field closed, a field relocated). Both were rendering
// identically as a public alert/info box at the top of that field's page
// in the player app (see the `field.notes` block in App.jsx's
// FieldDetailScreen) -- so internal research language was visible to
// every player and, per Michael, every field owner. Fixed at the source
// in seed-data.mjs on 2026-09-20 (removed `notes` entirely from every
// field except the 5 below, which got rewritten into short, plain,
// player-facing copy with no research-process language). This script
// applies that same fix directly to the live `fields` collection, since a
// source-file edit alone doesn't touch documents already in Firestore.
//
// The 5 fields kept below are the only ones where `notes` was the *sole*
// place telling a player a field is closed or relocated -- these have no
// `about` field to fall back on. (Sektor7, also closed/relocated, is not
// here: its closure story already lives in its `about` field, so its
// `notes` was purely internal and got cleared like everything else.)
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

const CLEAN_NOTES = {
  "total-control": "This field has closed; the property has reportedly been sold.",
  "nest-of-vipers": "This field has closed. Its final event was held July 14, 2026.",
  "kizzy-field": "This field closed in 2024.",
  "sfod-hq": "This field is no longer active.",
  "waste": "This field has relocated and now runs events out of Darkfire Airsoft's Hillsdale, MI location.",
};

async function run() {
  const snap = await db.collection("fields").get();

  let replaced = 0;
  let cleared = 0;
  let skipped = 0;

  const BATCH_SIZE = 400;
  let batch = db.batch();
  let opsInBatch = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    if (typeof data.notes !== "string" || data.notes.length === 0) {
      skipped++;
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(CLEAN_NOTES, doc.id)) {
      batch.update(doc.ref, { notes: CLEAN_NOTES[doc.id] });
      replaced++;
    } else {
      batch.update(doc.ref, { notes: FieldValue.delete() });
      cleared++;
    }
    opsInBatch++;
    if (opsInBatch >= BATCH_SIZE) {
      await batch.commit();
      batch = db.batch();
      opsInBatch = 0;
    }
  }
  if (opsInBatch > 0) {
    await batch.commit();
  }

  console.log(
    `Rewrote ${replaced} field(s) with clean player-facing notes, ` +
    `cleared internal notes from ${cleared} field(s), ` +
    `skipped ${skipped} field(s) with no notes to begin with.`
  );
}

run().catch((err) => {
  console.error("Fix failed:", err);
  process.exit(1);
});
