import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

// Owner-built unlockable patches (2026-10-27), fields/{fieldId}/fieldPatches
// (not "patches" -- that name is reserved for users/{uid}/patches, which a
// collectionGroup("patches") read in the admin portal counts).
// Public read. Loaded only for the fields passed in — the player app passes
// the fields the player has actually checked in at (for unlocks / Active
// Achievements) plus whichever field page is open (for its "Unlockable
// patches here" strip) — so cost scales with fields played, not all of Atlas.
// Returns { byField: { [fieldId]: patch[] }, loading } — loading stays true
// until every requested field has delivered its first snapshot, so the
// grant pass never runs against a half-loaded set.
export function useFieldPatches(fieldIds) {
  const key = useMemo(() => [...new Set((fieldIds || []).filter(Boolean))].sort().join("|"), [fieldIds]);
  const [byField, setByField] = useState({});
  const [loadedKey, setLoadedKey] = useState(null);

  useEffect(() => {
    const ids = key ? key.split("|") : [];
    if (ids.length === 0) {
      setByField({});
      setLoadedKey(key);
      return undefined;
    }
    const seen = new Set();
    const next = {};
    const unsubs = ids.map((fieldId) =>
      onSnapshot(
        collection(db, "fields", fieldId, "fieldPatches"),
        (snap) => {
          next[fieldId] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          seen.add(fieldId);
          setByField({ ...next });
          if (seen.size === ids.length) setLoadedKey(key);
        },
        (err) => {
          console.error("useFieldPatches error:", fieldId, err);
          next[fieldId] = [];
          seen.add(fieldId);
          setByField({ ...next });
          if (seen.size === ids.length) setLoadedKey(key);
        }
      )
    );
    return () => unsubs.forEach((u) => u());
  }, [key]);

  return { byField, fieldPatchesLoading: loadedKey !== key };
}
