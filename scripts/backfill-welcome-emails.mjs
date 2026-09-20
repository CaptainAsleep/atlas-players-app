// One-off backfill: sends the player signup-welcome email to every
// existing player who already completed onboarding *before*
// sendPlayerWelcomeEmail (functions/index.js) existed — so the normal
// completedOnboarding false->true Firestore trigger never fired for them
// and they never got it.
//
// Reuses the exact same template and subject line as that Cloud
// Function, and sets welcomeEmailSentAt on each doc it sends to, same as
// the real function does — so this can never double-send if run twice,
// and the live trigger will never re-send to anyone this script already
// covered.
//
// Usage:
//   RESEND_API_KEY=re_xxxxxxxx node scripts/backfill-welcome-emails.mjs --dry-run
//   RESEND_API_KEY=re_xxxxxxxx node scripts/backfill-welcome-emails.mjs
//
// Optional --also=email1,email2 adds extra one-off recipients not
// otherwise picked up by the completedOnboarding filter — e.g. an
// account that predates that field existing at all (like Michael's own
// personal player account). Looked up by email in `users` to grab the
// real callsign; still sent (with a generic "Player" callsign) if no
// matching doc is found at all.
//
// (Use the same key already sitting in atlas-email-sender/.env.)
//
// Requires the same scripts/serviceAccountKey.json as seed-data.mjs.

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { Resend } from "resend";

const serviceAccount = JSON.parse(
  readFileSync(new URL("./serviceAccountKey.json", import.meta.url))
);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const DRY_RUN = process.argv.includes("--dry-run");
const FROM = "Michael @ Atlas <welcome@airsoftatlas.app>";

function parseAlsoArg() {
  const arg = process.argv.find((a) => a.startsWith("--also="));
  if (!arg) return [];
  return arg.slice("--also=".length).split(",").map((e) => e.trim()).filter(Boolean);
}
const alsoEmails = parseAlsoArg();

// Same template file the live sendPlayerWelcomeEmail function reads from.
const template = readFileSync(
  new URL("../functions/templates/signup-welcome.html", import.meta.url),
  "utf-8"
);

// Same plain [token] -> value substitution used everywhere else in this
// email pipeline (atlas-email-sender/send.mjs, functions/index.js).
function fillTemplate(html, replacements) {
  let out = html;
  for (const [token, value] of Object.entries(replacements)) {
    out = out.split(token).join(value ?? "");
  }
  return out;
}

if (!DRY_RUN && !process.env.RESEND_API_KEY) {
  console.error("RESEND_API_KEY is not set — prefix the command with RESEND_API_KEY=re_xxxxxxxx or export it first.");
  process.exit(1);
}
const resend = DRY_RUN ? null : new Resend(process.env.RESEND_API_KEY);

const usersSnap = await db.collection("users").get();

const toSend = [];
const skippedNotOnboarded = [];
const skippedAlreadySent = [];
const skippedNoEmail = [];

for (const doc of usersSnap.docs) {
  const data = doc.data();
  if (data.completedOnboarding !== true) {
    skippedNotOnboarded.push(doc.id);
    continue;
  }
  if (data.welcomeEmailSentAt) {
    skippedAlreadySent.push(doc.id);
    continue;
  }
  if (!data.email) {
    skippedNoEmail.push(doc.id);
    continue;
  }
  toSend.push({ id: doc.id, email: data.email, callsign: data.callsign || "Player" });
}

// --also=email1,email2 — extra one-off recipients not otherwise picked
// up by the completedOnboarding filter above.
for (const email of alsoEmails) {
  if (toSend.some((p) => p.email === email)) continue; // already included naturally
  const snap = await db.collection("users").where("email", "==", email).limit(1).get();
  if (snap.empty) {
    console.warn(`--also ${email}: no matching user doc found — sending anyway with a generic callsign.`);
    toSend.push({ id: null, email, callsign: "Player" });
    continue;
  }
  const doc = snap.docs[0];
  const data = doc.data();
  if (data.welcomeEmailSentAt) {
    console.warn(`--also ${email}: welcomeEmailSentAt already set — skipping to avoid a duplicate.`);
    continue;
  }
  toSend.push({ id: doc.id, email: data.email, callsign: data.callsign || "Player" });
}

console.log(`Found ${usersSnap.size} player doc(s) total.`);
console.log(`  ${toSend.length} will receive the welcome email:`);
toSend.forEach((p) => console.log(`    -> ${p.callsign} <${p.email}>`));
console.log(`  ${skippedNotOnboarded.length} skipped — haven't completed onboarding.`);
console.log(`  ${skippedAlreadySent.length} skipped — welcomeEmailSentAt already set.`);
console.log(`  ${skippedNoEmail.length} skipped — no email on file.`);
console.log("");

if (DRY_RUN) {
  console.log("[--dry-run] Not sending anything. Re-run without --dry-run to actually send.");
  process.exit(0);
}

if (toSend.length === 0) {
  console.log("Nothing to send.");
  process.exit(0);
}

let sent = 0;
let failed = 0;
for (const p of toSend) {
  const html = fillTemplate(template, { "[PLAYER CALLSIGN]": p.callsign });
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: p.email,
      subject: `Welcome to Atlas, ${p.callsign} — here's the rundown before your first game`,
      html,
    });
    if (error) {
      console.error(`FAILED ${p.callsign} <${p.email}>:`, error);
      failed++;
      continue;
    }
    if (p.id) {
      await db.collection("users").doc(p.id).update({ welcomeEmailSentAt: FieldValue.serverTimestamp() });
    }
    console.log(`Sent to ${p.callsign} <${p.email}>`);
    sent++;
  } catch (err) {
    console.error(`FAILED ${p.callsign} <${p.email}>:`, err);
    failed++;
  }
}

console.log(`\nDone. ${sent} sent, ${failed} failed.`);
