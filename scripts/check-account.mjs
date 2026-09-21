// Read-only account diagnostic. Run with:
//   node scripts/check-account.mjs someone@example.com
//
// Looks up a Firebase Auth user by email and reports whether their
// users/{uid} and publicProfiles/{uid} Firestore docs exist — useful for
// diagnosing "permission-denied" reports, since several rules (team
// creation among them) do an update() on publicProfiles/{uid}, and
// update() on a doc that doesn't exist yet surfaces to the client as a
// permission error rather than a clear "not found."
//
// Requires the same scripts/serviceAccountKey.json as the other scripts.
// Makes no writes — safe to run any time.

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(
  readFileSync(new URL("./serviceAccountKey.json", import.meta.url))
);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
const auth = getAuth();

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/check-account.mjs someone@example.com");
  process.exit(1);
}

async function run() {
  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
  } catch (err) {
    console.log(`No Firebase Auth user found for ${email}: ${err.message}`);
    return;
  }
  console.log(
    `Auth user found: uid=${userRecord.uid}, emailVerified=${userRecord.emailVerified}, ` +
    `createdAt=${userRecord.metadata.creationTime}, lastSignIn=${userRecord.metadata.lastSignInTime}`
  );

  const uid = userRecord.uid;

  const userDoc = await db.collection("users").doc(uid).get();
  console.log(`users/${uid} exists: ${userDoc.exists}`);
  if (userDoc.exists) {
    const d = userDoc.data();
    console.log(
      `  callsign: ${d.callsign}, completedOnboarding: ${d.completedOnboarding}, ` +
      `acceptedTermsVersion: ${d.acceptedTermsVersion}, teamId: ${d.teamId}, ` +
      `createdAt: ${d.createdAt?.toDate?.()}`
    );
  }

  const pubDoc = await db.collection("publicProfiles").doc(uid).get();
  console.log(`publicProfiles/${uid} exists: ${pubDoc.exists}`);
  if (pubDoc.exists) {
    const d = pubDoc.data();
    console.log(`  callsign: ${d.callsign}, teamId: ${d.teamId}, verified: ${d.verified}`);
  }

  const ownerDoc = await db.collection("owners").doc(uid).get();
  console.log(`owners/${uid} exists: ${ownerDoc.exists} (same uid across apps, since they share one Firebase Auth pool)`);
}

run().catch((err) => {
  console.error("Check failed:", err);
  process.exit(1);
});
