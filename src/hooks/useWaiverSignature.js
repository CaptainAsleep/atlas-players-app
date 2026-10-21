import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, query, serverTimestamp, where, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";

// Bumped whenever the guardian-notice wording in App.jsx changes, so a
// child's signature doc records exactly which notice text was shown.
export const GUARDIAN_NOTICE_VERSION = "2026-10-draft-1";
// Bumped whenever the "you are not playing" section (child-only bookings,
// GUARDIAN_ABSENT_NOTICE_TEXT in App.jsx) changes.
export const GUARDIAN_ABSENT_NOTICE_VERSION = "2026-10-draft-1";

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
  // Children whose "parent not playing" acknowledgement doc exists
  // (uid_eventId_dependentId_absent, guardianAbsent: true).
  const [signedAbsentDependentIds, setSignedAbsentDependentIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid || !eventId) {
      setSignature(null);
      setSignedDependentIds([]);
      setSignedAbsentDependentIds([]);
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(
      query(collection(db, "waiverSignatures"), where("uid", "==", uid), where("eventId", "==", eventId)),
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setSignature(docs.find((d) => !d.dependentId) || null);
        setSignedDependentIds(docs.filter((d) => d.dependentId && !d.guardianAbsent).map((d) => d.dependentId));
        setSignedAbsentDependentIds(docs.filter((d) => d.dependentId && d.guardianAbsent === true).map((d) => d.dependentId));
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
  // guardianAbsent (child-only booking): also writes one acknowledgement doc
  // per child for the "you are not playing" section.
  async function signWaiver({ uid, eventId, fieldId = null, hostOwnerId = null, signedName, waiverVersion, dependents = [], guardianAbsent = false }) {
    const batch = writeBatch(db);
    if (!signature) {
      batch.set(doc(db, "waiverSignatures", `${uid}_${eventId}`), {
        uid,
        eventId,
        fieldId: fieldId ?? null,
        // Atlas Major: no field, so the organizer is the one who needs to
        // read this signature (firestore.rules waiverSignatures read).
        ...(hostOwnerId ? { hostOwnerId } : {}),
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
        fieldId: fieldId ?? null,
        // Atlas Major: no field, so the organizer is the one who needs to
        // read this signature (firestore.rules waiverSignatures read).
        ...(hostOwnerId ? { hostOwnerId } : {}),
        dependentId: dep.id,
        dependentName: dep.fullName,
        signedName,
        waiverVersion,
        guardianNoticeVersion: GUARDIAN_NOTICE_VERSION,
        signedAt: serverTimestamp(),
      });
    }
    if (guardianAbsent) {
      for (const dep of dependents) {
        if (signedAbsentDependentIds.includes(dep.id)) continue;
        batch.set(doc(db, "waiverSignatures", `${uid}_${eventId}_${dep.id}_absent`), {
          uid,
          eventId,
          fieldId: fieldId ?? null,
          ...(hostOwnerId ? { hostOwnerId } : {}),
          dependentId: dep.id,
          dependentName: dep.fullName,
          guardianAbsent: true,
          signedName,
          waiverVersion,
          guardianNoticeVersion: GUARDIAN_NOTICE_VERSION,
          guardianAbsentNoticeVersion: GUARDIAN_ABSENT_NOTICE_VERSION,
          signedAt: serverTimestamp(),
        });
      }
    }
    await batch.commit();
  }

  return { signature, signedDependentIds, signedAbsentDependentIds, signatureLoading: loading, signWaiver };
}
