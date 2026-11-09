// Design tokens for the players app — Light (default) and Night Ops Dark
// themes. See atlas-status.md ("Light/Dark Mode setting") for how the dark
// values were derived from the Night Ops concept artboards. Every key that
// exists in LIGHT_T also exists in DARK_T with the same name — components
// pull the active set via useTheme() (src/hooks/useTheme.jsx) rather than
// importing these directly.

export const LIGHT_T = {
  // Light, high-contrast palette — chosen for outdoor sunlight readability
  // over aesthetic preference. Text-bearing tokens (ash/ashDim/ashFaint,
  // accent, good, alert) are deliberately on the darker/more-saturated end
  // of their range for real contrast against the light backgrounds, not
  // just "looks fine indoors."
  void: "#F2F2ED", // page background
  panel: "#FFFFFF", // card surfaces — clear separation from the page
  panelAlt: "#E7E7E1", // nested surfaces: chip fills, placeholder thumbnails
  line: "#D2D2CB", // borders/dividers
  ash: "#002C48", // primary text ink (deep navy)
  ashDim: "#4E5257", // secondary text
  ashFaint: "#686C72", // tertiary text/labels
  accent: "#1554B8", // links/interactive — deep blue for real contrast on white
  good: "#0F7A52", // success/positive
  alert: "#BC3327", // warnings/live badges

  // Dedicated primary-button-fill token. Kept separate from `ash` because
  // in dark mode `ash` becomes a light text-ink color while the primary
  // button fill needs to stay a bold, high-contrast color of its own — see
  // DARK_T below. Light value matches `ash` exactly so light mode is
  // pixel-identical to before this token existed.
  cta: "#002C48",
  // Text/icon color for anything sitting on a cta/accent/good/alert FILL
  // (as opposed to text sitting on the page/panel background, which uses
  // ash/ashDim/ashFaint instead).
  inverse: "#FFFFFF",

  // Elevation — soft shadows replace the flat 1px border as the primary
  // depth cue on cards; borders stay only for hairline dividers and
  // secondary/outline buttons that need a visible edge with no fill.
  shadowSm: "0 1px 2px rgba(0,44,72,0.05)",
  shadowMd: "0 1px 2px rgba(0,44,72,0.05), 0 8px 20px -8px rgba(0,44,72,0.16)",
  shadowLg: "0 1px 2px rgba(0,44,72,0.06), 0 10px 28px -8px rgba(0,44,72,0.22)",
  shadowNav: "0 -8px 24px -8px rgba(0,44,72,0.14)", // bottom nav / sticky footer bars
  shadowFloat: "0 6px 14px rgba(0,44,72,0.16), 0 24px 48px -12px rgba(0,44,72,0.40)", // detached/floating bars (nav, booking bar)
  glassFill: "rgba(255,255,255,0.72)", // translucent fill for floating glass bars
  glassBlur: "blur(20px)", // backdrop blur amount for floating glass bars
  glassBorder: "1px solid rgba(255,255,255,0.6)", // edge highlight for floating glass bars

  // A single deliberate radius scale — identical in both themes, shape
  // doesn't change with theme, only color/shadow does.
  rTight: 10, // inputs, small chips
  rCard: 16, // standard cards
  rHero: 18, // feature/hero cards
  rFloat: 24, // floating detached bars (booking bar / sticky footer)
  rMedia: 14, // images inside cards
  rPill: 999, // pills, segmented controls, toggle chips, primary buttons

  // Soft tint washes for icon badges
  tint: "#EEF2F8",
  tintGood: "#EAF5EF",

  // Dark-mode fix pass, 2026-10-24. Surfaces that used to be hardcoded
  // light values while their text/icons used ash (which flips to
  // off-white in dark) — white-on-white in Night Ops. Light values below
  // are exactly the old hardcoded ones, so light mode is unchanged.
  onImageFill: "rgba(255,255,255,0.92)", // round back/favorite/share buttons over hero photos
  onImageBorder: "none",
  onImageBlur: "none",
  overlayFill: "rgba(0,44,72,0.97)", // full-screen celebration overlays (Welcome, Patch Unlocked)
  overlayBtnFill: "#FFFFFF", // the single action button on those overlays
  overlayBtnText: "#002C48",
  scrim: "rgba(255,255,255,0.7)", // "Uploading…" wash over an avatar
  navActive: "rgba(0,44,72,0.08)", // active-tab pill in the bottom nav

  // Per-look flags (paid skins, 2026-11-09). These replace the old
  // theme === "dark" checks in App.jsx, so any look — free or paid — can
  // say what it needs. Light values reproduce exactly what light mode
  // drew before.
  isDark: false, // native controls + map tiles
  heroBg: "linear-gradient(155deg, #FFFFFF 0%, #EEF2F8 100%)", // Home next-game card
  heroBorder: "none",
  heroGlow: "rgba(21,84,184,0.08)", // the soft circle in the hero's corner
  heroMotif: null, // "radar" = Night Ops rings on the hero + event header
  motifColor: null,
  texture: null, // "camo" | "brushed" | "grid" (see SkinTexture.jsx)
  heroScrim: null, // wash over a textured hero so its text stays readable
};

