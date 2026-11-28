import test from "node:test";
import assert from "node:assert/strict";
import { readYouthRules, childYouthStatus, blockedMessage, youthRulesSummary, encodeYouthFlags, decodeYouthFlags } from "./youthRules.js";

test("nothing set: everyone allowed, nothing needed", () => {
  const r = readYouthRules({});
  assert.deepEqual(r, { minAge: null, minAgeWithGuardian: null, fullFaceUnderAge: null });
  assert.deepEqual(childYouthStatus(8, r), { blocked: null, needsGuardian: false, needsFullFace: false });
  assert.equal(youthRulesSummary(r), null);
});

test("minimum age only: same as before", () => {
  const r = readYouthRules({ minimumAge: 14 });
  assert.equal(childYouthStatus(13, r).blocked.reason, "under_min");
  assert.equal(childYouthStatus(14, r).blocked, null);
  assert.equal(blockedMessage("Ghost", r), "Ghost is under this event's minimum age of 14.");
});

test("guardian band: 16+, 12-15 with a guardian", () => {
  const r = readYouthRules({ minimumAge: 16, minAgeWithGuardian: 12 });
  assert.deepEqual(childYouthStatus(11, r), { blocked: { reason: "under_guardian_min" }, needsGuardian: false, needsFullFace: false });
  assert.equal(childYouthStatus(12, r).needsGuardian, true);
  assert.equal(childYouthStatus(15, r).needsGuardian, true);
  assert.equal(childYouthStatus(16, r).needsGuardian, false);
  assert.equal(blockedMessage("Bear", r), "Bear is under this event's minimum age of 12, even with a guardian.");
  assert.equal(youthRulesSummary(r), "Ages 16+ · 12–15 with a legal guardian on site");
});

test("guardian age at or above the minimum is ignored", () => {
  assert.equal(readYouthRules({ minimumAge: 12, minAgeWithGuardian: 12 }).minAgeWithGuardian, null);
  assert.equal(readYouthRules({ minAgeWithGuardian: 10 }).minAgeWithGuardian, null);
});

test("one-year guardian band reads as a single age", () => {
  assert.equal(youthRulesSummary(readYouthRules({ minimumAge: 13, minAgeWithGuardian: 12 })), "Ages 13+ · 12 with a legal guardian on site");
});

test("full face under 18, editable, capped at 18", () => {
  const r = readYouthRules({ fullFaceUnderAge: 18 });
  assert.equal(childYouthStatus(17, r).needsFullFace, true);
  assert.equal(readYouthRules({ fullFaceUnderAge: 16 }).fullFaceUnderAge, 16);
  assert.equal(readYouthRules({ fullFaceUnderAge: 21 }).fullFaceUnderAge, null);
  assert.equal(youthRulesSummary(readYouthRules({ minimumAge: 10, fullFaceUnderAge: 18 })), "Ages 10+ · Full face under 18");
});

test("bad values are ignored", () => {
  assert.deepEqual(readYouthRules({ minimumAge: "abc", minAgeWithGuardian: -3, fullFaceUnderAge: 0 }), { minAge: null, minAgeWithGuardian: null, fullFaceUnderAge: null });
  assert.equal(readYouthRules({ minimumAge: "16" }).minAge, 16);
});

test("flags round-trip through metadata", () => {
  const s = encodeYouthFlags([{ id: "a1", needsGuardian: true, fullFace: true }, { id: "b2", fullFace: true }, { id: "c3" }]);
  assert.equal(s, "a1:gf;b2:f");
  assert.deepEqual(decodeYouthFlags(s), { a1: { needsGuardian: true, fullFace: true }, b2: { needsGuardian: false, fullFace: true } });
  assert.deepEqual(decodeYouthFlags(""), {});
});
