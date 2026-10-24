// When does an event stop taking bookings? (2026-10-24, per Michael)
//   - End time set      -> at the end time on the last day (endDate || date)
//   - Only a start time -> start + 8 hours on the last day
//   - Neither           -> midnight at the end of the last day (old behavior)
// Times are the field's wall clock, in the field's time zone (from its state).
// Times are free text on most events ("5:00 PM", "9:00 AM (gates), 11:00 AM
// start") or "HH:MM" from the owner app's time picker; the first time found
// is used.
//
// SAME FILE lives at atlas-players-app/src/lib/eventClose.js — keep the two
// copies identical (functions/ and src/ don't share modules).
// Tests: node --test functions/eventClose.test.mjs

export const NO_END_TIME_HOURS = 8;

// Majority zone per state. Split states (e.g. western KY/TN, the FL
// panhandle, parts of ID/OR/IN) get their larger zone; a field in the other
// zone closes an hour early or late.
const STATE_TZ = {
  AL: "America/Chicago", AK: "America/Anchorage", AZ: "America/Phoenix", AR: "America/Chicago",
  CA: "America/Los_Angeles", CO: "America/Denver", CT: "America/New_York", DE: "America/New_York",
  DC: "America/New_York", FL: "America/New_York", GA: "America/New_York", HI: "Pacific/Honolulu",
  ID: "America/Boise", IL: "America/Chicago", IN: "America/Indiana/Indianapolis", IA: "America/Chicago",
  KS: "America/Chicago", KY: "America/New_York", LA: "America/Chicago", ME: "America/New_York",
  MD: "America/New_York", MA: "America/New_York", MI: "America/Detroit", MN: "America/Chicago",
  MS: "America/Chicago", MO: "America/Chicago", MT: "America/Denver", NE: "America/Chicago",
  NV: "America/Los_Angeles", NH: "America/New_York", NJ: "America/New_York", NM: "America/Denver",
  NY: "America/New_York", NC: "America/New_York", ND: "America/Chicago", OH: "America/New_York",
  OK: "America/Chicago", OR: "America/Los_Angeles", PA: "America/New_York", RI: "America/New_York",
  SC: "America/New_York", SD: "America/Chicago", TN: "America/Chicago", TX: "America/Chicago",
  UT: "America/Denver", VT: "America/New_York", VA: "America/New_York", WA: "America/Los_Angeles",
  WV: "America/New_York", WI: "America/Chicago", WY: "America/Denver",
};
// Unknown state: assume the latest mainland zone, so we close late, never early.
const FALLBACK_TZ = "America/Los_Angeles";

// "Billings, MT" -> "MT"; also accepts a bare "MT".
export function stateFromCity(city) {
  const m = /(?:^|,\s*)([A-Za-z]{2})\s*$/.exec(String(city || "").trim());
  return m ? m[1].toUpperCase() : null;
}

export function timeZoneForState(state) {
  return STATE_TZ[String(state || "").trim().toUpperCase()] || FALLBACK_TZ;
}

// Minutes after midnight for the first time in a string, or null.
export function parseFirstTime(s) {
  const str = String(s || "");
  const candidates = [];
  const ampm = /(\d{1,2})(?::(\d{2}))?\s*([ap])\.?\s*m\b\.?/gi;
  let m;
  while ((m = ampm.exec(str))) {
    let h = Number(m[1]);
    const min = Number(m[2] || 0);
    if (h < 1 || h > 12 || min > 59) continue;
    if (m[3].toLowerCase() === "p" && h !== 12) h += 12;
    if (m[3].toLowerCase() === "a" && h === 12) h = 0;
    candidates.push({ at: m.index, minutes: h * 60 + min });
  }
  const h24 = /\b(\d{1,2}):(\d{2})\b(?!\s*[ap]\.?\s*m)/gi;
  while ((m = h24.exec(str))) {
    const h = Number(m[1]);
    const min = Number(m[2]);
    if (h > 23 || min > 59) continue;
    candidates.push({ at: m.index, minutes: h * 60 + min });
  }
  if (/\bnoon\b/i.test(str)) candidates.push({ at: str.search(/\bnoon\b/i), minutes: 12 * 60 });
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.at - b.at);
  return candidates[0].minutes;
}

// Offset (ms) of `timeZone` from UTC at instant `utcMs`.
function zoneOffsetMs(utcMs, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}

// UTC ms for wall-clock `minutes` after midnight on `dateStr` (YYYY-MM-DD)
// in `timeZone`. minutes may exceed 1440 (rolls into the next day).
export function wallClockToUtcMs(dateStr, minutes, timeZone) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateStr || ""));
  if (!m) return null;
  const guess = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) + minutes * 60000;
  let ms = guess - zoneOffsetMs(guess, timeZone);
  ms = guess - zoneOffsetMs(ms, timeZone); // second pass settles DST edges
  return ms;
}

// The moment bookings close (UTC ms), or null if the event has no date.
export function eventCloseMs(ev, state) {
  const lastDay = ev?.endDate || ev?.date;
  if (!lastDay) return null;
  const tz = timeZoneForState(state);
  const start = parseFirstTime(ev.startTime);
  const end = parseFirstTime(ev.endTime);
  let minutes;
  if (end != null) {
    // Single-day event ending at/after midnight (e.g. 8 PM - 2 AM).
    minutes = !ev.endDate && start != null && end <= start ? end + 1440 : end;
  } else if (start != null) {
    minutes = start + NO_END_TIME_HOURS * 60;
  } else {
    minutes = 1440;
  }
  return wallClockToUtcMs(lastDay, minutes, tz);
}

export function isEventClosed(ev, state, nowMs = Date.now()) {
  const close = eventCloseMs(ev, state);
  return close != null && nowMs >= close;
}
