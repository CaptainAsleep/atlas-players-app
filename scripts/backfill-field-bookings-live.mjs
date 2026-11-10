// Backfill fields/{fieldId}.bookingsLive (2026-11-10) for every claimed
// field, from its owner's current payout status. New changes are kept in
// sync automatically by the syncFieldBookingsLiveOnOwner /
// syncFieldBookingsLiveOnClaim Cloud Functions; this only covers fields
// claimed (and owners onboarded) before those existed.
//
//   node scripts/backfill-field-bookings-live.mjs            dry run: prints what would change
//   node scripts/backfill-field-bookings-live.mjs --write    writes bookingsLive (+ bookingsLiveAt when true)
//
// Same check createBookingCheckout makes: owner payoutsEnabled AND
// stripeConnectAccountId. Safe to re-run: fields already correct are skipped.
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";

initializeApp({ credential: cert(JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)))) });
const db = getFirestore();
const write = process.argv.includes("--write");

const fields = await db.collection("fields").get();
const ownerCache = new Map();
let claimed = 0, changed = 0;
for (const f of fields.docs) {
  const d = f.data();
  if (!d.ownerId) continue;
  claimed += 1;
  if (!ownerCache.has(d.ownerId)) {
    ownerCache.set(d.ownerId, (await db.collection("owners").doc(d.ownerId).get()).data() || null);
  }
  const owner = ownerCache.get(d.ownerId);
  const isLive = !!(owner?.payoutsEnabled && owner?.stripeConnectAccountId);
  const label = `${(d.name || f.id).padEnd(36)} ${f.id}`;
  if (d.bookingsLive === isLive) { console.log(`  ok        ${label}  bookingsLive=${isLive}`); continue; }
  changed += 1;
  console.log(`  ${write ? "SET" : "would set"} ${label}  bookingsLive=${isLive}`);
  if (write) {
    await f.ref.update(isLive ? { bookingsLive: true, bookingsLiveAt: FieldValue.serverTimestamp() } : { bookingsLive: false });
  }
}
console.log(`\n${claimed} claimed field(s), ${changed} ${write ? "updated" : "to update (dry run — add --write)"}.`);
