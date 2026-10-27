import { useEffect, useState } from "react";
import { collection, collectionGroup, doc, getDoc, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../lib/firebase";

// Public Child Profiles (2026-10-27). A parent can make a child profile a
// public player profile — callsign, preset avatar, team and patches, no
// events/bookings/friends — and join it to teams from any team page.
// Everything public lives at childPublicProfiles/{publicId} (random id, never
// derived from the family); the parent link is server-only. All writes go
// through Cloud Functions (functions/index.js "Public Child Profiles").

// { [dependentId]: publicId } for the signed-in parent's public kids.
export function useChildPublicPointers(uid) {
  const [byDep, setByDep] = useState({});
  useEffect(() => {
    if (!uid) {
      setByDep({});
      return undefined;
    }
    return onSnapshot(
      collection(db, "users", uid, "childPublic"),
      (snap) => setByDep(Object.fromEntries(snap.docs.map((d) => [d.id, d.data().publicId]))),
      (err) => console.error("useChildPublicPointers error:", err)
    );
  }, [uid]);
  return byDep;
}

// Every public child profile, for player search. Shape matches the adult
// directory entries ({ uid, callsign, ... }) with avatarPreset instead of a
// photo.
export function useAllChildPublicProfiles() {
  const [profiles, setProfiles] = useState([]);
  useEffect(() => onSnapshot(
    collection(db, "childPublicProfiles"),
    (snap) => setProfiles(snap.docs.map((d) => ({ uid: d.id, ...d.data() }))),
    (err) => console.error("useAllChildPublicProfiles error:", err)
  ), []);
  return { childProfiles: profiles };
}

// One public child profile, or null if this id isn't one (it's an adult uid).
export function useChildPublicProfile(publicId) {
  const [state, setState] = useState({ profile: null, loading: true });
  useEffect(() => {
    if (!publicId) {
      setState({ profile: null, loading: false });
      return undefined;
    }
    setState({ profile: null, loading: true });
    return onSnapshot(
      doc(db, "childPublicProfiles", publicId),
      (snap) => setState({ profile: snap.exists() ? { uid: snap.id, ...snap.data() } : null, loading: false }),
      (err) => {
        console.error("useChildPublicProfile error:", err);
        setState({ profile: null, loading: false });
      }
    );
  }, [publicId]);
  return state;
}

export function useChildPublicPatches(publicId) {
  const [patches, setPatches] = useState([]);
  useEffect(() => {
    if (!publicId) {
      setPatches([]);
      return undefined;
    }
    return onSnapshot(
      collection(db, "childPublicProfiles", publicId, "publicPatches"),
      (snap) => setPatches(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error("useChildPublicPatches error:", err)
    );
  }, [publicId]);
  return patches;
}

// For one team: { [publicId]: "member" | "pending" | "none" } for each of the
// parent's public kids. Member docs are public; the rules let a parent read
// their own child's join request.
export function useChildTeamStatus(teamId, publicIds) {
  const key = (publicIds || []).join(",");
  const [state, setState] = useState({});
  useEffect(() => {
    setState({});
    if (!teamId || !key) return undefined;
    const ids = key.split(",");
    const member = {};
    const pending = {};
    const publish = () => setState(Object.fromEntries(ids.map((id) => [id, member[id] ? "member" : pending[id] ? "pending" : "none"])));
    const unsubs = ids.flatMap((id) => [
      onSnapshot(doc(db, "teams", teamId, "members", id), (s) => { member[id] = s.exists(); publish(); }, (err) => console.error("child member status:", err)),
      onSnapshot(doc(db, "joinRequests", `${teamId}_${id}`), (s) => { pending[id] = s.exists() && s.data().approved !== true; publish(); }, (err) => console.error("child request status:", err)),
    ]);
    return () => unsubs.forEach((u) => u());
  }, [teamId, key]);
  return state;
}

// [{ teamId, teamName }] a public child is on (member docs are public).
export async function fetchChildTeams(publicId) {
  const snap = await getDocs(query(collectionGroup(db, "members"), where("uid", "==", publicId)));
  return Promise.all(snap.docs.map(async (d) => {
    const teamId = d.ref.parent.parent.id;
    const team = await getDoc(doc(db, "teams", teamId)).catch(() => null);
    return { teamId, teamName: team?.data()?.name || "" };
  }));
}

export async function setChildProfilePublic(dependentId, makePublic) {
  const res = await httpsCallable(functions, "setChildProfilePublic")({ dependentId, public: !!makePublic });
  return res.data;
}

// action: "join" (follows the team's open/approval setting) | "cancel" | "leave"
export async function childTeamAction(dependentId, teamId, action) {
  const res = await httpsCallable(functions, "childTeamAction")({ dependentId, teamId, action });
  return res.data;
}
