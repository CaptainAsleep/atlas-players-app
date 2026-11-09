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
export const CARD_BETA_UIDS = new Set([
  "lg4HMLTJvsPfSEN1pvNhMV4fbct1", // Atlas
  "4gaohQb6ddMvdSNdhlDp75eMZke2", // Rogue (2026-11-08)
]);
export const FOUNDER_UID = "lg4HMLTJvsPfSEN1pvNhMV4fbct1";

// Hand-set tiers that skip the circulation ranking (like Founder). Rogue is
// Diamond (Michael, 2026-11-08; was Legendary). Decide before cards open to
// everyone: her card shows Diamond no matter how many decks it's in.
// Legendary (influencers) and Diamond (founders, special members) are only
// ever set here. Add a uid with "legendary" or "diamond".
export const TIER_OVERRIDES = { "4gaohQb6ddMvdSNdhlDp75eMZke2": "diamond" };

// Fewer collections than this = Unranked (Michael, 2026-11-08).
export const RANKED_MIN = 5;

// The QR on screen refreshes every 30s; a code stays valid a little longer so
// a camera scan that opens the app (and maybe a sign-in) still lands. Short
// enough that a screenshot posted online is useless.
export const SHARE_TTL_MS = 3 * 60 * 1000;

// Server-owned fields on a public profile. Mirrored in firestore.rules.
export const CARD_SERVER_KEYS = ["signupNumber", "circulation", "cardTier", "cardTitle", "cardStats", "cardsCollected", "rankFloor", "cardOptOut"];

// Likeness consent (2026-11-09). The app hashes the exact words it showed in
// the consent pop-up and sends the hash with the answer; only this version
// is accepted. Changing one word = new version + hash here AND in
// src/TradingCards.jsx (CARD_CONSENT_TERMS / CARD_CONSENT_VERSION), and
// everyone is asked again (an old "in" stops counting).
export const CARD_CONSENT = { version: "2026-11-09.v1", sha256: "251156e0ae4403c5e0e597f8c6c5219cd0b51cc425ac3a32b825f413f81ac3ca" };
export function consentProblem({ choice, version, termsHash } = {}) {
  if (choice !== "in" && choice !== "out") return "choice";
  if (version !== CARD_CONSENT.version || termsHash !== CARD_CONSENT.sha256) return "terms";
  return null;
}
export const consentIsCurrentIn = (d) => !!d && d.choice === "in" && d.version === CARD_CONSENT.version;

// Trading + card packs consent (2026-11-09) — a second, separate permission,
// asked only of Legendary-and-up cards (influencers, ambassadors, founders).
// The hash covers every term AND the "I understand" checkbox line; "in"
// is only accepted with that box ticked. Same rule as above: change a word
// = new version + hash here and in src/TradingCards.jsx.
export const CARD_PACK_CONSENT = { version: "2026-11-09.p1", sha256: "4f9f378a24820430d73ca2979edf60d830cd2d2a3ed062399d3c39d4df53c4cf" };
export const PACK_ELIGIBLE_RANKS = ["legendary", "onyx", "diamond", "founder"];
export const isPackEligible = (cardTier) => PACK_ELIGIBLE_RANKS.includes(cardTier);
export function packConsentProblem({ choice, version, termsHash, acknowledged } = {}) {
  if (choice !== "in" && choice !== "out") return "choice";
  if (version !== CARD_PACK_CONSENT.version || termsHash !== CARD_PACK_CONSENT.sha256) return "terms";
  if (choice === "in" && acknowledged !== true) return "ack";
  return null;
}
export const packConsentIsCurrentIn = (d) => !!d && d.choice === "in" && d.acknowledged === true && d.version === CARD_PACK_CONSENT.version;