export const DARK_T = {
  // "Night Ops" — dark liquid-glass surfaces, night-vision green + blaze
  // orange accents. Values pulled directly from the Night Ops concept
  // artboards (Notes.dc.html / Main.dc.html / Detail.dc.html), not
  // reinvented here.
  void: "#0A0C0F",
  panel: "#15181D",
  panelAlt: "#1E2228",
  line: "rgba(255,255,255,0.12)",
  ash: "#F5F7F5", // primary text ink — off-white, NOT used for button fills (see cta)
  ashDim: "rgba(245,247,245,0.65)",
  ashFaint: "rgba(245,247,245,0.45)",
  accent: "#B6FF3D", // night-vision green
  good: "#2FBF71", // kept distinct from the neon accent
  alert: "#FF7A1A", // blaze orange — matches Night Ops "LIVE"/"TODAY" badges

  cta: "#B6FF3D", // primary button fill — night-vision green, glowing
  inverse: "#0A0C0F", // near-black text/icon color on top of cta/accent/good/alert fills

  shadowSm: "0 1px 2px rgba(0,0,0,0.30)",
  shadowMd: "0 1px 2px rgba(0,0,0,0.30), 0 8px 20px -8px rgba(0,0,0,0.50)",
  shadowLg: "0 1px 2px rgba(0,0,0,0.35), 0 10px 28px -8px rgba(0,0,0,0.55)",
  shadowNav: "0 -8px 24px -8px rgba(0,0,0,0.45)",
  shadowFloat: "0 6px 14px rgba(0,0,0,0.40), 0 24px 48px -12px rgba(0,0,0,0.65)",
  glassFill: "rgba(20,22,25,0.72)",
  glassBlur: "blur(24px)",
  glassBorder: "1px solid rgba(255,255,255,0.14)",

  rTight: 10,
  rCard: 16,
  rHero: 18,
  rFloat: 24,
  rMedia: 14,
  rPill: 999,

  tint: "rgba(182,255,61,0.14)",
  tintGood: "rgba(47,191,113,0.16)",

  onImageFill: "rgba(10,12,15,0.62)", // dark glass chip — reads on bright AND dark photos
  onImageBorder: "1px solid rgba(255,255,255,0.18)",
  onImageBlur: "blur(12px)",
  overlayFill: "rgba(10,12,15,0.97)",
  overlayBtnFill: "#B6FF3D", // = cta
  overlayBtnText: "#0A0C0F", // = inverse
  scrim: "rgba(10,12,15,0.7)",
  navActive: "rgba(255,255,255,0.10)",

  isDark: true,
  heroBg: "linear-gradient(155deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))",
  heroBorder: "1px solid rgba(255,255,255,0.12)",
  heroGlow: "rgba(182,255,61,0.14)",
  heroMotif: "radar",
  motifColor: "#B6FF3D",
  texture: null,
  heroScrim: null,
};

