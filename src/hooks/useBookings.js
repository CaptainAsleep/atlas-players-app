import { useEffect, useState } from "react";
import { collection, deleteDoc, doc, getDocs, increment, onSnapshot, orderBy, query, writeBatch } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../lib/firebase";

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

// A one-time (non-live) read of an event's bookings — used by the
// team-threshold patch check, which just needs a current count each time
// it runs, not a live subscription per event.
export async function getEventBookingsOnce(eventId) {
  const snap = await getDocs(collection(db, "events", eventId, "bookings"));
  return snap.docs.map((d) => d.data());
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
  // Cloud-Function-only now, not a direct client write — firestore.rules
  // no longer allows a client to create a booking document at all. This
  // used to be a plain writeBatch straight from here with no server-side
  // price check behind it whatsoever (a real security gap: anyone could
  // call it directly for any event, paid or not, and get in for free).
  // bookFreeEvent resolves the real price itself and only writes if it
  // actually comes out to $0 — profile lookup and all three writes now
  // happen server-side, in one transaction, so this is just the trigger.
  async function bookEvent(uid, profile, event, selectedChoice) {
    const call = httpsCallable(functions, "bookFreeEvent");
    await call({ eventId: event.id, selectedChoiceId: selectedChoice?.id || null });
  }

  async function cancelBooking(uid, eventId) {
    const batch = writeBatch(db);
    batch.delete(doc(db, "events", eventId, "bookings", uid));
    batch.delete(doc(db, "users", uid, "bookings", eventId));
    batch.update(doc(db, "events", eventId), { bookedCount: increment(-1) });
    await batch.commit();
  }

  // For a real, priced event — redirects to Stripe Checkout rather than
  // writing a booking directly. The booking itself only gets created by
  // the webhook, server-side, once payment actually succeeds — this
  // function's whole job is just getting the player to a real checkout
  // page, nothing more.
  async function createBookingCheckout(eventId, selectedChoiceId) {
    const call = httpsCallable(functions, "createBookingCheckout");
    const result = await call({ eventId, selectedChoiceId: selectedChoiceId || null });
    return result.data.url;
  }

  return { bookEvent, cancelBooking, createBookingCheckout };
}
