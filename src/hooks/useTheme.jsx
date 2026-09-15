import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { LIGHT_T, DARK_T, LIGHT_FONTS, DARK_FONTS } from "../theme";

const STORAGE_KEY = "atlas-theme";
const ThemeContext = createContext(null);

// Device-local display preference — not synced to the player's account,
// same reasoning as the referral-code capture elsewhere in this app (a
// real deployed PWA, not a sandboxed artifact, so localStorage is the
// right tool here). Defaults to "light" so nothing changes for anyone
// until they open Profile and opt into Dark Mode themselves.
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage can be blocked (private browsing, locked-down device) —
      // the toggle just won't persist across sessions, not fatal.
    }
    // Keep the PWA's OS status-bar tint in sync with the active theme.
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#0A0C0F" : "#F2F2ED");
  }, [theme]);

  const value = useMemo(() => {
    const T = theme === "dark" ? DARK_T : LIGHT_T;
    const fonts = theme === "dark" ? DARK_FONTS : LIGHT_FONTS;
    return { T, display: fonts.display, body: fonts.body, mono: fonts.mono, theme, setTheme };
  }, [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
