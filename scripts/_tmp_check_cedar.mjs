// Read-only: Cedar Airsoft Field's claim state + upcoming events as they exist in Firestore right now.
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
initializeApp({ credential: cert(JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)))) });
const db = getFirestore();
const f = (await db.collection("fields").doc("cedar-airsoft-field").get()).data();
console.log("field:", f ? { name: f.name, status: f.status, ownerId: f.ownerId || null, claimStatus: f.claimStatus || null, website: f.website, hidden: f.hidden } : "MISSING");
const ev = await db.collection("events").where("fieldId", "==", "cedar-airsoft-field").get();
const today = new Date().toISOString().slice(0, 10);
const rows = ev.docs.map(d => d.data()).map(e => ({ title: e.title, date: e.date, endDate: e.endDate || "", price: e.price, status: e.status || "", source: e.source || e.sourceUrl || "" })).sort((a, b) => a.date.localeCompare(b.date));
console.log(`total events: ${rows.length}; today=${today}`);
console.table(rows.filter(r => r.date >= today));
