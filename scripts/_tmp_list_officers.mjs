// Read-only: lists every team officer + the email on their users doc.
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
initializeApp({ credential: cert(JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)))) });
const db = getFirestore();
const teams = await db.collection("teams").get();
const rows = [];
for (const t of teams.docs) {
  const ms = await t.ref.collection("members").get();
  for (const m of ms.docs) {
    const d = m.data();
    if (d.role !== "officer") continue;
    const u = await db.collection("users").doc(m.id).get();
    rows.push({ team: t.data().name, teamId: t.id, uid: m.id, callsign: d.callsign, email: u.data()?.email || null, founder: t.data().createdBy === m.id });
  }
}
console.log(`teams: ${teams.size}, officers: ${rows.length}`);
console.log(JSON.stringify(rows, null, 1));
