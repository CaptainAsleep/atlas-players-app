// Social Feed (2026-11-22): the Firestore reads/writes behind the feed.
// Shared by the triggers in index.js and scripts/backfill-feed.mjs, so both
// write exactly the same shapes. Pure rules live in feed.js.
//
// Every function takes the Admin SDK `db` (and FieldValue where needed) so
// it has no module-level Firebase state of its own.

import * as feed from "./feed.js";
import { isCardBeta } from "./cards.js";

const BATCH = 400;

async function commitInChunks(db, ops) {
  for (let i = 0; i < ops.length; i += BATCH) {
    const batch = db.batch();
    for (const op of ops.slice(i, i + BATCH)) op(batch);
    await batch.commit();
  }
}

// Current friends of uid (both orderings of the friendRequests id).
export async function friendsOf(db, uid) {
  const col = db.collection("friendRequests");
  const [sent, received] = await Promise.all([
    col.where("fromUid", "==", uid).where("status", "==", "accepted").get(),
    col.where("toUid", "==", uid).where("status", "==", "accepted").get(),
  ]);
  return feed.friendUidsFrom(uid, sent.docs.map((d) => d.data()), received.docs.map((d) => d.data()));
}

// Same check as cardBetaAllowed in index.js: the code list or a cardBeta doc.
export async function hasCards(db, uid) {
  if (isCardBeta(uid)) return true;
  const d = await db.collection("cardBeta").doc(uid).get().catch(() => null);
  return !!d?.exists;
}

async function audienceFor(db, activity, friendUids) {
  if (!(activity.cardsOnly === true || activity.type === "cardCollected")) return friendUids;
  const flags = await Promise.all(friendUids.map((f) => hasCards(db, f)));
  return friendUids.filter((_, i) => flags[i]);
}

// Write pointers for one activity into each friend's feed.
export async function fanOut(db, id, activity, friendUids) {
  const friends = friendUids || (await friendsOf(db, activity.actorUid));
  const audience = await audienceFor(db, activity, friends);
  const pointer = feed.feedPointer(id, activity.actorUid, activity.type, activity.createdAt);
  await commitInChunks(db, audience.map((f) => (b) => b.set(db.collection("users").doc(f).collection("feed").doc(id), pointer)));
  return audience.length;
}

// Create an activity (idempotent: an existing doc with this id is left as
// is, so a retried trigger never resets reactions or the timestamp) and fan
// it out. Returns { id, created }.
export async function postActivity(db, { actorUid, type, refId, data = {}, createdAt = new Date() }) {
  const id = feed.activityId(actorUid, type, refId);
  const activity = { ...data, actorUid, type, createdAt, reactions: {} };
  const ref = db.collection("activity").doc(id);
  try {
    await ref.create(activity);
  } catch (err) {
    if (err?.code === 6 || /already exists/i.test(String(err?.message))) return { id, created: false };
    throw err;
  }
  await fanOut(db, id, activity);
  return { id, created: true };
}

// Remove an activity everywhere: every current friend's pointer, its
// reactions, and the doc itself. Safe to call for an id that doesn't exist.
export async function removeActivity(db, id) {
  const ref = db.collection("activity").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return false;
  const { actorUid } = snap.data();
  const [friends, reactions] = await Promise.all([
    actorUid ? friendsOf(db, actorUid) : [],
    ref.collection("reactions").get(),
  ]);
  const ops = [
    ...friends.map((f) => (b) => b.delete(db.collection("users").doc(f).collection("feed").doc(id))),
    ...reactions.docs.map((d) => (b) => b.delete(d.ref)),
  ];
  await commitInChunks(db, ops);
  await ref.delete();
  return true;
}

export async function removeTypes(db, uid, types, refId) {
  for (const t of types) await removeActivity(db, feed.activityId(uid, t, refId));
}

export async function activityExists(db, uid, type, refId) {
  return (await db.collection("activity").doc(feed.activityId(uid, type, refId)).get()).exists;
}

// First-save marker. Returns true if this call created it (first save ever).
export async function claimMarker(db, uid, type, refId) {
  try {
    await db.collection("activityKeys").doc(feed.markerId(uid, type, refId)).create({ uid, type, refId, at: new Date() });
    return true;
  } catch (err) {
    if (err?.code === 6 || /already exists/i.test(String(err?.message))) return false;
    throw err;
  }
}

