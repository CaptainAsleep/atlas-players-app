// Social Feed (2026-11-22). Reads users/{uid}/feed (pointers written by
// Cloud Functions — functions/feedStore.js) and keeps a live listener on
// each pointed-to activity/{id} doc, which carries the card's display data
// and its reactions map. Reacting writes activity/{id}/reactions/{uid};
// a trigger folds that into activity.reactions.
//
// Lives in AppShell (not the Feed tab) because the Social badge needs the
// unseen count on every screen.

import { useEffect, useMemo, useRef, useState } from "react";
import { collection, deleteDoc, doc, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { db } from "../lib/firebase";

export const FEED_DAYS = 30;
export const FEED_LIMIT = 50;
export const REACTION_KINDS = ["thumbsUp", "fire", "heart", "niceShot"];

const toMs = (v) => (v?.toMillis ? v.toMillis() : typeof v === "number" ? v : 0);

export function useFeed(uid, feedSeenAt) {
  const [pointers, setPointers] = useState([]);
  const [activities, setActivities] = useState({}); // id -> data | null (gone / no access)
  const [loading, setLoading] = useState(true);
  // Optimistic reactions: id -> kind | null, cleared once the doc catches up.
  const [pending, setPending] = useState({});
  const listeners = useRef(new Map());

  useEffect(() => {
    if (!uid) {
      setPointers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const cutoff = new Date(Date.now() - FEED_DAYS * 24 * 60 * 60 * 1000);
    const unsub = onSnapshot(
      query(collection(db, "users", uid, "feed"), where("createdAt", ">=", cutoff), orderBy("createdAt", "desc"), limit(FEED_LIMIT)),
      (snap) => {
        setPointers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("feed listener failed:", err);
        setLoading(false);
      }
    );
    return unsub;
  }, [uid]);

  // One listener per activity in view; dropped when it leaves the feed.
  useEffect(() => {
    const live = listeners.current;
    const want = new Set(pointers.map((p) => p.id));
    for (const [id, unsub] of live) {
      if (!want.has(id)) {
        unsub();
        live.delete(id);
      }
    }
    for (const id of want) {
      if (live.has(id)) continue;
      live.set(
        id,
        onSnapshot(
          doc(db, "activity", id),
          (snap) => setActivities((prev) => ({ ...prev, [id]: snap.exists() ? { id, ...snap.data() } : null })),
          () => setActivities((prev) => ({ ...prev, [id]: null }))
        )
      );
    }
  }, [pointers]);

  useEffect(() => () => {
    for (const unsub of listeners.current.values()) unsub();
    listeners.current.clear();
  }, []);

  const items = useMemo(
    () =>
      pointers
        .map((p) => {
          const a = activities[p.id];
          if (!a) return null;
          const reactions = { ...(a.reactions || {}) };
          if (uid && p.id in pending) {
            if (pending[p.id]) reactions[uid] = pending[p.id];
            else delete reactions[uid];
          }
          return { ...a, id: p.id, reactions, createdAtMs: toMs(a.createdAt) || toMs(p.createdAt) };
        })
        .filter(Boolean),
    [pointers, activities, pending, uid]
  );

  // Clear optimistic entries once the server copy agrees.
  useEffect(() => {
    if (!uid) return;
    const done = Object.keys(pending).filter((id) => (activities[id]?.reactions?.[uid] || null) === pending[id]);
    if (done.length) {
      setPending((prev) => {
        const next = { ...prev };
        for (const id of done) delete next[id];
        return next;
      });
    }
  }, [activities, pending, uid]);

  const seenMs = toMs(feedSeenAt);
  const unseenCount = useMemo(() => pointers.filter((p) => toMs(p.createdAt) > seenMs).length, [pointers, seenMs]);

  async function react(activityId, kind) {
    if (!uid) return;
    const next = kind && REACTION_KINDS.includes(kind) ? kind : null;
    setPending((prev) => ({ ...prev, [activityId]: next }));
    const ref = doc(db, "activity", activityId, "reactions", uid);
    try {
      if (next) await setDoc(ref, { kind: next, at: serverTimestamp() });
      else await deleteDoc(ref);
    } catch (err) {
      console.error("reaction failed:", err);
      setPending((prev) => {
        const copy = { ...prev };
        delete copy[activityId];
        return copy;
      });
    }
  }

  async function markSeen() {
    if (!uid || unseenCount === 0) return;
    try {
      await updateDoc(doc(db, "users", uid), { feedSeenAt: serverTimestamp() });
    } catch (err) {
      console.error("feedSeenAt update failed:", err);
    }
  }

  return { feedItems: items, feedLoading: loading, unseenCount, react, markSeen };
}
