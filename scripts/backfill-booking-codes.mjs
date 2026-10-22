// Backfill check-in codes (2026-10-22) for every existing booking that
// doesn't have one yet. New bookings get theirs automatically (webhook,
// bookFreeEvent, bookEventWithVoucher).
//
//   node scripts/backfill-booking-codes.mjs            dry run: counts only, writes nothing
//   node scripts/backfill-booking-codes.mjs --write    writes bookingCodes + bookingCodeIndex
//
// Sends no email (players see the code in the app) and doesn't touch
// check-in status or method. Safe to re-run: bookings that already have a
// code are skipped. Includes test bookings (isTest) so the QR rehearsal
// accounts can rehearse code check-in too.
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";
import { reserveBookingCode, writeBookingCode, bookingCodeDocId, formatBookingCode } from "../functions/bookingCode.js";

initializeApp({ credential: cert(JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)))) });
const db = getFirestore();
const write = process.argv.includes("--write");

const events = await db.collection("events").get();
let total = 0, have = 0, added = 0;
for (const ev of events.docs) {
  const e = ev.data();
  const bookings = await ev.ref.collection("bookings").get();
  if (bookings.empty) continue;
  let line = 0;
  for (const b of bookings.docs) {
    total += 1;
    const codeRef = db.collection("bookingCodes").doc(bookingCodeDocId(ev.id, b.id));
    if ((await codeRef.get()).exists) { have += 1; continue; }
    if (!write) { added += 1; line += 1; continue; }
    const code = await db.runTransaction(async (t) => {
      const existing = await t.get(codeRef);
      if (existing.exists) return null; // a real booking raced us
      const c = await reserveBookingCode(t, db, ev.id);
      writeBookingCode(t, db, { code: c, eventId: ev.id, uid: b.id, fieldId: b.data().fieldId ?? e.fieldId ?? null, hostOwnerId: b.data().hostOwnerId || e.hostOwnerId || null });
      return c;
    });
    if (code) { added += 1; line += 1; console.log(`  ${ev.id}  ${(b.data().callsign || b.id).padEnd(18)} ${formatBookingCode(code)}`); }
    else have += 1;
  }
  if (line) console.log(`${write ? "wrote" : "would add"} ${line} code(s) — ${e.title || ev.id} (${e.date || "?"})`);
}
console.log(`\n${write ? "WROTE" : "DRY RUN — nothing written."} Bookings: ${total}. Already had a code: ${have}. ${write ? "Codes added" : "Would add"}: ${added}.`);
