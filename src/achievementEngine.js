import { getEventBookingsOnce } from "./hooks/useBookings";

function stateNameFromCityLocal(city, US_STATES) {
  if (!city) return null;
  const match = city.match(/,\s*([A-Z]{2})\s*$/);
  if (match) return US_STATES[match[1]] || null;
  const trimmed = city.trim();
  return Object.values(US_STATES).includes(trimmed) ? trimmed : null;
}

// Best-effort — event start times are free text ("9:00 AM (gates), 11:00
// AM start"), not a structured value. Looks for the first clear hour:minute
// AM/PM pattern and returns it in 24-hour form, or null if nothing parses.
function parseFirstHour24(startTime) {
  if (!startTime) return null;
  const match = startTime.match(/(\d{1,2})(?::\d{2})?\s*(AM|PM)/i);
  if (!match) return null;
  let hour = parseInt(match[1], 10);
  const period = match[2].toUpperCase();
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return hour;
}

function matchesFilter(booking, event, field, filter) {
  if (!filter) return true;
  if (filter.indoorOutdoor && field?.indoorOutdoor !== filter.indoorOutdoor) return false;
  if (filter.eventType && event?.type !== filter.eventType) return false;
  if (filter.fieldId && event?.fieldId !== filter.fieldId) return false;
  if (filter.monthIn) {
    const month = parseInt((event?.date || "").split("-")[1], 10);
    if (!filter.monthIn.includes(month)) return false;
  }
  if (filter.multiDayOrMilsim) {
    const isMultiDay = event?.endDate && event.endDate !== event.date;
    if (!(isMultiDay || event?.type === "MILSIM")) return false;
  }
  if (filter.timeAfterHour != null) {
    const hour = parseFirstHour24(event?.startTime);
    if (hour == null || hour < filter.timeAfterHour) return false;
  }
  if (filter.titleKeywords) {
    const haystack = `${event?.title || ""} ${event?.description || ""}`.toLowerCase();
    if (!filter.titleKeywords.some((kw) => haystack.includes(kw.toLowerCase()))) return false;
  }
  if (filter.dateWindow) {
    const [y, m, d] = (event?.date || "").split("-").map(Number);
    const { startMonth, startDay, endMonth, endDay } = filter.dateWindow;
    const afterStart = m > startMonth || (m === startMonth && d >= startDay);
    const beforeEnd = m < endMonth || (m === endMonth && d <= endDay);
    if (!(afterStart && beforeEnd)) return false;
  }
  if (filter.dateRange) {
    if ((event?.date || "") < filter.dateRange.start || (event?.date || "") > filter.dateRange.end) return false;
  }
  return true;
}

// Longest run of consecutive calendar days with a check-in.
function maxConsecutiveDays(dates) {
  const sorted = [...new Set(dates)].sort();
  if (sorted.length === 0) return 0;
  let run = 1;
  let best = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const cur = new Date(sorted[i]);
    const diffDays = Math.round((cur - prev) / (1000 * 60 * 60 * 24));
    run = diffDays === 1 ? run + 1 : 1;
    if (run > best) best = run;
  }
  return best;
}

// A "weekend" here is a specific Saturday+Sunday calendar pair. Returns the
// longest run of back-to-back weekends (no gap weekend in between) that
// each have at least one check-in.
function maxConsecutiveWeekends(dates) {
  const weekendKeys = new Set();
  dates.forEach((d) => {
    const date = new Date(d + "T00:00:00");
    const day = date.getDay(); // 0 = Sun, 6 = Sat
    if (day === 0 || day === 6) {
      // Key by the Saturday of that weekend, so Sat and the following
      // Sun both map to the same weekend bucket.
      const satOffset = day === 0 ? -1 : 0;
      const sat = new Date(date);
      sat.setDate(sat.getDate() + satOffset);
      weekendKeys.add(sat.toISOString().slice(0, 10));
    }
  });
  const sortedWeekends = [...weekendKeys].sort();
  if (sortedWeekends.length === 0) return 0;
  let run = 1;
  let best = 1;
  for (let i = 1; i < sortedWeekends.length; i++) {
    const prev = new Date(sortedWeekends[i - 1]);
    const cur = new Date(sortedWeekends[i]);
    const diffDays = Math.round((cur - prev) / (1000 * 60 * 60 * 24));
    run = diffDays === 7 ? run + 1 : 1;
    if (run > best) best = run;
  }
  return best;
}

function localTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// "N of this field's events in a row" (2026-10-27, DTB). Walks the field's
// real, already-held events in date order: each one the player checked in to
// extends the run, each one they missed resets it to zero. Canceled, deleted
// and draft events don't count either way. An event dated today only counts
// if they've already checked in (it isn't "missed" until the day is over).
// Returns { best, current }: best = longest run ever (unlock), current = the
// run still alive at the latest held event (progress).
// MIRRORED in atlas-owners-app/src/patchProgress.js — keep both in sync.
export function fieldEventStreak(fieldId, events, checkedInEventIds, today = localTodayStr()) {
  const held = events
    .filter((e) => e.fieldId === fieldId && !e.canceled && !e.deleted && !e.draft)
    .filter((e) => (e.endDate || e.date) < today || (e.date <= today && checkedInEventIds.has(e.id)))
    .sort((a, b) => (a.date === b.date ? (a.startTime || "").localeCompare(b.startTime || "") : a.date.localeCompare(b.date)));
  let run = 0;
  let best = 0;
  for (const e of held) {
    run = checkedInEventIds.has(e.id) ? run + 1 : 0;
    if (run > best) best = run;
  }
  return { best, current: run };
}

// ---------------------------------------------------------------------------
// Owner-built field patches (2026-10-27). Stored at fields/{fieldId}/fieldPatches
// with owner-facing rule templates; each template compiles onto an engine
// trigger with the field's own id forced in, so an owner can only ever write
// rules about their own field. Rule list = OR.
// MIRRORED in atlas-owners-app/src/patchProgress.js — keep both in sync.
export const FIELD_RULE_TYPES = ["checkins", "event_streak", "weekend_streak", "event_type", "night", "keywords", "date_range"];

export function compileFieldRule(rule, fieldId) {
  if (!rule || !fieldId) return null;
  const count = Number(rule.count) || 1;
  switch (rule.type) {
    case "checkins":
      return { type: "field_checkin_count", fieldId, count };
    case "event_streak":
      return { type: "field_event_streak", fieldId, count };
    case "weekend_streak":
      return { type: "consecutive_weekends", weekends: count, filter: { fieldId } };
    case "event_type":
      return { type: "filtered_checkin_count", count, filter: { fieldId, eventType: rule.eventType } };
    case "night":
      return { type: "filtered_checkin_count", count, filter: { fieldId, timeAfterHour: Number(rule.hour) || 20 } };
    case "keywords":
      return { type: "filtered_checkin_count", count, filter: { fieldId, titleKeywords: (rule.keywords || []).filter(Boolean) } };
    case "date_range":
      return { type: "filtered_checkin_count", count, filter: { fieldId, dateRange: { start: rule.start, end: rule.end } } };
    default:
      return null;
  }
}

// A field patch doc -> the same shape as a catalog entry, so the grant pass
// and Active Achievements treat both identically. grantDocId is the doc id
// the granted copy lives at in users/{uid}/patches (field patches dedupe by
// id, not name — owner-chosen names can collide across fields).
export function fieldPatchToEnginePatch(fieldId, fieldPatch) {
  return {
    id: fieldPatch.id,
    name: fieldPatch.name,
    imageUrl: fieldPatch.imageUrl,
    details: fieldPatch.details || null,
    source: "field",
    fieldId,
    fieldPatchId: fieldPatch.id,
    grantDocId: fieldPatch.grantDocId,
    active: fieldPatch.active !== false,
    rules: (fieldPatch.rules || []).map((r) => compileFieldRule(r, fieldId)).filter(Boolean),
  };
}

// Unlock rules for any patch: field patches carry `rules` (OR'd), catalog
// entries a single `trigger` (null = not automatable).
export function patchTriggers(patch) {
  if (Array.isArray(patch.rules)) return patch.rules.filter(Boolean);
  return patch.trigger ? [patch.trigger] : [];
}

// Child profiles (2026-10-27) earn patches from the games they play, but
// they're not accounts: no sign-up date, no referrals, no team membership of
// their own, no walk-on sign-up. These trigger types describe an account, so
// they're dropped for a child — account_created would otherwise be "always
// earned" and team_threshold would read the parent's team.
export const ACCOUNT_ONLY_TRIGGER_TYPES = new Set([
  "account_created",
  "signup_window",
  "walkon_flagged_booking",
  "team_joined",
  "referral_count",
  "team_threshold_any_event",
]);

// The same patch with only the rules a child can meet (as a `rules` array,
// which patchTriggers prefers). No rules left = never unlocks for a child.
export function childEligiblePatch(patch) {
  return { ...patch, rules: patchTriggers(patch).filter((t) => t && !ACCOUNT_ONLY_TRIGGER_TYPES.has(t.type)) };
}

