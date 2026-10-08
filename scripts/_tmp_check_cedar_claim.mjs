import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
initializeApp({ credential: cert(JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)))) });
const db = getFirestore();
const ref = db.collection("fields").doc("cedar-airsoft-field");
const f = (await ref.get()).data();
const a = await ref.collection("private").doc("emailClaim").get();
console.log({ emailClaimEnabled: f.emailClaimEnabled, ownerId: f.ownerId || null, allowlistDocExists: a.exists, allowlistMatches: a.exists && a.data().email === "cedarairsoftfield@gmail.com" });
