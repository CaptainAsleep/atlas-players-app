// ---------------------------------------------------------------------------
// Post-event feedback requests (scoped 2026-10-21, see
// Atlas/atlas-status.md "Event feedback" and the project scope doc).
//
// The day after an event ends, every CHECKED-IN booking gets one email
// (a parent's booking covers their kids) asking for two ratings -- the
// field and Atlas -- and the host owner gets one asking about Atlas only.
// Each email carries a random, unguessable token; the public page at
// airsoftatlas.app/feedback.html trades it for the event context and
// submits answers through callables in index.js. No sign-in needed.
//
// Deliberately free of firebase-admin / firebase-functions imports: the
// caller passes `db` and a `sendEmail` function in. That lets the exact
// same code run from scripts/feedback-dry-run.mjs (service-account db,
// sendEmail = null => nothing is sent, nothing is written) and from the
// scheduled Cloud Function.
// ---------------------------------------------------------------------------
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { randomBytes } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const playerTemplate = readFileSync(path.join(__dirname, "templates", "feedback-request-player.html"), "utf-8");
const ownerTemplate = readFileSync(path.join(__dirname, "templates", "feedback-request-owner.html"), "utf-8");

export const FEEDBACK_ADMIN_UID = "lg4HMLTJvsPfSEN1pvNhMV4fbct1"; // same as ADMIN_UID in index.js
export const FEEDBACK_ALERT_TO = "Michael@airsoftatlas.app";
export const FEEDBACK_EMAIL_FROM = "Michael @ Atlas <feedback@airsoftatlas.app>";
export const FEEDBACK_PAGE_URL = "https://airsoftatlas.app/feedback.html";
// Nothing before the first event this shipped for is ever emailed, so the
// first deploy can't blast feedback requests for old events.
export const FEEDBACK_START_DATE = "2026-10-24";
// How many days after an event's last day a missed send is still caught
// up (e.g. if a scheduled run failed). Older events are left alone.
const CATCH_UP_DAYS = 4;
// "...and for being one of the first players to book through Atlas" --
// only true early on.
const EARLY_PLAYER_LINE_UNTIL = "2026-12-31";
const MAX_COMMENT = 2000;

