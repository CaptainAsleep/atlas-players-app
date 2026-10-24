import test from "node:test";
import assert from "node:assert/strict";
import { parseFirstTime, stateFromCity, timeZoneForState, wallClockToUtcMs, eventCloseMs, isEventClosed } from "./eventClose.js";

const iso = (ms) => new Date(ms).toISOString();

test("parseFirstTime", () => {
  assert.equal(parseFirstTime("9:00 AM (gates), 11:00 AM start"), 540);
  assert.equal(parseFirstTime("5:00 PM"), 1020);
  assert.equal(parseFirstTime("15:00"), 900);
  assert.equal(parseFirstTime("10:00"), 600);
  assert.equal(parseFirstTime("12:00 PM"), 720);
  assert.equal(parseFirstTime("12:30 am"), 30);
  assert.equal(parseFirstTime("8 PM"), 1200);
  assert.equal(parseFirstTime("Noon"), 720);
  assert.equal(parseFirstTime("TBD"), null);
  assert.equal(parseFirstTime(null), null);
});

test("state + zone", () => {
  assert.equal(stateFromCity("Billings, MT"), "MT");
  assert.equal(stateFromCity("Saginaw, MI"), "MI");
  assert.equal(stateFromCity("Nowhere"), null);
  assert.equal(timeZoneForState("mi"), "America/Detroit");
  assert.equal(timeZoneForState(null), "America/Los_Angeles");
});

test("wall clock -> UTC across DST", () => {
  assert.equal(iso(wallClockToUtcMs("2026-10-24", 17 * 60, "America/Detroit")), "2026-10-24T21:00:00.000Z"); // EDT
  assert.equal(iso(wallClockToUtcMs("2026-12-05", 17 * 60, "America/Detroit")), "2026-12-05T22:00:00.000Z"); // EST
  assert.equal(iso(wallClockToUtcMs("2026-11-01", 3 * 60, "America/New_York")), "2026-11-01T08:00:00.000Z"); // after fall-back
  assert.equal(iso(wallClockToUtcMs("2026-10-24", 1440, "America/Chicago")), "2026-10-25T05:00:00.000Z");
});

test("The Compound today: no end time -> 9 AM + 8h = 5 PM Eastern", () => {
  const ev = { date: "2026-10-24", startTime: "9:00 AM (gates), 11:00 AM start" };
  assert.equal(iso(eventCloseMs(ev, "MI")), "2026-10-24T21:00:00.000Z");
  assert.equal(isEventClosed(ev, "MI", Date.parse("2026-10-24T20:59:00Z")), false);
  assert.equal(isEventClosed(ev, "MI", Date.parse("2026-10-24T21:00:00Z")), true);
});

test("end time, multi-day, overnight, no times, no date", () => {
  assert.equal(iso(eventCloseMs({ date: "2026-10-25", startTime: "10:00", endTime: "15:00" }, "MT")), "2026-10-25T21:00:00.000Z");
  assert.equal(iso(eventCloseMs({ date: "2026-10-03", endDate: "2026-10-04", startTime: "8:00 AM" }, "TX")), "2026-10-04T21:00:00.000Z");
  assert.equal(iso(eventCloseMs({ date: "2026-10-31", startTime: "8:00 PM", endTime: "2:00 AM" }, "MI")), "2026-11-01T07:00:00.000Z"); // 2 AM is EST: DST ends that night
  assert.equal(iso(eventCloseMs({ date: "2026-11-08" }, "MI")), "2026-11-09T05:00:00.000Z");
  assert.equal(eventCloseMs({}, "MI"), null);
  assert.equal(isEventClosed({}, "MI"), false);
});
