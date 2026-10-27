import test from "node:test";
import assert from "node:assert/strict";
import { profileChanged, todayInDetroit, isUpcoming, copyPatch, attendeesPatch, eventBookingPatch, bookingMirrorPatch } from "./profileSync.js";

test("profileChanged only on callsign/avatar", () => {
  assert.equal(profileChanged({ callsign: "a", teamId: "x" }, { callsign: "a", teamId: "y" }), false);
  assert.equal(profileChanged({ callsign: "whyustaring" }, { callsign: "Snakebite" }), true);
  assert.equal(profileChanged({ avatarUrl: null }, {}), false);
  assert.equal(profileChanged({}, { avatarUrl: "u" }), true);
});

test("todayInDetroit uses Michigan date", () => {
  // 2026-10-28 02:00 UTC is still Oct 27 in Detroit
  assert.equal(todayInDetroit(new Date("2026-10-28T02:00:00Z")), "2026-10-27");
});

test("isUpcoming through last day", () => {
  assert.equal(isUpcoming({ date: "2026-10-27" }, "2026-10-27"), true);
  assert.equal(isUpcoming({ date: "2026-10-26" }, "2026-10-27"), false);
  assert.equal(isUpcoming({ date: "2026-10-25", endDate: "2026-10-27" }, "2026-10-27"), true);
  assert.equal(isUpcoming({}, "2026-10-27"), false);
});

test("copyPatch", () => {
  assert.equal(copyPatch({ callsign: "A", avatarUrl: "u" }, { callsign: "A", avatarUrl: "u" }), null);
  assert.deepEqual(copyPatch({ callsign: "whyustaring", avatarUrl: "old" }, { callsign: "Snakebite", avatarUrl: "new" }), { callsign: "Snakebite", avatarUrl: "new" });
  assert.deepEqual(copyPatch({ callsign: "Afellow", avatarUrl: null }, { callsign: "Afellow", avatarUrl: "u" }), { avatarUrl: "u" });
  assert.deepEqual(copyPatch({ fromCallsign: "x" }, { callsign: "y" }, "fromCallsign", "fromAvatarUrl"), { fromCallsign: "y" });
});

test("attendees: only adult entry changes", () => {
  const a = [{ kind: "adult", callsign: "old" }, { kind: "minor", callsign: "Kid" }];
  assert.deepEqual(attendeesPatch(a, "new"), [{ kind: "adult", callsign: "new" }, { kind: "minor", callsign: "Kid" }]);
  assert.equal(attendeesPatch(a.slice(1), "new"), null);
  assert.equal(attendeesPatch(undefined, "new"), null);
});

test("booking patches never touch other fields", () => {
  const p = eventBookingPatch({ callsign: "old", avatarUrl: null, paid: true, amountPaidCents: 2500 }, { callsign: "new", avatarUrl: null });
  assert.deepEqual(p, { callsign: "new" });
  assert.equal(bookingMirrorPatch({ date: "2026-11-01" }, { callsign: "new" }), null);
});