const TZ = "America/Detroit";
export function dayKey(d = new Date()) {
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}
export function addDays(key, n) {
  const d = new Date(key + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}
function fill(html, map) {
  let out = html;
  for (const [k, v] of Object.entries(map)) out = out.split(k).join(v ?? "");
  return out;
}
export function formatLongDate(key) {
  if (!key) return "";
  return new Date(key + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
}
const newToken = () => randomBytes(24).toString("base64url");
const feedbackDocId = (eventId, role, uid) => (role === "owner" ? `${eventId}__owner` : `${eventId}__${uid}`);

export function renderPlayerEmail({ callsign, fieldName, eventTitle, eventDate, token }) {
  const link = `${FEEDBACK_PAGE_URL}?t=${encodeURIComponent(token)}`;
  const early = eventDate && eventDate <= EARLY_PLAYER_LINE_UNTIL
    ? ", and for being one of the first players to book through Atlas."
    : ".";
  const html = fill(playerTemplate, {
    "[TITLE]": `How was ${escapeHtml(fieldName)}?`,
    "[FIELD NAME]": escapeHtml(fieldName),
    "[CALLSIGN]": escapeHtml(callsign),
    "[EVENT NAME]": escapeHtml(eventTitle),
    "[EVENT DATE]": escapeHtml(formatLongDate(eventDate)),
    "[EARLY_LINE]": early,
    "[FEEDBACK_LINK]": link,
    "[BUTTON_LABEL]": "Rate your day &rarr;",
  });
  return { subject: `How was ${fieldName}?`, html };
}

export function renderOwnerEmail({ fieldName, eventTitle, token, firstLine }) {
  const link = `${FEEDBACK_PAGE_URL}?t=${encodeURIComponent(token)}`;
  const html = fill(ownerTemplate, {
    "[TITLE]": "How did Atlas do?",
    "[FIELD NAME]": escapeHtml(fieldName),
    "[EVENT NAME]": escapeHtml(eventTitle),
    "[OWNER_FIRST_LINE]": firstLine,
    "[FEEDBACK_LINK]": link,
    "[BUTTON_LABEL]": "Rate Atlas &rarr;",
  });
  return { subject: `How did Atlas do for ${eventTitle}?`, html };
}

// Events whose last day was yesterday (or up to CATCH_UP_DAYS before, to
// recover from a missed run), never before FEEDBACK_START_DATE.
export async function findEligibleEvents(db, { today = dayKey(), onlyEventId = null } = {}) {
  if (onlyEventId) {
    const s = await db.collection("events").doc(onlyEventId).get();
    return s.exists ? [{ id: s.id, data: s.data() }] : [];
  }
  const yesterday = addDays(today, -1);
  const oldestEnd = addDays(today, -1 - CATCH_UP_DAYS);
  // An event's start date is <= its end date, so this window (plus a week
  // of slack for multi-day events) is a superset; the end-date filter
  // below is the real rule.
  const snap = await db.collection("events")
    .where("date", ">=", addDays(oldestEnd, -7))
    .where("date", "<=", yesterday)
    .get();
  return snap.docs
    .map((d) => ({ id: d.id, data: d.data() }))
    .filter(({ data }) => {
      const end = data.endDate || data.date;
      return data.date >= FEEDBACK_START_DATE && end <= yesterday && end >= oldestEnd;
    });
}

async function resolveHost(db, eventData) {
  let field = {};
  if (eventData.fieldId) field = (await db.collection("fields").doc(eventData.fieldId).get()).data() || {};
  const ownerId = eventData.hostOwnerId || field.ownerId || null;
  const fieldName = field.name || eventData.venueName || eventData.fieldName || "the field";
  return { ownerId, fieldName };
}

// Plans (and, unless dryRun, sends) every feedback email for one event.
// Returns a report describing exactly who would be / was emailed.
// assumeAllCheckedIn is a dry-run-only preview aid (for an event that
// hasn't happened yet); it's ignored whenever dryRun is false.
export async function processEvent(db, { id: eventId, data: ev }, { dryRun = true, sendEmail = null, includeNotCheckedIn = false, assumeAllCheckedIn = false } = {}) {
  const treatAsCheckedIn = dryRun && assumeAllCheckedIn;
  const report = { eventId, title: ev.title || "", date: ev.date, endDate: ev.endDate || null, skipped: null, recipients: [], notCheckedIn: [] };
  if (ev.canceled) { report.skipped = "event was canceled"; return report; }
  if (ev.externalTicketing) { report.skipped = "event is ticketed outside Atlas"; return report; }

  const { ownerId, fieldName } = await resolveHost(db, ev);
  report.fieldName = fieldName;
  const eventTitle = ev.title || "your event";

  const reqRef = db.collection("eventFeedbackRequests").doc(eventId);
  const reqSnap = await reqRef.get();
  const log = reqSnap.exists ? reqSnap.data() : { recipients: {} };
  log.recipients = log.recipients || {};

  const bookings = await db.collection("events").doc(eventId).collection("bookings").get();
  const checkedIn = [];
  for (const b of bookings.docs) {
    const bd = b.data();
    if (b.id === FEEDBACK_ADMIN_UID) continue;
    if (bd.checkedIn || treatAsCheckedIn) checkedIn.push({ uid: b.id, bd });
    else if (includeNotCheckedIn) report.notCheckedIn.push({ uid: b.id, callsign: bd.callsign || "" });
  }
  if (!checkedIn.length) {
    report.skipped = `no checked-in bookings (${bookings.size} booked)`;
    return report;
  }

  const plan = [];
  for (const { uid, bd } of checkedIn) {
    const user = (await db.collection("users").doc(uid).get()).data() || {};
    const prior = log.recipients[uid];
    plan.push({
      key: uid, role: "player", uid, email: user.email || null,
      callsign: user.callsign || bd.callsign || "Player",
      attendees: bd.attendeeCount || 1,
      alreadySent: !!prior?.sentAt, token: prior?.token || null,
    });
  }

  let ownerFirstLine = "Your honest take is how Atlas gets better for every field.";
  if (ownerId && ownerId !== FEEDBACK_ADMIN_UID) {
    const owner = (await db.collection("owners").doc(ownerId).get()).data() || {};
    const anyEver = await db.collection("eventFeedbackRequests").limit(2).get();
    const others = anyEver.docs.filter((d) => d.id !== eventId);
    if (!others.length) {
      ownerFirstLine = "You were the first field to run an event on Atlas, so your honest take matters more than anyone's.";
    } else if (ev.fieldId) {
      const fieldPrior = await db.collection("eventFeedbackRequests").where("fieldId", "==", ev.fieldId).limit(2).get();
      if (!fieldPrior.docs.some((d) => d.id !== eventId)) {
        ownerFirstLine = "This was your first event on Atlas, so your honest take matters more than anyone's.";
      }
    }
    const prior = log.recipients.__owner;
    plan.push({
      key: "__owner", role: "owner", uid: ownerId, email: owner.email || null,
      alreadySent: !!prior?.sentAt, token: prior?.token || null,
    });
  } else {
    report.ownerNote = ownerId ? "host is Michael's own account, owner email skipped" : "no claimed owner, owner email skipped";
  }

  for (const r of plan) {
    const row = { role: r.role, email: r.email, callsign: r.callsign || null, attendees: r.attendees || null };
    if (!r.email) { row.status = "skipped: no email on file"; report.recipients.push(row); continue; }
    if (r.alreadySent) { row.status = "skipped: already sent"; report.recipients.push(row); continue; }
    const token = r.token || newToken();
    const rendered = r.role === "player"
      ? renderPlayerEmail({ callsign: r.callsign, fieldName, eventTitle, eventDate: ev.date, token })
      : renderOwnerEmail({ fieldName, eventTitle, token, firstLine: ownerFirstLine });
    row.subject = rendered.subject;
    if (dryRun) { row.status = "would send"; row.html = rendered.html; report.recipients.push(row); continue; }

    await db.collection("feedbackTokens").doc(token).set({
      eventId, fieldId: ev.fieldId || null, ownerId: ownerId || null,
      role: r.role, uid: r.uid, createdAt: new Date(),
    });
    try {
      await sendEmail({ to: r.email, subject: rendered.subject, html: rendered.html });
      log.recipients[r.key] = { token, sentAt: new Date(), role: r.role };
      row.status = "sent";
    } catch (err) {
      log.recipients[r.key] = { token, error: String(err?.message || err), role: r.role };
      row.status = "error: " + String(err?.message || err);
    }
    report.recipients.push(row);
    await new Promise((res) => setTimeout(res, 600)); // stay under Resend's rate limit
  }

  if (!dryRun) {
    const sentCount = Object.values(log.recipients).filter((x) => x.sentAt && x.role === "player").length;
    await reqRef.set({
      eventId, fieldId: ev.fieldId || null, ownerId: ownerId || null,
      eventTitle, eventDate: ev.date, fieldName,
      playerRequestsSent: sentCount,
      recipients: log.recipients,
      sentAt: log.sentAt || new Date(),
      sentDayKey: log.sentDayKey || dayKey(),
      updatedAt: new Date(),
    }, { merge: true });
  }
  return report;
}

export async function runFeedbackSends(db, opts = {}) {
  const events = await findEligibleEvents(db, opts);
  const reports = [];
  for (const e of events) reports.push(await processEvent(db, e, opts));
  return reports;
}

// ---- Public page: token -> context, and submit -----------------------------
async function loadToken(db, token) {
  if (typeof token !== "string" || token.length < 20 || token.length > 64) return null;
  const s = await db.collection("feedbackTokens").doc(token).get();
  return s.exists ? s.data() : null;
}

export async function getContextForToken(db, token) {
  const t = await loadToken(db, token);
  if (!t) return null;
  const ev = (await db.collection("events").doc(t.eventId).get()).data() || {};
  const { fieldName } = await resolveHost(db, ev);
  const existing = (await db.collection("eventFeedback").doc(feedbackDocId(t.eventId, t.role, t.uid)).get()).data() || null;
  return {
    role: t.role,
    fieldName,
    eventTitle: ev.title || "",
    eventDate: formatLongDate(ev.date),
    existing: existing ? {
      fieldRating: existing.fieldRating ?? null, fieldComment: existing.fieldComment || "",
      atlasRating: existing.atlasRating ?? null, atlasComment: existing.atlasComment || "",
      quoteConsent: !!existing.quoteConsent, callOptIn: !!existing.callOptIn,
    } : null,
  };
}

function rating(v, required) {
  if (v === null || v === undefined || v === "") { if (required) throw new Error("rating-required"); return null; }
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1 || n > 5) throw new Error("rating-invalid");
  return n;
}
const comment = (v) => String(v ?? "").trim().slice(0, MAX_COMMENT);

// Returns { doc, lowAlert } -- lowAlert is set the first time a submission
// has any 1-2 star rating, so the caller can email Michael right away.
export async function submitForToken(db, token, data) {
  const t = await loadToken(db, token);
  if (!t) throw new Error("bad-token");
  const isPlayer = t.role === "player";
  const doc = {
    eventId: t.eventId, fieldId: t.fieldId, ownerId: t.ownerId, role: t.role, uid: t.uid,
    fieldRating: isPlayer ? rating(data.fieldRating, true) : null,
    fieldComment: isPlayer ? comment(data.fieldComment) : "",
    atlasRating: rating(data.atlasRating, true),
    atlasComment: comment(data.atlasComment),
    quoteConsent: isPlayer ? data.quoteConsent === true : false,
    callOptIn: !isPlayer ? data.callOptIn === true : false,
    updatedAt: new Date(),
  };
  const ref = db.collection("eventFeedback").doc(feedbackDocId(t.eventId, t.role, t.uid));
  const prev = (await ref.get()).data();
  if (!prev) doc.submittedAt = new Date();
  const low = (doc.fieldRating && doc.fieldRating <= 2) || doc.atlasRating <= 2;
  const lowAlert = low && !prev?.lowAlertSentAt;
  await ref.set(doc, { merge: true });
  return { ref, doc: { ...prev, ...doc }, lowAlert };
}

// ---- Read views -------------------------------------------------------------
async function eventMeta(db, ids) {
  const out = {};
  for (const id of ids) {
    const r = (await db.collection("eventFeedbackRequests").doc(id).get()).data();
    if (r) { out[id] = { eventTitle: r.eventTitle, eventDate: r.eventDate, fieldName: r.fieldName, sent: r.playerRequestsSent || 0 }; continue; }
    const ev = (await db.collection("events").doc(id).get()).data() || {};
    out[id] = { eventTitle: ev.title || id, eventDate: ev.date || "", fieldName: ev.fieldName || "", sent: 0 };
  }
  return out;
}

// Owner view: field ratings + field comments only, no uid/callsign/booking.
export async function getOwnerFeedback(db, ownerUid) {
  const snap = await db.collection("eventFeedback").where("ownerId", "==", ownerUid).where("role", "==", "player").get();
  const rows = snap.docs.map((d) => d.data()).filter((r) => r.fieldRating);
  const meta = await eventMeta(db, [...new Set(rows.map((r) => r.eventId))]);
  const byEvent = {};
  for (const r of rows) {
    const e = (byEvent[r.eventId] ||= { eventId: r.eventId, ...meta[r.eventId], ratings: [], comments: [] });
    e.ratings.push(r.fieldRating);
    if (r.fieldComment) e.comments.push({ rating: r.fieldRating, text: r.fieldComment });
  }
  return Object.values(byEvent)
    .map((e) => ({
      eventId: e.eventId, eventTitle: e.eventTitle, eventDate: e.eventDate, fieldName: e.fieldName,
      responses: e.ratings.length,
      average: Math.round((e.ratings.reduce((a, b) => a + b, 0) / e.ratings.length) * 10) / 10,
      comments: e.comments,
    }))
    .sort((a, b) => (b.eventDate || "").localeCompare(a.eventDate || ""));
}

const ts = (v) => (v?.toDate ? v.toDate().toISOString() : v instanceof Date ? v.toISOString() : v || null);

export async function getAdminFeedback(db) {
  const [fb, reqs] = await Promise.all([db.collection("eventFeedback").get(), db.collection("eventFeedbackRequests").get()]);
  const callsigns = {};
  for (const d of fb.docs) {
    const r = d.data();
    if (r.role === "player" && r.uid && !(r.uid in callsigns)) {
      callsigns[r.uid] = (await db.collection("users").doc(r.uid).get()).data()?.callsign || "";
    }
  }
  const events = {};
  for (const d of reqs.docs) {
    const r = d.data();
    events[d.id] = { eventId: d.id, eventTitle: r.eventTitle, eventDate: r.eventDate, fieldName: r.fieldName, sent: r.playerRequestsSent || 0, sentAt: ts(r.sentAt), responses: [] };
  }
  for (const d of fb.docs) {
    const r = d.data();
    const e = (events[r.eventId] ||= { eventId: r.eventId, eventTitle: r.eventId, eventDate: "", fieldName: "", sent: 0, responses: [] });
    e.responses.push({
      role: r.role, callsign: r.role === "player" ? callsigns[r.uid] || "" : "",
      fieldRating: r.fieldRating ?? null, fieldComment: r.fieldComment || "",
      atlasRating: r.atlasRating ?? null, atlasComment: r.atlasComment || "",
      quoteConsent: !!r.quoteConsent, callOptIn: !!r.callOptIn, submittedAt: ts(r.submittedAt),
    });
  }
  return Object.values(events).sort((a, b) => (b.eventDate || "").localeCompare(a.eventDate || ""));
}

// ---- Emails to Michael -----------------------------------------------------
const stars = (n) => (n ? "★".repeat(n) + "☆".repeat(5 - n) : "—");
const avg = (xs) => (xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1) : "—");

