// Read-only: every current team officer vs. their emailSends/teamOfficerWelcome_* doc.
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
initializeApp({ credential: cert(JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)))) });
const db = getFirestore();
const teams = await db.collection("teams").get();
const rows = [];
for (const t of teams.docs) {
  for (const m of (await t.ref.collection("members").get()).docs) {
    const d = m.data();
    if (d.role !== "officer") continue;
    const u = (await db.collection("users").doc(m.id).get()).data();
    const s = await db.collection("emailSends").doc(`teamOfficerWelcome_${t.id}_${m.id}`).get();
    rows.push({ team: t.data().name, callsign: d.callsign, email: u?.email || null, founder: t.data().createdBy === m.id, sent: s.exists, backfill: s.exists ? !!s.data().backfill : null });
  }
}
console.log(`teams: ${teams.size}, officers: ${rows.length}`);
console.table(rows);
console.log("NOT SENT:", JSON.stringify(rows.filter(r => !r.sent), null, 1));
