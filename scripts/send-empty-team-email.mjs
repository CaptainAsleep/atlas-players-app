// Empty-team email (2026-11-23): asks a team's creator to rejoin or delete
// a team that has nobody on it. Uses functions/emptyTeam.js, so the email,
// token and page behave exactly like the deployed functions expect.
//
//   node scripts/send-empty-team-email.mjs <teamId>          dry run + preview
//   node scripts/send-empty-team-email.mjs <teamId> --send   really send
//
// Deploy getEmptyTeamOffer/resolveEmptyTeam and publish team.html BEFORE
// sending, or the buttons will land on a page with nothing behind it.
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync, writeFileSync } from "fs";
import { Resend } from "resend";
import * as emptyTeam from "../functions/emptyTeam.js";

const [teamId, flag] = process.argv.slice(2);
if (!teamId) { console.error("usage: node scripts/send-empty-team-email.mjs <teamId> [--send]"); process.exit(1); }
const SEND = flag === "--send";

initializeApp({ credential: cert(JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)))) });
const db = getFirestore();

const team = await db.collection("teams").doc(teamId).get();
if (!team.exists) throw new Error(`No team ${teamId}`);
const { name, createdBy } = team.data();
const members = await team.ref.collection("members").get();
if (!members.empty) throw new Error(`${name} has ${members.size} member(s) — not empty, not sending.`);
if (!createdBy) throw new Error(`${name} has no createdBy.`);
const user = (await db.collection("users").doc(createdBy).get()).data();
if (!user?.email) throw new Error(`Creator ${createdBy} has no email on file.`);
const callsign = user.callsign || "Operator";

const prior = await db.collection("emptyTeamTokens").where("teamId", "==", teamId).where("usedAt", "==", null).get();
console.log(`Team: ${name} (${teamId})\nCreator: ${callsign} <${user.email}> uid=${createdBy}\nUnused links already sent: ${prior.size}`);

if (!SEND) {
  const { subject, html } = emptyTeam.renderEmail({ callsign, teamName: name, token: "PREVIEW-TOKEN-not-a-real-link" });
  const out = new URL("../../Claude outputs/empty-team-email-preview.html", import.meta.url);
  writeFileSync(out, html);
  console.log(`\nDRY RUN — nothing sent.\nSubject: ${subject}\nPreview: ${decodeURIComponent(out.pathname)}`);
  process.exit(0);
}

const key = readFileSync(new URL("../../atlas-email-sender/.env", import.meta.url), "utf-8").match(/RESEND_API_KEY=(\S+)/)[1];
const token = await emptyTeam.createOffer(db, { teamId, uid: createdBy, email: user.email });
const { subject, html } = emptyTeam.renderEmail({ callsign, teamName: name, token });
const { data, error } = await new Resend(key).emails.send({
  from: emptyTeam.EMPTY_TEAM_EMAIL_FROM, replyTo: emptyTeam.EMPTY_TEAM_REPLY_TO,
  to: user.email, subject, html,
});
if (error) {
  await db.collection("emptyTeamTokens").doc(emptyTeam.hashToken(token)).delete();
  throw new Error(`Resend error: ${JSON.stringify(error)}`);
}
await db.collection("emptyTeamTokens").doc(emptyTeam.hashToken(token)).update({ resendId: data.id, sentAt: new Date(), teamName: name });
console.log(`SENT to ${user.email} — id=${data.id}`);