export function renderLowRatingAlert({ doc, callsign, meta }) {
  const lines = [
    `<p><strong>${escapeHtml(meta.fieldName)} — ${escapeHtml(meta.eventTitle)}</strong> (${escapeHtml(meta.eventDate)})</p>`,
    `<p>From: ${doc.role === "owner" ? "the field owner" : escapeHtml(callsign || "a player")}</p>`,
  ];
  if (doc.role === "player") lines.push(`<p>Field: ${stars(doc.fieldRating)}<br>${escapeHtml(doc.fieldComment) || "<em>no comment</em>"}</p>`);
  lines.push(`<p>Atlas: ${stars(doc.atlasRating)}<br>${escapeHtml(doc.atlasComment) || "<em>no comment</em>"}</p>`);
  if (doc.callOptIn) lines.push(`<p>They're open to a quick call.</p>`);
  lines.push(`<p><a href="https://admin.airsoftatlas.app/#feedback">Open Feedback in the Admin portal</a></p>`);
  return { subject: `Low rating: ${meta.fieldName} — ${meta.eventTitle}`, html: `<div style="font-family:Helvetica,Arial,sans-serif;font-size:14px;color:#2A2E33;">${lines.join("")}</div>` };
}

function summaryBlock(e) {
  const players = e.responses.filter((r) => r.role === "player");
  const owner = e.responses.find((r) => r.role === "owner");
  const parts = [
    `<h3 style="margin:24px 0 4px;color:#002C48;">${escapeHtml(e.fieldName)} — ${escapeHtml(e.eventTitle)} <span style="font-weight:400;color:#686C72;">(${escapeHtml(e.eventDate)})</span></h3>`,
    `<p style="margin:0 0 8px;">${players.length} of ${e.sent} players responded · Field avg ${avg(players.map((r) => r.fieldRating).filter(Boolean))} · Atlas avg ${avg(players.map((r) => r.atlasRating).filter(Boolean))}${owner ? ` · Owner rated Atlas ${owner.atlasRating}/5` : ""}</p>`,
  ];
  for (const r of e.responses) {
    const who = r.role === "owner" ? "Owner" : escapeHtml(r.callsign || "Player");
    const bits = [];
    if (r.fieldComment) bits.push(`Field (${r.fieldRating}/5): ${escapeHtml(r.fieldComment)}`);
    if (r.atlasComment) bits.push(`Atlas (${r.atlasRating}/5): ${escapeHtml(r.atlasComment)}`);
    if (bits.length) parts.push(`<p style="margin:6px 0;"><strong>${who}${r.quoteConsent ? " · OK to quote" : ""}</strong><br>${bits.join("<br>")}</p>`);
  }
  return parts.join("");
}

