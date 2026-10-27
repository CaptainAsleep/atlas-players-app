// Field Staff Logins (2026-10-27) — pure helpers, no Firestore, so they can be
// unit-tested (staff.test.mjs). See firestore.rules "Field Staff Logins" and
// the project doc claude/atlas-staff-logins-scope.md.

// Max staff per field, counting pending invites (Michael, 2026-10-27).
export const STAFF_CAP = 20;

// Minimum gap between invite emails to the same pending invite.
export const STAFF_INVITE_COOLDOWN_MS = 60 * 1000;

// Minimum gap between staff verification emails to the same account.
export const STAFF_VERIFY_COOLDOWN_MS = 60 * 1000;

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeStaffEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

export function isValidEmail(email) {
  const e = normalizeStaffEmail(email);
  return e.length >= 3 && e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

// Name the owner types for a staff member: trimmed, inner whitespace
// collapsed, max 60 chars. Empty means "not given" (caller falls back).
export function cleanStaffName(name) {
  return String(name ?? "").replace(/\s+/g, " ").trim().slice(0, 60);
}

function utcDayStartMs(dateStr) {
  if (typeof dateStr !== "string" || !DATE_RE.test(dateStr)) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  const ms = Date.UTC(y, m - 1, d);
  return Number.isFinite(ms) ? ms : null;
}

// The event-day window staff access is locked to. MUST match
// staffWindowOpen() in firestore.rules: from UTC midnight of the event date
// until UTC midnight two days after the last event day (endDate if valid,
// else date). In US local time: the evening before the event (8pm Eastern /
// 5pm Pacific) until the evening after it ends.
export function staffWindowOpen(dateStr, endDateStr, nowMs = Date.now()) {
  const start = utcDayStartMs(dateStr);
  if (start === null) return false;
  const end = utcDayStartMs(endDateStr) ?? start;
  return nowMs >= start && nowMs < end + 2 * DAY_MS;
}
