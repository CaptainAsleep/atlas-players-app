import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { resolveLook, SKIN_THEMES, SKIN_FONT_URLS } from "../theme";

const STORAGE_KEY = "atlas-theme";
const ThemeContext = createContext(null);

const asFont = (f) => (typeof f === "string" ? { fontFamily: f } : f);
const isLookId = (id) => id === "light" || id === "dark" || !!SKIN_THEMES[id];

// Paid skins (2026-11-09). The look a player has equipped is saved on
// their account (users/{uid}.appearance — the Firestore rule only accepts
// "light", "dark" or a skin they own), so it follows them to any device.
// localStorage keeps a copy of the last look shown on this device so the
// app paints in the right look before Firestore answers; AppShell calls
// syncFromAccount() once the account's value is known, and the account
// wins. A player who's never picked (or an existing Light/Dark player from
// before skins) keeps their device value, and AppShell copies it up.
//
// Preview: previewTheme temporarily overrides the look everywhere without
// touching what's saved. Clearing it restores the saved look.
export function ThemeProvider({ children }) {
  const [saved, setSaved] = useState(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return isLookId(v) ? v : "light";
    } catch {
      return "light";
    }
  });
  const [previewTheme, setPreviewThemeState] = useState(null);
  const theme = previewTheme || saved;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, saved);
    } catch {
      // Storage can be blocked (private browsing, locked-down device) —
      // the look just won't survive a relaunch before sign-in. Not fatal.
    }
  }, [saved]);

  const look = useMemo(() => resolveLook(theme), [theme]);

  useEffect(() => {
    const bg = look.T.void;
    // Keep the PWA's OS status-bar tint in sync with the active look.
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", bg);
    // index.css hardcodes the light page color on html/body; anything not
    // covered by a screen (iOS overscroll bounce, safe-area edges, the gap
    // during a screen transition) would flash it. color-scheme makes
    // native controls (date pickers, selects, scrollbars, autofill) match.
    document.documentElement.style.backgroundColor = bg;
    document.body.style.backgroundColor = bg;
    document.documentElement.style.colorScheme = look.T.isDark ? "dark" : "light";
  }, [look]);

  // iOS home-screen apps read the status-bar color from index.html at
  // launch and don't repaint it when the meta tag changes later. Cache the
  // equipped look's background (not a preview) so index.html's inline
  // script can set theme-color before iOS reads it on the next launch.
  useEffect(() => {
    try {
      localStorage.setItem("atlas-theme-bg", resolveLook(saved).T.void);
    } catch {
      // Storage blocked — status bar falls back to the light default.
    }
  }, [saved]);

  // A skin's display font is fetched the first time that skin is shown
  // (previewed or equipped) — the free looks' fonts are already in FONTS.
  useEffect(() => {
    const href = SKIN_FONT_URLS[theme];
    if (!href || document.querySelector(`link[data-skin-font="${theme}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.setAttribute("data-skin-font", theme);
    document.head.appendChild(link);
  }, [theme]);

  const value = useMemo(() => ({
    T: look.T,
    // LIGHT_FONTS/DARK_FONTS hold { fontFamily } objects; skins hold strings.
    display: asFont(look.fonts.display),
    body: asFont(look.fonts.body),
    mono: asFont(look.fonts.mono),
    theme, // the look on screen right now (preview included)
    savedTheme: saved, // the look the player has equipped
    previewTheme,
    // Device-side apply. Saving to the account is the caller's job
    // (useSkins().equip), since the rule check happens there.
    setTheme: (id) => setSaved(isLookId(id) ? id : "light"),
    setPreviewTheme: (id) => setPreviewThemeState(id && SKIN_THEMES[id] ? id : null),
    syncFromAccount: (id) => { if (isLookId(id)) setSaved(id); },
  }), [look, theme, saved, previewTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
