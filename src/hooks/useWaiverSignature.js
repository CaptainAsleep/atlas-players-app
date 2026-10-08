import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, query, serverTimestamp, where, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";

// Bumped whenever the guardian-notice wording in App.jsx changes, so a
// child's signature doc records exactly which notice text was shown.
export const GUARDIAN_NOTICE_VERSION = "2026-10-draft-1";

// Signatures live at deterministic ids so nothing can be duplicated by
// construction: the guardian's own doc is uid_eventId (unchanged from
// before), and each child's is uid_eventId_dependentId. All docs are
// immutable (rules: update/delete false), so "re-signing" after an
// abandoned checkout only ever writes the docs that are still missing.
// One query (uid + eventId) reads all of them; the rule allows it because
// every doc it returns has uid == the caller.
export function useWaiverSignature(uid, eventId) {
  const [signature, setSignature] = useState(null);
  const [signedDependentIds, setSignedDependentIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid || !eventId) {
      setSignature(null);
      setSignedDependentIds([]);
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(
      query(collection(db, "waiverSignatures"), where("uid", "==", uid), where("eventId", "==", eventId)),
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setSignature(docs.find((d) => !d.dependentId) || null);
        setSignedDependentIds(docs.filter((d) => d.dependentId).map((d) => d.dependentId));
        setLoading(false);
      },
      (err) => {
        console.error("useWaiverSignature error:", err);
        setLoading(false);
      }
    );
    return unsub;
  }, [uid, eventId]);

  // dependents: [{ id, fullName }] the guardian is signing for right now.
  // Writes the guardian's own doc only if it doesn't exist yet, and one doc
  // per child that doesn't have one — all in a single batch, so it either
  // fully lands or not at all. waiverVersion is a permanent record of
  // exactly which wording was agreed to, in case the owner edits it later.
  async function signWaiver({ uid, eventId, fieldId, signedName, waiverVersion, dependents = [] }) {
    const batch = writeBatch(db);
    if (!signature) {
      batch.set(doc(db, "waiverSignatures", `${uid}_${eventId}`), {
        uid,
        eventId,
        fieldId,
        signedName,
        waiverVersion,
        signedAt: serverTimestamp(),
      });
    }
    for (const dep of dependents) {
      if (signedDependentIds.includes(dep.id)) continue;
      batch.set(doc(db, "waiverSignatures", `${uid}_${eventId}_${dep.id}`), {
        uid,
        eventId,
        fieldId,
        dependentId: dep.id,
        dependentName: dep.fullName,
        signedName,
        waiverVersion,
        guardianNoticeVersion: GUARDIAN_NOTICE_VERSION,
        signedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  }

  return { signature, signedDependentIds, signatureLoading: loading, signWaiver };
}
