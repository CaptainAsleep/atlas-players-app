// Team Bookings (2026-11-05, per Michael — scope: project doc
// claude/atlas-team-bookings-scope.md). One player buys up to 20 tickets to a
// paid event in one checkout and hands them out. Each ticket lives in
// teamTickets/{ticketId} until it's claimed (the recipient signs the waiver
// and it becomes their own normal booking), handed back (a voucher for the
// buyer), or the event passes (a voucher for the buyer).
//
// Pure helpers only — kept here so they're unit-tested (teamTickets.test.mjs)
// without Firestore. Everything that reads or writes lives in index.js.
import { createHash } from "node:crypto";

export const MAX_TEAM_TICKETS = 20;
export const ACCEPT_WINDOW_MS = 5 * 24 * 3600 * 1000;

export class TeamTicketError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const UID_RE = /^[A-Za-z0-9_-]{1,128}$/;
const DEP_RE = /^[A-Za-z0-9_-]{1,64}$/;

// A recipient as the app sends it. Returns a clean copy or throws.
//   { kind: "self" }                      the buyer
//   { kind: "player", uid }               any adult player
//   { kind: "child", publicId }           a public child profile (teammate)
//   { kind: "ownChild", dependentId }     one of the buyer's own children
export function normalizeRecipient(raw) {
  const kind = raw?.kind;
  if (kind === "self") return { kind: "self" };
  if (kind === "player" && typeof raw.uid === "string" && UID_RE.test(raw.uid)) return { kind: "player", uid: raw.uid };
  if (kind === "child" && typeof raw.publicId === "string" && UID_RE.test(raw.publicId)) return { kind: "child", publicId: raw.publicId };
  if (kind === "ownChild" && typeof raw.dependentId === "string" && DEP_RE.test(raw.dependentId)) return { kind: "ownChild", dependentId: raw.dependentId };
  throw new TeamTicketError("invalid-argument", "One of the people you picked isn't valid.");
}

// One key per person, so the same person can't hold two tickets to one event.
// The buyer picking themselves as a "player" is the same person as "self".
export function recipientKey(r, buyerUid) {
  if (r.kind === "self") return `u:${buyerUid}`;
  if (r.kind === "player") return `u:${r.uid}`;
  if (r.kind === "child") return `c:${r.publicId}`;
  return `d:${buyerUid}:${r.dependentId}`;
}

// Quantity 1..20, and at most that many recipients (the rest are assigned
// later). Duplicate people are refused.
export function normalizeTeamPurchase({ quantity, recipients }, buyerUid) {
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_TEAM_TICKETS) {
    throw new TeamTicketError("invalid-argument", `Pick between 1 and ${MAX_TEAM_TICKETS} tickets.`);
  }
  const list = Array.isArray(recipients) ? recipients.filter((r) => r != null) : [];
  if (list.length > qty) {
    throw new TeamTicketError("invalid-argument", "You picked more people than tickets.");
  }
  const clean = list.map(normalizeRecipient);
  const keys = clean.map((r) => recipientKey(r, buyerUid));
  if (new Set(keys).size !== keys.length) {
    throw new TeamTicketError("invalid-argument", "The same person is picked twice.");
  }
  return { quantity: qty, recipients: clean };
}

// Money for N tickets. Every ticket carries its own per-ticket fee (the same
// computeStandardFee a solo booking pays, cap included); the fee goes on top
// of the price only when the field passes it to the player.
export function teamTicketTotals({ entryPriceCents, perTicketFeeCents, quantity, passFeeToPlayer }) {
  const unitCents = entryPriceCents + (passFeeToPlayer ? perTicketFeeCents : 0);
  return {
    unitCents,
    totalCents: unitCents * quantity,
    applicationFeeCents: perTicketFeeCents * quantity,
  };
}

// 5 days to claim, but never past the moment the event closes. A ticket
// assigned on game day is claimable right up to close ("at the gate").
export function acceptDeadlineMs(nowMs, eventCloseMs) {
  const fiveDays = nowMs + ACCEPT_WINDOW_MS;
  return typeof eventCloseMs === "number" ? Math.min(fiveDays, eventCloseMs) : fiveDays;
}

// Whole days left, rounded up (the Home card shows "3 days left"); 0 once
// it's under a minute away.
export function daysLeft(deadlineMs, nowMs) {
  const ms = deadlineMs - nowMs;
  if (ms <= 60000) return 0;
  return Math.ceil(ms / (24 * 3600 * 1000));
}

// Deterministic id for one checkout request. The same request (impatient
// re-tap, relaunch) maps to the same draft doc and the same Stripe
// idempotency key, so it can never become two sessions; a different
// quantity, price choice, tier or recipient list is a new request.
export function teamDraftId({ buyerUid, eventId, quantity, selectedChoiceId, priceTier, recipients }) {
  const h = createHash("sha256")
    .update(JSON.stringify([buyerUid, eventId, quantity, selectedChoiceId || null, priceTier || null, recipients]))
    .digest("hex");
  return `td_${h.slice(0, 32)}`;
}

// Name list for copy: "Ghost", "Ghost and Viper", "Ghost, Viper and Bear".
export function joinNames(names) {
  const n = names.filter(Boolean);
  if (n.length <= 1) return n.join("");
  return `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}`;
}

export function fmtUsd(cents) {
  const v = (cents || 0) / 100;
  return Number.isInteger(v) ? `$${v}` : `$${v.toFixed(2)}`;
}
