// Rebuilds missing users/{uid} docs for players who have a publicProfiles
// doc but no private profile. Cause: the users/{userId} rule's verified
// guard errored on docs with no `verified` field, so unverified-email
// players' creates were rejected (fixed 2026-10-06 in firestore.rules).
//
// DRY RUN by default — prints what it would create and writes nothing.
//   node scripts/repair-missing-user-docs.mjs            (dry run)
//   node scripts/repair-missing-user-docs.mjs --write    (actually create)
//
// Never overwrites: skips any uid whose users/{uid} doc already exists, and
// skips (and lists) any public profile with no matching Auth account.
// Leaves acceptedTermsVersion unset (they must still accept the EULA) and
// verified unset (the app's email-verification sync handles it).

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { readFileSync } from "fs";

const WRITE = process.argv.includes("--write");
const serviceAccount = JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
const auth = getAuth();

const pubSnap = await db.collection("publicProfiles").get();
console.log(`${pubSnap.size} public profiles scanned. Mode: ${WRITE ? "WRITE" : "DRY RUN"}\n`);

let toCreate = 0, created = 0, existed = 0, noAuth = 0;
for (const pub of pubSnap.docs) {
  const uid = pub.id;
  const userRef = db.collection("users").doc(uid);
  if ((await userRef.get()).exists) { existed++; continue; }

  let authUser;
  try { authUser = await auth.getUser(uid); }
  catch { noAuth++; console.log(`SKIP  ${uid} (${pub.data().callsign}) — no Auth account, needs a manual look`); continue; }

  const p = pub.data();
  const doc = {
    email: authUser.email || null,
    callsign: p.callsign || (authUser.email ? authUser.email.split("@")[0] : "Player"),
    createdAt: p.createdAt || Timestamp.now(),
    completedOnboarding: false,
    ...(p.avatarUrl ? { avatarUrl: p.avatarUrl } : {}),
  };
  toCreate++;
  console.log(`${WRITE ? "CREATE" : "WOULD CREATE"}  users/${uid}  callsign=${doc.callsign}  email=${doc.email}  emailVerified=${authUser.emailVerified}`);
  if (WRITE) {
    // create() fails if the doc appeared since the check above — never overwrites.
    await userRef.create(doc);
    created++;
  }
}
console.log(`\nSummary: ${existed} already had a users doc, ${noAuth} skipped (no Auth), ${toCreate} ${WRITE ? "created" : "would be created"}.`);
if (!WRITE && toCreate) console.log("Re-run with --write to create them.");
