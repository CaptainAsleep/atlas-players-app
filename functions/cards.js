// Player Trading Cards (2026-11-08). Pure helpers, kept out of index.js so
// they can be unit-tested (cards.test.mjs). Scope: project doc
// claude/atlas-trading-cards-scope.md.
//
// Data:
//   counters/players                       { total }  — all-time card count (adults + public kids). Public read.
//   publicProfiles/{uid}                   + signupNumber, circulation, cardTier, cardTitle, cardStats, cardsCollected (server-only)
//   childPublicProfiles/{publicId}         + the same card fields (server-only, like the rest of that doc)
//   childCardSerials/{guardianUid}_{depId}  { signupNumber } — a child's number survives toggling public off and on (server-only)
//   cardCollections/{collectorUid}_{ownerId}  { collectorUid, ownerId, ownerKind, collectedAt }  public read, server write
//   cardShares/{token}                     { ownerId, ownerKind, issuerUid, expiresAt, status, ... } issuer read, server write

// v1 is visible to these accounts only (Michael, 2026-11-08). Add a uid here
// AND in src/TradingCards.jsx to let someone else test.
export const CARD_BETA_UIDS = new Set(["lg4HMLTJvsPfSEN1pvNhMV4fbct1"]);
export const FOUNDER_UID = "lg4HMLTJvsPfSEN1pvNhMV4fbct1";

// Fewer collections than this = Unranked (Michael, 2026-11-08).
export const RANKED_MIN = 5;

// The QR on screen refreshes every 30s; a code stays valid a little longer so
// a camera scan that opens the app (and maybe a sign-in) still lands. Short
// enough that a screenshot posted online is useless.
export const SHARE_TTL_MS = 3 * 60 * 1000;

// Server-owned fields on a public profile. Mirrored in firestore.rules.
export const CARD_SERVER_KEYS = ["signupNumber", "circulation", "cardTier", "cardTitle", "cardStats", "cardsCollected"];

export const TIERS = ["unranked", "common", "rare", "epic", "legendary", "founder"];

export function isCardBeta(uid) {
  return !!uid && CARD_BETA_UIDS.has(uid);
}

export function newShareToken(randomBytes) {
  return randomBytes(16).toString("hex");
}

export function isWellFormedShareToken(t) {
  return typeof t === "string" && /^[0-9a-f]{32}$/.test(t);
}

// Ops = events the player checked into through Atlas (child-only bookings,
// where the parent didn't play, don't count). Fields = distinct fields among
// those. Same rules as the achievement engine (isPlayedBooking, distinct
// fieldId; Atlas Majors have no field and add an op but no field).
export function adultCardStats(mirrors) {
  const played = (mirrors || []).filter((b) => b && b.checkedIn && b.guardianPlaying !== false);
  return { ops: played.length, fields: new Set(played.map((b) => b.fieldId).filter(Boolean)).size };
}

// A child's games are the parent's checked-in bookings that had the child on
// them (attendeeDetails/{depId} exists). Per-child check-in doesn't exist,
// so a checked-in party counts for everyone on it.
export function childCardStats(mirrorsWithChild) {
  const played = (mirrorsWithChild || []).filter((b) => b && b.checkedIn);
  return { ops: played.length, fields: new Set(played.map((b) => b.fieldId).filter(Boolean)).size };
}

export function sameStats(a, b) {
  return (a?.ops ?? -1) === (b?.ops ?? -1) && (a?.fields ?? -1) === (b?.fields ?? -1);
}

