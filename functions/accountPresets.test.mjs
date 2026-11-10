import test from "node:test";
import assert from "node:assert/strict";
import { normEmail, presetPlan, countsForAlmostFamous, almostFamousRecipients } from "./accountPresets.js";

const T0 = 1_000_000;
const ci = (at, extra = {}) => ({ checkedIn: true, checkedInAt: new Date(at), ...extra });

test("normEmail lowercases and rejects junk", () => {
  assert.equal(normEmail("  DesertFoxTactical@Gmail.com "), "desertfoxtactical@gmail.com");
  assert.equal(normEmail("not an email"), null);
  assert.equal(normEmail("a/b@c.com"), null);
});

test("presetPlan keeps valid parts only", () => {
  assert.deepEqual(presetPlan({ cardBeta: true, rank: "legendary", creator: { kind: "youtuber" }, friendRequestFrom: "u1" }),
    { cardBeta: true, rank: "legendary", creator: { kind: "youtuber", label: "Creator" }, friendRequestFrom: "u1" });
  assert.deepEqual(presetPlan({ cardBeta: "yes", rank: "founder", creator: { kind: "tiktok" } }),
    { cardBeta: false, rank: null, creator: null, friendRequestFrom: null });
});

test("countsForAlmostFamous: checked in, playing, after the tag", () => {
  assert.equal(countsForAlmostFamous(ci(T0 + 1), T0), true);
  assert.equal(countsForAlmostFamous(ci(T0 - 1), T0), false, "before the tag");
  assert.equal(countsForAlmostFamous({ checkedIn: false, checkedInAt: new Date(T0 + 1) }, T0), false);
  assert.equal(countsForAlmostFamous(ci(T0 + 1, { guardianPlaying: false }), T0), false, "child-only booking");
  assert.equal(countsForAlmostFamous({ checkedIn: true }, T0), false, "no check-in time");
  assert.equal(countsForAlmostFamous(ci(T0 + 1), null), false);
});

const creators = new Map([["jet", T0]]);

test("player checks in after the creator: player gets it", async () => {
  const r = await almostFamousRecipients({ bookingUid: "p1", booking: ci(T0 + 5), creators,
    loadOne: async (u) => (u === "jet" ? ci(T0 + 2) : null), loadCheckedIn: async () => [] });
  assert.deepEqual(r, ["p1"]);
});

test("player checks in but the creator hasn't: nobody yet", async () => {
  const r = await almostFamousRecipients({ bookingUid: "p1", booking: ci(T0 + 5), creators,
    loadOne: async () => ({ checkedIn: false }), loadCheckedIn: async () => [] });
  assert.deepEqual(r, []);
});

test("creator checks in last: everyone already checked in gets it, except other creators and non-players", async () => {
  const two = new Map([["jet", T0], ["matt", T0]]);
  const r = await almostFamousRecipients({ bookingUid: "jet", booking: ci(T0 + 9), creators: two, loadOne: async () => null,
    loadCheckedIn: async () => [
      { uid: "jet", data: ci(T0 + 9) }, { uid: "p1", data: ci(T0 + 3) }, { uid: "matt", data: ci(T0 + 4) },
      { uid: "parent", data: ci(T0 + 4, { guardianPlaying: false }) }, { uid: "old", data: ci(T0 - 10) },
    ] });
  assert.deepEqual(r, ["p1"]);
});

test("no creators: nothing", async () => {
  const r = await almostFamousRecipients({ bookingUid: "p1", booking: ci(T0 + 5), creators: new Map(),
    loadOne: async () => ci(T0), loadCheckedIn: async () => [] });
  assert.deepEqual(r, []);
});
