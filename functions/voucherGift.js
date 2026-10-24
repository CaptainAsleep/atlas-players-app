// Pure helpers for gifted "free entry" vouchers (2026-10-24). No Firebase
// imports here, so voucherGift.test.mjs can run them directly with
// `node --test functions/voucherGift.test.mjs`.

// Per field, per calendar month (UTC). Gifted entries carry no Atlas fee,
// so the cap is what keeps "sell in cash, comp through Atlas" small.
export const GIFT_MONTHLY_CAP = 10;
export const GIFT_NOTE_MAX = 140;
const DAY_MS = 86400000;
const MAX_EXPIRY_MS = 3650 * DAY_MS;
const MIN_EXPIRY_LEAD_MS = 60 * 60 * 1000;

export function monthStartUtc(now) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export function nextMonthStartUtc(now) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}

// "Nov 1" style label for the reset date in the cap error.
export function capResetLabel(now) {
  const d = nextMonthStartUtc(now);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

// An owner-picked expiration (end of a chosen day, sent as epoch ms).
// Returns null when none was sent (caller falls back to its default),
// a Date when valid, or throws Error with a user-safe message.
export function parseExpiresAtMs(raw, nowMs) {
  if (raw === undefined || raw === null || raw === "") return null;
  const ms = Number(raw);
  if (!Number.isFinite(ms)) throw new Error("That expiration date isn't valid.");
  if (ms < nowMs + MIN_EXPIRY_LEAD_MS) throw new Error("Pick an expiration date in the future.");
  if (ms > nowMs + MAX_EXPIRY_MS) throw new Error("Expiration can be at most 10 years out.");
  return new Date(ms);
}

export function cleanGiftNote(raw) {
  const s = String(raw ?? "").replace(/\s+/g, " ").trim();
  return s ? s.slice(0, GIFT_NOTE_MAX) : null;
}

// Case variants for a callsign prefix search — Firestore range queries are
// case-sensitive and publicProfiles has no lowercased copy of callsign.
export function callsignVariants(q) {
  const s = String(q ?? "").trim();
  if (!s) return [];
  const cap = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  return [...new Set([s, s.toLowerCase(), cap, s.toUpperCase()])];
}

// A restored free entry (its event was canceled) keeps its original expiry,
// but never less than 30 days from now, so it's actually usable.
export function restoredFreeEntryExpiry(originalExpiresAt, now) {
  const floor = new Date(now.getTime() + 30 * DAY_MS);
  if (!(originalExpiresAt instanceof Date) || Number.isNaN(originalExpiresAt.getTime())) return floor;
  return originalExpiresAt > floor ? originalExpiresAt : floor;
}
