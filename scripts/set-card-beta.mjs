// Let a player into the trading-card test group (or take them out), by
// callsign. Refuses unless the callsign matches exactly one profile.
// Dry run by default; --apply writes; --remove takes them out.
//   node set-card-beta.mjs "Maziko"
//   node set-card-beta.mjs "Maziko" --apply
//   node set-card-beta.mjs "Maziko" --remove --apply
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const [callsign] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const APPLY = process.argv.includes("--apply");
const REMOVE = process.argv.includes("--remove");
if (!callsign) { console.log('Usage: node set-card-beta.mjs "<callsign>" [--remove] [--apply]'); process.exit(1); }
const sa = JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)));
initializeApp({ credential: cert(sa) });
const db = getFirestore();
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const matches = (await db.collection("publicProfiles").get()).docs.filter((d) => norm(d.data().callsign) === norm(callsign));
if (matches.length !== 1) {
  console.log(`Found ${matches.length} profiles with callsign "${callsign}". Nothing changed.`);
  matches.forEach((d) => console.log(`  ${d.id}  ${d.data().callsign}`));
  process.exit(1);
}
const d = matches[0];
const ref = db.collection("cardBeta").doc(d.id);
const already = (await ref.get()).exists;
console.log(`${d.data().callsign} (${d.id}): ${REMOVE ? (already ? "remove from" : "not in") : (already ? "already in" : "add to")} the trading-card test group`);
if (!APPLY) { console.log("Dry run only. Re-run with --apply to write."); process.exit(0); }
if (REMOVE) await ref.delete();
else await ref.set({ callsign: d.data().callsign, addedAt: FieldValue.serverTimestamp() });
console.log("Done.");