// Rarity. cards: [{ key, circulation, founder, serial }]
// - Founder: always "founder", outside the rules.
// - circulation < RANKED_MIN: "unranked".
// - Ranked cards by percentile of circulation, least-circulated first:
//   bottom 5% Legendary, next 15% Epic, next 30% Rare, top 50% Common.
//   A card's percentile = share of ranked cards with strictly LOWER
//   circulation, so ties always land in the same tier.
// Titles (all-time, they move): "most_popular" = highest circulation of any
// non-founder card (needs at least 1); "rarest" = lowest circulation among
// ranked cards. Ties go to the lowest serial (earliest player).
export function computeTiers(cards) {
  const tiers = {};
  const titles = {};
  const pool = (cards || []).filter((c) => c && c.key);
  const ranked = pool.filter((c) => !c.founder && (c.circulation || 0) >= RANKED_MIN);
  const circs = ranked.map((c) => c.circulation || 0).sort((a, b) => a - b);
  const n = circs.length;
  const lowerCount = (v) => {
    let lo = 0, hi = n;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (circs[mid] < v) lo = mid + 1; else hi = mid; }
    return lo;
  };
  for (const c of pool) {
    if (c.founder) { tiers[c.key] = "founder"; continue; }
    const circ = c.circulation || 0;
    if (circ < RANKED_MIN) { tiers[c.key] = "unranked"; continue; }
    const p = lowerCount(circ) / n;
    tiers[c.key] = p < 0.05 ? "legendary" : p < 0.20 ? "epic" : p < 0.50 ? "rare" : "common";
  }
  const bySerial = (a, b) => (a.serial ?? Infinity) - (b.serial ?? Infinity);
  const popular = pool.filter((c) => !c.founder && (c.circulation || 0) > 0)
    .sort((a, b) => (b.circulation || 0) - (a.circulation || 0) || bySerial(a, b))[0];
  if (popular) titles[popular.key] = "most_popular";
  const rarest = ranked.slice().sort((a, b) => (a.circulation || 0) - (b.circulation || 0) || bySerial(a, b))[0];
  if (rarest && !titles[rarest.key]) titles[rarest.key] = "rarest";
  return { tiers, titles };
}

// Checks a scan against its share doc. Returns null when it may be collected,
// or an error reason the client turns into a message.
//   share: the cardShares doc data (or null)
//   ctx: { now, collectorUid, collectorHasProfile, ownerExists, guardianUid }
export function collectProblem(share, ctx) {
  if (!share) return "invalid";
  if (share.status === "revoked") return "invalid";
  const exp = typeof share.expiresAt?.toMillis === "function" ? share.expiresAt.toMillis() : Number(share.expiresAtMs ?? share.expiresAt);
  if (!Number.isFinite(exp) || ctx.now > exp) return "expired";
  if (!ctx.ownerExists) return "gone";
  if (!ctx.collectorHasProfile) return "no-profile";
  if (share.ownerKind === "adult" && share.ownerId === ctx.collectorUid) return "own-card";
  if (share.ownerKind === "child" && ctx.guardianUid && ctx.guardianUid === ctx.collectorUid) return "own-card";
  if (share.issuerUid === ctx.collectorUid) return "own-card";
  return null;
}

export function collectionDocId(collectorUid, ownerId) {
  return `${collectorUid}_${ownerId}`;
}

function toMs(v) {
  if (v == null) return null;
  if (typeof v.toMillis === "function") return v.toMillis();
  if (typeof v === "number") return v;
  if (typeof v._seconds === "number") return v._seconds * 1000;
  const p = Date.parse(v);
  return Number.isFinite(p) ? p : null;
}

// Backfill numbering (Michael, 2026-11-08): bottom of the admin Players
// table to the top. That table sorts publicProfiles newest-first by
// createdAt with a missing date counting as 0, so the order here is
// createdAt ascending, missing dates first, ties by doc id.
// profiles: [{ id, createdAt, signupNumber? }]; startAfter = current total.
// Returns { assignments: [{ id, signupNumber }], total, missingCreatedAt: [ids] }.
// Profiles that already have a number keep it.
export function planSerials(profiles, startAfter = 0) {
  const rows = (profiles || []).map((p) => ({ id: p.id, ms: toMs(p.createdAt), has: Number.isInteger(p.signupNumber) && p.signupNumber > 0 ? p.signupNumber : null }));
  const missingCreatedAt = rows.filter((r) => r.ms == null).map((r) => r.id);
  const maxExisting = rows.reduce((m, r) => Math.max(m, r.has || 0), 0);
  let next = Math.max(startAfter, maxExisting);
  const todo = rows.filter((r) => !r.has).sort((a, b) => (a.ms ?? 0) - (b.ms ?? 0) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const assignments = todo.map((r) => ({ id: r.id, signupNumber: ++next }));
  return { assignments, total: next, missingCreatedAt };
}

export function collectMessage(reason) {
  switch (reason) {
    case "expired": return "That code expired. Ask them to show their card again.";
    case "gone": return "That card isn't available anymore.";
    case "own-card": return "That's your own card.";
    case "no-profile": return "Finish setting up your profile first.";
    case "not-beta": return "Trading cards aren't available yet.";
    default: return "That isn't a valid card code.";
  }
}
