import { useEffect, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { db } from "../lib/firebase";

// Friends — merges the two possible directions (I sent it, or I received
// it) since a single Firestore query can't express "fromUid == me OR
// toUid == me" cleanly. Each entry is normalized to the OTHER person's
// info regardless of which side of the original request they were.
export function useFriends(uid) {
  const [sent, setSent] = useState([]);
  const [received, setReceived] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setSent([]);
      setReceived([]);
      setLoading(false);
      return;
    }
    const unsubSent = onSnapshot(
      query(collection(db, "friendRequests"), where("fromUid", "==", uid), where("status", "==", "accepted")),
      (snap) => setSent(snap.docs.map((d) => d.data()))
    );
    const unsubReceived = onSnapshot(
      query(collection(db, "friendRequests"), where("toUid", "==", uid), where("status", "==", "accepted")),
      (snap) => { setReceived(snap.docs.map((d) => d.data())); setLoading(false); }
    );
    return () => {
      unsubSent();
      unsubReceived();
    };
  }, [uid]);

  const friends = [
    ...sent.map((r) => ({ uid: r.toUid, callsign: r.toCallsign, avatarUrl: r.toAvatarUrl })),
    ...received.map((r) => ({ uid: r.fromUid, callsign: r.fromCallsign, avatarUrl: r.fromAvatarUrl })),
  ];

  return { friends, friendsLoading: loading };
}

// Pending requests someone else sent ME — need my own action (accept/decline).
export function useIncomingRequests(uid) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setRequests([]);
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(
      query(collection(db, "friendRequests"), where("toUid", "==", uid), where("status", "==", "pending")),
      (snap) => {
        setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }
    );
    return unsub;
  }, [uid]);

  return { requests, requestsLoading: loading };
}

// Requests I sent that are still pending — used to show "Request Sent"
// instead of "Add Friend" on someone's profile, and to block sending a
// second one.
export function useOutgoingRequestUids(uid) {
  const [uids, setUids] = useState(new Set());

  useEffect(() => {
    if (!uid) {
      setUids(new Set());
      return;
    }
    const unsub = onSnapshot(
      query(collection(db, "friendRequests"), where("fromUid", "==", uid), where("status", "==", "pending")),
      (snap) => setUids(new Set(snap.docs.map((d) => d.data().toUid)))
    );
    return unsub;
  }, [uid]);

  return uids;
}

export function useFriendActions() {
  async function sendRequest(fromUid, fromProfile, toUid, toProfile) {
    const requestId = `${fromUid}_${toUid}`;
    await setDoc(doc(db, "friendRequests", requestId), {
      fromUid,
      toUid,
      fromCallsign: fromProfile?.callsign || "Player",
      fromAvatarUrl: fromProfile?.avatarUrl || null,
      toCallsign: toProfile?.callsign || "Player",
      toAvatarUrl: toProfile?.avatarUrl || null,
      status: "pending",
      createdAt: serverTimestamp(),
    });
  }

  async function acceptRequest(requestId) {
    await updateDoc(doc(db, "friendRequests", requestId), { status: "accepted" });
  }

  async function declineRequest(requestId) {
    await deleteDoc(doc(db, "friendRequests", requestId));
  }

  // Cancelling a pending request I sent, and unfriending someone I'm
  // already connected to, are the same operation either way — delete the
  // request doc regardless of its current status.
  async function cancelOrUnfriend(myUid, otherUid) {
    // The doc could exist under either ordering depending on who sent the
    // original request — try both, since only one will actually exist.
    await deleteDoc(doc(db, "friendRequests", `${myUid}_${otherUid}`)).catch(() => {});
    await deleteDoc(doc(db, "friendRequests", `${otherUid}_${myUid}`)).catch(() => {});
  }

  return { sendRequest, acceptRequest, declineRequest, cancelOrUnfriend };
}
