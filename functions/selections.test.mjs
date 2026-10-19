import test from "node:test";
import assert from "node:assert/strict";
import {
  SelectionError, resolveSelections, normalizeSelectionGroups, takenSeats, assertCapacity,
  snapshotSelections, selectionPairs,
} from "./selections.js";

// Verbatim copy of the pre-Phase-2 resolveEntryPrice (HttpsError swapped
// for Error) — the legacy path must match it exactly.
function oldResolveEntryPrice(eventData, selectedChoiceId) {
  const basePriceCents = Math.round(parseFloat(String(eventData.price || "").replace(/[^0-9.]/g, "")) * 100) || 0;
  const priceOptions = eventData.priceOptions;
  let selectedChoice = null;
  if (priceOptions?.choices?.length) {
    selectedChoice = priceOptions.choices.find((c) => c.id === selectedChoiceId) || null;
    if (priceOptions.required && !selectedChoice) {
      throw new Error(`Choose a valid ${priceOptions.label || "option"} before booking.`);
    }
    if (selectedChoiceId && !selectedChoice) {
      throw new Error("That option isn't available for this event anymore.");
    }
  }
  return { entryPriceCents: basePriceCents + (selectedChoice?.priceCents || 0), selectedChoice };
}

const legacyEvents = [
  { price: "$40" },
  { price: null },
  { price: "Price varies" },
  { price: "25.50", priceOptions: { label: "Class", required: true, choices: [{ id: "ar", label: "AR", priceCents: 2000 }, { id: "lmg", label: "LMG", priceCents: 3000 }] } },
  { price: "$20", priceOptions: { label: "", required: false, choices: [{ id: "a", label: "A", priceCents: 500 }] } },
  { priceOptions: { label: "BB", required: true, choices: [] } },
];

test("legacy events: identical result or error to the old resolveEntryPrice", () => {
  for (const ev of legacyEvents) {
    for (const id of [undefined, null, "", "ar", "lmg", "a", "bogus"]) {
      let oldR, oldE, newR, newE;
      try { oldR = oldResolveEntryPrice(ev, id); } catch (e) { oldE = e.message; }
      try { newR = resolveSelections(ev, { selectedChoiceId: id }); } catch (e) { newE = e.message; assert.ok(e instanceof SelectionError); }
      assert.equal(newE, oldE, JSON.stringify([ev, id]));
      if (!oldE) {
        assert.equal(newR.entryPriceCents, oldR.entryPriceCents);
        assert.deepEqual(newR.selectedChoice, oldR.selectedChoice);
        assert.equal(newR.grouped, false);
        assert.deepEqual(newR.selections, []);
      }
    }
  }
});

test("legacy event ignores a stray selections map", () => {
  const ev = legacyEvents[3];
  const r = resolveSelections(ev, { selectedChoiceId: "ar", selections: { team: "x" } });
  assert.equal(r.entryPriceCents, 4550);
});

const wombats = {
  price: "$40",
  selectionGroups: [
    { id: "team", label: "Team", required: true, choices: [{ id: "g", label: "Green", priceCents: 0, capacity: 2 }, { id: "r", label: "Red", priceCents: 0, capacity: null }] },
    { id: "role", label: "Role", required: false, choices: [{ id: "med", label: "Medic", priceCents: 500, capacity: 1 }, { id: "rifle", label: "Rifleman", priceCents: 0 }] },
  ],
};

test("grouped: sums prices, joins labels", () => {
  const r = resolveSelections(wombats, { selections: { team: "g", role: "med" } });
  assert.equal(r.entryPriceCents, 4500);
  assert.equal(r.selectedChoice.label, "Green / Medic");
  assert.equal(r.selectedChoice.priceCents, 500);
  assert.equal(r.selections.length, 2);
  assert.equal(r.grouped, true);
});

test("grouped: optional group may be skipped; required may not", () => {
  const r = resolveSelections(wombats, { selections: { team: "r" } });
  assert.equal(r.entryPriceCents, 4000);
  assert.equal(r.selections.length, 1);
  assert.throws(() => resolveSelections(wombats, { selections: { role: "med" } }), /Choose a valid Team/);
  assert.throws(() => resolveSelections(wombats, {}), /Choose a valid Team/);
  assert.throws(() => resolveSelections(wombats, { selections: "nope" }), /Choose a valid Team/);
});

