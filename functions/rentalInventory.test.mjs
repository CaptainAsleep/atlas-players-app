import test from "node:test";
import assert from "node:assert/strict";
import { stockOf, maxPerPersonOf, qtyOf, normalizeRentalPicks, countBookedRentals, countHeldRentals, assertRentalStock, samePicks, RENTAL_HOLD_GRACE_MS } from "./rentalInventory.js";

const catalog = [
  { id: "kit", name: "Rental Kit", priceCents: 3000, quantity: 12, maxPerPerson: 1 },
  { id: "mag", name: "Mid-Cap Magazine", priceCents: 500, quantity: 6, maxPerPerson: 3 },
  { id: "bbs", name: "BBs", priceCents: 1000 },
];

test("defaults keep old catalogs working", () => {
  assert.equal(stockOf(catalog[2]), null);
  assert.equal(maxPerPersonOf(catalog[2]), 1);
  assert.equal(stockOf({ quantity: 0 }), 0);
  assert.equal(qtyOf({}), 1);
  assert.equal(qtyOf({ qty: 3 }), 3);
});

test("normalizeRentalPicks: new shape, legacy ids, merging, validation", () => {
  assert.deepEqual(normalizeRentalPicks([{ id: "mag", qty: 2 }, { id: "mag", qty: 1 }], null), [{ id: "mag", qty: 3 }]);
  assert.deepEqual(normalizeRentalPicks(null, ["kit", "bbs"]), [{ id: "kit", qty: 1 }, { id: "bbs", qty: 1 }]);
  assert.deepEqual(normalizeRentalPicks(null, null), []);
  assert.throws(() => normalizeRentalPicks([{ id: "kit", qty: 0 }]), /quantity/);
  assert.throws(() => normalizeRentalPicks([{ id: "kit", qty: 1.5 }]), /quantity/);
  assert.throws(() => normalizeRentalPicks([{ qty: 1 }]), /id/);
});

test("counting booked + held (own hold and expired holds excluded)", () => {
  const used = countBookedRentals([{ selectedRentals: [{ id: "mag", qty: 2 }, { id: "kit" }] }, { selectedRentals: [{ id: "mag", qty: 1 }] }, {}]);
  assert.deepEqual(used, { mag: 3, kit: 1 });
  const now = 1_000_000;
  const holds = [
    { uid: "a", expiresAtMs: now + 60_000, items: [{ id: "mag", qty: 2 }] },
    { uid: "me", expiresAtMs: now + 60_000, items: [{ id: "mag", qty: 3 }] },
    { uid: "b", expiresAtMs: now - RENTAL_HOLD_GRACE_MS - 1, items: [{ id: "mag", qty: 5 }] },
    { uid: "c", expiresAtMs: now - 1000, items: [{ id: "kit", qty: 1 }] },
  ];
  assert.deepEqual(countHeldRentals(holds, now, "me"), { mag: 2, kit: 1 });
});

test("assertRentalStock", () => {
  assert.doesNotThrow(() => assertRentalStock(catalog, [{ id: "mag", qty: 1 }], { mag: 3 }, { mag: 2 }));
  assert.throws(() => assertRentalStock(catalog, [{ id: "mag", qty: 2 }], { mag: 3 }, { mag: 2 }), /Only 1 Mid-Cap Magazine left/);
  assert.throws(() => assertRentalStock(catalog, [{ id: "mag", qty: 1 }], { mag: 6 }, {}), /sold out/);
  assert.throws(() => assertRentalStock(catalog, [{ id: "kit", qty: 3 }], { kit: 10 }, {}), /Only 2 Rental Kits left/);
  assert.doesNotThrow(() => assertRentalStock(catalog, [{ id: "bbs", qty: 40 }], { bbs: 999 }, {}));
});

test("samePicks ignores order", () => {
  assert.ok(samePicks([{ id: "a", qty: 1 }, { id: "b", qty: 2 }], [{ id: "b", qty: 2 }, { id: "a" }]));
  assert.ok(!samePicks([{ id: "a", qty: 1 }], [{ id: "a", qty: 2 }]));
});
