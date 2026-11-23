// Turn an organizer account into a test account (or back). Every event a
// test account creates carries testEvent: true and is hidden from players
// except TEST_VIEWER_UIDS (src/testViewers.js). Admin SDK only: the owner app
// can't set testAccount (firestore.rules).
//
// Only events created AFTER this is set are marked. Existing events of the
// account are listed (not changed) so you can see what's already public.
//
// Usage (dry run by default):
//   node set-test-account.mjs --email test@example.com
//   node set-test-account.mjs --email test@example.com --write
//   node set-test-account.mjs --email test@example.com --off --write
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { readFileSync } from "fs";

const arg = (name) => { const i = process.argv.indexOf(`--${name}`); return i > -1 ? process.argv[i + 1] : null; };
const email = (arg("email") || "").trim().toLowerCase();
const write = process.argv.includes("--write");
const off = process.argv.includes("--off");
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error("Usage: node set-test-account.mjs --email <address> [--off] [--write]");
  process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)))) });
const db = getFirestore();
let user;
try { user = await getAuth().getUserByEmail(email); } catch { console.error(`No Atlas account for ${email}. Sign up in the Major app first.`); process.exit(1); }
const ref = db.collection("owners").doc(user.uid);
const snap = await ref.get();
if (!snap.exists) { console.error(`${email} (${user.uid}) has no owners doc yet. Sign in to the Major app once first.`); process.exit(1); }
const o = snap.data();
console.log(`Account: ${email} (${user.uid}) — name ${o.name || "-"}, organizer ${o.accountRoles?.organizer === true}, testAccount now ${o.testAccount === true}`);
const evs = await db.collection("events").where("hostOwnerId", "==", user.uid).get();
for (const d of evs.docs) {
  const e = d.data();
  console.log(`  event ${d.id}: "${e.title || ""}" draft=${!!e.draft} testEvent=${e.testEvent === true}`);
}
if (o.accountRoles?.fieldOwner || (o.claimedFieldCount || 0) > 0) {
  console.error("This account owns or manages a field. Use a separate email for testing.");
  process.exit(1);
}
console.log(`Would set testAccount: ${!off}.`);
if (!write) { console.log("Dry run — re-run with --write to apply."); process.exit(0); }
await ref.update({ testAccount: !off });
console.log("Done.");
