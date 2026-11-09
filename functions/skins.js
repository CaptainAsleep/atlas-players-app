// Paid skins (2026-11-09). Scope: project doc claude/atlas-skins-scope.md.
//
// The catalog lives in code, not Firestore: every new skin needs new theme
// tokens and a deploy anyway. This server copy is the only source of truth
// for price and availability. A display copy lives in the player app's
// src/skins.js (keep the ids, names, prices and sale windows in sync, same
// as RANK_TABLES in cards.js / TradingCards.jsx).
//
// Nothing here touches Firestore directly except grantSkinsInTransaction,
// which takes the transaction and db from its caller so it can be tested
// against the emulator.

export const FREE_LOOKS = ["light", "dark"];

// collection "core" = always for sale. A limited drop gets its own
// collection id plus saleStart/saleEnd (ISO strings, UTC). A recurring
// holiday skin keeps the same id every year and just gets a new window.
export const SKINS = [
  { id: "ridgeline", name: "Ridgeline", collection: "core", priceCents: 99 },
  { id: "ridgeline-black", name: "Ridgeline Black", collection: "core", priceCents: 99 },
  { id: "m81", name: "M81 Woodland", collection: "core", priceCents: 99 },
  { id: "gunmetal", name: "Gun Metal", collection: "core", priceCents: 99 },
  { id: "neon", name: "Neon", collection: "core", priceCents: 99 },
];

export const CORE_BUNDLE_NAME = "The Originals";
// Priced by how many Core skins the player doesn't own yet, so nobody pays
// more than $3.99 total for all five. 2 or fewer left: no bundle (singles
// are already cheaper).
export const BUNDLE_PRICE_BY_REMAINING = { 5: 399, 4: 299, 3: 199 };

export const MAX_SKINS_PER_PURCHASE = 10;
const ID_RE = /^[a-z0-9-]{1,40}$/;

export class SkinError extends Error {}

export function skinById(id) {
  return SKINS.find((s) => s.id === id) || null;
}

export function isOnSale(skin, nowMs = Date.now()) {
  if (!skin) return false;
  if (skin.saleStart && nowMs < Date.parse(skin.saleStart)) return false;
  if (skin.saleEnd && nowMs >= Date.parse(skin.saleEnd)) return false;
  return true;
}

// "light", "dark", or any skin id in the catalog (owned or not — ownership
// is checked separately, by the Firestore rule on users/{uid}.appearance).
export function isKnownLook(id) {
  return FREE_LOOKS.includes(id) || !!skinById(id);
}

// The "complete the set" offer for this player right now, or null.
export function bundleOffer(ownedIds, nowMs = Date.now()) {
  const owned = new Set(ownedIds || []);
  const core = SKINS.filter((s) => s.collection === "core" && isOnSale(s, nowMs));
  const remaining = core.filter((s) => !owned.has(s.id));
  const priceCents = BUNDLE_PRICE_BY_REMAINING[remaining.length];
  if (!priceCents) return null;
  return { skinIds: remaining.map((s) => s.id), priceCents, complete: remaining.length === core.length };
}

// Request shape from either checkout: { skinIds: string[] } or { bundle: true }.
// Returns null for "no skins".
export function normalizeSkinRequest(raw) {
  if (raw == null) return null;
  if (typeof raw !== "object" || Array.isArray(raw)) throw new SkinError("That skin selection isn't valid.");
  const bundle = raw.bundle === true;
  const ids = raw.skinIds == null ? [] : raw.skinIds;
  if (!Array.isArray(ids)) throw new SkinError("That skin selection isn't valid.");
  if (bundle && ids.length > 0) throw new SkinError("Pick the bundle or single skins, not both.");
  if (ids.length > MAX_SKINS_PER_PURCHASE) throw new SkinError("Too many skins in one purchase.");
  const clean = [];
  for (const id of ids) {
    if (typeof id !== "string" || !ID_RE.test(id)) throw new SkinError("That skin selection isn't valid.");
    if (!clean.includes(id)) clean.push(id);
  }
  if (!bundle && clean.length === 0) return null;
  return bundle ? { bundle: true, skinIds: [] } : { bundle: false, skinIds: clean.sort() };
}

