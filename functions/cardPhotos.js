// Card photos + photo reports (2026-11-26). Pure helpers, kept out of
// index.js so they can be unit-tested (cardPhotos.test.mjs). Scope: project
// doc claude/atlas-card-photo-change-scope.md.
//
// Data (all server-written):
//   publicProfiles/{uid}        + cardPhotoUrl, cardPhotoPath, cardPhotoAspect, cardPhotoHiRes, cardPhotoChanges
//   users/{uid}/dependents/{id} + the same five fields for a child's card (mirrored to childPublicProfiles)
//   cardPhotoCredits/{sessionId} { uid, amountCents, used, usedAt, usedFor, createdAt } — one paid change each. Payer can read.
//   photoReports/{caseId}_{reporterUid} { caseId, reporterUid, photoUrl, createdAt } — closed
//   photoReportCases/{caseId}   { ownerKind, ownerId, target, photoUrl, reporters, ignoredReporters, status, ... } — admin read
//
// Rules of the money (Michael, 2026-11-26): the first card photo is free,
// every one after that is $3.99 (one credit = one change). Re-cropping is
// free. There's no removal; the card opt-out is the way off.

export const CARD_PHOTO_PRICE_CENTS = 399;
export const CARD_PHOTO_MAX_BYTES = 3 * 1024 * 1024;
export const PHOTO_REPORT_HIDE_AT = 3;
// Server-owned card photo fields. Mirrored in firestore.rules and in
// CARD_SERVER_KEYS (cards.js).
export const CARD_PHOTO_SERVER_KEYS = ["cardPhotoUrl", "cardPhotoPath", "cardPhotoAspect", "cardPhotoHiRes", "cardPhotoChanges"];

// How a new card photo gets paid for: "free" (first one), "credit" (a paid,
// unused change exists) or null (needs a $3.99 checkout first).
export function cardPhotoPayment(changes, hasCredit) {
  const n = Number.isInteger(changes) && changes > 0 ? changes : 0;
  if (n === 0) return "free";
  return hasCredit ? "credit" : null;
}

// width / height from the app. Anything silly becomes square.
export function cleanAspect(a) {
  const n = Number(a);
  if (!Number.isFinite(n) || n <= 0) return 1;
  return Math.min(5, Math.max(0.2, n));
}

export function cleanCardCrop(c) {
  if (!c || typeof c !== "object") return { x: 0.5, y: 0.5, zoom: 1 };
  const num = (v, lo, hi, d) => (Number.isFinite(Number(v)) ? Math.min(hi, Math.max(lo, Number(v))) : d);
  return { x: num(c.x, 0, 1, 0.5), y: num(c.y, 0, 1, 0.5), zoom: num(c.zoom, 1, 4, 1) };
}

const ADULT_ID = /^[A-Za-z0-9]{20,40}$/;
const CHILD_ID = /^c[0-9a-f]{24}$/;
export const REPORT_TARGETS = ["profile", "card"];

// { ownerKind, ownerId, target } from the app -> the case id, or null.
export function reportCaseId(input = {}) {
  const { ownerKind, ownerId, target } = input;
  if (!REPORT_TARGETS.includes(target)) return null;
  if (ownerKind === "adult" && ADULT_ID.test(ownerId || "")) return `adult_${ownerId}_${target}`;
  if (ownerKind === "child" && CHILD_ID.test(ownerId || "")) return `child_${ownerId}_${target}`;
  return null;
}

export function parseCaseId(caseId) {
  const m = /^(adult|child)_([A-Za-z0-9]+)_(profile|card)$/.exec(caseId || "");
  return m ? { ownerKind: m[1], ownerId: m[2], target: m[3] } : null;
}

// One report against the photo showing now. Returns what to write:
//   { status: "duplicate" | "ignored" | "counted", reporters, ignoredReporters, hide }
// A different photo than the case last saw starts the count over (the
// owner changed it). Reporters from before a restore don't count again.
export function applyReport(caseData, photoUrl, reporterUid, hideAt = PHOTO_REPORT_HIDE_AT) {
  const same = !!caseData && caseData.photoUrl === photoUrl;
  const reporters = same ? [...(caseData.reporters || [])] : [];
  const ignored = same ? [...(caseData.ignoredReporters || [])] : [];
  const alreadyHidden = same && caseData.status === "hidden";
  if (reporters.includes(reporterUid)) return { status: "duplicate", reporters, ignoredReporters: ignored, hide: false };
  if (ignored.includes(reporterUid)) return { status: "ignored", reporters, ignoredReporters: ignored, hide: false };
  reporters.push(reporterUid);
  return { status: "counted", reporters, ignoredReporters: ignored, hide: !alreadyHidden && reporters.length >= hideAt };
}

// Storage object path inside a Firebase download URL, or null.
export function storagePathFromUrl(url) {
  const m = /\/o\/([^?]+)/.exec(typeof url === "string" ? url : "");
  if (!m) return null;
  try { return decodeURIComponent(m[1]); } catch { return null; }
}

// What a card photo write sets on the owner doc.
export function cardPhotoFields({ url, path, aspect, hiRes, changes }) {
  return {
    cardPhotoUrl: url,
    cardPhotoPath: path,
    cardPhotoAspect: cleanAspect(aspect),
    cardPhotoHiRes: hiRes !== false,
    cardPhotoChanges: (Number.isInteger(changes) && changes > 0 ? changes : 0) + 1,
  };
}
