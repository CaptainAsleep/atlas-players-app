// Social Feed (2026-11-22). Pure logic for the friend activity feed — no
// Firestore here, so it's unit-tested in feed.test.mjs. The triggers that
// use it live in index.js (search "Social Feed").
//
// Data model (scope: claude/atlas-social-feed-scope.md in the Atlas project):
//   activity/{activityId}                 server-written; one per thing a player did
//   activity/{activityId}/reactions/{uid} { kind } — written by the reacting player
//   users/{uid}/feed/{activityId}         pointer { activityId, actorUid, type, createdAt }, server-written
//   activityKeys/{uid}_{type}_{refId}     first-save markers, server-only
//
// Activity ids are deterministic ({uid}_{type}_{refId}) so every trigger is
// idempotent and every "undo" knows exactly which doc to delete.

export const FEED_DAYS = 30;
export const FEED_WINDOW_MS = FEED_DAYS * 24 * 60 * 60 * 1000;
export const PATCH_GROUP_MS = 10 * 60 * 1000;

export const TYPES = ["interested", "booked", "checkedIn", "savedField", "patch", "joinedTeam", "cardCollected"];
export const REACTION_KINDS = ["thumbsUp", "fire", "heart", "niceShot"];

export const isReactionKind = (k) => typeof k === "string" && REACTION_KINDS.includes(k);

// Short ref names inside the id, kept stable forever (ids are stored).
const ID_TAG = {
  interested: "interested",
  booked: "booked",
  checkedIn: "checkedIn",
  savedField: "savedField",
  patch: "patch",
  joinedTeam: "joinedTeam",
  cardCollected: "card",
};

export function activityId(uid, type, refId) {
  if (!uid || !ID_TAG[type] || !refId) throw new Error(`bad activity id parts: ${uid} ${type} ${refId}`);
  return `${uid}_${ID_TAG[type]}_${refId}`;
}

// First-save markers only exist for the two "save" types (decision 10).
export function markerId(uid, type, refId) {
  if (type !== "interested" && type !== "savedField") throw new Error(`no marker for ${type}`);
  return activityId(uid, type, refId);
}

// users/{uid}/favorites/{type}-{refId} → which activity it would post.
export function favoriteActivity(fav) {
  if (!fav || typeof fav.refId !== "string" || !fav.refId) return null;
  if (fav.type === "event") return { type: "interested", refId: fav.refId };
  if (fav.type === "field") return { type: "savedField", refId: fav.refId };
  return null;
}

// A booking mirror that shouldn't speak for the account holder: games
// carried over from a child profile at graduation, and child-only bookings
// where the parent isn't playing.
export function bookingIsSilent(b) {
  return !!b && (b.inherited === true || b.guardianPlaying === false);
}

// users/{uid}/bookings/{eventId} before → after. Returns what to post and
// which of this event's activity types to remove. Booked replaces
// interested; checked in replaces booked.
export function bookingTransition(before, after) {
  const none = { post: null, remove: [] };
  if (!before && !after) return none;
  if (bookingIsSilent(after) || (!after && bookingIsSilent(before))) return none;
  if (!before && after) {
    return after.checkedIn === true
      ? { post: "checkedIn", remove: ["interested", "booked"] }
      : { post: "booked", remove: ["interested"] };
  }
  if (before && !after) return { post: null, remove: ["booked", "checkedIn"] };
  const was = before.checkedIn === true, is = after.checkedIn === true;
  if (!was && is) return { post: "checkedIn", remove: ["interested", "booked"] };
  if (was && !is) return { post: "booked", remove: ["checkedIn"] };
  return none;
}

// Public child ids used for team membership / child cards (see onChildMemberWritten).
export const isChildPublicId = (id) => typeof id === "string" && /^c[0-9a-f]{24}$/.test(id);

