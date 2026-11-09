// Paid skins — the player app's display copy of the catalog (2026-11-09).
// The server copy in functions/skins.js is the only source of truth for
// price and availability; keep ids, names, prices and sale windows in
// sync with it (same arrangement as RANK_TABLES in cards.js /
// TradingCards.jsx). How each skin looks lives in theme.js (SKIN_THEMES).

export const FREE_LOOKS = [
  { id: "light", name: "Light", sub: "Built for sunlight" },
  { id: "dark", name: "Dark", sub: "Night Ops" },
];

// swatch = the small round preview chip (a CSS background).
export const SKINS = [
  { id: "ridgeline", name: "Ridgeline", collection: "core", priceCents: 99, swatch: "linear-gradient(135deg, #C4B48C 0%, #C4B48C 40%, #7A774A 40%, #7A774A 70%, #5B4A32 70%)" },
  { id: "ridgeline-black", name: "Ridgeline Black", collection: "core", priceCents: 99, swatch: "linear-gradient(135deg, #393C3F 0%, #393C3F 40%, #1B1D1E 40%, #1B1D1E 70%, #4A4E51 70%)" },
  { id: "m81", name: "M81 Woodland", collection: "core", priceCents: 99, swatch: "linear-gradient(135deg, #55663B 0%, #55663B 35%, #A3946B 35%, #A3946B 60%, #5D4631 60%, #5D4631 80%, #1E1E19 80%)" },
  { id: "gunmetal", name: "Gun Metal", collection: "core", priceCents: 99, swatch: "linear-gradient(160deg, #EEF1F4 0%, #8C96A1 45%, #2A2F36 100%)" },
  { id: "neon", name: "Neon", collection: "core", priceCents: 99, swatch: "linear-gradient(135deg, #FF3DDB 0%, #FF3DDB 48%, #19F0FF 52%, #19F0FF 100%)" },
];

export const COLLECTIONS = {
  core: { name: "The Originals", label: "Core Collection · Always available" },
};

export const BUNDLE_PRICE_BY_REMAINING = { 5: 399, 4: 299, 3: 199 };

export const skinById = (id) => SKINS.find((s) => s.id === id) || null;
export const lookName = (id) => (FREE_LOOKS.find((l) => l.id === id) || skinById(id) || FREE_LOOKS[0]).name;
export const isPaidSkin = (id) => !!skinById(id);

export function isOnSale(skin, nowMs = Date.now()) {
  if (!skin) return false;
  if (skin.saleStart && nowMs < Date.parse(skin.saleStart)) return false;
  if (skin.saleEnd && nowMs >= Date.parse(skin.saleEnd)) return false;
  return true;
}

export function bundleOffer(ownedIds, nowMs = Date.now()) {
  const owned = new Set(ownedIds || []);
  const core = SKINS.filter((s) => s.collection === "core" && isOnSale(s, nowMs));
  const remaining = core.filter((s) => !owned.has(s.id));
  const priceCents = BUNDLE_PRICE_BY_REMAINING[remaining.length];
  if (!priceCents) return null;
  return { skinIds: remaining.map((s) => s.id), priceCents, complete: remaining.length === core.length };
}

export const fmtSkinPrice = (cents) => `$${(cents / 100).toFixed(2)}`;
