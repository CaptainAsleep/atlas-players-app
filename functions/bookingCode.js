// ---------------------------------------------------------------------------
// Booking check-in codes (2026-10-22, scope: project doc
// claude/atlas-confirmation-code-scope.md).
//
// Every booking gets an 8-character code the player (or, for a child-only
// booking, the child) can give at check-in when the QR won't scan or the
// parent isn't there. One code per booking — it checks in the whole party.
//
// Storage — never on anything public:
//   bookingCodes/{eventId}_{uid}       { code, eventId, uid, fieldId, hostOwnerId?, createdAt }
//                                      readable only by that player and the admin (rules)
//   bookingCodeIndex/{eventId}_{code}  { uid, eventId, createdAt }
//                                      no client access; per-event uniqueness + lookup
// A rebook after a cancel overwrites bookingCodes with a fresh code; the old
// code's index doc is left behind but no longer matches, so it's rejected.
//
// Deliberately free of firebase imports so scripts/backfill-booking-codes.mjs
// and tests use the exact same code.
// ---------------------------------------------------------------------------
import { randomInt } from "node:crypto";

// No 0/O, 1/I/L — nothing that reads ambiguously off a phone or out loud.
export const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const CODE_LENGTH = 8;

export function generateBookingCode(rand = randomInt) {
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) out += CODE_ALPHABET[rand(CODE_ALPHABET.length)];
  return out;
}

// "K7MPQ3XR" -> "K7MP-Q3XR"
export function formatBookingCode(code) {
  const c = String(code || "");
  return c.length === CODE_LENGTH ? `${c.slice(0, 4)}-${c.slice(4)}` : c;
}

// Whatever the owner typed -> canonical form, or null if it can't be a code.
// Ignores dashes, spaces and case.
export function normalizeBookingCode(input) {
  const c = String(input || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (c.length !== CODE_LENGTH) return null;
  for (const ch of c) if (!CODE_ALPHABET.includes(ch)) return null;
  return c;
}

export const bookingCodeDocId = (eventId, uid) => `${eventId}_${uid}`;
export const bookingCodeIndexId = (eventId, code) => `${eventId}_${code}`;

// Call in a transaction's READ phase (before any t.set/t.update). Picks a
// code not already used in this event; 31^8 makes a collision vanishingly
// rare, the retry is just so it can never silently double up.
export async function reserveBookingCode(t, db, eventId, rand = randomInt) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateBookingCode(rand);
    const snap = await t.get(db.collection("bookingCodeIndex").doc(bookingCodeIndexId(eventId, code)));
    if (!snap.exists) return code;
  }
  throw new Error("could not reserve a unique booking code");
}

// Call in the same transaction's WRITE phase, alongside the booking writes.
export function writeBookingCode(t, db, { code, eventId, uid, fieldId = null, hostOwnerId = null, now = new Date() }) {
  t.set(db.collection("bookingCodes").doc(bookingCodeDocId(eventId, uid)), {
    code, eventId, uid, fieldId: fieldId ?? null,
    ...(hostOwnerId ? { hostOwnerId } : {}),
    createdAt: now,
  });
  t.set(db.collection("bookingCodeIndex").doc(bookingCodeIndexId(eventId, code)), {
    uid, eventId, createdAt: now,
  });
}

// --- Email ------------------------------------------------------------------
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
const joinNames = (names) => (names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`);

// The [CHECKIN_CODE_BLOCK] table row used by every confirmation template.
// childCallsigns is set for a child-only booking (the parent isn't playing):
// then the copy tells the parent to hand the code to the kid.
// Empty string when there's no code (e.g. a booking from before codes).
export function renderCheckInCodeBlock({ code, mode = "solo", childCallsigns = [] }) {
  if (!code) return "";
  const shown = esc(formatBookingCode(code));
  let note;
  if (mode === "child-only") {
    const kids = esc(joinNames(childCallsigns));
    note = `Give this code to ${kids || "your child"} &mdash; ${childCallsigns.length > 1 ? "any of them" : "they"} can give it at check-in without you there. It checks in everyone on this booking.`;
  } else if (mode === "party") {
    note = "If the QR code won&rsquo;t scan, give this code at check-in. It checks in everyone on this booking &mdash; you can also give it to your child so they can check in with it.";
  } else {
    note = "If the QR code won&rsquo;t scan, give this code at check-in.";
  }
  return `<tr>
    <td class="atlas-px" style="padding:24px 40px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="background:#F2F2ED; border-radius:10px; padding:20px 22px; text-align:center;">
          <div style="font-family:'IBM Plex Mono','Courier New',monospace; font-size:10px; font-weight:600; letter-spacing:0.1em; color:#686C72; text-transform:uppercase; margin-bottom:8px;">Check-in code</div>
          <div style="font-family:'IBM Plex Mono','Courier New',monospace; font-size:26px; font-weight:700; letter-spacing:0.12em; color:#002C48;">${shown}</div>
          <p style="margin:10px 0 0; font-family:Helvetica,Arial,sans-serif; font-size:13px; line-height:1.6; color:#4A4E54;">${note}</p>
        </td>
      </tr></table>
    </td>
  </tr>`;
}
