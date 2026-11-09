// Full-screen overlays (photo crop tool, trading-card screens) hide the
// floating bottom nav while they're open (Michael, 2026-11-08). Counted so
// two overlays open at once don't bring the nav back early.
import { useEffect } from "react";

export function useHideBottomNav(active = true) {
  useEffect(() => {
    if (!active) return undefined;
    const b = document.body;
    b.dataset.navHidden = String((Number(b.dataset.navHidden) || 0) + 1);
    b.classList.add("atlas-hide-nav");
    return () => {
      const n = (Number(b.dataset.navHidden) || 1) - 1;
      b.dataset.navHidden = String(n);
      if (n <= 0) b.classList.remove("atlas-hide-nav");
    };
  }, [active]);
}
