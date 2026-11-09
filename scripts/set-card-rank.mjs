// Give (or take back) a hand-given trading-card rank: legendary, onyx, diamond.
// Looks the player up by callsign (case, spaces and punctuation ignored) and
// refuses if that matches more or fewer than one profile.
//
// Dry run by default. Add --apply to write. Add --remove to take a rank back
// (their card falls back to whatever they've earned).
//   node set-card-rank.mjs "Doctor Lamao" onyx
//   node set-card-rank.mjs "Doctor Lamao" onyx --apply
//   node set-card-rank.mjs "Doctor Lamao" --remove --apply
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { HAND_GIVEN_RANKS, earnedRank, finalRank, rankInputs, FOUNDER_UID, TIER_OVERRIDES } from "../functions/cards.js";

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const APPLY = process.argv.includes("--apply");
const REMOVE = process.argv.includes("--remove");
const [callsign, rank] = args;
if (!callsign || (!REMOVE && !HAND_GIVEN_RANKS.includes(rank))) {
  console.log(`Usage: node set-card-rank.mjs "<callsign>" <${HAND_GIVEN_RANKS.join("|")}> [--apply]`);
  console.log('       node set-card-rank.mjs "<callsign>" --remove [--apply]');
  process.exit(1);
}
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
const data = d.data();
const overrideRef = db.collection("cardRankOverrides").doc(d.id);
const newRank = REMOVE
  ? finalRank({ earned: earnedRank(rankInputs(data), "adult"), override: TIER_OVERRIDES[d.id], floor: data.rankFloor, founder: d.id === FOUNDER_UID })
  : rank;
console.log(`${data.callsign} (${d.id}, #${data.signupNumber ?? "—"}): ${data.cardTier || "unranked"} -> ${newRank}${REMOVE ? " (hand-given rank removed)" : " (hand-given, permanent)"}`);
if (!APPLY) { console.log("Dry run only. Re-run with --apply to write."); process.exit(0); }
if (REMOVE) await overrideRef.delete();
else await overrideRef.set({ rank, callsign: data.callsign, setAt: FieldValue.serverTimestamp() });
await d.ref.update({ cardTier: newRank, cardTitle: null, rankChangedAt: FieldValue.serverTimestamp() });
console.log("Done.");
