import { useEffect, useState } from "react";
import { collection, deleteDoc, doc, increment, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

// Favorites live at users/{uid}/favorites/{type}-{refId} so a field and an
// event can never collide, and toggling is just "does this doc id exist?".
// Takes profile too now — needed to denormalize callsign/avatarUrl onto
// the real per-event interested list (events/{eventId}/interested/{uid}),
// same pattern as bookings, so Booked and Interested can be shown together
// in one real segmented list instead of interestCount staying an
// anonymous number nobody can click into.
export function useFavorites(uid, profile) {
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
      // The real per-event list — mirrors the favorite/unfavorite action
      // exactly, so it can never drift out of sync with interestCount's
      // underlying truth (both driven by this same toggle).
      try {
        const interestedRef = doc(db, "events", refId, "interested", uid);
        if (wasFavorited) {
          await deleteDoc(interestedRef);
        } else {
          await setDoc(interestedRef, {
            uid,
            callsign: profile?.callsign || "Player",
            avatarUrl: profile?.avatarUrl || null,
            savedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        console.error("interested list update failed:", err);
      }
    }
  }

  return { favorites, favoritesLoading: loading, isFavorited, toggleFavorite };
}

// The real "who's interested" list for one event — mirrors
// useEventBookings exactly, so both can back the same segmented list
// (Booked, then Interested). Populated by toggleFavorite above.
export function useEventInterested(eventId) {
  const [interested, setInterested] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) {
      setInterested([]);
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(
      query(collection(db, "events", eventId, "interested"), orderBy("savedAt")),
      (snap) => {
        setInterested(snap.docs.map((d) => d.data()));
        setLoading(false);
      },
      (err) => {
        console.error("useEventInterested error:", err);
        setLoading(false);
      }
    );
    return unsub;
  }, [eventId]);

  return { interested, interestedLoading: loading };
}
