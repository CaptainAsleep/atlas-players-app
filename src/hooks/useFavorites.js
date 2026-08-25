import { useEffect, useState } from "react";
import { collection, deleteDoc, doc, increment, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

// Favorites live at users/{uid}/favorites/{type}-{refId} so a field and an
// event can never collide, and toggling is just "does this doc id exist?".
export function useFavorites(uid) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setFavorites([]);
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(
      collection(db, "users", uid, "favorites"),
      (snap) => {
        setFavorites(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("useFavorites error:", err);
        setLoading(false);
      }
    );
    return unsub;
  }, [uid]);

  const isFavorited = (type, refId) => favorites.some((f) => f.type === type && f.refId === refId);

  async function toggleFavorite(type, refId) {
    if (!uid) return;
    const favId = `${type}-${refId}`;
    const ref = doc(db, "users", uid, "favorites", favId);
    const wasFavorited = isFavorited(type, refId);
    if (wasFavorited) {
      await deleteDoc(ref);
    } else {
      await setDoc(ref, { type, refId, savedAt: serverTimestamp() });
    }
    // Client-side counter, not a Cloud Function — honest real number, but
    // can very rarely drift by one if a write fails mid-flight (e.g. a
    // dropped connection between the two calls). Acceptable for an
    // interest signal; would want a server-maintained counter if this ever
    // needs to be exact (e.g. tied to real capacity/payment logic).
    if (type === "event") {
      try {
        await updateDoc(doc(db, "events", refId), { interestCount: increment(wasFavorited ? -1 : 1) });
      } catch (err) {
        console.error("interestCount update failed:", err);
      }
    }
  }

  return { favorites, favoritesLoading: loading, isFavorited, toggleFavorite };
}
