// Read-only: how many fields are claimed / in how many states, and any real player activity tied to Cedar.
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
initializeApp({ credential: cert(JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)))) });
const db = getFirestore();
const fs = (await db.collection("fields").get()).docs.map(d => ({ id: d.id, ...d.data() }));
const st = (f) => (f.city || "").split(",").pop().trim();
const claimed = fs.filter(f => f.claimed === true || f.ownerId);
console.log(`fields total: ${fs.length}; states listed: ${new Set(fs.map(st)).size}`);
console.log(`claimed fields: ${claimed.length}; states w/ claimed: ${new Set(claimed.map(st)).size}`);
console.log(claimed.map(f => `${f.name} (${f.city}) ${f.claimVerification || ""}`).join("\n"));
const ev = await db.collection("events").where("fieldId", "==", "cedar-airsoft-field").get();
for (const e of ev.docs) {
  const d = e.data();
  const b = await e.ref.collection("bookings").get();
  const i = await e.ref.collection("interested").get().catch(() => ({ size: "n/a" }));
  console.log(d.date, d.title, "interestedCount:", d.interestedCount ?? "-", "bookings:", b.size, "interested subcol:", i.size);
}
const users = await db.collection("users").count().get();
console.log("player accounts:", users.data().count);
const fav = await db.collectionGroup("favorites").where("fieldId", "==", "cedar-airsoft-field").get().catch(e => ({ size: "err " + e.code }));
console.log("favorites of Cedar:", fav.size);
