import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, query } from "firebase/firestore";
import { db } from "../lib/firebase";

// One player's public-facing profile — the narrow mirror, never the real
// users/{uid} doc. Safe to read for anyone, including strangers.
export function usePublicProfile(uid) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(doc(db, "publicProfiles", uid), (snap) => {
      setProfile(snap.exists() ? { uid, ...snap.data() } : null);
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  return { profile, profileLoading: loading };
}

// Every public profile — used for client-side callsign search. Fine at
// this scale; a real full-text search service would only be worth it once
// the player base is large enough that fetching them all gets expensive.
export function useAllPublicProfiles() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "publicProfiles")),
      (snap) => {
        setProfiles(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("useAllPublicProfiles error:", err);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  return { profiles, profilesLoading: loading };
}
