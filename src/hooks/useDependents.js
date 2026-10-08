import { useEffect, useState } from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

// A guardian can book themselves plus up to 4 children onto one event.
// Enforced for real server-side (functions/index.js resolveAttendees) —
// these constants only drive the UI. Keep in sync with that file by hand,
// same as isNearField/distanceMiles, since functions/ and src/ share no
// module.
export const MAX_DEPENDENTS = 4;
export const MAX_ATTENDEES_PER_BOOKING = 5;
export const ADULT_AGE = 18;

// Preset avatar ids only — never an uploaded photo of a minor. The
// UI (App.jsx) maps each id to an icon; anything unrecognized falls back
// to a default there, so adding an id here later is safe.
export const CHILD_AVATAR_IDS = ["shield", "target", "crosshair", "compass", "flag", "star", "rocket", "medal"];

// Whole years old on a given date, from plain YYYY-MM-DD strings — no
// Date objects, so there's no timezone drift to get a child's age wrong
// by a day on their birthday. Returns null for anything malformed. Mirrors
// ageOnDate() in functions/index.js exactly (the server's is the one that
// actually enforces minimum age; this only drives what the UI offers).
export function ageOnDate(dob, onDate) {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob || "");
  const o = /^(\d{4})-(\d{2})-(\d{2})/.exec(onDate || "");
  if (!d || !o) return null;
  let age = Number(o[1]) - Number(d[1]);
  if (Number(o[2]) < Number(d[2]) || (Number(o[2]) === Number(d[2]) && Number(o[3]) < Number(d[3]))) age -= 1;
  return age;
}

// Child profiles live at users/{uid}/dependents/{id} — a profile the
// parent keeps, NOT an account: no auth identity, no login. Parent-only
// by rule (firestore.rules); a field owner only ever sees the snapshot
// taken at booking time, never this live record. dob is set once at
// creation and the rules refuse any later change to it.
export function useDependents(uid) {
  const [dependents, setDependents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setDependents([]);
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(
      query(collection(db, "users", uid, "dependents"), orderBy("createdAt", "asc")),
      (snap) => {
        setDependents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("useDependents error:", err);
        setLoading(false);
      }
    );
    return unsub;
  }, [uid]);

  async function addDependent({ fullName, callsign, dob, avatar }) {
    if (!uid) return;
    if (dependents.length >= MAX_DEPENDENTS) {
      throw new Error(`You can add up to ${MAX_DEPENDENTS} child profiles.`);
    }
    await addDoc(collection(db, "users", uid, "dependents"), {
      fullName: fullName.trim(),
      callsign: callsign.trim(),
      dob, // YYYY-MM-DD, locked after this write
      avatar: avatar || CHILD_AVATAR_IDS[0],
      createdAt: serverTimestamp(),
    });
  }

  // dob is deliberately not accepted here — and the rules would reject it
  // anyway. createdAt is carried through untouched by updateDoc.
  async function updateDependent(id, { fullName, callsign, avatar }) {
    if (!uid) return;
    await updateDoc(doc(db, "users", uid, "dependents", id), {
      fullName: fullName.trim(),
      callsign: callsign.trim(),
      avatar,
    });
  }

  async function deleteDependent(id) {
    if (!uid) return;
    await deleteDoc(doc(db, "users", uid, "dependents", id));
  }

  return { dependents, dependentsLoading: loading, addDependent, updateDependent, deleteDependent };
}