test("grouped: unknown group / choice / non-string id rejected", () => {
  assert.throws(() => resolveSelections(wombats, { selections: { team: "g", ghost: "x" } }), /isn't available/);
  assert.throws(() => resolveSelections(wombats, { selections: { team: "zzz" } }), /isn't available/);
  assert.throws(() => resolveSelections(wombats, { selections: { team: ["g"] } }), /isn't available/);
});

test("grouped: client-sent prices are never trusted (only ids read)", () => {
  const r = resolveSelections(wombats, { selections: { team: "g", role: "rifle" }, selectedChoiceId: "med" });
  assert.equal(r.entryPriceCents, 4000);
});

test("normalizeSelectionGroups ignores junk", () => {
  assert.deepEqual(normalizeSelectionGroups({ selectionGroups: [null, { id: "x", choices: [] }, { choices: [{}] }] }), []);
  assert.deepEqual(normalizeSelectionGroups({}), []);
  // empty selectionGroups falls back to the legacy path
  const r = resolveSelections({ price: "$10", selectionGroups: [], priceOptions: null }, {});
  assert.equal(r.entryPriceCents, 1000);
});

const bk = (g, c, n) => ({ selections: [{ groupId: "team", choiceId: g }, { groupId: "role", choiceId: c }], attendeeCount: n });

test("takenSeats counts heads, defaults a missing attendeeCount to 1", () => {
  const docs = [bk("g", "med", 2), bk("g", "rifle", undefined), bk("r", "rifle", 3), { attendeeCount: 5 }];
  assert.equal(takenSeats(docs, "team", "g"), 3);
  assert.equal(takenSeats(docs, "team", "r"), 3);
  assert.equal(takenSeats(docs, "role", "med"), 2);
  assert.equal(takenSeats([], "team", "g"), 0);
});

test("capacity: 2 of 2 taken blocks one more head", () => {
  const r = resolveSelections(wombats, { selections: { team: "g" } });
  assert.throws(() => assertCapacity(wombats, r, [bk("g", "rifle", 2)], 1), /Green is full/);
});

test("capacity: party of 3 into 2 remaining blocks, party of 2 fits", () => {
  const ev = { ...wombats, selectionGroups: [{ ...wombats.selectionGroups[0], choices: [{ id: "g", label: "Green", priceCents: 0, capacity: 5 }] }] };
  const r = resolveSelections(ev, { selections: { team: "g" } });
  const docs = [bk("g", "x", 3)];
  assert.throws(() => assertCapacity(ev, r, docs, 3), /Only 2 spots left on Green/);
  assert.doesNotThrow(() => assertCapacity(ev, r, docs, 2));
});

test("capacity: removed bookings free seats; null capacity is unlimited", () => {
  const r = resolveSelections(wombats, { selections: { team: "g" } });
  assert.doesNotThrow(() => assertCapacity(wombats, r, [bk("g", "x", 1)], 1)); // 1 of 2 taken
  const red = resolveSelections(wombats, { selections: { team: "r" } });
  assert.doesNotThrow(() => assertCapacity(wombats, red, Array.from({ length: 500 }, () => bk("r", "x", 4)), 4));
});

test("capacity: any one full choice blocks the whole booking", () => {
  const r = resolveSelections(wombats, { selections: { team: "r", role: "med" } });
  assert.throws(() => assertCapacity(wombats, r, [bk("r", "med", 1)], 1), /Medic is full/);
});

test("capacity is a no-op for legacy events", () => {
  const r = resolveSelections(legacyEvents[3], { selectedChoiceId: "ar" });
  assert.doesNotThrow(() => assertCapacity(legacyEvents[3], r, [], 1));
});

test("metadata round-trip: ids -> snapshot, unknown ids dropped", () => {
  const r = resolveSelections(wombats, { selections: { team: "g", role: "med" } });
  const pairs = selectionPairs(r.selections);
  assert.ok(JSON.stringify(pairs).length < 500);
  assert.deepEqual(snapshotSelections(wombats, pairs), r.selections);
  assert.deepEqual(snapshotSelections(wombats, [{ g: "team", c: "gone" }, { g: "nope", c: "g" }, null]), []);
  assert.deepEqual(snapshotSelections(wombats, undefined), []);
});
