// One-off (2026-11-09): hide Futureball's Sat Nov 14 Open Play from the player
// app. Futureball is running Saturday outside Atlas; only Sun Nov 15 runs on
// Atlas. Sets draft: true, which useEvents.js already filters out for players.
// The owner app still shows it as a draft, so Futureball can publish it later.
// Existing bookings/interest are left untouched; this only prints them.
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
const sa = JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)));
initializeApp({ credential: cert(sa) });
const db = getFirestore();
const ref = db.collection("events").doc("futureball-2026-11-14-open-play");
const snap = await ref.get();
if (!snap.exists) { console.log("Event not found — nothing changed."); process.exit(1); }
const e = snap.data();
console.log("BEFORE", JSON.stringify({ title: e.title, date: e.date, draft: e.draft ?? false, deleted: e.deleted ?? false, bookedCount: e.bookedCount ?? 0, interestCount: e.interestCount ?? 0 }));
const bookings = await ref.collection("bookings").get();
console.log(`Existing bookings: ${bookings.size}`);
for (const b of bookings.docs) console.log("  ", b.id, JSON.stringify({ status: b.data().status ?? null }));
if (e.draft === true) { console.log("Already hidden (draft: true) — nothing changed."); process.exit(0); }
await ref.update({ draft: true });
console.log("Hidden: draft set to true.");
