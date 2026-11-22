import { test } from "node:test";
import assert from "node:assert/strict";
import {
  TYPES, REACTION_KINDS, isReactionKind, activityId, markerId, favoriteActivity, bookingIsSilent, bookingTransition,
  isChildPublicId, friendshipTransition, friendUidsFrom, pickPatchGroup, eventDisplay, eventDisplayFromBooking,
  fieldDisplay, teamDisplay, patchEntry, cardDisplay, visibleTo, withinWindow, FEED_WINDOW_MS, PATCH_GROUP_MS, toMs,
} from "./feed.js";

test("reaction kinds", () => {
  assert.deepEqual(REACTION_KINDS, ["thumbsUp", "fire", "heart", "niceShot"]);
  for (const k of REACTION_KINDS) assert.ok(isReactionKind(k));
  for (const k of ["salute", "clap", "", null, undefined, 1]) assert.ok(!isReactionKind(k));
});

test("activity ids are deterministic and type-checked", () => {
  assert.equal(activityId("u1", "interested", "e1"), "u1_interested_e1");
  assert.equal(activityId("u1", "cardCollected", "o1"), "u1_card_o1");
  assert.equal(activityId("u1", "booked", "e1"), activityId("u1", "booked", "e1"));
  assert.notEqual(activityId("u1", "booked", "e1"), activityId("u1", "checkedIn", "e1"));
  assert.throws(() => activityId("u1", "nope", "e1"));
  assert.throws(() => activityId("", "booked", "e1"));
  assert.throws(() => activityId("u1", "booked", ""));
  for (const t of TYPES) assert.ok(activityId("u", t, "r"));
});

test("markers only for the two save types", () => {
  assert.equal(markerId("u", "interested", "e"), "u_interested_e");
  assert.equal(markerId("u", "savedField", "f"), "u_savedField_f");
  assert.throws(() => markerId("u", "booked", "e"));
});

test("favorites map to interested / savedField", () => {
  assert.deepEqual(favoriteActivity({ type: "event", refId: "e1" }), { type: "interested", refId: "e1" });
  assert.deepEqual(favoriteActivity({ type: "field", refId: "f1" }), { type: "savedField", refId: "f1" });
  assert.equal(favoriteActivity({ type: "team", refId: "t" }), null);
  assert.equal(favoriteActivity({ type: "event" }), null);
  assert.equal(favoriteActivity(null), null);
});

test("silent bookings: inherited and kid-only", () => {
  assert.ok(bookingIsSilent({ inherited: true }));
  assert.ok(bookingIsSilent({ guardianPlaying: false }));
  assert.ok(!bookingIsSilent({}));
  assert.ok(!bookingIsSilent({ guardianPlaying: true }));
  assert.ok(!bookingIsSilent(null));
});

test("booking transitions", () => {
  assert.deepEqual(bookingTransition(null, { checkedIn: false }), { post: "booked", remove: ["interested"] });
  assert.deepEqual(bookingTransition(null, {}), { post: "booked", remove: ["interested"] });
  // walk-up: booking created already checked in
  assert.deepEqual(bookingTransition(null, { checkedIn: true }), { post: "checkedIn", remove: ["interested", "booked"] });
  assert.deepEqual(bookingTransition({}, { checkedIn: true }), { post: "checkedIn", remove: ["interested", "booked"] });
  assert.deepEqual(bookingTransition({ checkedIn: true }, { checkedIn: false }), { post: "booked", remove: ["checkedIn"] });
  assert.deepEqual(bookingTransition({ checkedIn: true }, { checkedIn: true, x: 1 }), { post: null, remove: [] });
  assert.deepEqual(bookingTransition({}, { x: 1 }), { post: null, remove: [] });
  assert.deepEqual(bookingTransition({}, null), { post: null, remove: ["booked", "checkedIn"] });
  assert.deepEqual(bookingTransition(null, null), { post: null, remove: [] });
  // silent ones never post or remove
  assert.deepEqual(bookingTransition(null, { guardianPlaying: false }), { post: null, remove: [] });
  assert.deepEqual(bookingTransition(null, { inherited: true, checkedIn: true }), { post: null, remove: [] });
  assert.deepEqual(bookingTransition({ guardianPlaying: false }, { guardianPlaying: false, checkedIn: true }), { post: null, remove: [] });
  assert.deepEqual(bookingTransition({ guardianPlaying: false }, null), { post: null, remove: [] });
});

