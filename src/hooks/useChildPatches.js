import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, getDocs, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { bookingHasChildren } from "./useBookings";

// Child Patches (2026-10-27). A child profile's patches live at
// users/{parentUid}/dependents/{depId}/childPatches/{patchId} — private to
// the parent (deliberately not "patches", whose collection-group rule is
// public). Same doc shape and the same doc ids as an adult's
// users/{uid}/patches, so graduation (claimChildProfile) can move them
// straight across and dedupe against what the new account already has.

// { [depId]: [patch] } for every listed child, live.
export function useChildPatches(uid, dependentIds) {
  const key = (dependentIds || []).join(",");
  const [byDep, setByDep] = useState({});
  const [loadedKeys, setLoadedKeys] = useState(() => new Set());

  useEffect(() => {
    if (!uid || !key) {
      setByDep({});
      setLoadedKeys(new Set());
      return;
    }
    const ids = key.split(",");
    setLoadedKeys(new Set());
    const unsubs = ids.map((depId) => onSnapshot(
      collection(db, "users", uid, "dependents", depId, "childPatches"),
      (snap) => {
        setByDep((prev) => ({ ...prev, [depId]: snap.docs.map((d) => ({ id: d.id, ...d.data() })) }));
        setLoadedKeys((prev) => new Set(prev).add(depId));
      },
      (err) => {
        console.error("useChildPatches error:", depId, err);
        setLoadedKeys((prev) => new Set(prev).add(depId));
      }
    ));
    return () => unsubs.forEach((u) => u());
  }, [uid, key]);

  const loading = !!key && key.split(",").some((id) => !loadedKeys.has(id));
  return { childPatchesByDep: byDep, childPatchesLoading: loading };
}

// Same no-op-if-it-exists idiom as usePatches' grantPatch (doc id = name
// slug, or opts.docId for owner-built field patches).
export async function grantChildPatch(uid, depId, name, imageUrl, details = null, opts = {}) {
  const patchId = opts.docId || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-+|-+$)/g, "");
  const ref = doc(db, "users", uid, "dependents", depId, "childPatches", patchId);
  const existing = await getDoc(ref);
  if (existing.exists()) return { id: patchId, alreadyOwned: true };
  await setDoc(ref, {
    ...(opts.extra || {}),
    name,
    imageUrl,
    details,
    addedAt: serverTimestamp(),
    granted: true,
    seen: false,
  });
  return { id: patchId };
}

export async function markChildPatchSeen(uid, depId, patchId) {
  await updateDoc(doc(db, "users", uid, "dependents", depId, "childPatches", patchId), { seen: true });
}

// Each child's games, derived from what already exists: the parent's own
// booking mirrors that had children on them, plus the private
// attendeeDetails/{depId} snapshot the booking functions write for every
// child on a booking (the parent can read those). Check-in is booking-level,
// so a child "attended" when the party was checked in.
// Returns { [depId]: [booking] } in the shape the achievement engine reads.
// The parent's walk-on flag and the child-only marker are stripped: they
// describe the parent's booking, not the child's game.
export function useChildHistory(uid, myBookings, dependentIds, myBookingsLoading) {
  const familyBookings = useMemo(() => (myBookings || []).filter(bookingHasChildren), [myBookings]);
  // Re-read only when the set of family bookings changes. Check-in state is
  // taken from the live mirror below, so a check-in doesn't need a re-read.
  const readKey = familyBookings.map((b) => b.eventId).sort().join(",");
  const [attendance, setAttendance] = useState({}); // { eventId: [depId] }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid || myBookingsLoading) return;
    if (!readKey) {
      setAttendance({});
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all(readKey.split(",").map((eventId) =>
      getDocs(collection(db, "events", eventId, "bookings", uid, "attendeeDetails"))
        .then((snap) => [eventId, snap.docs.map((d) => d.id)])
        .catch((err) => {
          console.error("child history read failed:", eventId, err);
          return [eventId, []];
        })
    )).then((pairs) => {
      if (cancelled) return;
      setAttendance(Object.fromEntries(pairs));
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [uid, readKey, myBookingsLoading]);

  const historyByDep = useMemo(() => {
    const out = {};
    (dependentIds || []).forEach((id) => { out[id] = []; });
    familyBookings.forEach((b) => {
      (attendance[b.eventId] || []).forEach((depId) => {
        if (!out[depId]) return;
        // eslint-disable-next-line no-unused-vars
        const { guardianPlaying, walkOnEligible, ...rest } = b;
        out[depId].push(rest);
      });
    });
    return out;
  }, [familyBookings, attendance, dependentIds]);

  return { childHistoryByDep: historyByDep, childHistoryLoading: loading || !!myBookingsLoading };
}
