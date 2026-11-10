// Set up an account BEFORE the person joins, keyed by their email (2026-11-10).
// When an account with that email (verified) finishes onboarding, the server
// applies it once: card beta, a hand-given card rank, a creator badge, and a
// pending friend request from Michael. See functions/accountPresets.js.
//
// Dry run by default. --apply writes. --remove deletes a preset that hasn't
// been applied yet (an applied one is history; undo its parts with
// set-card-beta.mjs / set-card-rank.mjs instead).
//
//   node set-account-preset.mjs "DesertFoxTactical@gmail.com" --card-beta --rank legendary --creator youtuber --friend-request
//   node set-account-preset.mjs "DesertFoxTactical@gmail.com" --card-beta --rank legendary --creator youtuber --friend-request --apply
//   node set-account-preset.mjs "DesertFoxTactical@gmail.com" --remove --apply
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { normEmail, presetPlan, HAND_GIVEN, CREATOR_KINDS } from "../functions/accountPresets.js";
import { FOUNDER_UID } from "../functions/cards.js";

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const val = (n) => { const i = argv.indexOf(`--${n}`); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : null; };
const email = normEmail(argv[0]);
const APPLY = flag("apply");
const REMOVE = flag("remove");
if (!email) {
  console.log(`Usage: node set-account-preset.mjs "<email>" [--card-beta] [--rank <${HAND_GIVEN.join("|")}>] [--creator <${Object.keys(CREATOR_KINDS).join("|")}>] [--friend-request] [--apply]`);
  console.log('       node set-account-preset.mjs "<email>" --remove [--apply]');
  process.exit(1);
}
const sa = JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)));
initializeApp({ credential: cert(sa) });
const db = getFirestore();
const ref = db.collection("accountPresets").doc(email);
const existing = await ref.get();

if (existing.exists && existing.data().appliedTo) {
  console.log(`${email}: already applied to ${existing.data().appliedTo}. Nothing changed.`);
  process.exit(1);
}
if (REMOVE) {
  console.log(`${email}: ${existing.exists ? "remove pending preset" : "no preset to remove"}`);
  if (!APPLY) { console.log("Dry run only. Re-run with --apply to write."); process.exit(0); }
  if (existing.exists) await ref.delete();
  console.log("Done.");
  process.exit(0);
}

const doc = {
  cardBeta: flag("card-beta"),
  rank: val("rank"),
  creator: val("creator") ? { kind: val("creator") } : null,
  friendRequestFrom: flag("friend-request") ? FOUNDER_UID : null,
};
const plan = presetPlan(doc);
if (doc.rank && !plan.rank) { console.log(`Unknown rank "${doc.rank}".`); process.exit(1); }
if (doc.creator && !plan.creator) { console.log(`Unknown creator kind "${doc.creator.kind}".`); process.exit(1); }
if (!plan.cardBeta && !plan.rank && !plan.creator && !plan.friendRequestFrom) { console.log("Nothing to set. Add at least one option."); process.exit(1); }

console.log(`${email}: ${existing.exists ? "replace pending preset" : "new preset"}`);
console.log(`  card beta:      ${plan.cardBeta ? "yes" : "no"}`);
console.log(`  card rank:      ${plan.rank || "-"}`);
console.log(`  creator badge:  ${plan.creator ? plan.creator.label : "-"}`);
console.log(`  friend request: ${plan.friendRequestFrom ? "pending request from Atlas (Michael)" : "-"}`);
console.log("Applied when an account with this email (verified) has a public profile; checked on signup and hourly.");
if (!APPLY) { console.log("Dry run only. Re-run with --apply to write."); process.exit(0); }
await ref.set({ ...plan, appliedTo: null, createdAt: FieldValue.serverTimestamp() });
console.log("Done.");
