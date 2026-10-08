// One field at a time: allowlist the email address that may claim a field
// via the emailed-code route (requestFieldEmailClaim / verifyFieldEmailClaim
// in functions/index.js). Writes the address to the field's PRIVATE
// subcollection (the field doc itself is world-readable) and sets the
// public flag emailClaimEnabled so the owner app offers the route.
//
// Usage (dry run by default):
//   node setup-email-claim.mjs --field cedar-airsoft-field --email someone@example.com
//   node setup-email-claim.mjs --field cedar-airsoft-field --email someone@example.com --write
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const arg = (name) => { const i = process.argv.indexOf(`--${name}`); return i > -1 ? process.argv[i + 1] : null; };
const fieldId = arg("field");
const email = (arg("email") || "").trim().toLowerCase();
const write = process.argv.includes("--write");
if (!fieldId || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error("Usage: node setup-email-claim.mjs --field <fieldId> --email <address> [--write]");
  process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)))) });
const db = getFirestore();
const fieldRef = db.collection("fields").doc(fieldId);
const snap = await fieldRef.get();
if (!snap.exists) { console.error(`No such field: ${fieldId}`); process.exit(1); }
const f = snap.data();
console.log(`Field: ${f.name} (${f.city}) — ownerId: ${f.ownerId || "none"}, claimed: ${f.claimed === true}`);
if (f.ownerId) { console.error("Already claimed — nothing to set up."); process.exit(1); }
console.log(`Would allowlist ${email} (private/emailClaim) and set emailClaimEnabled: true.`);
if (!write) { console.log("Dry run — re-run with --write to apply."); process.exit(0); }
await fieldRef.collection("private").doc("emailClaim").set({ email, createdAt: new Date() });
await fieldRef.update({ emailClaimEnabled: true });
console.log("Done.");
