// Read-only: find Minty + WhiteHorse Milsim membership/officerRequests state.
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
initializeApp({ credential: cert(JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)))) });
const db = getFirestore();
const teams = await db.collection("teams").get();
const wh = teams.docs.filter(d => /white\s*horse/i.test(d.data().name || ""));
console.log("teams matched:", wh.map(d => [d.id, d.data().name, d.data().createdBy]));
const pp = await db.collection("publicProfiles").get();
const minty = pp.docs.filter(d => /minty/i.test(d.data().callsign || ""));
console.log("minty profiles:", minty.map(d => [d.id, d.data().callsign, d.data().teamId, d.data().teamName]));
for (const t of wh) {
  const ms = await t.ref.collection("members").get();
  console.log("members of", t.id, ms.docs.map(m => [m.id, m.data().callsign, m.data().role]));
  const rq = await db.collection("officerRequests").where("teamId","==",t.id).get();
  console.log("officerRequests:", rq.docs.map(r => [r.id, r.data()]));
}
