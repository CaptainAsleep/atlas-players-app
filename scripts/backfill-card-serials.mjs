// Trading cards (2026-11-08): one-time numbering + card stats + tiers.
//
// Serial numbers go oldest-first, matching the admin portal's Players table
// read bottom to top (Michael, 2026-11-08). The run refuses to write unless
// it produces Rogue #2, Doctor Lamao #13 and Maziko #100.
// Public child profiles are numbered after every adult (they went public
// before cards existed); from now on each new player or newly public child
// takes the next number (assignCardSerial / setChildProfilePublic).
//
// Dry run by default — prints the plan. Add --apply to write.
//   node backfill-card-serials.mjs
//   node backfill-card-serials.mjs --apply
// Safe to re-run: numbered profiles keep their numbers; anyone missing one
// (e.g. signed up mid-run) gets the next number.
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { planSerials, adultCardStats, childCardStats, computeTiers, sameStats, FOUNDER_UID, TIER_OVERRIDES } from "../functions/cards.js";

const APPLY = process.argv.includes("--apply");
const sa = JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

// Matched on callsign with case, spaces and punctuation ignored.
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const EXPECT = { "Rogue": 2, "Doctor Lamao": 13, "Maziko": 100 };

const counterRef = db.collection("counters").doc("players");
const counterSnap = await counterRef.get();
const startTotal = counterSnap.exists ? counterSnap.data().total || 0 : 0;

const adults = (await db.collection("publicProfiles").get()).docs;
const adultPlan = planSerials(adults.map((d) => ({ id: d.id, createdAt: d.data().createdAt, signupNumber: d.data().signupNumber })), startTotal);

const kidsSnap = (await db.collection("childPublicProfiles").get()).docs;
const links = {};
await Promise.all(kidsSnap.map(async (d) => {
  const l = await db.collection("childPublicLinks").doc(d.id).get();
  if (l.exists) links[d.id] = l.data();
}));
const keptSerial = {};
await Promise.all(kidsSnap.map(async (d) => {
  const l = links[d.id];
  if (!l) return;
  const k = await db.collection("childCardSerials").doc(`${l.guardianUid}_${l.dependentId}`).get();
  if (k.exists) keptSerial[d.id] = k.data().signupNumber;
}));
const kidPlan = planSerials(
  kidsSnap.filter((d) => links[d.id]).map((d) => ({ id: d.id, createdAt: d.data().createdAt, signupNumber: d.data().signupNumber ?? keptSerial[d.id] })),
  adultPlan.total,
);

// --- Checks --------------------------------------------------------------
const serialOf = {};
adults.forEach((d) => { if (Number.isInteger(d.data().signupNumber)) serialOf[d.id] = d.data().signupNumber; });
adultPlan.assignments.forEach((a) => { serialOf[a.id] = a.signupNumber; });
const byCallsign = {};
adults.forEach((d) => {
  const k = norm(d.data().callsign);
  (byCallsign[k] ||= []).push(d.id);
});
let ok = true;
for (const [name, want] of Object.entries(EXPECT)) {
  const ids = byCallsign[norm(name)] || [];
  if (ids.length !== 1) { ok = false; console.log(`CHECK FAIL  "${name}": ${ids.length} profiles with that callsign`); continue; }
  const got = serialOf[ids[0]];
  const pass = got === want;
  if (!pass) ok = false;
  console.log(`CHECK ${pass ? "ok  " : "FAIL"}  ${name.padEnd(13)} want #${want}  got #${got}  (${ids[0]})`);
}
if (adultPlan.missingCreatedAt.length) {
  console.log(`\nNOTE  ${adultPlan.missingCreatedAt.length} profile(s) have no createdAt and sort as oldest (same as the admin table):`);
  adultPlan.missingCreatedAt.forEach((id) => console.log(`      ${id}  ${adults.find((d) => d.id === id)?.data().callsign || ""}`));
}

console.log(`\nAdults: ${adults.length} profiles, ${adultPlan.assignments.length} to number. Kids: ${kidsSnap.length} public, ${kidPlan.assignments.length} to number.`);
console.log(`Counter: ${startTotal} -> ${kidPlan.total}\n`);
const nameOf = (id) => adults.find((d) => d.id === id)?.data().callsign || kidsSnap.find((d) => d.id === id)?.data().callsign || "";
console.log("Players (admin Players table, bottom to top):");
adultPlan.assignments.forEach((a) => console.log(`#${String(a.signupNumber).padStart(4)}  ${nameOf(a.id)}`));
if (kidPlan.assignments.length) {
  // Public child profiles live in childPublicProfiles, not in the admin
  // Players table, so they're listed separately and numbered after every adult.
  console.log("\nPublic child profiles (not in the admin Players table):");
  kidPlan.assignments.forEach((a) => console.log(`#${String(a.signupNumber).padStart(4)}  ${nameOf(a.id)}  (child, public id ${a.id})`));
}