// friendRequests/{id} before → after: "added" when a friendship starts,
// "removed" when an accepted one ends (deleted or moved off accepted).
export function friendshipTransition(before, after) {
  const was = before?.status === "accepted", is = after?.status === "accepted";
  if (!was && is) return "added";
  if (was && !is) return "removed";
  return null;
}

// Two friendRequests query results (fromUid == me, toUid == me, both
// accepted) → a de-duplicated list of the other uids.
export function friendUidsFrom(uid, sentDocs = [], receivedDocs = []) {
  const out = new Set();
  for (const d of sentDocs) if (d?.toUid && d.toUid !== uid) out.add(d.toUid);
  for (const d of receivedDocs) if (d?.fromUid && d.fromUid !== uid) out.add(d.fromUid);
  return [...out];
}

// Patch grouping: a new patch joins the actor's newest patch activity if
// that one started within PATCH_GROUP_MS. `existing` is [{ id, createdAtMs }].
export function pickPatchGroup(existing, nowMs, windowMs = PATCH_GROUP_MS) {
  let best = null;
  for (const a of existing || []) {
    if (typeof a?.createdAtMs !== "number") continue;
    if (nowMs - a.createdAtMs > windowMs || a.createdAtMs > nowMs + 60_000) continue;
    if (!best || a.createdAtMs > best.createdAtMs) best = a;
  }
  return best ? best.id : null;
}

// Display payloads. Names/images are copied so a card renders from one doc;
// the actor's own callsign/avatar are NOT copied (the app reads them live).
export function eventDisplay(eventId, ev = {}, field = {}) {
  return {
    eventId,
    eventTitle: ev.title || null,
    fieldId: ev.fieldId ?? null,
    fieldName: ev.fieldName || field?.name || null,
    date: ev.date || null,
    endDate: ev.endDate || null,
    imageUrl: ev.imageUrl || field?.imageUrl || null,
  };
}

// Same, built from the player's booking mirror when the event doc is gone.
export function eventDisplayFromBooking(eventId, b = {}) {
  return {
    eventId,
    eventTitle: b.eventTitle || null,
    fieldId: b.fieldId ?? null,
    fieldName: b.fieldName || null,
    date: b.date || null,
    endDate: b.endDate || null,
    imageUrl: null,
  };
}

export function fieldDisplay(fieldId, f = {}) {
  return { fieldId, fieldName: f.name || null, city: f.city || null, state: f.state || null, imageUrl: f.imageUrl || null };
}

export function teamDisplay(teamId, t = {}) {
  return { teamId, teamName: t.name || null, patchUrl: t.patchUrl || null };
}

export function patchEntry(patchId, p = {}) {
  return { id: patchId, name: p.name || "Patch", imageUrl: p.imageUrl || null };
}

export function cardDisplay(ownerId, ownerKind, owner = {}) {
  return {
    ownerId,
    ownerKind: ownerKind === "child" ? "child" : "adult",
    ownerCallsign: owner.callsign || "Player",
    ownerAvatarUrl: owner.avatarUrl || null,
    ownerTier: owner.cardTier || null,
    cardsOnly: true,
  };
}

// Pointer written into each friend's feed.
export function feedPointer(activityIdValue, actorUid, type, createdAt) {
  return { activityId: activityIdValue, actorUid, type, createdAt };
}

// Should this activity go to this viewer? Card activity only reaches
// viewers with card access (decision 8).
export function visibleTo(activity, viewerHasCards) {
  if (!activity) return false;
  if (activity.cardsOnly === true || activity.type === "cardCollected") return !!viewerHasCards;
  return true;
}

// Backfill/age helper: is a timestamp (ms) inside the feed window?
export function withinWindow(ms, nowMs, windowMs = FEED_WINDOW_MS) {
  return typeof ms === "number" && ms > 0 && nowMs - ms <= windowMs;
}

export const toMs = (v) => (v?.toMillis ? v.toMillis() : v instanceof Date ? v.getTime() : typeof v === "number" ? v : null);
