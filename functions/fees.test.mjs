import test from "node:test";
import assert from "node:assert/strict";
import { computeStandardFee, cardProcessingCents, passedFeeCents } from "./fees.js";

// Copy of computeBookingFeeCents from index.js.
function bookingFee(entry, chargeable, n, uncapped) {
  const per = entry > 0 ? computeStandardFee(entry, uncapped) : 0;
  return (n - 1) * per + computeStandardFee(chargeable, uncapped);
}

test("processing estimate: $40 ticket", () => {
  assert.equal(computeStandardFee(4000, true), 270);
  assert.equal(cardProcessingCents(4000, true), 146);
});

test("split: $40 Major, solo — player pays $1.46, organizer absorbs $1.24", () => {
  const fee = bookingFee(4000, 4000, 1, true);
  const passed = passedFeeCents({ model: "split_processing", entryPriceCents: 4000, chargeableCents: 4000, attendeeCount: 1, uncapped: true, bookingFeeCents: fee });
  assert.equal(passed, 146);
  assert.equal(fee - passed, 124);
});

test("split: party of 3 with rentals mirrors the fee structure", () => {
  const fee = bookingFee(4000, 6000, 3, true);
  const passed = passedFeeCents({ model: "split_processing", entryPriceCents: 4000, chargeableCents: 6000, attendeeCount: 3, uncapped: true, bookingFeeCents: fee });
  assert.equal(passed, 2 * 146 + (Math.round(6000 * 0.029) + 30));
  assert.ok(passed < fee);
});

test("pass and absorb are unchanged", () => {
  const fee = bookingFee(4000, 4000, 2, true);
  assert.equal(passedFeeCents({ model: "pass_to_player", entryPriceCents: 4000, chargeableCents: 4000, attendeeCount: 2, uncapped: true, bookingFeeCents: fee }), fee);
  assert.equal(passedFeeCents({ model: "absorb", entryPriceCents: 4000, chargeableCents: 4000, attendeeCount: 2, uncapped: true, bookingFeeCents: fee }), 0);
});

test("free entry + paid rentals: no per-ticket part for extras", () => {
  assert.equal(passedFeeCents({ model: "split_processing", entryPriceCents: 0, chargeableCents: 2000, attendeeCount: 3, uncapped: true, bookingFeeCents: 200 }), Math.round(2000 * 0.029) + 30);
  assert.equal(cardProcessingCents(0, true), 0);
});

test("capped fee: processing never exceeds the fee", () => {
  assert.equal(cardProcessingCents(20000, false), 500);
  assert.equal(cardProcessingCents(4000, false), 146);
});

test("split never exceeds the full fee across prices", () => {
  for (const cents of [100, 500, 1000, 2500, 4000, 9999, 15000, 50000]) {
    const fee = bookingFee(cents, cents, 2, true);
    const p = passedFeeCents({ model: "split_processing", entryPriceCents: cents, chargeableCents: cents, attendeeCount: 2, uncapped: true, bookingFeeCents: fee });
    assert.ok(p > 0 && p < fee, `${cents}: ${p} vs ${fee}`);
  }
});
