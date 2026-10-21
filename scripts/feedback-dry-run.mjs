// Dry run of post-event feedback emails. Sends NOTHING, writes NOTHING.
// Runs the exact same planning code the scheduled Cloud Function uses
// (functions/feedback.js) against live Firestore.
//
//   node scripts/feedback-dry-run.mjs                  # what would go out at tonight's 6pm run
//   node scripts/feedback-dry-run.mjs <eventId>        # one specific event, any date
//   node scripts/feedback-dry-run.mjs <eventId> --assume-checked-in   # preview an event that hasn't happened yet
//   node scripts/feedback-dry-run.mjs <eventId> --html # also save each rendered email to Claude outputs/
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { runFeedbackSends, dayKey } from "../functions/feedback.js";

initializeApp({ credential: cert(JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)))) });
const db = getFirestore();
const onlyEventId = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : null;
const saveHtml = process.argv.includes("--html");

const assumeAllCheckedIn = process.argv.includes("--assume-checked-in");
const reports = await runFeedbackSends(db, { dryRun: true, onlyEventId, includeNotCheckedIn: true, assumeAllCheckedIn });
if (assumeAllCheckedIn) console.log("PREVIEW MODE: treating every booking as checked in.");
console.log(`DRY RUN — nothing sent. Today (Detroit): ${dayKey()}${onlyEventId ? `, event: ${onlyEventId}` : ", events whose last day was yesterday (or up to 4 days earlier)"}`);
if (!reports.length) console.log("No eligible events.");
for (const r of reports) {
  console.log(`\n${r.fieldName || ""} — ${r.title} (${r.date})  [${r.eventId}]`);
  if (r.ownerNote) console.log(`  note: ${r.ownerNote}`);
  if (r.skipped) console.log(`  SKIPPED: ${r.skipped}`);
  for (const x of r.recipients) {
    console.log(`  ${x.role.padEnd(6)} ${(x.callsign || "").padEnd(18)} ${(x.email || "(none)").padEnd(34)} ${x.attendees > 1 ? `party of ${x.attendees}  ` : ""}${x.status}`);
  }
  if (r.notCheckedIn.length) console.log(`  not checked in (no email): ${r.notCheckedIn.map((n) => n.callsign || n.uid).join(", ")}`);
  if (saveHtml) {
    const dir = new URL("../../Claude outputs/feedback-dry-run/", import.meta.url);
    mkdirSync(dir, { recursive: true });
    r.recipients.filter((x) => x.html).forEach((x, i) => writeFileSync(new URL(`${r.eventId}-${i}-${x.role}.html`, dir), x.html));
  }
}
