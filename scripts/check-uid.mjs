// Read-only diagnostic by uid. Run with:
//   node scripts/check-uid.mjs <uid>
// Reports the Auth record, whether users/{uid} and publicProfiles/{uid}
// exist, and which subcollections hang off users/{uid}. Makes no writes.
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
const auth = getAuth();

const uid = process.argv[2];
if (!uid) { console.error("Usage: node scripts/check-uid.mjs <uid>"); process.exit(1); }

try {
  const u = await auth.getUser(uid);
  console.log(`Auth: email=${u.email}, emailVerified=${u.emailVerified}, providers=${u.providerData.map((p) => p.providerId).join(",")}, created=${u.metadata.creationTime}, lastSignIn=${u.metadata.lastSignInTime}`);
} catch (e) { console.log(`Auth: no user for this uid (${e.message})`); }

const userRef = db.collection("users").doc(uid);
const userDoc = await userRef.get();
console.log(`users/${uid} exists: ${userDoc.exists}`);
if (userDoc.exists) console.log("  fields:", JSON.stringify(userDoc.data()));
const subs = await userRef.listCollections();
console.log("  subcollections:", subs.map((c) => c.id).join(", ") || "(none)");
const pub = await db.collection("publicProfiles").doc(uid).get();
console.log(`publicProfiles/${uid} exists: ${pub.exists}`);
if (pub.exists) console.log("  fields:", JSON.stringify(pub.data()));
