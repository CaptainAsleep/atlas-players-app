// Rental inventory + quantities (2026-10-24). Pure helpers, no Firebase
// imports, so rentalInventory.test.mjs can run them directly:
//   node --test functions/rentalInventory.test.mjs
//
// Catalog item: { id, name, priceCents, quantity?, maxPerPerson? }
//   quantity      per-event stock; missing/null = unlimited (pre-2026-10-24)
//   maxPerPerson  default 1 — exactly the old on/off toggle
// Booking.selectedRentals: [{ id, name, priceCents, qty? }] — missing qty = 1.
// Hold (events/{id}/rentalHolds/{uid}): { items: [{id, qty}], expiresAt }.

// Stripe needs a Checkout Session's expires_at at least 30 min out, so the
// hold is 31 min and the session expires with it.
export const RENTAL_HOLD_MS = 31 * 60 * 1000;
// A session paid in its last second still needs its webhook to land before
// the items count as booked — keep a lapsed hold counting this long.
export const RENTAL_HOLD_GRACE_MS = 2 * 60 * 1000;
export const MAX_QTY_PER_ITEM = 50;

export function stockOf(item) {
  const n = Number(item?.quantity);
  return Number.isInteger(n) && n >= 0 ? n : null;
}

export function maxPerPersonOf(item) {
  const n = Number(item?.maxPerPerson);
  return Number.isInteger(n) && n >= 1 ? Math.min(n, MAX_QTY_PER_ITEM) : 1;
}

export function qtyOf(r) {
  const n = Number(r?.qty);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

// New clients send selectedRentals [{id, qty}]; older builds send
// selectedRentalIds [id] (qty 1). Merges duplicate ids. Throws on a bad qty.
export function normalizeRentalPicks(selectedRentals, legacyIds) {
  const out = new Map();
  if (Array.isArray(selectedRentals) && selectedRentals.length > 0) {
    for (const p of selectedRentals) {
      const id = typeof p?.id === "string" ? p.id : null;
      const qty = Number(p?.qty);
      if (!id) throw new Error("A selected rental item is missing its id.");
      if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_ITEM) throw new Error("A rental quantity isn't valid.");
      out.set(id, (out.get(id) || 0) + qty);
    }
  } else if (Array.isArray(legacyIds)) {
    for (const id of legacyIds) if (typeof id === "string") out.set(id, (out.get(id) || 0) + 1);
  }
  return [...out.entries()].map(([id, qty]) => ({ id, qty }));
}

// Σ qty per rental id across confirmed bookings.
export function countBookedRentals(bookings) {
  const used = {};
  for (const b of bookings || []) {
    for (const r of b?.selectedRentals || []) {
      if (!r?.id) continue;
      used[r.id] = (used[r.id] || 0) + qtyOf(r);
    }
  }
  return used;
}

// Σ qty per rental id across other players' live holds.
export function countHeldRentals(holds, nowMs, excludeUid) {
  const held = {};
  for (const h of holds || []) {
    if (!h || h.uid === excludeUid) continue;
    if (!(typeof h.expiresAtMs === "number" && h.expiresAtMs + RENTAL_HOLD_GRACE_MS > nowMs)) continue;
    for (const it of h.items || []) {
      if (!it?.id) continue;
      held[it.id] = (held[it.id] || 0) + qtyOf(it);
    }
  }
  return held;
}

function plural(name, n) {
  return n === 1 ? name : /s$/i.test(name) ? name : `${name}s`;
}

// Throws Error with a player-safe message if any pick exceeds stock left.
export function assertRentalStock(catalog, picks, used, held) {
  for (const p of picks) {
    const item = (catalog || []).find((r) => r.id === p.id);
    const stock = stockOf(item);
    if (stock == null) continue;
    const left = Math.max(0, stock - (used[p.id] || 0) - (held[p.id] || 0));
    if (p.qty > left) {
      throw new Error(left === 0
        ? `${item.name} is sold out for this event — remove it to continue.`
        : `Only ${left} ${plural(item.name, left)} left for this event — lower the quantity.`);
    }
  }
}

export function samePicks(a, b) {
  const key = (xs) => (xs || []).map((x) => `${x.id}:${qtyOf(x)}`).sort().join("|");
  return key(a) === key(b);
}