// "diamond" is hand-set only (TIER_OVERRIDES); circulation never produces it.
export const TIERS = ["unranked", "common", "uncommon", "rare", "epic", "legendary", "onyx", "diamond", "founder"];

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
  return (a?.ops ?? -1) === (b?.ops ?? -1) && (a?.fields ?? -1) === (b?.fields ?? -1)
    && (a?.patches ?? -1) === (b?.patches ?? -1);
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
  const fixed = (c) => c.founder || TIERS.includes(c.override);
  const ranked = pool.filter((c) => !fixed(c) && (c.circulation || 0) >= RANKED_MIN);
  const circs = ranked.map((c) => c.circulation || 0).sort((a, b) => a - b);
  const n = circs.length;
  const lowerCount = (v) => {
    let lo = 0, hi = n;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (circs[mid] < v) lo = mid + 1; else hi = mid; }
    return lo;
  };
  for (const c of pool) {
    if (c.founder) { tiers[c.key] = "founder"; continue; }
    if (TIERS.includes(c.override)) { tiers[c.key] = c.override; continue; }
    const circ = c.circulation || 0;
    if (circ < RANKED_MIN) { tiers[c.key] = "unranked"; continue; }
    const p = lowerCount(circ) / n;
    tiers[c.key] = p < 0.05 ? "legendary" : p < 0.20 ? "epic" : p < 0.50 ? "rare" : "common";
  }
  const bySerial = (a, b) => (a.serial ?? Infinity) - (b.serial ?? Infinity);
  const popular = pool.filter((c) => !fixed(c) && (c.circulation || 0) > 0)
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

// ===========================================================================
// Rank v2 (Michael + Rogue, 2026-11-08/09). Replaces the circulation
// percentile. Everyone starts Unranked and climbs; every input only goes up,
// so a rank is never lost. ALL criteria of a rank must be met. Legendary and
// Diamond are hand-set only (TIER_OVERRIDES). Same numbers live in
// src/TradingCards.jsx (RANK_TABLES) for the progress view — keep in sync.
// ===========================================================================
// Onyx (2026-11-09): hand-given, permanent, for Atlas ambassadors.
export const RANK_ORDER = ["unranked", "common", "uncommon", "rare", "epic", "legendary", "onyx", "diamond", "founder"];
export const HAND_GIVEN_RANKS = ["legendary", "onyx", "diamond"];
export const RANK_TABLES = {
  adult: [
    { rank: "common",   events: 3,   fields: 1,  circulation: 5,   patches: 0 },
    { rank: "uncommon", events: 10,  fields: 3,  circulation: 20,  patches: 0 },
    { rank: "rare",     events: 30,  fields: 10, circulation: 75,  patches: 10 },
    { rank: "epic",     events: 100, fields: 50, circulation: 250, patches: 25 },
  ],
  child: [
    { rank: "common",   events: 2,  fields: 1,  circulation: 3,  patches: 0 },
    { rank: "uncommon", events: 6,  fields: 2,  circulation: 10, patches: 0 },
    { rank: "rare",     events: 15, fields: 4,  circulation: 25, patches: 5 },
    { rank: "epic",     events: 40, fields: 12, circulation: 75, patches: 15 },
  ],
};

export const rankIndex = (r) => Math.max(0, RANK_ORDER.indexOf(r));

// stats: { events, fields, circulation, patches } → highest earned rank.
export function earnedRank(stats, kind = "adult") {
  const s = stats || {};
  let best = "unranked";
  for (const row of RANK_TABLES[kind === "child" ? "child" : "adult"]) {
    const ok = (s.events || 0) >= row.events && (s.fields || 0) >= row.fields
      && (s.circulation || 0) >= row.circulation && (s.patches || 0) >= row.patches;
    if (!ok) break; // ranks are cumulative; each row is strictly harder
    best = row.rank;
  }
  return best;
}

// What a card shows: a hand-set rank wins; otherwise the earned rank, never
// below a kept floor (a child who moved to an adult account keeps their rank,
// Michael 2026-11-09).
export function finalRank({ earned, override, floor, founder }) {
  if (founder) return "founder";
  if (override && RANK_ORDER.includes(override)) return override;
  const f = floor && RANK_ORDER.includes(floor) && rankIndex(floor) <= rankIndex("epic") ? floor : "unranked";
  return rankIndex(f) > rankIndex(earned) ? f : earned;
}

// The four rank inputs from a public profile doc.
export function rankInputs(doc) {
  return {
    events: doc?.cardStats?.ops || 0,
    fields: doc?.cardStats?.fields || 0,
    circulation: doc?.circulation || 0,
    patches: doc?.cardStats?.patches || 0,
  };
}
