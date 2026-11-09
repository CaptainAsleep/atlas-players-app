import test from "node:test";
import assert from "node:assert/strict";
import { SKINS, FREE_LOOKS, SkinError, skinById, isOnSale, isKnownLook, bundleOffer, normalizeSkinRequest, resolveSkinPurchase, skinKeyPart, skinMetadata, parseSkinMetadata, readSkinGrantState, writeSkinGrant } from "./skins.js";

const CORE = ["ridgeline", "ridgeline-black", "m81", "gunmetal", "neon"];

test("catalog: five core skins at 99c with valid ids", () => {
  assert.deepEqual(SKINS.map((s) => s.id), CORE);
  for (const s of SKINS) {
    assert.equal(s.priceCents, 99);
    assert.equal(s.collection, "core");
    assert.match(s.id, /^[a-z0-9-]{1,40}$/);
  }
  assert.deepEqual(FREE_LOOKS, ["light", "dark"]);
});

test("isOnSale honors sale windows; core skins are always on sale", () => {
  const drop = { id: "x", saleStart: "2026-12-01T05:00:00Z", saleEnd: "2027-01-01T05:00:00Z" };
  assert.equal(isOnSale(drop, Date.parse("2026-11-30T00:00:00Z")), false);
  assert.equal(isOnSale(drop, Date.parse("2026-12-15T00:00:00Z")), true);
  assert.equal(isOnSale(drop, Date.parse("2027-01-01T05:00:00Z")), false);
  assert.equal(isOnSale(skinById("neon")), true);
  assert.equal(isOnSale(null), false);
});

test("isKnownLook", () => {
  assert.equal(isKnownLook("light"), true);
  assert.equal(isKnownLook("dark"), true);
  assert.equal(isKnownLook("gunmetal"), true);
  assert.equal(isKnownLook("multicam"), false);
});

test("bundleOffer: $3.99 / $2.99 / $1.99, hidden at 2 or fewer left", () => {
  assert.deepEqual(bundleOffer([]), { skinIds: CORE, priceCents: 399, complete: true });
  assert.equal(bundleOffer(["gunmetal"]).priceCents, 299);
  assert.deepEqual(bundleOffer(["gunmetal"]).skinIds, ["ridgeline", "ridgeline-black", "m81", "neon"]);
  assert.equal(bundleOffer(["gunmetal", "neon"]).priceCents, 199);
  assert.equal(bundleOffer(["gunmetal", "neon", "m81"]), null);
  assert.equal(bundleOffer(CORE), null);
});

test("never pays more than $3.99 total for all five via singles-then-bundle", () => {
  for (let owned = 0; owned <= 2; owned++) {
    const offer = bundleOffer(CORE.slice(0, owned));
    assert.ok(owned * 99 + offer.priceCents <= 399, `owned ${owned}`);
  }
});

test("normalizeSkinRequest", () => {
  assert.equal(normalizeSkinRequest(null), null);
  assert.equal(normalizeSkinRequest(undefined), null);
  assert.equal(normalizeSkinRequest({ skinIds: [] }), null);
  assert.deepEqual(normalizeSkinRequest({ skinIds: ["neon", "m81", "neon"] }), { bundle: false, skinIds: ["m81", "neon"] });
  assert.deepEqual(normalizeSkinRequest({ bundle: true }), { bundle: true, skinIds: [] });
  assert.throws(() => normalizeSkinRequest({ bundle: true, skinIds: ["neon"] }), SkinError);
  assert.throws(() => normalizeSkinRequest({ skinIds: ["../users"] }), SkinError);
  assert.throws(() => normalizeSkinRequest({ skinIds: "neon" }), SkinError);
  assert.throws(() => normalizeSkinRequest([]), SkinError);
  assert.throws(() => normalizeSkinRequest({ skinIds: Array.from({ length: 11 }, (_, i) => `s${i}`) }), SkinError);
});

test("resolveSkinPurchase: singles", () => {
  const p = resolveSkinPurchase({ bundle: false, skinIds: ["m81", "neon"] }, []);
  assert.equal(p.via, "single");
  assert.deepEqual(p.grantIds, ["m81", "neon"]);
  assert.equal(p.totalCents, 198);
  assert.deepEqual(p.lineItems.map((l) => l.name), ["Atlas skin: M81 Woodland", "Atlas skin: Neon"]);
});

