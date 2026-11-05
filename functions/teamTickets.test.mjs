import test from "node:test";
import assert from "node:assert/strict";
import { MAX_TEAM_TICKETS, ACCEPT_WINDOW_MS, normalizeRecipient, recipientKey, normalizeTeamPurchase, teamTicketTotals, acceptDeadlineMs, daysLeft, teamDraftId, joinNames, fmtUsd } from "./teamTickets.js";

test("normalizeRecipient", () => {
  assert.deepEqual(normalizeRecipient({ kind: "self", uid: "x" }), { kind: "self" });
  assert.deepEqual(normalizeRecipient({ kind: "player", uid: "abc123", extra: 1 }), { kind: "player", uid: "abc123" });
  assert.deepEqual(normalizeRecipient({ kind: "child", publicId: "c0123" }), { kind: "child", publicId: "c0123" });
  assert.deepEqual(normalizeRecipient({ kind: "ownChild", dependentId: "dep_1" }), { kind: "ownChild", dependentId: "dep_1" });
  assert.throws(() => normalizeRecipient({ kind: "player", uid: "a/b" }), /isn't valid/);
  assert.throws(() => normalizeRecipient({ kind: "admin" }), /isn't valid/);
  assert.throws(() => normalizeRecipient(null), /isn't valid/);
});

test("recipientKey treats self and the buyer's own uid as one person", () => {
  assert.equal(recipientKey({ kind: "self" }, "B"), "u:B");
  assert.equal(recipientKey({ kind: "player", uid: "B" }, "B"), "u:B");
  assert.equal(recipientKey({ kind: "child", publicId: "c1" }, "B"), "c:c1");
  assert.equal(recipientKey({ kind: "ownChild", dependentId: "d1" }, "B"), "d:B:d1");
});

test("normalizeTeamPurchase", () => {
  assert.deepEqual(normalizeTeamPurchase({ quantity: 3, recipients: [{ kind: "self" }] }, "B"), { quantity: 3, recipients: [{ kind: "self" }] });
  assert.equal(normalizeTeamPurchase({ quantity: "2" }, "B").quantity, 2);
  assert.deepEqual(normalizeTeamPurchase({ quantity: 1, recipients: [null] }, "B").recipients, []);
  assert.throws(() => normalizeTeamPurchase({ quantity: 0 }, "B"), /between 1 and 20/);
  assert.throws(() => normalizeTeamPurchase({ quantity: MAX_TEAM_TICKETS + 1 }, "B"), /between 1 and 20/);
  assert.throws(() => normalizeTeamPurchase({ quantity: 1.5 }, "B"), /between 1 and 20/);
  assert.throws(() => normalizeTeamPurchase({ quantity: 1, recipients: [{ kind: "self" }, { kind: "player", uid: "x" }] }, "B"), /more people than tickets/);
  assert.throws(() => normalizeTeamPurchase({ quantity: 2, recipients: [{ kind: "self" }, { kind: "player", uid: "B" }] }, "B"), /twice/);
});

test("teamTicketTotals: per-ticket fee, passed or absorbed", () => {
  // $20 ticket: fee $2.00 each.
  assert.deepEqual(teamTicketTotals({ entryPriceCents: 2000, perTicketFeeCents: 200, quantity: 5, passFeeToPlayer: true }), { unitCents: 2200, totalCents: 11000, applicationFeeCents: 1000 });
  assert.deepEqual(teamTicketTotals({ entryPriceCents: 2000, perTicketFeeCents: 200, quantity: 5, passFeeToPlayer: false }), { unitCents: 2000, totalCents: 10000, applicationFeeCents: 1000 });
});

test("acceptDeadlineMs: 5 days, or the event's close if sooner", () => {
  const now = Date.UTC(2026, 10, 1);
  assert.equal(acceptDeadlineMs(now, now + 30 * 86400000), now + ACCEPT_WINDOW_MS);
  assert.equal(acceptDeadlineMs(now, now + 2 * 86400000), now + 2 * 86400000);
  assert.equal(acceptDeadlineMs(now, null), now + ACCEPT_WINDOW_MS);
});

test("daysLeft rounds up", () => {
  const now = 0;
  assert.equal(daysLeft(5 * 86400000, now), 5);
  assert.equal(daysLeft(4 * 86400000 + 1, now), 5);
  assert.equal(daysLeft(3600000, now), 1);
  assert.equal(daysLeft(30000, now), 0);
  assert.equal(daysLeft(-5, now), 0);
});

test("teamDraftId is stable and changes with the request", () => {
  const base = { buyerUid: "B", eventId: "E", quantity: 3, selectedChoiceId: null, priceTier: null, recipients: [{ kind: "self" }] };
  assert.equal(teamDraftId(base), teamDraftId({ ...base }));
  assert.match(teamDraftId(base), /^td_[0-9a-f]{32}$/);
  assert.notEqual(teamDraftId(base), teamDraftId({ ...base, quantity: 4 }));
  assert.notEqual(teamDraftId(base), teamDraftId({ ...base, priceTier: "day_of" }));
  assert.notEqual(teamDraftId(base), teamDraftId({ ...base, recipients: [] }));
});

test("joinNames / fmtUsd", () => {
  assert.equal(joinNames(["Ghost"]), "Ghost");
  assert.equal(joinNames(["Ghost", "Viper"]), "Ghost and Viper");
  assert.equal(joinNames(["Ghost", "Viper", "Bear"]), "Ghost, Viper and Bear");
  assert.equal(fmtUsd(2000), "$20");
  assert.equal(fmtUsd(2050), "$20.50");
});
