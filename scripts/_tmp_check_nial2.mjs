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

async function run() {
  const email = "bsraptorsairsoft@gmail.com";
  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
  } catch (err) {
    console.log(`No Firebase Auth user found for ${email}: ${err.message}`);
    return;
  }
  console.log(`Auth user found: uid=${userRecord.uid}, emailVerified=${userRecord.emailVerified}, createdAt=${userRecord.metadata.creationTime}, lastSignIn=${userRecord.metadata.lastSignInTime}`);

  const uid = userRecord.uid;

  const userDoc = await db.collection("users").doc(uid).get();
  console.log(`users/${uid} exists: ${userDoc.exists}`);
  if (userDoc.exists) {
    const d = userDoc.data();
    console.log(`  callsign: ${d.callsign}, completedOnboarding: ${d.completedOnboarding}, acceptedTermsVersion: ${d.acceptedTermsVersion}, teamId: ${d.teamId}, createdAt: ${d.createdAt?.toDate?.()}`);
  }

  const pubDoc = await db.collection("publicProfiles").doc(uid).get();
  console.log(`publicProfiles/${uid} exists: ${pubDoc.exists}`);
  if (pubDoc.exists) {
    const d = pubDoc.data();
    console.log(`  callsign: ${d.callsign}, teamId: ${d.teamId}, verified: ${d.verified}`);
  }
}

run().catch((err) => {
  console.error("Check failed:", err);
  process.exit(1);
});