test("resolveSkinPurchase refuses owned, unknown, off-sale, empty", () => {
  assert.throws(() => resolveSkinPurchase({ bundle: false, skinIds: ["neon"] }, ["neon"]), /already own Neon/);
  assert.throws(() => resolveSkinPurchase({ bundle: false, skinIds: ["nope"] }, []), /doesn't exist/);
  assert.throws(() => resolveSkinPurchase(null, []), /Pick a skin/);
  const drop = { id: "frost", name: "Frost", collection: "winter", priceCents: 99, saleStart: "2026-12-01T00:00:00Z", saleEnd: "2027-01-01T00:00:00Z" };
  SKINS.push(drop);
  try {
    assert.throws(() => resolveSkinPurchase({ bundle: false, skinIds: ["frost"] }, [], Date.parse("2027-02-01T00:00:00Z")), /isn't available/);
    assert.equal(resolveSkinPurchase({ bundle: false, skinIds: ["frost"] }, [], Date.parse("2026-12-10T00:00:00Z")).totalCents, 99);
    // A drop skin never counts toward the Core bundle.
    assert.equal(bundleOffer([], Date.parse("2026-12-10T00:00:00Z")).skinIds.length, 5);
  } finally {
    SKINS.pop();
  }
});

test("resolveSkinPurchase: bundle prices off what's owned", () => {
  const full = resolveSkinPurchase({ bundle: true, skinIds: [] }, []);
  assert.equal(full.totalCents, 399);
  assert.equal(full.grantIds.length, 5);
  assert.equal(full.lineItems[0].name, "Atlas skin bundle: The Originals (5 skins)");
  const rest = resolveSkinPurchase({ bundle: true, skinIds: [] }, ["gunmetal"]);
  assert.equal(rest.totalCents, 299);
  assert.ok(!rest.grantIds.includes("gunmetal"));
  assert.throws(() => resolveSkinPurchase({ bundle: true, skinIds: [] }, ["gunmetal", "neon", "m81"]), /one at a time/);
});

test("key part and metadata round-trip", () => {
  assert.equal(skinKeyPart(null), "");
  assert.equal(skinKeyPart({ bundle: true, skinIds: [] }), "skins:bundle");
  assert.equal(skinKeyPart({ bundle: false, skinIds: ["m81", "neon"] }), "skins:m81,neon");
  const req = { bundle: false, skinIds: ["m81", "neon"] };
  const meta = skinMetadata(req, resolveSkinPurchase(req, []), "addon");
  assert.deepEqual(meta, { skinIds: "m81,neon", skinVia: "addon", skinCents: "198" });
  assert.deepEqual(parseSkinMetadata(meta), { skinIds: ["m81", "neon"], via: "addon", skinCents: 198 });
  assert.deepEqual(parseSkinMetadata({}), { skinIds: [], via: "single", skinCents: 0 });
  assert.deepEqual(parseSkinMetadata({ skinIds: "neon,../x,neon", skinVia: "evil", skinCents: "-5" }), { skinIds: ["neon"], via: "single", skinCents: 0 });
});

// In-memory stand-in for a Firestore transaction (the emulator suite covers the real thing).
function fakeDb(existing = {}) {
  const store = { ...existing };
  const ref = (path) => ({ path, collection: (c) => ({ doc: (d) => ref(`${path}/${c}/${d}`) }) });
  const db = { store, collection: (c) => ({ doc: (d) => ref(`${c}/${d}`) }) };
  const t = {
    get: async (r) => ({ exists: r.path in store }),
    set: (r, data) => { store[r.path] = data; },
  };
  return { db, t };
}

test("grant writes new skins + purchase record, skips owned, is idempotent", async () => {
  const { db, t } = fakeDb({ "users/u1/skins/neon": { via: "single" } });
  const args = { uid: "u1", sessionId: "cs_1", skinIds: ["m81", "neon"], via: "bundle", amountCents: 299, now: new Date(0) };
  const state = await readSkinGrantState(t, db, "u1", "cs_1", args.skinIds);
  assert.deepEqual(state, { purchaseExists: false, ownedAlready: ["neon"] });
  assert.deepEqual(writeSkinGrant(t, db, args, state).granted, ["m81"]);
  assert.equal(db.store["users/u1/skins/m81"].sessionId, "cs_1");
  assert.equal(db.store["users/u1/skins/neon"].via, "single");
  assert.equal(db.store["skinPurchases/cs_1"].amountCents, 299);
  const again = await readSkinGrantState(t, db, "u1", "cs_1", args.skinIds);
  assert.equal(again.purchaseExists, true);
  assert.deepEqual(writeSkinGrant(t, db, args, again).granted, []);
});