test("child public ids", () => {
  assert.ok(isChildPublicId("c" + "a".repeat(24)));
  assert.ok(!isChildPublicId("lg4HMLTJvsPfSEN1pvNhMV4fbct1"));
  assert.ok(!isChildPublicId("c" + "a".repeat(23)));
  assert.ok(!isChildPublicId(null));
});

test("friendship transitions", () => {
  assert.equal(friendshipTransition(null, { status: "pending" }), null);
  assert.equal(friendshipTransition({ status: "pending" }, { status: "accepted" }), "added");
  assert.equal(friendshipTransition(null, { status: "accepted" }), "added");
  assert.equal(friendshipTransition({ status: "accepted" }, null), "removed");
  assert.equal(friendshipTransition({ status: "accepted" }, { status: "accepted", x: 1 }), null);
  assert.equal(friendshipTransition({ status: "pending" }, null), null);
});

test("friend uid list is de-duplicated and excludes self", () => {
  const uids = friendUidsFrom("me", [{ toUid: "a" }, { toUid: "b" }, { toUid: "me" }], [{ fromUid: "a" }, { fromUid: "c" }, {}]);
  assert.deepEqual(uids.sort(), ["a", "b", "c"]);
  assert.deepEqual(friendUidsFrom("me"), []);
});

test("patch grouping window", () => {
  const now = 1_000_000_000;
  assert.equal(pickPatchGroup([], now), null);
  assert.equal(pickPatchGroup([{ id: "old", createdAtMs: now - PATCH_GROUP_MS - 1 }], now), null);
  assert.equal(pickPatchGroup([{ id: "a", createdAtMs: now - 60_000 }, { id: "b", createdAtMs: now - 30_000 }], now), "b");
  assert.equal(pickPatchGroup([{ id: "x" }, null], now), null);
});

test("display payloads", () => {
  const d = eventDisplay("e1", { title: "Open Play", fieldId: "f1", date: "2026-12-19" }, { name: "Darkfire", imageUrl: "f.png" });
  assert.deepEqual(d, { eventId: "e1", eventTitle: "Open Play", fieldId: "f1", fieldName: "Darkfire", date: "2026-12-19", endDate: null, imageUrl: "f.png" });
  assert.equal(eventDisplay("e1", { imageUrl: "e.png" }, { imageUrl: "f.png" }).imageUrl, "e.png");
  assert.equal(eventDisplay("e1").fieldId, null);
  assert.equal(eventDisplayFromBooking("e1", { eventTitle: "T", fieldName: "F" }).eventTitle, "T");
  assert.deepEqual(fieldDisplay("f1", { name: "Compound", city: "Auburn, MI", state: "MI" }),
    { fieldId: "f1", fieldName: "Compound", city: "Auburn, MI", state: "MI", imageUrl: null });
  assert.deepEqual(teamDisplay("t1", { name: "B4LZ" }), { teamId: "t1", teamName: "B4LZ", patchUrl: null });
  assert.deepEqual(patchEntry("p1", {}), { id: "p1", name: "Patch", imageUrl: null });
  const c = cardDisplay("o1", "child", { callsign: "Kid", cardTier: "rare" });
  assert.equal(c.ownerKind, "child");
  assert.equal(c.cardsOnly, true);
  assert.equal(cardDisplay("o1", "weird", {}).ownerKind, "adult");
});

test("card activity only reaches card users", () => {
  assert.ok(visibleTo({ type: "booked" }, false));
  assert.ok(!visibleTo({ type: "cardCollected", cardsOnly: true }, false));
  assert.ok(visibleTo({ type: "cardCollected", cardsOnly: true }, true));
  assert.ok(!visibleTo(null, true));
});

test("window + timestamps", () => {
  const now = 10 * FEED_WINDOW_MS;
  assert.ok(withinWindow(now - 1000, now));
  assert.ok(!withinWindow(now - FEED_WINDOW_MS - 1, now));
  assert.ok(!withinWindow(null, now));
  assert.equal(toMs({ toMillis: () => 5 }), 5);
  assert.equal(toMs(new Date(7)), 7);
  assert.equal(toMs(9), 9);
  assert.equal(toMs("x"), null);
});
