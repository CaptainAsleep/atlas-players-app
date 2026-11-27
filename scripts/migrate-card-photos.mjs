// One-off migration for Separate Card Photo + Paid Changes (2026-11-26).
// Scope: project doc claude/atlas-card-photo-change-scope.md.
//
// Cards no longer fall back to the profile photo, and the card photo is now
// server-owned (cardPhotos/...). So before the new app goes out, every player
// and child with a photo gets a card photo snapshot:
//   - an existing card photo (avatars/{uid}/card-photo.jpg, 1,200px) -> copied, marked sharp
//   - otherwise their current profile photo -> copied, marked low-res (they get the "sharper photo" prompt)
// cardPhotoChanges is set to 0 for everyone: per Michael, existing photos
// don't use up anyone's free card photo. Old files are left where they are.
// Safe to re-run: anyone already on a cardPhotos/ file is skipped.
//
// Run AFTER deploying functions + rules, BEFORE pushing the player app:
//   node migrate-card-photos.mjs           (dry run, writes nothing)
//   node migrate-card-photos.mjs --apply
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { readFileSync } from "fs";
import { randomBytes, randomUUID } from "crypto";
import { storagePathFromUrl, cleanAspect } from "../functions/cardPhotos.js";

const APPLY = process.argv.includes("--apply");
const STORAGE_BUCKET = "atlas-players-app.firebasestorage.app";
const sa = JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)));
initializeApp({ credential: cert(sa), storageBucket: STORAGE_BUCKET });
const db = getFirestore();
const bucket = getStorage().bucket();

function sniff(buf) {
  if (buf[0] === 0xff && buf[1] === 0xd8) return { type: "image/jpeg", ext: "jpg" };
  if (buf[0] === 0x89 && buf[1] === 0x50) return { type: "image/png", ext: "png" };
  if (buf.toString("ascii", 0, 4) === "RIFF") return { type: "image/webp", ext: "webp" };
  return null;
}

async function readImage(url) {
  const p = storagePathFromUrl(url);
  if (p) { const [buf] = await bucket.file(p).download(); return buf; }
  const res = await fetch(url); // e.g. a Google sign-in photo
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function copyToCardPhotos(url) {
  const buf = await readImage(url);
  const kind = sniff(buf);
  if (!kind) throw new Error("not an image");
  const path = `cardPhotos/${randomBytes(16).toString("hex")}.${kind.ext}`;
  const token = randomUUID();
  await bucket.file(path).save(buf, { resumable: false, contentType: kind.type, metadata: { cacheControl: "public, max-age=31536000", metadata: { firebaseStorageDownloadTokens: token } } });
  return { path, url: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}` };
}

const tally = { sharp: 0, lowRes: 0, already: 0, noPhoto: 0, failed: 0 };
async function migrate(label, ref, d, { isChild }) {
  if (typeof d.cardPhotoPath === "string" && d.cardPhotoPath.startsWith("cardPhotos/")) { tally.already++; return; }
  const legacyCard = !isChild && d.cardPhotoUrl ? d.cardPhotoUrl : null;
  const source = legacyCard || d.avatarUrl || null;
  if (!source) { tally.noPhoto++; return; }
  const hiRes = !!legacyCard;
  hiRes ? tally.sharp++ : tally.lowRes++;
  console.log(`  ${label}: ${hiRes ? "card photo (sharp)" : "profile photo (low-res)"}`);
  if (!APPLY) return;
  try {
    const { path, url } = await copyToCardPhotos(source);
    await ref.update({
      cardPhotoUrl: url, cardPhotoPath: path,
      cardPhotoAspect: hiRes ? cleanAspect(d.cardPhotoAspect) : 1,
      cardPhotoHiRes: hiRes, cardPhotoChanges: 0,
    });
  } catch (err) {
    hiRes ? tally.sharp-- : tally.lowRes--;
    tally.failed++;
    console.log(`    FAILED: ${err.message}`);
  }
}

console.log("Players:");
for (const doc of (await db.collection("publicProfiles").get()).docs) {
  await migrate(`${doc.data().callsign || "?"} (${doc.id})`, doc.ref, doc.data(), { isChild: false });
}
console.log("Kids (dependent profiles):");
for (const doc of (await db.collectionGroup("dependents").get()).docs) {
  const d = doc.data();
  if (d.graduatedAt) continue;
  await migrate(`${d.callsign || "?"} (child ${doc.id})`, doc.ref, d, { isChild: true });
}
console.log(`\nSharp card photos: ${tally.sharp} · from profile photo (low-res): ${tally.lowRes} · already done: ${tally.already} · no photo: ${tally.noPhoto} · failed: ${tally.failed}`);
console.log(APPLY ? "Done." : "Dry run only. Re-run with --apply to write.");
