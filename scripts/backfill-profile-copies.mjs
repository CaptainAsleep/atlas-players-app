// One-time repair (2026-10-27): brings every stored copy of a player's
// callsign/avatarUrl back in line with publicProfiles. Uses the same patch
// rules as the syncProfileCopies function (functions/profileSync.js),
// including "bookings only for events that haven't ended".
//
// Dry run by default — prints what it would change. Add --apply to write.
//   node backfill-profile-copies.mjs
//   node backfill-profile-copies.mjs --apply
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { todayInDetroit, isUpcoming, copyPatch, eventBookingPatch, bookingMirrorPatch, applyProfileCopyUpdates } from "../functions/profileSync.js";

const APPLY = process.argv.includes("--apply");
const sa = JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)));
initializeApp({ credential: cert(sa) });
const db = getFirestore();
const today = todayInDetroit();

const pub = {};
(await db.collection("publicProfiles").get()).docs.forEach((d) => { pub[d.id] = d.data(); });
const eventDates = {};
(await db.collection("events").get()).docs.forEach((d) => { eventDates[d.id] = d.data(); });

const updates = [];
const counts = {};
const add = (label, ref, patch) => {
  if (!patch) return;
  updates.push({ ref, patch });
  counts[label] = (counts[label] || 0) + 1;
  console.log(`${label.padEnd(16)} ${ref.path}  ${JSON.stringify(patch).slice(0, 160)}`);
};

for (const g of ["members", "rsvps", "interested"]) {
  for (const d of (await db.collectionGroup(g).get()).docs) {
    const p = pub[d.data().uid];
    if (p) add(g, d.ref, copyPatch(d.data(), p));
  }
}
for (const c of ["joinRequests", "officerRequests"]) {
  for (const d of (await db.collection(c).get()).docs) {
    const p = pub[d.data().uid];
    if (p) add(c, d.ref, copyPatch(d.data(), p));
  }
}
for (const d of (await db.collection("friendRequests").get()).docs) {
  const x = d.data();
  const patch = {
    ...(pub[x.fromUid] ? copyPatch(x, pub[x.fromUid], "fromCallsign", "fromAvatarUrl") : {}),
    ...(pub[x.toUid] ? copyPatch(x, pub[x.toUid], "toCallsign", "toAvatarUrl") : {}),
  };
  add("friendRequests", d.ref, Object.keys(patch).length ? patch : null);
}
// bookings: events/{eventId}/bookings/{uid} and the users/{uid}/bookings/{eventId} mirror
let skippedPast = 0;
for (const d of (await db.collectionGroup("bookings").get()).docs) {
  const parts = d.ref.path.split("/");
  if (parts[0] === "events") {
    const [, eventId, , uid] = parts;
    const p = pub[uid];
    if (!p) continue;
    if (!isUpcoming(eventDates[eventId], today)) { if (eventBookingPatch(d.data(), p)) skippedPast++; continue; }
    add("bookings", d.ref, eventBookingPatch(d.data(), p));
  } else if (parts[0] === "users") {
    const p = pub[parts[1]];
    if (p && isUpcoming(d.data(), today)) add("bookingMirrors", d.ref, bookingMirrorPatch(d.data(), p));
  }
}

console.log(`\nToday (Detroit): ${today}`);
console.log("Stale copies by type:", counts);
console.log(`Past-event bookings left as booked: ${skippedPast}`);
console.log(`Total updates: ${updates.length}`);
if (APPLY) {
  await applyProfileCopyUpdates(db, updates);
  console.log("APPLIED.");
} else {
  console.log("Dry run — nothing written. Re-run with --apply to write.");
}
