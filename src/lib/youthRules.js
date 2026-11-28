// Youth rules (2026-11-28, RealSim request): pure helpers, no Firebase
// imports, so they're unit-tested with `node --test functions/youthRules.test.mjs`.
// Scope: project doc claude/atlas-major-youth-rules-scope.md.
//
// Three optional settings. On a Major they live on the event doc; on a field
// event they live on the field doc (resolveEventHost hands either one over as
// `fieldData`). Anything unset behaves exactly as before this shipped.
//   minimumAge          — under this age a child can't play (existing setting)
//   minAgeWithGuardian  — children from this age up to minimumAge - 1 may play
//                         only with their legal guardian on site (playing, or
//                         the guardian ticked "I'll be on site")
//   fullFaceUnderAge    — children under this age must wear full face
//                         protection; the guardian acknowledges it at booking
// Adults always count as 18+, so only child profiles are ever affected.
//
// Client copy of functions/youthRules.js -- keep the two identical (functions/
// and src/ share no module). The server is the real gate.

export const FULL_FACE_ACK_VERSION = "2026-11-28";

function posInt(v, max) {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN;
  return Number.isInteger(n) && n > 0 && n <= max ? n : null;
}

// Normalized rules from a field doc or a Major event doc.
export function readYouthRules(src) {
  const minAge = posInt(src?.minimumAge, 99);
  const guardianFrom = posInt(src?.minAgeWithGuardian, 99);
  return {
    minAge,
    // Only meaningful below the minimum age; anything else is ignored.
    minAgeWithGuardian: minAge && guardianFrom && guardianFrom < minAge ? guardianFrom : null,
    fullFaceUnderAge: posInt(src?.fullFaceUnderAge, 18),
  };
}

// What one child (age on the event's start date) needs at this event.
// blocked: null, or { reason: "under_min" | "under_guardian_min", age }
export function childYouthStatus(age, rules) {
  const r = rules || {};
  let blocked = null;
  let needsGuardian = false;
  if (r.minAge && age < r.minAge) {
    if (r.minAgeWithGuardian && age >= r.minAgeWithGuardian) needsGuardian = true;
    else blocked = { reason: r.minAgeWithGuardian ? "under_guardian_min" : "under_min" };
  }
  const needsFullFace = !!(r.fullFaceUnderAge && age < r.fullFaceUnderAge);
  return { blocked, needsGuardian, needsFullFace };
}

// Player-facing reason a child can't be booked.
export function blockedMessage(callsign, rules) {
  const who = callsign || "A child";
  if (rules.minAgeWithGuardian) return `${who} is under this event's minimum age of ${rules.minAgeWithGuardian}, even with a guardian.`;
  return `${who} is under this event's minimum age of ${rules.minAge}.`;
}

// One line for event and field pages, or null when nothing is set.
// e.g. "Ages 16+ · 12–15 with a legal guardian on site · Full face under 18"
export function youthRulesSummary(rules) {
  const parts = [];
  if (rules.minAge) parts.push(`Ages ${rules.minAge}+`);
  if (rules.minAge && rules.minAgeWithGuardian) {
    const lo = rules.minAgeWithGuardian;
    const hi = rules.minAge - 1;
    parts.push(`${lo === hi ? lo : `${lo}–${hi}`} with a legal guardian on site`);
  }
  if (rules.fullFaceUnderAge) parts.push(`Full face under ${rules.fullFaceUnderAge}`);
  return parts.length ? parts.join(" · ") : null;
}

// Compact per-child flags carried in Stripe metadata ("id:gf;id2:f"), so the
// webhook can write them without re-deriving the rules. Metadata is set by
// the server (createBookingCheckout), never the client.
export function encodeYouthFlags(dependents) {
  return dependents
    .filter((d) => d.needsGuardian || d.fullFace)
    .map((d) => `${d.id}:${d.needsGuardian ? "g" : ""}${d.fullFace ? "f" : ""}`)
    .join(";");
}

export function decodeYouthFlags(str) {
  const out = {};
  for (const part of String(str || "").split(";")) {
    const [id, flags = ""] = part.split(":");
    if (!id) continue;
    out[id] = { needsGuardian: flags.includes("g"), fullFace: flags.includes("f") };
  }
  return out;
}