// --- Stats -----------------------------------------------------------------
const statUpdates = [];
for (const d of adults) {
  const m = await db.collection("users").doc(d.id).collection("bookings").where("checkedIn", "==", true).get();
  const stats = adultCardStats(m.docs.map((x) => x.data()));
  if (!sameStats(stats, d.data().cardStats)) statUpdates.push({ ref: d.ref, stats });
}
for (const d of kidsSnap) {
  const l = links[d.id];
  if (!l) continue;
  const m = await db.collection("users").doc(l.guardianUid).collection("bookings").where("checkedIn", "==", true).get();
  const rows = [];
  for (const b of m.docs) {
    const det = await db.collection("events").doc(b.data().eventId || b.id).collection("bookings").doc(l.guardianUid).collection("attendeeDetails").doc(l.dependentId).get().catch(() => null);
    if (det?.exists) rows.push(b.data());
  }
  const stats = childCardStats(rows);
  if (!sameStats(stats, d.data().cardStats)) statUpdates.push({ ref: d.ref, stats });
}
console.log(`\nCard stats to update: ${statUpdates.length}`);

if (!ok) {
  console.log("\nNot writing: a numbering check failed. Nothing was changed.");
  process.exit(1);
}
if (!APPLY) {
  console.log("\nDry run only. Re-run with --apply to write.");
  process.exit(0);
}

// --- Write -----------------------------------------------------------------
const ops = [];
adultPlan.assignments.forEach((a) => ops.push((b) => b.update(db.collection("publicProfiles").doc(a.id), { signupNumber: a.signupNumber })));
kidPlan.assignments.forEach((a) => {
  const l = links[a.id];
  ops.push((b) => b.update(db.collection("childPublicProfiles").doc(a.id), { signupNumber: a.signupNumber }));
  ops.push((b) => b.set(db.collection("childCardSerials").doc(`${l.guardianUid}_${l.dependentId}`), { signupNumber: a.signupNumber, assignedAt: FieldValue.serverTimestamp() }));
});
statUpdates.forEach((u) => ops.push((b) => b.update(u.ref, { cardStats: u.stats })));
for (let i = 0; i < ops.length; i += 400) {
  const batch = db.batch();
  ops.slice(i, i + 400).forEach((op) => op(batch));
  await batch.commit();
}
// The counter last: until it exists, new sign-ups aren't numbered, so they
// can't collide with the numbers above. Then catch anyone who slipped in.
await counterRef.set({ total: kidPlan.total, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
const late = (await db.collection("publicProfiles").get()).docs.filter((d) => !Number.isInteger(d.data().signupNumber));
for (const d of late) {
  await db.runTransaction(async (t) => {
    const c = await t.get(counterRef);
    const p = await t.get(d.ref);
    if (Number.isInteger(p.data()?.signupNumber)) return;
    const n = (c.data().total || 0) + 1;
    t.update(counterRef, { total: n });
    t.update(d.ref, { signupNumber: n });
    console.log(`late sign-up numbered: #${n} ${p.data().callsign}`);
  });
}

// Tiers + titles now, instead of waiting for the hourly job.
const pubs = (await db.collection("publicProfiles").get()).docs;
const kids2 = (await db.collection("childPublicProfiles").get()).docs;
const all = [
  ...pubs.map((d) => ({ key: `a:${d.id}`, ref: d.ref, data: d.data(), founder: d.id === FOUNDER_UID, override: TIER_OVERRIDES[d.id] })),
  ...kids2.map((d) => ({ key: `c:${d.id}`, ref: d.ref, data: d.data(), founder: false })),
];
const { tiers, titles } = computeTiers(all.map((c) => ({ key: c.key, circulation: c.data.circulation || 0, founder: c.founder, override: c.override, serial: c.data.signupNumber })));
const tierOps = all.filter((c) => c.data.cardTier !== tiers[c.key] || (c.data.cardTitle || null) !== (titles[c.key] || null))
  .map((c) => (b) => b.update(c.ref, { cardTier: tiers[c.key], cardTitle: titles[c.key] || null }));
for (let i = 0; i < tierOps.length; i += 400) {
  const batch = db.batch();
  tierOps.slice(i, i + 400).forEach((op) => op(batch));
  await batch.commit();
}
console.log(`\nDone. Numbered ${adultPlan.assignments.length + kidPlan.assignments.length}, stats ${statUpdates.length}, tiers ${tierOps.length}. Counter = ${(await counterRef.get()).data().total}.`);
