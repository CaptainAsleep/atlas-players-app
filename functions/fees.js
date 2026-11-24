// Atlas fee helpers (pure, no Firebase imports) so they can be unit-tested
// with `node --test functions/fees.test.mjs`.
//
// Atlas's fee is 3.5% + $1.30 per ticket (capped at $5 on field events,
// uncapped on Majors). It already covers Stripe's card processing, which
// Atlas pays. The split option (2026-11-24, Major events) lets the
// organizer absorb Atlas's platform part while the player pays an
// estimate of card processing: 2.9% + $0.30 per ticket. Atlas collects the
// same total fee under every model; only who pays which part changes.

export const FEE_MODELS = ["pass_to_player", "split_processing", "absorb"];

export function computeStandardFee(entryPriceCents, uncapped = false) {
  const fee = Math.round(entryPriceCents * 0.035) + 130;
  return uncapped ? fee : Math.min(fee, 500);
}

// Card processing part of the fee on `cents`, never more than the fee
// itself (matters only under the $5 cap).
export function cardProcessingCents(cents, uncapped = false) {
  if (!(cents > 0)) return 0;
  return Math.min(Math.round(cents * 0.029) + 30, computeStandardFee(cents, uncapped));
}

// What the player pays of Atlas's fee for a whole booking, mirroring
// computeBookingFeeCents in index.js: N-1 tickets at the per-ticket fee on
// the entry price, plus one fee on entry + rentals (`chargeableCents`).
// A $0 entry adds no per-ticket part for extra people.
export function passedFeeCents({ model, entryPriceCents, chargeableCents, attendeeCount = 1, uncapped = false, bookingFeeCents }) {
  if (model === "absorb") return 0;
  if (model === "split_processing") {
    const extra = entryPriceCents > 0 ? cardProcessingCents(entryPriceCents, uncapped) : 0;
    return Math.max(0, attendeeCount - 1) * extra + cardProcessingCents(chargeableCents, uncapped);
  }
  return bookingFeeCents;
}
