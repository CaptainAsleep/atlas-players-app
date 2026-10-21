// Free, internal TEST bookings for rehearsing the QR check-in scan.
//
//   node scripts/add-test-bookings.mjs                  dry run (default, no writes)
//   node scripts/add-test-bookings.mjs --write          create the bookings
//   node scripts/add-test-bookings.mjs --reset-checkin  un-check-in them, to scan again
//   node scripts/add-test-bookings.mjs --remove         delete them after the event
//
// Each booking is written in the same shape bookFreeEvent writes (event
// copy + the player's own mirror copy), plus `isTest: true`. On purpose:
//   - bookedCount is NOT touched, so they sit outside the event's player count.
//   - The player app treats them like any booking: same Home card, same QR.
//   - The owner app scans them like any booking (same green check-in).
//   - Owner roster/counts, After-Action Report, Analytics and the
//     post-event feedback emails all skip isTest bookings.
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const EVENT_ID = "the-compound-2026-10-24-open-play";
const TEST_UIDS = {
  lg4HMLTJvsPfSEN1pvNhMV4fbct1: "Atlas",
  "4gaohQb6ddMvdSNdhlDp75eMZke2": "Rogue",
};

const mode = process.argv.includes("--write") ? "write"
  : process.argv.includes("--reset-checkin") ? "reset"
  : process.argv.includes("--remove") ? "remove" : "dry";

const sa = JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

const eventRef = db.collection("events").doc(EVENT_ID);
const ev = (await eventRef.get()).data();
if (!ev) throw new Error(`Event ${EVENT_ID} not found`);
console.log(`Event: ${ev.title} @ ${ev.fieldName} on ${ev.date} (bookedCount ${ev.bookedCount}, stays unchanged)`);
console.log(`Mode: ${mode}\n`);

for (const [uid, label] of Object.entries(TEST_UIDS)) {
  const bookingRef = eventRef.collection("bookings").doc(uid);
  const mirrorRef = db.collection("users").doc(uid).collection("bookings").doc(EVENT_ID);
  const [bSnap, mSnap, pSnap, sigSnap] = await Promise.all([
    bookingRef.get(), mirrorRef.get(),
    db.collection("users").doc(uid).get(),
    db.collection("waiverSignatures").doc(`${uid}_${EVENT_ID}`).get(),
  ]);
  const existing = bSnap.data();
  const profile = pSnap.data() || {};
  console.log(`${label} (${uid})`);
  console.log(`  booking: ${existing ? (existing.isTest ? "test booking exists" : "REAL booking exists") : "none"}${existing?.checkedIn ? ", checked in" : ""}`);
  console.log(`  waiver signed in app: ${sigSnap.exists ? "yes" : "no"}`);

  if (existing && !existing.isTest) {
    console.log("  -> skipped: a real booking is already here; leaving it alone.\n");
    continue;
  }

  if (mode === "write") {
    if (existing) { console.log("  -> already set up.\n"); continue; }
    const now = new Date();
    const batch = db.batch();
    batch.set(bookingRef, {
      uid,
      fieldId: ev.fieldId ?? null,
      ...(ev.hostOwnerId ? { hostOwnerId: ev.hostOwnerId } : {}),
      teamId: profile.teamId || null,
      callsign: profile.callsign || label,
      avatarUrl: profile.avatarUrl || null,
      bookedAt: now,
      isTest: true,
    });
    batch.set(mirrorRef, {
      eventId: EVENT_ID,
      fieldId: ev.fieldId ?? null,
      ...(ev.hostOwnerId ? { hostOwnerId: ev.hostOwnerId } : {}),
      eventTitle: ev.title || null,
      fieldName: ev.fieldName || null,
      date: ev.date || null,
      endDate: ev.endDate || null,
      bookedAt: now,
      isTest: true,
    });
    await batch.commit();
    console.log("  -> created.\n");
  } else if (mode === "reset") {
    if (!existing) { console.log("  -> nothing to reset.\n"); continue; }
    const clear = { checkedIn: FieldValue.delete(), checkedInAt: FieldValue.delete() };
    const batch = db.batch();
    batch.update(bookingRef, clear);
    if (mSnap.exists) batch.update(mirrorRef, clear);
    await batch.commit();
    console.log("  -> check-in cleared, ready to scan again.\n");
  } else if (mode === "remove") {
    if (!existing) { console.log("  -> nothing to remove.\n"); continue; }
    const batch = db.batch();
    batch.delete(bookingRef);
    if (mSnap.exists) batch.delete(mirrorRef);
    await batch.commit();
    console.log("  -> removed.\n");
  } else {
    console.log(`  -> would ${existing ? "leave as is" : "create a free test booking"} (dry run).\n`);
  }
}
const after = (await eventRef.get()).data();
console.log(`bookedCount now ${after.bookedCount}`);