// The actor's patch activities, newest first, as plain objects.
export async function patchActivitiesOf(db, uid) {
  const snap = await db.collection("activity").where("actorUid", "==", uid).where("type", "==", "patch").get();
  return snap.docs
    .map((d) => ({ id: d.id, ref: d.ref, data: d.data(), createdAtMs: feed.toMs(d.data().createdAt) }))
    .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
}

// A patch was added: join a group from the last 10 minutes, or post new.
export async function addPatch(db, FieldValue, uid, patchId, patchData, now = new Date()) {
  const entry = feed.patchEntry(patchId, patchData);
  const mine = await patchActivitiesOf(db, uid);
  if (mine.some((a) => (a.data.patchIds || []).includes(patchId))) return { grouped: false, skipped: true };
  const groupId = feed.pickPatchGroup(mine, now.getTime());
  if (groupId) {
    await db.collection("activity").doc(groupId).update({
      patches: FieldValue.arrayUnion(entry),
      patchIds: FieldValue.arrayUnion(patchId),
    });
    return { grouped: true, id: groupId };
  }
  const r = await postActivity(db, { actorUid: uid, type: "patch", refId: patchId, data: { patches: [entry], patchIds: [patchId] }, createdAt: now });
  return { grouped: false, ...r };
}

// A patch was removed: take it out of its group; drop the group if empty.
export async function dropPatch(db, uid, patchId) {
  const mine = await patchActivitiesOf(db, uid);
  const hit = mine.find((a) => (a.data.patchIds || []).includes(patchId));
  if (!hit) return false;
  const patches = (hit.data.patches || []).filter((p) => p.id !== patchId);
  if (!patches.length) return removeActivity(db, hit.id);
  await hit.ref.update({ patches, patchIds: patches.map((p) => p.id) });
  return true;
}

// New friendship: copy fromUid's recent activity into toUid's feed.
export async function copyRecentInto(db, fromUid, toUid, nowMs = Date.now()) {
  const cutoff = new Date(nowMs - feed.FEED_WINDOW_MS);
  const snap = await db.collection("activity").where("actorUid", "==", fromUid).where("createdAt", ">=", cutoff).get();
  if (snap.empty) return 0;
  const viewerHasCards = await hasCards(db, toUid);
  const docs = snap.docs.filter((d) => feed.visibleTo(d.data(), viewerHasCards));
  await commitInChunks(db, docs.map((d) => (b) => b.set(
    db.collection("users").doc(toUid).collection("feed").doc(d.id),
    feed.feedPointer(d.id, fromUid, d.data().type, d.data().createdAt),
  )));
  return docs.length;
}

// Unfriend: remove actorUid's cards from ownerUid's feed.
export async function removeActorFrom(db, ownerUid, actorUid) {
  const snap = await db.collection("users").doc(ownerUid).collection("feed").where("actorUid", "==", actorUid).get();
  await commitInChunks(db, snap.docs.map((d) => (b) => b.delete(d.ref)));
  return snap.size;
}

// Event/field/team/card display lookups.
export async function eventData(db, eventId) {
  const ev = await db.collection("events").doc(eventId).get();
  if (!ev.exists) return null;
  const e = ev.data();
  const f = e.fieldId ? await db.collection("fields").doc(e.fieldId).get() : null;
  return feed.eventDisplay(eventId, e, f?.exists ? f.data() : {});
}

export async function fieldData(db, fieldId) {
  const f = await db.collection("fields").doc(fieldId).get();
  return f.exists ? feed.fieldDisplay(fieldId, f.data()) : null;
}

export async function teamData(db, teamId) {
  const t = await db.collection("teams").doc(teamId).get();
  return t.exists ? feed.teamDisplay(teamId, t.data()) : null;
}

export async function cardOwnerData(db, ownerId, ownerKind) {
  const col = ownerKind === "child" ? "childPublicProfiles" : "publicProfiles";
  const p = await db.collection(col).doc(ownerId).get();
  return p.exists ? feed.cardDisplay(ownerId, ownerKind, p.data()) : null;
}
