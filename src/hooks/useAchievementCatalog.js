import { useEffect, useState } from "react";
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";
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

// Parses "atlas:redeem:{patchId}" from a scanned QR code, looks up that
// catalog entry, and grants it to the scanning player. Deliberately
// generic — works for Secret Agent today and any future owner-issued
// special patch without needing new code, since it's just referencing
// whatever catalog entry the patchId points to. No rules changes needed
// anywhere for this: achievementPatches is already public-read, and
// grantPatch already only ever writes to the scanning player's own
// patches subcollection.
export async function redeemPatchCode(rawText, uid, grantPatch) {
  const parts = (rawText || "").split(":");
  if (parts.length !== 3 || parts[0] !== "atlas" || parts[1] !== "redeem") {
    return { ok: false, reason: "not-atlas-code" };
  }
  const patchId = parts[2];
  const snap = await getDoc(doc(db, "achievementPatches", patchId));
  if (!snap.exists()) {
    return { ok: false, reason: "not-found" };
  }
  const patch = snap.data();
  const result = await grantPatch(uid, patch.name, patch.imageUrl, patch.details || null);
  if (result.alreadyOwned) {
    return { ok: false, reason: "already-owned", name: patch.name };
  }
  return { ok: true, name: patch.name };
}
