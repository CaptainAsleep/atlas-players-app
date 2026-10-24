import test from "node:test";
import assert from "node:assert/strict";
import { monthStartUtc, nextMonthStartUtc, capResetLabel, parseExpiresAtMs, cleanGiftNote, callsignVariants, restoredFreeEntryExpiry } from "./voucherGift.js";

test("month boundaries (UTC)", () => {
  const now = new Date(Date.UTC(2026, 9, 24, 18));
  assert.equal(monthStartUtc(now).toISOString(), "2026-10-01T00:00:00.000Z");
  assert.equal(nextMonthStartUtc(now).toISOString(), "2026-11-01T00:00:00.000Z");
  assert.equal(capResetLabel(now), "Nov 1");
  assert.equal(capResetLabel(new Date(Date.UTC(2026, 11, 31))), "Jan 1");
});

test("parseExpiresAtMs", () => {
  const now = Date.UTC(2026, 9, 24);
  assert.equal(parseExpiresAtMs(undefined, now), null);
  assert.equal(parseExpiresAtMs(null, now), null);
  assert.ok(parseExpiresAtMs(now + 86400000, now) instanceof Date);
  assert.throws(() => parseExpiresAtMs(now - 1, now), /future/);
  assert.throws(() => parseExpiresAtMs("abc", now), /valid/);
  assert.throws(() => parseExpiresAtMs(now + 3651 * 86400000, now), /10 years/);
});

test("cleanGiftNote", () => {
  assert.equal(cleanGiftNote("  thanks   for  helping "), "thanks for helping");
  assert.equal(cleanGiftNote(""), null);
  assert.equal(cleanGiftNote("x".repeat(200)).length, 140);
});

test("callsignVariants", () => {
  assert.deepEqual(callsignVariants("gHost"), ["gHost", "ghost", "Ghost", "GHOST"]);
  assert.deepEqual(callsignVariants("  "), []);
});

test("restoredFreeEntryExpiry", () => {
  const now = new Date(Date.UTC(2026, 9, 24));
  const far = new Date(Date.UTC(2027, 9, 24));
  assert.equal(restoredFreeEntryExpiry(far, now), far);
  const soon = new Date(Date.UTC(2026, 9, 30));
  assert.equal(restoredFreeEntryExpiry(soon, now).toISOString(), "2026-11-23T00:00:00.000Z");
  assert.equal(restoredFreeEntryExpiry(null, now).toISOString(), "2026-11-23T00:00:00.000Z");
});
