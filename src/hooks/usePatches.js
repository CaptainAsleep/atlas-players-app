import { useEffect, useState } from "react";
import { collection, doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

// Patches are earned, not self-managed — granted automatically by
// checkInFromScan (per-event) and the team-threshold check in App.jsx,
// both writing here via grantPatch. Once granted, a patch is permanent —
// there's no remove, same as a real earned medal. A player can still
// choose which one to feature.
export function usePatches(uid) {
  const [patches, setPatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setPatches([]);
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(
      collection(db, "users", uid, "patches"),
      (snap) => {
        setPatches(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("usePatches error:", err);
        setLoading(false);
      }
    );
    return unsub;
  }, [uid]);

  // For a patch that's already hosted somewhere (a check-in reward patch
  // the owner uploaded once, to be granted to many players) — just
  // references that same URL rather than re-uploading a duplicate copy
  // into every player's own storage path.
  //
  // Genuinely idempotent, not just "hard to call twice" — the document id
  // is deterministically derived from the patch name (not random), and
  // this checks for an existing doc before writing. A ref-based in-memory
  // guard alone isn't enough here: it resets to empty on every fresh app
  // load, so it can't prevent a duplicate grant across two separate
  // sessions, only within one. This makes a repeat call a genuine no-op
  // at the data level regardless of what triggered it twice.
  async function grantPatch(uid, name, imageUrl, details = null) {
    const patchId = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-+|-+$)/g, "");
    const ref = doc(db, "users", uid, "patches", patchId);
    const existing = await getDoc(ref);
    if (existing.exists()) return { id: patchId, name, imageUrl, details, alreadyOwned: true };
    await setDoc(ref, {
      name,
      imageUrl,
      details,
      addedAt: serverTimestamp(),
      granted: true,
      // Starts unseen — this is exactly what drives the unlock
      // notification. Marked seen once the player actually views it.
      seen: false,
    });
    return { id: patchId, name, imageUrl, details };
  }

  async function markPatchSeen(uid, patchId) {
    await updateDoc(doc(db, "users", uid, "patches", patchId), { seen: true });
  }

  // Denormalized onto the profile doc (rather than just referencing a patch
  // id) so anywhere that displays the callsign can show the featured patch
  // with a single read, no extra query needed.
  async function setFeaturedPatch(uid, patch) {
    const featuredPatch = patch ? { name: patch.name, imageUrl: patch.imageUrl } : null;
    await updateDoc(doc(db, "users", uid), { featuredPatch });
    await updateDoc(doc(db, "publicProfiles", uid), { featuredPatch });
  }

  return { patches, patchesLoading: loading, grantPatch, markPatchSeen, setFeaturedPatch };
}
