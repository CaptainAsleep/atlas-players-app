// One-off (2026-11-16): delist Big Lake Tactical Wargames per Michael.
// Sets status "delisted" on the field doc (keeping every other field on
// record), which the player app uses to hide it from Home/Map/search, hide
// its events, and show Atlas's notice on its page instead of its details.
// The owner app's claim search and the admin portal treat it as inactive.
// Events and bookings are NOT modified; this only prints them.
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
const sa = JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)));
initializeApp({ credential: cert(sa) });
const db = getFirestore();
const ref = db.collection("fields").doc("big-lake-tactical");
const snap = await ref.get();
if (!snap.exists) { console.log("Field not found — nothing changed."); process.exit(1); }
const f = snap.data();
console.log("BEFORE", JSON.stringify({ name: f.name, status: f.status ?? null, ownerId: f.ownerId ?? null, claimed: f.claimed ?? false }));
const evs = await db.collection("events").where("fieldId", "==", "big-lake-tactical").get();
console.log(`Events on record for this field: ${evs.size} (left untouched, hidden in the player app)`);
for (const e of evs.docs) console.log("  ", e.id, JSON.stringify({ date: e.data().date, bookedCount: e.data().bookedCount ?? 0 }));
if (f.status === "delisted") { console.log("Already delisted — nothing changed."); process.exit(0); }
await ref.update({ status: "delisted", previousStatus: f.status ?? null, delistedAt: "2026-11-16" });
console.log("Delisted: status set to \"delisted\".");