function buildContext({ myBookings, events, fields }) {
  const checkedIn = myBookings
    .filter((b) => b.checkedIn)
    .map((b) => {
      const event = events.find((e) => e.id === b.eventId);
      const field = fields.find((f) => f.id === event?.fieldId);
      return { booking: b, event, field };
    })
    .filter((x) => x.event);
  const checkedInEventIds = new Set(checkedIn.map((x) => x.event.id));
  return { checkedIn, checkedInEventIds };
}

function checkinsMatching(checkedIn, filter) {
  return filter ? checkedIn.filter((x) => matchesFilter(x.booking, x.event, x.field, filter)) : checkedIn;
}

// { current, target, label } for one trigger, or null if the trigger has no
// meaningful progress to show (one-off moments, or a window that's closed).
// Shared by the unlock check below, so a progress bar can never say 10/10
// while the patch stays locked.
function triggerProgress(trigger, { checkedIn, checkedInEventIds, myBookings, events, fields, profile, US_STATES, today }) {
  switch (trigger.type) {
    case "team_joined":
      return { current: profile?.teamId ? 1 : 0, target: 1, label: "team joined" };
    case "referral_count":
      return { current: profile?.referralCount || 0, target: trigger.count, label: "referrals" };
    case "total_checkin_count":
      return { current: checkedIn.length, target: trigger.count, label: "check-ins" };
    // Counts bookings (not check-ins) on events at a claimed field, i.e.
    // one with an ownerId. Every users/{uid}/bookings doc is written
    // server-side only (bookFreeEvent, bookEventWithVoucher, or the
    // Stripe webhook after payment succeeds), so an abandoned checkout
    // never shows up here. New bookings on unclaimed fields are already
    // refused server-side; this filter is for older ones made before
    // that gate existed. Evaluated on every app load, so it also grants
    // retroactively to anyone who already booked.
    case "claimed_field_booking_count": {
      const claimedBookings = myBookings.filter((b) => {
        const fieldId = b.fieldId || events.find((e) => e.id === b.eventId)?.fieldId;
        return !!fields.find((f) => f.id === fieldId)?.ownerId;
      });
      return { current: claimedBookings.length, target: trigger.count, label: "bookings" };
    }
    case "field_checkin_count":
      return { current: checkedIn.filter((x) => x.event.fieldId === trigger.fieldId).length, target: trigger.count, label: "games" };
    case "field_event_streak": {
      const { current } = fieldEventStreak(trigger.fieldId, events, checkedInEventIds, today);
      return { current, target: trigger.count, label: "events in a row" };
    }
    case "single_field_checkin_count": {
      const counts = {};
      // Atlas Major events have no field (fieldId null) — they are not a repeat
      // visit to one place, so they must not pile up under one shared key.
      checkedIn.forEach((x) => { if (!x.event.fieldId) return; counts[x.event.fieldId] = (counts[x.event.fieldId] || 0) + 1; });
      return { current: Math.max(0, ...Object.values(counts)), target: trigger.count, label: "games at one field" };
    }
    case "distinct_fields_count": {
      const matching = checkinsMatching(checkedIn, trigger.filter);
      return { current: new Set(matching.map((x) => x.event.fieldId).filter(Boolean)).size, target: trigger.count, label: "fields" };
    }
    case "filtered_checkin_count": {
      // A fixed date range that has already closed can't be progressed.
      if (trigger.filter?.dateRange?.end && trigger.filter.dateRange.end < today) return null;
      return { current: checkinsMatching(checkedIn, trigger.filter).length, target: trigger.count, label: "qualifying games" };
    }
    case "consecutive_calendar_days":
      return { current: maxConsecutiveDays(checkedIn.map((x) => x.event.date)), target: trigger.days, label: "days in a row" };
    case "consecutive_weekends":
      return {
        current: maxConsecutiveWeekends(checkinsMatching(checkedIn, trigger.filter).map((x) => x.event.date)),
        target: trigger.weekends,
        label: "weekends in a row",
      };
    case "distinct_states_count": {
      const states = new Set(
        checkedIn.map((x) => stateNameFromCityLocal(
          x.field?.city || (x.event.isMajor && x.event.venueState ? `${x.event.venueCity || ""}, ${x.event.venueState}` : null),
          US_STATES
        )).filter(Boolean)
      );
      return { current: states.size, target: trigger.count, label: "states" };
    }
    case "early_checkin": {
      const done = checkedIn.some((x) => {
        if (!x.event.briefingTime || !x.booking.checkedInAt?.toDate) return false;
        const briefingAt = new Date(`${x.event.date}T${x.event.briefingTime}:00`);
        const minutesEarly = (briefingAt - x.booking.checkedInAt.toDate()) / (1000 * 60);
        return minutesEarly >= trigger.minutesBefore;
      });
      return { current: done ? 1 : 0, target: 1, label: "early check-in" };
    }
    default:
      // account_created (always earned), signup_window / walkon_flagged_booking
      // (one-time moments), team_threshold_any_event (needs extra reads).
      return null;
  }
}

