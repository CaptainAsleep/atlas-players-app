import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

// The full catalog — includes entries with trigger: null (cataloged but
// not automatable yet, e.g. no review system exists for Intel Officer).
// Filtering those out happens where the catalog is evaluated, not here.
export function useAchievementCatalog() {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "achievementPatches"),
      (snap) => {
        setCatalog(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("useAchievementCatalog error:", err);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  return { catalog, catalogLoading: loading };
}
