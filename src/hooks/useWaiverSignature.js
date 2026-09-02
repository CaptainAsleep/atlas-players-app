import { useEffect, useState } from "react";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

// Signatures live at a deterministic id (uid_eventId) so a player can only
// ever have one signature per event — no duplicates possible by construction,
// and looking up "did I already sign this" is a single doc read, not a query.
export function useWaiverSignature(uid, eventId) {
  const [signature, setSignature] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid || !eventId) {
      setSignature(null);
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(
      doc(db, "waiverSignatures", `${uid}_${eventId}`),
      (snap) => {
        setSignature(snap.exists() ? snap.data() : null);
        setLoading(false);
      },
      (err) => {
        console.error("useWaiverSignature error:", err);
        setLoading(false);
      }
    );
    return unsub;
  }, [uid, eventId]);

  async function signWaiver({ uid, eventId, fieldId, signedName, waiverVersion }) {
    // waiverVersion is a permanent record of exactly which wording the
    // player agreed to — critical if the field owner ever edits the text
    // later, so there's no ambiguity about what was actually signed.
    await setDoc(doc(db, "waiverSignatures", `${uid}_${eventId}`), {
      uid,
      eventId,
      fieldId,
      signedName,
      waiverVersion,
      signedAt: serverTimestamp(),
    });
  }

  return { signature, signatureLoading: loading, signWaiver };
}