async function triggerQualifies(trigger, ctx) {
  switch (trigger.type) {
    case "account_created":
      return true;
    case "signup_window": {
      const createdAt = ctx.profile?.createdAt?.toDate ? ctx.profile.createdAt.toDate() : null;
      if (!createdAt) return false;
      const iso = createdAt.toISOString().slice(0, 10);
      return iso >= trigger.start && iso < trigger.end;
    }
    // Doesn't filter on checkedIn like the others — the moment this is
    // rewarding (signing up on the spot, before the counter) already
    // happened at booking time, upstream in bookFreeEvent; waiting for
    // a later check-in would test the wrong thing.
    case "walkon_flagged_booking":
      return ctx.myBookings.some((b) => b.walkOnEligible === true);
    case "team_threshold_any_event": {
      if (!ctx.profile?.teamId) return false;
      for (const x of ctx.checkedIn) {
        const eventBookings = await getEventBookingsOnce(x.event.id);
        // guardianPlaying:false = a parent's child-only booking; the
        // parent (and their team) didn't actually play.
        const teammatesCheckedIn = eventBookings.filter((b) => b.checkedIn && b.teamId === ctx.profile.teamId && b.guardianPlaying !== false).length;
        if (teammatesCheckedIn >= trigger.count) return true;
      }
      return false;
    }
    case "field_event_streak":
      return fieldEventStreak(trigger.fieldId, ctx.events, ctx.checkedInEventIds, ctx.today).best >= trigger.count;
    default: {
      // Unlock uses the same count the progress bar shows. (A closed date
      // range returns null for progress but can still be met historically,
      // so it's re-counted directly here.)
      if (trigger.type === "filtered_checkin_count") {
        return checkinsMatching(ctx.checkedIn, trigger.filter).length >= trigger.count;
      }
      const p = triggerProgress(trigger, ctx);
      return !!p && p.current >= p.target;
    }
  }
}

// Returns the subset of `catalog` (catalog entries and/or field patches run
// through fieldPatchToEnginePatch) that this player newly qualifies for.
// Doesn't check whether they already own it — that dedup happens in the
// caller, same as the existing check-in/team-threshold grant logic.
export async function evaluateAchievements({ catalog, myBookings, events, fields, profile, US_STATES }) {
  const ctx = { ...buildContext({ myBookings, events, fields }), myBookings, events, fields, profile, US_STATES, today: localTodayStr() };
  const earned = [];
  for (const patch of catalog) {
    if (patch.active === false) continue; // a retired field patch stops unlocking
    for (const trigger of patchTriggers(patch)) {
      if (await triggerQualifies(trigger, ctx)) {
        earned.push(patch);
        break; // rules are OR'd
      }
    }
  }
  return earned;
}

// Active Achievements (2026-10-27): every un-owned patch that has at least
// one progressable rule, with one progress path per rule (OR'd — e.g. DTB's
// "events in a row" and "games"). Sorted closest-to-unlock first; one-shot
// patches (every path's target is 1) go last so seasonal "check in to one
// themed event" entries don't crowd the top. `isOwned(patch)` is supplied by
// the caller (catalog dedupes by name, field patches by grantDocId).
export function achievementProgress({ patches, isOwned, myBookings, events, fields, profile, US_STATES }) {
  const ctx = { ...buildContext({ myBookings, events, fields }), myBookings, events, fields, profile, US_STATES, today: localTodayStr() };
  const rows = [];
  for (const patch of patches) {
    if (patch.active === false || isOwned(patch)) continue;
    const paths = patchTriggers(patch)
      .map((t) => triggerProgress(t, ctx))
      .filter(Boolean)
      .map((p) => ({ ...p, current: Math.min(p.current, p.target), remaining: Math.max(0, p.target - p.current) }));
    if (paths.length === 0) continue;
    const ratio = Math.max(...paths.map((p) => (p.target > 0 ? p.current / p.target : 0)));
    const oneShot = paths.every((p) => p.target <= 1);
    rows.push({ patch, paths, ratio, oneShot });
  }
  rows.sort((a, b) => (a.oneShot !== b.oneShot ? (a.oneShot ? 1 : -1) : b.ratio - a.ratio));
  return rows;
}
