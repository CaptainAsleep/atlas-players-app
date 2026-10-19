// Booking-time selections: pure logic, no Firebase imports, so it can be
// unit-tested with `node --test functions/selections.test.mjs`.
//
// Two shapes of event data are understood:
//  - LEGACY (every field-owner event): one optional `priceOptions` group
//    { label, required, choices: [{ id, label, priceCents }] }. Behaves
//    byte-for-byte as resolveEntryPrice always has.
//  - GROUPED (organizer / Major events): `selectionGroups`, any number of
//    groups { id, label, required, choices: [{ id, label, priceCents,
//    capacity|null }] } — team, role, attendee type, class, etc. One
//    choice per group, for the whole party.
//
// Errors are SelectionError (with a Firebase-style `code`); index.js maps
// them onto HttpsError so this file never needs firebase-functions.

export class SelectionError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "SelectionError";
    this.code = code;
  }
}

export function basePriceCentsOf(eventData) {
  return Math.round(parseFloat(String(eventData?.price || "").replace(/[^0-9.]/g, "")) * 100) || 0;
}

// Grouped events only. A legacy event (or one with no groups) returns [].
export function normalizeSelectionGroups(eventData) {
  const groups = eventData?.selectionGroups;
  if (!Array.isArray(groups)) return [];
  return groups.filter((g) => g && g.id && Array.isArray(g.choices) && g.choices.length > 0);
}

export function isGroupedEvent(eventData) {
  return normalizeSelectionGroups(eventData).length > 0;
}

function resolveLegacy(eventData, selectedChoiceId) {
  const basePriceCents = basePriceCentsOf(eventData);
  const priceOptions = eventData.priceOptions;
  let selectedChoice = null;
  if (priceOptions?.choices?.length) {
    selectedChoice = priceOptions.choices.find((c) => c.id === selectedChoiceId) || null;
    if (priceOptions.required && !selectedChoice) {
      throw new SelectionError("invalid-argument", `Choose a valid ${priceOptions.label || "option"} before booking.`);
    }
    if (selectedChoiceId && !selectedChoice) {
      throw new SelectionError("invalid-argument", "That option isn't available for this event anymore.");
    }
  }
  return { entryPriceCents: basePriceCents + (selectedChoice?.priceCents || 0), selectedChoice, selections: [], grouped: false };
}

// `picks` is the client's { groupId: choiceId } map. Only ids are trusted;
// labels and prices come from the stored event.
function resolveGrouped(eventData, groups, picks) {
  const chosen = picks && typeof picks === "object" && !Array.isArray(picks) ? picks : {};
  for (const gid of Object.keys(chosen)) {
    if (!groups.some((g) => g.id === gid)) {
      throw new SelectionError("invalid-argument", "That option isn't available for this event anymore.");
    }
  }
  const selections = [];
  for (const g of groups) {
    const cid = chosen[g.id];
    if (cid === undefined || cid === null || cid === "") {
      if (g.required) throw new SelectionError("invalid-argument", `Choose a valid ${g.label || "option"} before booking.`);
      continue;
    }
    const choice = typeof cid === "string" ? g.choices.find((c) => c.id === cid) : null;
    if (!choice) throw new SelectionError("invalid-argument", "That option isn't available for this event anymore.");
    selections.push({
      groupId: g.id,
      groupLabel: g.label || "",
      choiceId: choice.id,
      choiceLabel: choice.label || "",
      priceCents: typeof choice.priceCents === "number" && choice.priceCents > 0 ? Math.round(choice.priceCents) : 0,
    });
  }
  const choiceTotal = selections.reduce((sum, s) => sum + s.priceCents, 0);
  // Compat object for callers written against the legacy single choice:
  // the labels joined, the prices summed.
  const selectedChoice = selections.length > 0
    ? { label: selections.map((s) => s.choiceLabel).join(" / "), priceCents: choiceTotal }
    : null;
  return { entryPriceCents: basePriceCentsOf(eventData) + choiceTotal, selectedChoice, selections, grouped: true };
}

export function resolveSelections(eventData, { selectedChoiceId, selections } = {}) {
  const groups = normalizeSelectionGroups(eventData);
  return groups.length > 0 ? resolveGrouped(eventData, groups, selections) : resolveLegacy(eventData, selectedChoiceId);
}

// Seats already taken by a choice: every head in every booking that picked
// it. `bookingDocs` are plain booking-doc data objects.
export function takenSeats(bookingDocs, groupId, choiceId) {
  let taken = 0;
  for (const b of bookingDocs || []) {
    if (!Array.isArray(b?.selections)) continue;
    if (b.selections.some((s) => s.groupId === groupId && s.choiceId === choiceId)) {
      taken += Math.max(1, Number(b.attendeeCount) || 1);
    }
  }
  return taken;
}

// Throws if any picked choice with a numeric `capacity` can't take
// `attendeeCount` more heads. `resolved` is resolveSelections' result.
export function assertCapacity(eventData, resolved, bookingDocs, attendeeCount) {
  if (!resolved?.grouped) return;
  const groups = normalizeSelectionGroups(eventData);
  const heads = Math.max(1, Number(attendeeCount) || 1);
  for (const s of resolved.selections) {
    const choice = groups.find((g) => g.id === s.groupId)?.choices.find((c) => c.id === s.choiceId);
    const cap = choice?.capacity;
    if (typeof cap !== "number" || !(cap >= 0)) continue;
    const taken = takenSeats(bookingDocs, s.groupId, s.choiceId);
    if (taken + heads > cap) {
      const left = Math.max(0, cap - taken);
      throw new SelectionError(
        "failed-precondition",
        left === 0
          ? `${s.choiceLabel} is full. Pick another ${s.groupLabel || "option"}.`
          : `Only ${left} spot${left === 1 ? "" : "s"} left on ${s.choiceLabel} — not enough for your party of ${heads}.`
      );
    }
  }
}

// Re-derive the booking-doc snapshot from ids alone (Stripe metadata
// carries only ids). Unknown ids are dropped — the paid webhook never
// rejects a payment that already went through.
export function snapshotSelections(eventData, pairs) {
  const groups = normalizeSelectionGroups(eventData);
  const out = [];
  for (const p of Array.isArray(pairs) ? pairs : []) {
    const g = groups.find((x) => x.id === p?.g);
    const c = g?.choices.find((x) => x.id === p?.c);
    if (!g || !c) continue;
    out.push({
      groupId: g.id, groupLabel: g.label || "", choiceId: c.id, choiceLabel: c.label || "",
      priceCents: typeof c.priceCents === "number" && c.priceCents > 0 ? Math.round(c.priceCents) : 0,
    });
  }
  return out;
}

export function selectionPairs(selections) {
  return (selections || []).map((s) => ({ g: s.groupId, c: s.choiceId }));
}
