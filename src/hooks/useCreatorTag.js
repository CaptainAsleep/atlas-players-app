// Creator badge (2026-11-10): creatorTags/{uid} is public and server-written
// (functions/accountPresets.js). null = not a creator.
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

export function useCreatorTag(uid) {
  const [tag, setTag] = useState(null);
  useEffect(() => {
    if (!uid) { setTag(null); return undefined; }
    return onSnapshot(doc(db, "creatorTags", uid), (s) => setTag(s.exists() ? s.data() : null), () => setTag(null));
  }, [uid]);
  return tag;
}
