import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

// The player's own check-in code for one booking (2026-10-22). Lives in
// bookingCodes/{eventId}_{uid}, readable only by that player — never on the
// booking doc (public) or the booking mirror (friends can read it). Written
// by Cloud Functions in the same transaction as the booking; live, so it
// shows up the moment a paid booking's webhook lands.
export function useBookingCode(uid, eventId) {
  const [code, setCode] = useState(null);
  useEffect(() => {
    if (!uid || !eventId) {
      setCode(null);
      return;
    }
    const unsub = onSnapshot(
      doc(db, "bookingCodes", `${eventId}_${uid}`),
      (snap) => setCode(snap.exists() ? snap.data().code || null : null),
      // Missing doc reads as "no code" (a booking from before codes, until
      // the backfill runs); a permission error just hides it.
      () => setCode(null)
    );
    return unsub;
  }, [uid, eventId]);
  return code;
}

// "K7MPQ3XR" -> "K7MP-Q3XR"
export function formatBookingCode(code) {
  const c = String(code || "");
  return c.length === 8 ? `${c.slice(0, 4)}-${c.slice(4)}` : c;
}
