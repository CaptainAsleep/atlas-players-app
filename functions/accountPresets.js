// Account presets + creator tags (2026-11-10, per Michael).
//
// An account preset is set up BEFORE someone joins, keyed by their email:
//   accountPresets/{email, lowercased}
//     { cardBeta, rank, creator: { kind, label }, friendRequestFrom, appliedTo: null }
// (scripts/set-account-preset.mjs writes it). The first time an account with
// that VERIFIED email has a public profile, the server applies it once:
//   cardBeta/{uid}            trading-card beta access
//   cardRankOverrides/{uid}   hand-given rank (e.g. legendary)
//   creatorTags/{uid}         public "Creator" badge + drives Almost Famous
//   friendRequests/{from}_{uid}  a PENDING request from Michael (he accepts it)
// First case: Jet DesertFox (DesertFoxTactical@gmail.com).
//
// Almost Famous ("Attend an event a YouTuber attended"): granted by the server
// when a player and a creator-tagged account are both checked in to the same
// event. Going forward only: both check-ins must be at or after the creator
// was tagged. A guardian on a child-only booking isn't playing, so it doesn't
// count. Creators don't earn it from each other. Kids don't get it (v1).

export const HAND_GIVEN = ["legendary", "onyx", "diamond"];
export const CREATOR_KINDS = { youtuber: "Creator" }; // badge text (Michael, 2026-11-10)
export const ALMOST_FAMOUS_ID = "almost-famous";

export function normEmail(email) {
  const e = String(email || "").trim().toLowerCase();
  return /^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(e) ? e : null;
}

// Preset doc → what to apply. Anything invalid is dropped, not guessed.
export function presetPlan(d = {}) {
  const kind = d.creator && CREATOR_KINDS[d.creator.kind] ? d.creator.kind : null;
  return {
    cardBeta: d.cardBeta === true,
    rank: HAND_GIVEN.includes(d.rank) ? d.rank : null,
    creator: kind ? { kind, label: String(d.creator.label || CREATOR_KINDS[kind]).slice(0, 24) } : null,
    friendRequestFrom: typeof d.friendRequestFrom === "string" && d.friendRequestFrom ? d.friendRequestFrom : null,
  };
}

export function toMs(v) {
  if (v == null) return null;
  if (typeof v.toMillis === "function") return v.toMillis();
  if (v instanceof Date) return v.getTime();
  if (typeof v === "number") return v;
  return null;
}

// Does this event booking count toward Almost Famous for a creator tagged at sinceMs?
export function countsForAlmostFamous(booking, sinceMs) {
  if (!booking || booking.checkedIn !== true) return false;
  if (booking.guardianPlaying === false) return false;
  const at = toMs(booking.checkedInAt);
  return sinceMs != null && at != null && at >= sinceMs;
}

// Who gets Almost Famous when `bookingUid` just checked in.
//   creators: Map(uid -> taggedAtMs)
//   loadOne(uid) -> booking data | null      (that uid's booking for this event)
//   loadCheckedIn() -> [{ uid, data }]       (every checked-in booking)
export async function almostFamousRecipients({ bookingUid, booking, creators, loadOne, loadCheckedIn }) {
  if (!creators?.size) return [];
  if (creators.has(bookingUid)) {
    const since = creators.get(bookingUid);
    if (!countsForAlmostFamous(booking, since)) return [];
    const all = await loadCheckedIn();
    return all.filter((r) => r.uid !== bookingUid && !creators.has(r.uid) && countsForAlmostFamous(r.data, since)).map((r) => r.uid);
  }
  for (const [cUid, since] of creators) {
    if (!countsForAlmostFamous(booking, since)) continue;
    const c = await loadOne(cUid);
    if (countsForAlmostFamous(c, since)) return [bookingUid];
  }
  return [];
}
