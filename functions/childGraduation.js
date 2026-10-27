// Child Patches + Graduation (2026-10-27) — pure helpers for handing a child
// profile's patches and checked-in games over to the child's own adult
// account. No firebase imports, so childGraduation.test.mjs can run them
// with plain node. The callables that use these live in index.js
// (startChildGraduation, cancelChildGraduation, claimChildProfile).
import { createHash, randomBytes } from "node:crypto";

export const GRADUATION_TTL_MS = 14 * 24 * 60 * 60 * 1000; // link works for 14 days
export const GRADUATION_RESEND_COOLDOWN_MS = 60 * 1000;
// One Firestore transaction allows 500 writes; the claim also writes the
// token, the dependent and the parent's status doc. A child with more than
// this many patches + games would need a batched claim — not realistic yet.
export const GRADUATION_MAX_WRITES = 450;

export function newGraduationToken() {
  return randomBytes(24).toString("base64url"); // 32 chars, URL-safe
}

// Only the hash is stored (childGraduations/{hash}), so a leaked database
// export can't be turned back into a working claim link.
export function hashGraduationToken(token) {
  return createHash("sha256").update(String(token)).digest("hex");
}

export function isWellFormedToken(token) {
  return typeof token === "string" && /^[A-Za-z0-9_-]{20,64}$/.test(token);
}

export function isValidDependentId(id) {
  return typeof id === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(id);
}

// "ghost.rider@gmail.com" -> "g***r@gmail.com" — enough for the right person
// to recognise their address, not enough to read it off a screenshot.
export function maskEmail(email) {
  const e = String(email || "");
  const at = e.lastIndexOf("@");
  if (at < 1) return "***";
  const local = e.slice(0, at);
  const domain = e.slice(at + 1);
  const shown = local.length <= 2 ? local[0] + "***" : `${local[0]}***${local[local.length - 1]}`;
  return `${shown}@${domain}`;
}

export function formatGraduationExpiry(ms) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "America/Detroit", month: "long", day: "numeric", year: "numeric" }).format(new Date(ms));
}

// A booking had child profiles on it (so it may have attendeeDetails for
// this child). Mirrors bookingHasChildren() in the app's useBookings.js.
export function mirrorHasChildren(mirror) {
  if (!mirror) return false;
  if (mirror.guardianPlaying === false) return true;
  if ((mirror.attendeeCount || 1) > 1) return true;
  return Array.isArray(mirror.attendees) && mirror.attendees.some((a) => a?.kind === "minor");
}

// The new account's copy of one game the child played. Only what history
// views read (Schedule's Past tab, profile Past Events, Year in Review, the
// achievement engine). Deliberately NO paid / amountPaidCents / codes /
// rentals / attendees / guardian info: this is history, not a booking —
// there is no event-side booking for the new uid, nothing to check in or
// cancel, and payment data only ever comes from the webhook.
export function inheritedMirrorDoc(eventId, guardianMirror, eventBooking, inheritedAt) {
  const m = guardianMirror || {};
  const doc = {
    eventId,
    fieldId: m.fieldId ?? eventBooking?.fieldId ?? null,
    eventTitle: m.eventTitle ?? null,
    fieldName: m.fieldName ?? null,
    date: m.date ?? null,
    endDate: m.endDate ?? null,
    bookedAt: m.bookedAt ?? null,
    checkedIn: true,
    checkedInAt: eventBooking?.checkedInAt ?? m.checkedInAt ?? null,
    inherited: true,
    inheritedAt,
  };
  const host = m.hostOwnerId || eventBooking?.hostOwnerId;
  if (host) doc.hostOwnerId = host;
  return doc;
}

// Decide what the claim writes. Inputs are plain data:
//   childPatches:       [{ id, data }]  the child profile's childPatches
//   existingPatchIds:   Set             ids already in users/{newUid}/patches
//   history:            [{ eventId, mirror, eventBooking }] — games the child
//                       was on (attendeeDetails exists), any check-in state
//   existingBookingIds: Set             eventIds already in users/{newUid}/bookings
// Only checked-in games carry over (Michael, 2026-10-27). A patch or game the
// account already has is skipped, never overwritten — merging into an
// existing account keeps what's already there.
export function planChildClaim({ childPatches, existingPatchIds, history, existingBookingIds, inheritedAt }) {
  const patchCopies = [];
  let skippedPatches = 0;
  for (const p of childPatches || []) {
    if (existingPatchIds.has(p.id)) { skippedPatches += 1; continue; }
    // seen:true — the new account shouldn't open to dozens of unlock
    // overlays; the claim screen says how many moved instead.
    patchCopies.push({ id: p.id, data: { ...p.data, seen: true, inherited: true } });
  }
  const mirrorWrites = [];
  let skippedGames = 0;
  const seen = new Set();
  for (const h of history || []) {
    if (!h?.eventId || seen.has(h.eventId)) continue;
    seen.add(h.eventId);
    if (h.eventBooking?.checkedIn !== true) continue;
    if (existingBookingIds.has(h.eventId)) { skippedGames += 1; continue; }
    mirrorWrites.push({ eventId: h.eventId, data: inheritedMirrorDoc(h.eventId, h.mirror, h.eventBooking, inheritedAt) });
  }
  return { patchCopies, mirrorWrites, skippedPatches, skippedGames };
}
