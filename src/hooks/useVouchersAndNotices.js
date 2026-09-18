import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query, updateDoc, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../lib/firebase";

// A player's active, field-scoped credit balances — issued by
// cancelEventWithVouchers when an owner cancels an event they'd already
// paid to attend, spent (in full, or partially — leftover balance stays
// active) by bookEventWithVoucher. Redeemed-down-to-zero vouchers flip to
// status "redeemed" server-side and drop out of this live query on their
// own, same idiom as favorites/patches elsewhere in this app.
export function useMyVouchers(uid) {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setVouchers([]);
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(
      query(collection(db, "users", uid, "vouchers"), where("status", "==", "active")),
      (snap) => {
        setVouchers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("useMyVouchers error:", err);
        setLoading(false);
      }
    );
    return unsub;
  }, [uid]);

  return { vouchers, vouchersLoading: loading };
}

// One-at-a-time "an event you reserved was canceled" popup, shown on
// next app open — same pattern as the owner app's usePayoutCelebration in
// useOwnerEvents.js (oldest-unacknowledged-first, dismissing flips a flag
// server never re-shows once acknowledged). Every booking (paid or free)
// gets one of these when its event is canceled; only the paid ones carry
// a voucherAmountCents.
export function useCancellationNotices(uid) {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setNotices([]);
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(
      query(
        collection(db, "users", uid, "cancellationNotices"),
        where("acknowledged", "==", false),
        orderBy("createdAt", "asc")
      ),
      (snap) => {
        setNotices(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("useCancellationNotices error:", err);
        setLoading(false);
      }
    );
    return unsub;
  }, [uid]);

  const noticeToShow = notices.length > 0 ? notices[0] : null;

  async function acknowledgeNotice(noticeId) {
    await updateDoc(doc(db, "users", uid, "cancellationNotices", noticeId), { acknowledged: true });
  }

  return { noticeToShow, noticesLoading: loading, acknowledgeNotice };
}

// Redeems an active voucher against a future event at the same field —
// entirely server-side, no Stripe involved at all. Compared against the
// new event's bare ticket price only, never a fee-inclusive total: the
// player already paid Atlas's platform fee once, on the original
// canceled booking, and isn't charged a second one just to spend the
// credit it left them. A voucher that doesn't cover the ticket price
// throws failed-precondition with a message safe to show as-is.
export function useVoucherRedemption() {
  async function redeemVoucher(eventId, voucherId, selectedChoiceId, location) {
    const call = httpsCallable(functions, "bookEventWithVoucher");
    await call({ eventId, voucherId, selectedChoiceId: selectedChoiceId || null, location: location || null });
  }
  return { redeemVoucher };
}
