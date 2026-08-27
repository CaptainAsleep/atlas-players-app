import { useEffect, useState } from "react";
import { collection, deleteDoc, doc, increment, onSnapshot, orderBy, query, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";

// Does the current player have a real booking for this event? A single
// doc existence check, same idiom as favorites.
export function useMyBooking(uid, eventId) {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid || !eventId) {
      setBooking(null);
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(doc(db, "users", uid, "bookings", eventId), (snap) => {
      setBooking(snap.exists() ? snap.data() : null);
      setLoading(false);
    });
    return unsub;
  }, [uid, eventId]);

  return { booking, bookingLoading: loading };
}

// Everyone who's booked a specific event — public read, so this doubles as
// the "who's going" list on the event page.
export function useEventBookings(eventId) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) {
      setBookings([]);
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(
      query(collection(db, "events", eventId, "bookings"), orderBy("bookedAt")),
      (snap) => {
        setBookings(snap.docs.map((d) => d.data()));
        setLoading(false);
      },
      (err) => {
        console.error("useEventBookings error:", err);
        setLoading(false);
      }
    );
    return unsub;
  }, [eventId]);

  return { bookings, bookingsLoading: loading };
}

// A player's own full list of bookings — powers the real Schedule "Booked"
// tab. Denormalized enough (title/fieldName/date) to render without a
// second lookup per event.
export function useMyBookings(uid) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setBookings([]);
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(
      collection(db, "users", uid, "bookings"),
      (snap) => {
        setBookings(snap.docs.map((d) => ({ eventId: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("useMyBookings error:", err);
        setLoading(false);
      }
    );
    return unsub;
  }, [uid]);

  return { bookings, bookingsLoading: loading };
}

export function useBookingActions() {
  // A real batch, not two separate calls like favorites uses — a booking
  // is a bigger commitment (gated behind a signed waiver), so all three
  // writes succeed together or none do, rather than risking a booking
  // that exists in one place but not the other.
  async function bookEvent(uid, profile, event) {
    const batch = writeBatch(db);
    batch.set(doc(db, "events", event.id, "bookings", uid), {
      uid,
      callsign: profile?.callsign || "Player",
      avatarUrl: profile?.avatarUrl || null,
      bookedAt: serverTimestamp(),
    });
    batch.set(doc(db, "users", uid, "bookings", event.id), {
      eventId: event.id,
      fieldId: event.fieldId,
      eventTitle: event.title,
      fieldName: event.fieldName,
      date: event.date,
      endDate: event.endDate || null,
      bookedAt: serverTimestamp(),
    });
    batch.update(doc(db, "events", event.id), { bookedCount: increment(1) });
    await batch.commit();
  }

  async function cancelBooking(uid, eventId) {
    const batch = writeBatch(db);
    batch.delete(doc(db, "events", eventId, "bookings", uid));
    batch.delete(doc(db, "users", uid, "bookings", eventId));
    batch.update(doc(db, "events", eventId), { bookedCount: increment(-1) });
    await batch.commit();
  }

  return { bookEvent, cancelBooking };
}
