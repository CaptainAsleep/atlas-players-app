import { test } from "node:test";
import assert from "node:assert/strict";
import { STAFF_CAP, normalizeStaffEmail, isValidEmail, cleanStaffName, staffWindowOpen } from "./staff.js";

const at = (iso) => Date.parse(iso);

test("cap is 20", () => assert.equal(STAFF_CAP, 20));

test("email normalization + validation", () => {
  assert.equal(normalizeStaffEmail("  Jake@Field.COM "), "jake@field.com");
  assert.equal(normalizeStaffEmail(undefined), "");
  assert.ok(isValidEmail("jake@field.com"));
  assert.ok(!isValidEmail("jake@field"));
  assert.ok(!isValidEmail("jake field@x.com"));
  assert.ok(!isValidEmail(""));
});

test("name cleaning", () => {
  assert.equal(cleanStaffName("  Jake   Smith "), "Jake Smith");
  assert.equal(cleanStaffName(null), "");
  assert.equal(cleanStaffName("x".repeat(80)).length, 60);
});

// Event on 2026-10-27 → window [2026-10-27T00:00Z, 2026-10-29T00:00Z)
// = 8pm EDT Oct 26 until 8pm EDT Oct 28.
test("window: single-day event", () => {
  const d = "2026-10-27";
  assert.equal(staffWindowOpen(d, null, at("2026-10-26T23:59:59Z")), false); // 7:59pm EDT the evening before
  assert.equal(staffWindowOpen(d, null, at("2026-10-27T00:00:00Z")), true);  // 8pm EDT the evening before
  assert.equal(staffWindowOpen(d, null, at("2026-10-27T14:00:00Z")), true);  // event morning
  assert.equal(staffWindowOpen(d, null, at("2026-10-28T23:59:59Z")), true);  // 7:59pm EDT the day after
  assert.equal(staffWindowOpen(d, null, at("2026-10-29T00:00:00Z")), false); // 8pm EDT the day after
});

test("window: Hawaii event morning is inside", () => {
  // 7am HST Oct 27 = 17:00Z Oct 27
  assert.equal(staffWindowOpen("2026-10-27", "", at("2026-10-27T17:00:00Z")), true);
});

test("window: multi-day uses endDate", () => {
  assert.equal(staffWindowOpen("2026-10-24", "2026-10-26", at("2026-10-27T20:00:00Z")), true);
  assert.equal(staffWindowOpen("2026-10-24", "2026-10-26", at("2026-10-28T00:00:00Z")), false);
  assert.equal(staffWindowOpen("2026-10-24", "2026-10-26", at("2026-10-24T00:00:00Z")), true);
  assert.equal(staffWindowOpen("2026-10-24", "2026-10-26", at("2026-10-23T23:59:59Z")), false);
});

test("window: bad or missing dates", () => {
  assert.equal(staffWindowOpen(null, null, at("2026-10-27T12:00:00Z")), false);
  assert.equal(staffWindowOpen("Oct 27", null, at("2026-10-27T12:00:00Z")), false);
  assert.equal(staffWindowOpen("2026-10-27", "garbage", at("2026-10-27T12:00:00Z")), true);
});