// Prices a normalized request against what the player already owns.
// Returns { via, grantIds, totalCents, lineItems: [{ name, unitCents }] }.
export function resolveSkinPurchase(req, ownedIds, nowMs = Date.now()) {
  if (!req) throw new SkinError("Pick a skin first.");
  const owned = new Set(ownedIds || []);
  if (req.bundle) {
    const offer = bundleOffer(owned, nowMs);
    if (!offer) throw new SkinError("You already have most of The Originals — grab the rest one at a time.");
    const n = offer.skinIds.length;
    return {
      via: "bundle",
      grantIds: offer.skinIds,
      totalCents: offer.priceCents,
      lineItems: [{ name: `Atlas skin bundle: ${CORE_BUNDLE_NAME} (${n} skin${n === 1 ? "" : "s"})`, unitCents: offer.priceCents }],
    };
  }
  const lineItems = [];
  for (const id of req.skinIds) {
    const skin = skinById(id);
    if (!skin) throw new SkinError("That skin doesn't exist.");
    if (!isOnSale(skin, nowMs)) throw new SkinError(`${skin.name} isn't available right now.`);
    if (owned.has(id)) throw new SkinError(`You already own ${skin.name}.`);
    lineItems.push({ name: `Atlas skin: ${skin.name}`, unitCents: skin.priceCents });
  }
  return {
    via: "single",
    grantIds: [...req.skinIds],
    totalCents: lineItems.reduce((sum, li) => sum + li.unitCents, 0),
    lineItems,
  };
}

// Stable piece of a Stripe idempotency key for a selection.
export function skinKeyPart(req) {
  if (!req) return "";
  return req.bundle ? "skins:bundle" : `skins:${req.skinIds.join(",")}`;
}

// Stripe metadata (strings only) written at checkout, read back by the webhook.
// via: "single" | "bundle" for the Appearance-screen checkout, "addon" when
// the skins ride along on an event booking (admin reporting splits on it).
export function skinMetadata(req, priced, via = priced?.via) {
  if (!req || !priced) return {};
  return {
    skinIds: priced.grantIds.join(","),
    skinVia: via,
    skinCents: String(priced.totalCents),
  };
}

export function parseSkinMetadata(meta) {
  const raw = typeof meta?.skinIds === "string" ? meta.skinIds : "";
  const ids = raw.split(",").map((s) => s.trim()).filter((s) => ID_RE.test(s));
  const cents = Number(meta?.skinCents);
  return {
    skinIds: [...new Set(ids)],
    via: ["single", "bundle", "addon"].includes(meta?.skinVia) ? meta.skinVia : "single",
    skinCents: Number.isFinite(cents) && cents > 0 ? Math.round(cents) : 0,
  };
}

// Writes ownership docs + the purchase record inside the caller's
// transaction. ALL reads happen first (Firestore transactions require
// reads before writes), so call this before any other t.set/t.update in
// the same transaction, or pass in already-read snapshots. Safe to run
// twice for the same session: the purchase record is the idempotency
// marker, and skins already owned are skipped.
export async function readSkinGrantState(t, db, uid, sessionId, skinIds) {
  const userRef = db.collection("users").doc(uid);
  const purchaseRef = db.collection("skinPurchases").doc(sessionId);
  const snaps = await Promise.all([t.get(purchaseRef), ...skinIds.map((id) => t.get(userRef.collection("skins").doc(id)))]);
  return { purchaseExists: snaps[0].exists, ownedAlready: skinIds.filter((_, i) => snaps[i + 1].exists) };
}

export function writeSkinGrant(t, db, { uid, sessionId, skinIds, via, amountCents, eventId = null, now = new Date() }, state) {
  if (state.purchaseExists) return { granted: [] };
  const userRef = db.collection("users").doc(uid);
  const granted = skinIds.filter((id) => !state.ownedAlready.includes(id));
  for (const id of granted) {
    t.set(userRef.collection("skins").doc(id), { acquiredAt: now, via, sessionId });
  }
  t.set(db.collection("skinPurchases").doc(sessionId), {
    uid,
    items: skinIds,
    granted,
    via,
    amountCents,
    ...(eventId ? { eventId } : {}),
    createdAt: now,
  });
  return { granted };
}
