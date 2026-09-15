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
};

export const LIGHT_FONTS = {
  display: { fontFamily: "'Space Grotesk', sans-serif" },
  body: { fontFamily: "'Inter', sans-serif" },
  mono: { fontFamily: "'IBM Plex Mono', monospace" },
};

export const DARK_FONTS = {
  display: { fontFamily: "'Unbounded', sans-serif" },
  body: { fontFamily: "'Plus Jakarta Sans', sans-serif" },
  mono: { fontFamily: "'JetBrains Mono', monospace" },
};

// Both themes' font families loaded together (unconditionally) so switching
// themes never needs a fresh network fetch or risks a flash of unstyled
// text — a modest extra one-time payload for a PWA that already loads 3
// families today.
export const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&family=Unbounded:wght@500;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700&display=swap');
`;
