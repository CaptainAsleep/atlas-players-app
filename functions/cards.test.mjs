import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import {
  RANKED_MIN, SHARE_TTL_MS, CARD_SERVER_KEYS, isCardBeta, FOUNDER_UID, newShareToken, isWellFormedShareToken,
  adultCardStats, childCardStats, sameStats, computeTiers, collectProblem, collectionDocId, planSerials, collectMessage,
} from "./cards.js";

test("constants", () => {
  assert.equal(RANKED_MIN, 5);
  assert.ok(SHARE_TTL_MS >= 60_000 && SHARE_TTL_MS <= 5 * 60_000);
  assert.ok(CARD_SERVER_KEYS.includes("signupNumber") && CARD_SERVER_KEYS.includes("circulation"));
  assert.ok(isCardBeta(FOUNDER_UID));
  assert.ok(!isCardBeta("someoneElse"));
  assert.ok(!isCardBeta(null));
});

test("share tokens", () => {
  const t = newShareToken(randomBytes);
  assert.ok(isWellFormedShareToken(t));
  assert.ok(!isWellFormedShareToken("abc"));
  assert.ok(!isWellFormedShareToken(t.toUpperCase()));
  assert.ok(!isWellFormedShareToken(null));
});

test("adult stats: checked in only, child-only bookings excluded, distinct fields", () => {
  const s = adultCardStats([
    { checkedIn: true, fieldId: "a" },
    { checkedIn: true, fieldId: "a" },
    { checkedIn: true, fieldId: "b" },
    { checkedIn: true, fieldId: null }, // Atlas Major: an op, no field
    { checkedIn: false, fieldId: "c" },
    { checkedIn: true, fieldId: "d", guardianPlaying: false },
  ]);
  assert.deepEqual(s, { ops: 4, fields: 2 });
  assert.deepEqual(adultCardStats([]), { ops: 0, fields: 0 });
  assert.deepEqual(adultCardStats(undefined), { ops: 0, fields: 0 });
});

test("child stats count child-only bookings too", () => {
  assert.deepEqual(childCardStats([{ checkedIn: true, fieldId: "a", guardianPlaying: false }, { checkedIn: false, fieldId: "b" }]), { ops: 1, fields: 1 });
  assert.ok(sameStats({ ops: 1, fields: 1 }, { ops: 1, fields: 1 }));
  assert.ok(!sameStats({ ops: 1, fields: 1 }, null));
});

test("tiers: founder, unranked floor, percentile bands, ties", () => {
  const cards = [{ key: "founder", circulation: 0, founder: true, serial: 1 }];
  // 20 ranked cards with circulation 5..24 + 3 unranked.
  for (let i = 0; i < 20; i++) cards.push({ key: `r${i}`, circulation: RANKED_MIN + i, serial: 10 + i });
  cards.push({ key: "u0", circulation: 0, serial: 50 }, { key: "u1", circulation: 4, serial: 51 }, { key: "u2", serial: 52 });
  const { tiers, titles } = computeTiers(cards);
  assert.equal(tiers.founder, "founder");
  assert.equal(tiers.u0, "unranked");
  assert.equal(tiers.u1, "unranked");
  assert.equal(tiers.u2, "unranked");
  assert.equal(tiers.r0, "legendary"); // 0/20 = 0%
  assert.equal(tiers.r1, "epic");      // 5%
  assert.equal(tiers.r3, "epic");      // 15%
  assert.equal(tiers.r4, "rare");      // 20%
  assert.equal(tiers.r9, "rare");      // 45%
  assert.equal(tiers.r10, "common");   // 50%
  assert.equal(tiers.r19, "common");
  assert.equal(titles.r19, "most_popular");
  assert.equal(titles.r0, "rarest");
  assert.equal(titles.founder, undefined);
  // Ties share a tier.
  const t2 = computeTiers([{ key: "a", circulation: 5 }, { key: "b", circulation: 5 }, { key: "c", circulation: 9 }]).tiers;
  assert.equal(t2.a, t2.b);
  assert.equal(t2.a, "legendary");
});

test("tiers: nobody ranked yet", () => {
  const { tiers, titles } = computeTiers([{ key: "a", circulation: 2, serial: 3 }, { key: "b", circulation: 2, serial: 2 }, { key: "f", founder: true, circulation: 40 }]);
  assert.equal(tiers.a, "unranked");
  assert.equal(titles.b, "most_popular"); // tie -> lower serial
  assert.equal(titles.f, undefined);      // founder never gets a title
  assert.ok(!Object.values(titles).includes("rarest"));
});

test("collect checks", () => {
  const now = 1_000_000;
  const share = { ownerId: "owner", ownerKind: "adult", issuerUid: "owner", expiresAtMs: now + 1000, status: "open" };
  const ok = { now, collectorUid: "me", collectorHasProfile: true, ownerExists: true };
  assert.equal(collectProblem(share, ok), null);
  assert.equal(collectProblem(null, ok), "invalid");
  assert.equal(collectProblem({ ...share, expiresAtMs: now - 1 }, ok), "expired");
  assert.equal(collectProblem(share, { ...ok, ownerExists: false }), "gone");
  assert.equal(collectProblem(share, { ...ok, collectorHasProfile: false }), "no-profile");
  assert.equal(collectProblem(share, { ...ok, collectorUid: "owner" }), "own-card");
  // A collected share can still be scanned by a second player (one QR, a line of people).
  assert.equal(collectProblem({ ...share, status: "collected" }, ok), null);
  const child = { ownerId: "cabc", ownerKind: "child", issuerUid: "parent", expiresAtMs: now + 1000 };
  assert.equal(collectProblem(child, { ...ok, guardianUid: "parent" }), null);
  assert.equal(collectProblem(child, { ...ok, collectorUid: "parent", guardianUid: "parent" }), "own-card");
  assert.equal(collectProblem({ ...share, expiresAt: { toMillis: () => now + 5 } }, ok), null);
  assert.equal(collectionDocId("me", "owner"), "me_owner");
  assert.match(collectMessage("expired"), /expired/);
  assert.match(collectMessage("whatever"), /valid/);
});

test("serial backfill: oldest first, missing dates first, existing numbers kept", () => {
  const ts = (ms) => ({ toMillis: () => ms });
  const plan = planSerials([
    { id: "c", createdAt: ts(300) },
    { id: "a", createdAt: ts(100) },
    { id: "nodate" },
    { id: "b", createdAt: ts(200) },
    { id: "b2", createdAt: ts(200) },
  ]);
  assert.deepEqual(plan.assignments, [
    { id: "nodate", signupNumber: 1 },
    { id: "a", signupNumber: 2 },
    { id: "b", signupNumber: 3 },
    { id: "b2", signupNumber: 4 },
    { id: "c", signupNumber: 5 },
  ]);
  assert.equal(plan.total, 5);
  assert.deepEqual(plan.missingCreatedAt, ["nodate"]);
  // Re-run after numbering: nothing to do; a new profile gets the next number.
  const again = planSerials([{ id: "a", createdAt: ts(1), signupNumber: 1 }, { id: "z", createdAt: ts(0) }], 7);
  assert.deepEqual(again.assignments, [{ id: "z", signupNumber: 8 }]);
  assert.equal(again.total, 8);
});
