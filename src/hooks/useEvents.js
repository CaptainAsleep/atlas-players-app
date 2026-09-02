import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";

export function useEvents(fieldId) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const base = collection(db, "events");
    const q = fieldId
      ? query(base, where("fieldId", "==", fieldId), orderBy("date"))
      : query(base, orderBy("date"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        // Soft-deleted events (owner app's deleteEvent) stay in Firestore
        // so the admin portal can still see their booking/revenue history —
        // they just shouldn't be visible here, same as a real delete used to be.
        setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((e) => !e.draft && !e.deleted));
        setLoading(false);
      },
      (err) => {
        console.error("useEvents error:", err);
        setLoading(false);
      }
    );
    return unsub;
  }, [fieldId]);

  return { events, loading };
}
