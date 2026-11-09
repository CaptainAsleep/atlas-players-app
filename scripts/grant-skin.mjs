// Gift (or take back) a paid skin. No Stripe involved: writes the same
// ownership doc the webhook writes (users/{uid}/skins/{skinId}) with
// via: "gift". Gifts are NOT added to skinPurchases, so they never show as
// revenue (and don't count in the admin Skins page's owners-per-skin).
// Looks the player up by callsign (case, spaces and punctuation ignored)
// and refuses if that matches more or fewer than one profile.
//
// Dry run by default. Add --apply to write. Add --remove to take a skin
// back; if it's the look they have equipped, they're switched to Light
// (the appearance rule re-checks ownership on every write to their user
// doc, so leaving it equipped would block their own profile edits).
//   node grant-skin.mjs "Doctor Lamao" neon
//   node grant-skin.mjs "Doctor Lamao" neon --apply
//   node grant-skin.mjs "Doctor Lamao" neon --remove --apply
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { SKINS, skinById } from "../functions/skins.js";

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const APPLY = process.argv.includes("--apply");
const REMOVE = process.argv.includes("--remove");
const [callsign, skinId] = args;
const skin = skinById(skinId);
if (!callsign || !skin) {
  console.log(`Usage: node grant-skin.mjs "<callsign>" <${SKINS.map((s) => s.id).join("|")}> [--remove] [--apply]`);
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
const uid = matches[0].id;
const name = matches[0].data().callsign;
const userRef = db.collection("users").doc(uid);
const skinRef = userRef.collection("skins").doc(skin.id);
const [skinSnap, userSnap] = await Promise.all([skinRef.get(), userRef.get()]);
if (!userSnap.exists) {
  console.log(`${name} (${uid}) has no users doc. Nothing changed.`);
  process.exit(1);
}
const equipped = userSnap.data().appearance === skin.id;

if (REMOVE) {
  if (!skinSnap.exists) { console.log(`${name} (${uid}) doesn't own ${skin.name}. Nothing to remove.`); process.exit(0); }
  console.log(`${name} (${uid}): remove ${skin.name} (owned via ${skinSnap.data().via || "?"})${equipped ? " — currently equipped, will switch them to Light" : ""}`);
} else {
  if (skinSnap.exists) { console.log(`${name} (${uid}) already owns ${skin.name} (via ${skinSnap.data().via || "?"}). Nothing changed.`); process.exit(0); }
  console.log(`${name} (${uid}): gift ${skin.name}`);
}
if (!APPLY) { console.log("Dry run only. Re-run with --apply to write."); process.exit(0); }

if (REMOVE) {
  const batch = db.batch();
  batch.delete(skinRef);
  if (equipped) batch.update(userRef, { appearance: "light" });
  await batch.commit();
} else {
  await skinRef.set({ acquiredAt: FieldValue.serverTimestamp(), via: "gift", sessionId: null });
}
console.log("Done.");