// Day after a send: one summary per event whose requests went out
// yesterday. Mondays: a weekly roll-up of everything submitted in the past
// 7 days. Returns null when there's nothing to say.
export async function buildDigest(db, { today = dayKey() } = {}) {
  const yesterday = addDays(today, -1);
  const all = await getAdminFeedback(db);
  const reqs = await db.collection("eventFeedbackRequests").where("sentDayKey", "==", yesterday).get();
  const sentYesterday = new Set(reqs.docs.map((d) => d.id));
  const daily = all.filter((e) => sentYesterday.has(e.eventId));

  const isMonday = new Date(today + "T12:00:00Z").getUTCDay() === 1;
  let weekly = [];
  if (isMonday) {
    const since = new Date(Date.now() - 7 * 864e5).toISOString();
    weekly = all
      .map((e) => ({ ...e, responses: e.responses.filter((r) => r.submittedAt && r.submittedAt >= since) }))
      .filter((e) => e.responses.length);
  }
  if (!daily.length && !weekly.length) return null;
  let html = `<div style="font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.55;color:#2A2E33;">`;
  if (daily.length) html += `<h2 style="color:#002C48;">Feedback so far — requests sent yesterday</h2>` + daily.map(summaryBlock).join("");
  if (weekly.length) html += `<h2 style="color:#002C48;margin-top:32px;">This week's feedback</h2>` + weekly.map(summaryBlock).join("");
  html += `<p style="margin-top:28px;"><a href="https://admin.airsoftatlas.app/#feedback">Open Feedback in the Admin portal</a></p></div>`;
  const subject = daily.length ? `Feedback summary: ${daily.map((e) => e.fieldName).join(", ")}` : "Weekly feedback summary";
  return { subject, html };
}