export const LIGHT_FONTS = {
  display: { fontFamily: "'Space Grotesk', sans-serif" },
  body: { fontFamily: "'Inter', sans-serif" },
  mono: { fontFamily: "'IBM Plex Mono', monospace" },
};

// Dark mode uses the same type as Light (per Michael, 2026-11-09 — was
// Unbounded / Plus Jakarta Sans / JetBrains Mono from the Night Ops concept).
export const DARK_FONTS = LIGHT_FONTS;

// Loaded unconditionally: the shared type (Space Grotesk / Inter / IBM Plex
// Mono) plus JetBrains Mono, which M81 and Neon use for labels. Skin
// display fonts load on demand (SKIN_FONT_URLS below).
export const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&family=JetBrains+Mono:wght@500;600;700&display=swap');
`;

// ── Paid skins (2026-11-09) ──────────────────────────────────────────────
// Scope: project doc claude/atlas-skins-scope.md. Each skin is a full token
// set with every key LIGHT_T has, built on whichever free look it's
// closest to so nothing is missed
// (key parity and text contrast are checked as part of the build verification).
// Catalog (names, prices, sale windows) lives in src/skins.js; this file
// is only how each one looks. Textures only ever sit behind the Explore
// header band and the next-game hero card, never behind text-heavy lists.
const R = { rTight: 10, rCard: 16, rHero: 18, rFloat: 24, rMedia: 14, rPill: 999 };
const darkShadows = (glow) => ({
  shadowSm: "0 1px 2px rgba(0,0,0,0.30)",
  shadowMd: glow ? `0 0 0 1px ${glow}, 0 8px 22px -8px rgba(0,0,0,0.55)` : "0 1px 2px rgba(0,0,0,0.30), 0 8px 20px -8px rgba(0,0,0,0.50)",
  shadowLg: glow ? `0 0 0 1px ${glow}, 0 10px 28px -8px rgba(0,0,0,0.6)` : "0 1px 2px rgba(0,0,0,0.35), 0 10px 28px -8px rgba(0,0,0,0.55)",
  shadowNav: "0 -8px 24px -8px rgba(0,0,0,0.45)",
  shadowFloat: "0 6px 14px rgba(0,0,0,0.40), 0 24px 48px -12px rgba(0,0,0,0.65)",
});

export const SKIN_THEMES = {
  ridgeline: {
    T: {
      ...LIGHT_T, ...R,
      void: "#ECE5D3", panel: "#FAF7EE", panelAlt: "#E3DAC4", line: "#D3C8AE",
      ash: "#2B2817", ashDim: "#575038", ashFaint: "#605A40",
      accent: "#5C5A1E", good: "#2F6B2A", alert: "#963F18",
      cta: "#3E4220", inverse: "#FAF7EE",
      shadowSm: "0 1px 2px rgba(43,40,23,0.06)",
      shadowMd: "0 1px 2px rgba(43,40,23,0.06), 0 8px 20px -8px rgba(43,40,23,0.22)",
      shadowLg: "0 1px 2px rgba(43,40,23,0.07), 0 10px 28px -8px rgba(43,40,23,0.28)",
      shadowNav: "0 -8px 24px -8px rgba(43,40,23,0.18)",
      shadowFloat: "0 6px 14px rgba(43,40,23,0.18), 0 24px 48px -12px rgba(43,40,23,0.42)",
      glassFill: "rgba(250,247,238,0.80)", glassBorder: "1px solid rgba(255,255,255,0.6)",
      tint: "rgba(92,90,30,0.10)", tintGood: "rgba(47,107,42,0.12)",
      onImageFill: "rgba(250,247,238,0.92)",
      overlayFill: "rgba(43,40,23,0.97)", overlayBtnFill: "#FAF7EE", overlayBtnText: "#2B2817",
      scrim: "rgba(250,247,238,0.7)", navActive: "rgba(62,66,32,0.12)",
      isDark: false,
      heroBg: "#E9DFC6", heroBorder: "1px solid #D3C8AE", heroGlow: "transparent",
      texture: "camo", heroScrim: "linear-gradient(100deg, rgba(250,247,238,0.95) 0%, rgba(250,247,238,0.88) 55%, rgba(250,247,238,0.62) 100%)",
      bandOpacity: 0.5,
      // "Field" pattern (SkinTexture.jsx), picked by Michael 2026-11-09.
      camo: { style: "field", seed: 3, base: "#CBBD96", layers: ["#AB9C6E", "#807C53", "#5F4C33", "#E3D8B6"], grain: "#3A3220", grainAmt: 0.22 },
    },
    fonts: LIGHT_FONTS, // same type as Light (per Michael, 2026-11-09)
  },
  "ridgeline-black": {
    T: {
      ...DARK_T, ...R, ...darkShadows(null),
      void: "#0D0E0F", panel: "#17191A", panelAlt: "#222528", line: "rgba(255,255,255,0.10)",
      ash: "#EDEEEA", ashDim: "rgba(237,238,234,0.68)", ashFaint: "rgba(237,238,234,0.52)",
      accent: "#D4D8CC", good: "#6FBF7E", alert: "#E08A3C",
      cta: "#E4E6E0", inverse: "#0D0E0F",
      glassFill: "rgba(23,25,26,0.76)", glassBorder: "1px solid rgba(255,255,255,0.12)",
      tint: "rgba(212,216,204,0.12)", tintGood: "rgba(111,191,126,0.16)",
      overlayFill: "rgba(13,14,15,0.97)", overlayBtnFill: "#E4E6E0", overlayBtnText: "#0D0E0F",
      scrim: "rgba(13,14,15,0.7)", navActive: "rgba(255,255,255,0.10)",
      isDark: true,
      heroBg: "#1B1D1E", heroBorder: "1px solid rgba(255,255,255,0.10)", heroGlow: "transparent",
      heroMotif: null, motifColor: null,
      texture: "camo", heroScrim: "linear-gradient(100deg, rgba(13,14,15,0.88) 0%, rgba(13,14,15,0.66) 60%, rgba(13,14,15,0.38) 100%)",
      bandOpacity: 0.85,
      // "Field" pattern (SkinTexture.jsx), picked by Michael 2026-11-09.
      camo: { style: "field", seed: 3, base: "#1C1E1F", layers: ["#2C3032", "#3B3F42", "#111213", "#4E5357"], grain: "#FFFFFF", grainAmt: 0.10 },
    },
    fonts: LIGHT_FONTS, // same type as Light (per Michael, 2026-11-09)
  },
  m81: {
    T: {
      ...DARK_T, ...R, ...darkShadows(null),
      void: "#1A1E15", panel: "#232920", panelAlt: "#2E3529", line: "rgba(237,233,218,0.12)",
      ash: "#EDE9DA", ashDim: "rgba(237,233,218,0.70)", ashFaint: "rgba(237,233,218,0.60)",
      accent: "#D2BE82", good: "#8FBF5A", alert: "#F2884F",
      cta: "#D2BE82", inverse: "#1A1E15",
      glassFill: "rgba(35,41,32,0.80)", glassBorder: "1px solid rgba(210,190,130,0.20)",
      tint: "rgba(210,190,130,0.14)", tintGood: "rgba(143,191,90,0.16)",
      onImageFill: "rgba(26,30,21,0.62)",
      overlayFill: "rgba(26,30,21,0.97)", overlayBtnFill: "#D2BE82", overlayBtnText: "#1A1E15",
      scrim: "rgba(26,30,21,0.7)", navActive: "rgba(210,190,130,0.16)",
      isDark: true,
      heroBg: "#4C5A33", heroBorder: "1px solid rgba(210,190,130,0.30)", heroGlow: "transparent",
      heroMotif: null, motifColor: null,
      texture: "camo", heroScrim: "linear-gradient(100deg, rgba(20,23,15,0.90) 0%, rgba(20,23,15,0.70) 60%, rgba(20,23,15,0.40) 100%)",
      bandOpacity: 0.55,
      camo: { seed: 81, base: "#55663B", layers: [["#A3946B", 14, 66, 26], ["#5D4631", 14, 60, 24], ["#1E1E19", 14, 34, 12]] },
    },
    fonts: { display: "'Saira Stencil One', sans-serif", body: "'Inter', sans-serif", mono: "'JetBrains Mono', monospace" },
  },
  gunmetal: {
    T: {
      ...DARK_T, ...R, ...darkShadows(null),
      void: "#16191D", panel: "#22262C", panelAlt: "#2C3138", line: "rgba(255,255,255,0.10)",
      ash: "#E6E9ED", ashDim: "rgba(230,233,237,0.68)", ashFaint: "rgba(230,233,237,0.60)",
      accent: "#9DB4CC", good: "#5CC28A", alert: "#F68A62",
      cta: "#C9D1DA", inverse: "#121417",
      glassFill: "rgba(34,38,44,0.82)", glassBorder: "1px solid rgba(255,255,255,0.16)",
      tint: "rgba(157,180,204,0.14)", tintGood: "rgba(92,194,138,0.16)",
      overlayFill: "rgba(22,25,29,0.97)", overlayBtnFill: "#C9D1DA", overlayBtnText: "#121417",
      scrim: "rgba(22,25,29,0.7)", navActive: "rgba(157,180,204,0.16)",
      isDark: true,
      heroBg: "linear-gradient(135deg, #3A4048 0%, #262A30 55%, #1E2227 100%)", heroBorder: "1px solid rgba(255,255,255,0.16)", heroGlow: "transparent",
      heroMotif: null, motifColor: null,
      texture: "brushed", heroScrim: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.25) 100%)",
      bandOpacity: 1,
    },
    fonts: LIGHT_FONTS, // same type as Light (per Michael, 2026-11-09)
  },
  neon: {
    T: {
      ...DARK_T, ...R, ...darkShadows("rgba(25,240,255,0.14)"),
      void: "#08060F", panel: "#130F22", panelAlt: "#1C1733", line: "rgba(25,240,255,0.20)",
      ash: "#F5F2FF", ashDim: "rgba(245,242,255,0.70)", ashFaint: "rgba(245,242,255,0.54)",
      accent: "#FF5AE1", good: "#3DFF9E", alert: "#FFE14D",
      cta: "#19F0FF", inverse: "#08060F",
      glassFill: "rgba(19,15,34,0.80)", glassBorder: "1px solid rgba(255,61,219,0.45)",
      tint: "rgba(255,90,225,0.14)", tintGood: "rgba(61,255,158,0.14)",
      overlayFill: "rgba(8,6,15,0.97)", overlayBtnFill: "#19F0FF", overlayBtnText: "#08060F",
      scrim: "rgba(8,6,15,0.7)", navActive: "rgba(25,240,255,0.14)",
      isDark: true,
      heroBg: "#130F22", heroBorder: "1px solid rgba(255,61,219,0.60)", heroGlow: "rgba(255,61,219,0.22)",
      heroMotif: null, motifColor: null,
      texture: "grid", heroScrim: null,
      bandOpacity: 1,
    },
    fonts: { display: "'Orbitron', sans-serif", body: "'Inter', sans-serif", mono: "'JetBrains Mono', monospace" },
  },
};

// Loaded only when a skin is previewed or equipped (see useTheme), so the
// free looks don't pay for extra font families. Ridgeline, Ridgeline
// Black and Gun Metal use the shared type, so they need nothing here.
export const SKIN_FONT_URLS = {
  m81: "https://fonts.googleapis.com/css2?family=Saira+Stencil+One&display=swap",
  neon: "https://fonts.googleapis.com/css2?family=Orbitron:wght@600;700;800&display=swap",
};

// Any look id -> { T, fonts }. Unknown ids fall back to Light.
export function resolveLook(id) {
  if (id === "dark") return { T: DARK_T, fonts: DARK_FONTS };
  if (SKIN_THEMES[id]) return SKIN_THEMES[id];
  return { T: LIGHT_T, fonts: LIGHT_FONTS };
}
