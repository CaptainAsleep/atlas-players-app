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

function hasConsecutiveDays(dates, requiredRun) {
  const sorted = [...new Set(dates)].sort();
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const cur = new Date(sorted[i]);
    const diffDays = Math.round((cur - prev) / (1000 * 60 * 60 * 24));
    run = diffDays === 1 ? run + 1 : 1;
    if (run >= requiredRun) return true;
  }
  return requiredRun <= 1 && sorted.length >= 1;
}

// A "weekend" here is a specific Saturday+Sunday calendar pair. Returns
// true if the player has at least one check-in within each of N such
// weekends, and those weekends are themselves consecutive (no gap
// weekend in between).
function hasConsecutiveWeekends(dates, requiredWeekends) {
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
  let run = 1;
  for (let i = 1; i < sortedWeekends.length; i++) {
    const prev = new Date(sortedWeekends[i - 1]);
    const cur = new Date(sortedWeekends[i]);
    const diffDays = Math.round((cur - prev) / (1000 * 60 * 60 * 24));
    run = diffDays === 7 ? run + 1 : 1;
    if (run >= requiredWeekends) return true;
  }
  return requiredWeekends <= 1 && sortedWeekends.length >= 1;
}

// Returns the subset of the catalog that this player newly qualifies for.
// Doesn't check whether they already own it — that dedup happens in the
// caller, same as the existing check-in/team-threshold grant logic.
export async function evaluateAchievements({ catalog, myBookings, events, fields, profile, US_STATES }) {
  const checkedIn = myBookings
    .filter((b) => b.checkedIn)
    .map((b) => {
      const event = events.find((e) => e.id === b.eventId);
      const field = fields.find((f) => f.id === event?.fieldId);
      return { booking: b, event, field };
    })
    .filter((x) => x.event);

  const earned = [];

  for (const patch of catalog) {
    const trigger = patch.trigger;
    if (!trigger) continue; // catalog-only, not automatable yet

    let qualifies = false;

    switch (trigger.type) {
      case "account_created": {
        qualifies = true;
        break;
      }
      case "team_joined": {
        qualifies = !!profile?.teamId;
        break;
      }
      case "signup_window": {
        const createdAt = profile?.createdAt?.toDate ? profile.createdAt.toDate() : null;
        if (createdAt) {
          const iso = createdAt.toISOString().slice(0, 10);
          qualifies = iso >= trigger.start && iso < trigger.end;
        }
        break;
      }
      case "referral_count": {
        qualifies = (profile?.referralCount || 0) >= trigger.count;
        break;
      }
      case "total_checkin_count": {
        qualifies = checkedIn.length >= trigger.count;
        break;
      }
      case "field_checkin_count": {
        qualifies = checkedIn.filter((x) => x.event.fieldId === trigger.fieldId).length >= trigger.count;
        break;
      }
      case "single_field_checkin_count": {
        const counts = {};
        checkedIn.forEach((x) => { counts[x.event.fieldId] = (counts[x.event.fieldId] || 0) + 1; });
        qualifies = Object.values(counts).some((c) => c >= trigger.count);
        break;
      }
      case "distinct_fields_count": {
        const matching = trigger.filter
          ? checkedIn.filter((x) => matchesFilter(x.booking, x.event, x.field, trigger.filter))
          : checkedIn;
        qualifies = new Set(matching.map((x) => x.event.fieldId)).size >= trigger.count;
        break;
      }
      case "filtered_checkin_count": {
        qualifies = checkedIn.filter((x) => matchesFilter(x.booking, x.event, x.field, trigger.filter)).length >= trigger.count;
        break;
      }
      case "consecutive_calendar_days": {
        qualifies = hasConsecutiveDays(checkedIn.map((x) => x.event.date), trigger.days);
        break;
      }
      case "consecutive_weekends": {
        qualifies = hasConsecutiveWeekends(checkedIn.map((x) => x.event.date), trigger.weekends);
        break;
      }
      case "distinct_states_count": {
        const states = new Set(
          checkedIn.map((x) => stateNameFromCityLocal(x.field?.city, US_STATES)).filter(Boolean)
        );
        qualifies = states.size >= trigger.count;
        break;
      }
      case "early_checkin": {
        qualifies = checkedIn.some((x) => {
          if (!x.event.briefingTime || !x.booking.checkedInAt?.toDate) return false;
          const briefingAt = new Date(`${x.event.date}T${x.event.briefingTime}:00`);
          const checkedInAt = x.booking.checkedInAt.toDate();
          const minutesEarly = (briefingAt - checkedInAt) / (1000 * 60);
          return minutesEarly >= trigger.minutesBefore;
        });
        break;
      }
      case "team_threshold_any_event": {
        if (profile?.teamId) {
          for (const x of checkedIn) {
            const eventBookings = await getEventBookingsOnce(x.event.id);
            const teammatesCheckedIn = eventBookings.filter((b) => b.checkedIn && b.teamId === profile.teamId).length;
            if (teammatesCheckedIn >= trigger.count) {
              qualifies = true;
              break;
            }
          }
        }
        break;
      }
      default:
        break;
    }

    if (qualifies) earned.push(patch);
  }

  return earned;
}
