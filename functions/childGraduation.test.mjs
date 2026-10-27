import assert from "node:assert/strict";
import { newGraduationToken, hashGraduationToken, isWellFormedToken, maskEmail, mirrorHasChildren, inheritedMirrorDoc, planChildClaim, formatGraduationExpiry, isValidDependentId } from "./childGraduation.js";

// tokens
const seenTok = new Set();
for (let i = 0; i < 2000; i++) {
  const t = newGraduationToken();
  assert.ok(isWellFormedToken(t), t);
  assert.equal(t.length, 32);
  assert.ok(!seenTok.has(t)); seenTok.add(t);
}
const t = newGraduationToken();
assert.equal(hashGraduationToken(t), hashGraduationToken(t));
assert.equal(hashGraduationToken(t).length, 64);
assert.notEqual(hashGraduationToken(t), hashGraduationToken(t + "x"));
assert.ok(!isWellFormedToken("short"));
assert.ok(!isWellFormedToken("../../etc/passwd/aaaaaaaaaaaaaaaaaaaa"));
assert.ok(!isWellFormedToken(null));
assert.ok(isValidDependentId("AbC_12-x"));
assert.ok(!isValidDependentId("a/b"));

// masking
assert.equal(maskEmail("ghost.rider@gmail.com"), "g***r@gmail.com");
assert.equal(maskEmail("ab@x.io"), "a***@x.io");
assert.equal(maskEmail("a@x.io"), "a***@x.io");
assert.equal(maskEmail("nope"), "***");
assert.match(formatGraduationExpiry(Date.UTC(2026, 10, 10, 15)), /November 10, 2026/);

// which mirrors had kids
assert.equal(mirrorHasChildren({ attendeeCount: 1 }), false);
assert.equal(mirrorHasChildren({}), false);
assert.equal(mirrorHasChildren({ attendeeCount: 2 }), true);
assert.equal(mirrorHasChildren({ guardianPlaying: false, attendeeCount: 1 }), true);
assert.equal(mirrorHasChildren({ attendees: [{ kind: "minor" }] }), true);

// inherited doc carries no payment / booking data
const mirror = { eventId: "e1", fieldId: "the-compound", eventTitle: "Open Play", fieldName: "The Compound", date: "2026-10-24", endDate: null, bookedAt: "B", paid: true, amountPaidCents: 4000, attendees: [{ kind: "minor", callsign: "Ghost" }], attendeeCount: 2, guardianPlaying: false, selectedRentals: [{ id: "r" }], walkOnEligible: true };
const doc = inheritedMirrorDoc("e1", mirror, { checkedIn: true, checkedInAt: "C" }, "NOW");
for (const k of ["paid", "amountPaidCents", "attendees", "attendeeCount", "guardianPlaying", "selectedRentals", "walkOnEligible", "hostOwnerId"]) assert.ok(!(k in doc), k);
assert.deepEqual(doc, { eventId: "e1", fieldId: "the-compound", eventTitle: "Open Play", fieldName: "The Compound", date: "2026-10-24", endDate: null, bookedAt: "B", checkedIn: true, checkedInAt: "C", inherited: true, inheritedAt: "NOW" });
assert.equal(inheritedMirrorDoc("e2", { hostOwnerId: "h" }, { checkedIn: true }, 1).hostOwnerId, "h");

// plan
const plan = planChildClaim({
  childPatches: [{ id: "dtb", data: { name: "DTB", seen: false, addedAt: "A1" } }, { id: "first-game", data: { name: "First Game", seen: false } }],
  existingPatchIds: new Set(["first-game"]),
  history: [
    { eventId: "e1", mirror, eventBooking: { checkedIn: true } },
    { eventId: "e1", mirror, eventBooking: { checkedIn: true } }, // duplicate ignored
    { eventId: "e2", mirror: {}, eventBooking: { checkedIn: false } }, // no-show
    { eventId: "e3", mirror: {}, eventBooking: { checkedIn: true } }, // already on account
    { eventId: "e4", mirror: {}, eventBooking: null }, // booking gone
  ],
  existingBookingIds: new Set(["e3"]),
  inheritedAt: "NOW",
});
assert.deepEqual(plan.patchCopies, [{ id: "dtb", data: { name: "DTB", seen: true, inherited: true, addedAt: "A1" } }]);
assert.equal(plan.skippedPatches, 1);
assert.deepEqual(plan.mirrorWrites.map((w) => w.eventId), ["e1"]);
assert.equal(plan.skippedGames, 1);
const empty = planChildClaim({ childPatches: [], existingPatchIds: new Set(), history: [], existingBookingIds: new Set(), inheritedAt: 0 });
assert.deepEqual(empty, { patchCopies: [], mirrorWrites: [], skippedPatches: 0, skippedGames: 0 });

console.log("childGraduation tests passed");
