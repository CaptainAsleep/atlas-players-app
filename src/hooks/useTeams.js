import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "../lib/firebase";

// Every team a player might browse — public data, no auth gating needed to read.
export function useAllTeams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "teams"), orderBy("name")),
      (snap) => {
        setTeams(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("useAllTeams error:", err);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  return { teams, teamsLoading: loading };
}

// One team's full profile + live roster — used for both "my team" and
// "viewing someone else's team" contexts, same data either way.
export function useTeam(teamId) {
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) {
      setTeam(null);
      setMembers([]);
      setLoading(false);
      return;
    }
    const unsubTeam = onSnapshot(doc(db, "teams", teamId), (snap) => {
      setTeam(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      setLoading(false);
    });
    const unsubMembers = onSnapshot(collection(db, "teams", teamId, "members"), (snap) => {
      const list = snap.docs.map((d) => d.data());
      // Officers first, then alphabetical by callsign within each group.
      list.sort((a, b) => (a.role === b.role ? a.callsign.localeCompare(b.callsign) : a.role === "officer" ? -1 : 1));
      setMembers(list);
    });
    return () => {
      unsubTeam();
      unsubMembers();
    };
  }, [teamId]);

  return { team, members, teamLoading: loading };
}

export function useTeamActions() {
  // Creates the team and its founding-officer member record in one atomic
  // batch — the security rules specifically allow this combination (self-add
  // as officer only when you're also the team's own createdBy).
  async function createTeam(uid, profile, { name, description, patchBlob }) {
    const teamRef = doc(collection(db, "teams"));

    const batch = writeBatch(db);
    batch.set(teamRef, {
      name,
      description: description || "",
      patchUrl: null,
      createdBy: uid,
      createdAt: serverTimestamp(),
    });
    batch.set(doc(db, "teams", teamRef.id, "members", uid), {
      uid,
      callsign: profile?.callsign || "Player",
      avatarUrl: profile?.avatarUrl || null,
      role: "officer",
      joinedAt: serverTimestamp(),
    });
    await batch.commit();

    await updateDoc(doc(db, "users", uid), { teamId: teamRef.id, teamName: name });

    if (patchBlob) {
      const storageRef = ref(storage, `teamPatches/${teamRef.id}/patch.jpg`);
      await uploadBytes(storageRef, patchBlob, { contentType: "image/jpeg" });
      const url = await getDownloadURL(storageRef);
      await updateDoc(teamRef, { patchUrl: url });
    }

    return teamRef.id;
  }

  async function joinTeam(uid, profile, teamId, teamName) {
    const batch = writeBatch(db);
    batch.set(doc(db, "teams", teamId, "members", uid), {
      uid,
      callsign: profile?.callsign || "Player",
      avatarUrl: profile?.avatarUrl || null,
      role: "member",
      joinedAt: serverTimestamp(),
    });
    batch.update(doc(db, "users", uid), { teamId, teamName });
    await batch.commit();
  }

  async function leaveTeam(uid, teamId) {
    const batch = writeBatch(db);
    batch.delete(doc(db, "teams", teamId, "members", uid));
    batch.update(doc(db, "users", uid), { teamId: null, teamName: null });
    await batch.commit();
  }

  async function updateTeamInfo(teamId, { name, description }) {
    await updateDoc(doc(db, "teams", teamId), { name, description });
    // Keep every current member's denormalized teamName in sync — a rename
    // shouldn't leave the roster or player profiles showing the old name.
    const membersSnap = await getDocs(collection(db, "teams", teamId, "members"));
    await Promise.all(
      membersSnap.docs.map((m) => updateDoc(doc(db, "users", m.id), { teamName: name }).catch(() => {}))
    );
  }

  async function updateTeamPatch(teamId, patchBlob) {
    const storageRef = ref(storage, `teamPatches/${teamId}/patch.jpg`);
    await uploadBytes(storageRef, patchBlob, { contentType: "image/jpeg" });
    const url = await getDownloadURL(storageRef);
    await updateDoc(doc(db, "teams", teamId), { patchUrl: url });
  }

  async function setMemberRole(teamId, memberUid, role) {
    await updateDoc(doc(db, "teams", teamId, "members", memberUid), { role });
  }

  // Officer removing someone else — different from leaveTeam (self-exit)
  // because it doesn't touch the removed player's own users/{uid} doc
  // (they didn't consent to this write, and the rules correctly wouldn't
  // allow an officer to edit another user's profile anyway). Their stale
  // teamId/teamName clears itself the next time they open the app, via a
  // quick existence check the UI does against the membership doc.
  async function removeMember(teamId, memberUid) {
    await deleteDoc(doc(db, "teams", teamId, "members", memberUid));
  }

  // Run once, cheaply, whenever a player with a teamId opens the Social tab.
  // If an officer removed them since their last visit, their own profile
  // still says they're on that team (an officer's removal can't touch the
  // removed player's profile doc — the rules correctly don't allow that).
  // This is the one place that gets corrected, using the player's own
  // write permission on their own profile.
  async function reconcileMembership(uid, teamId) {
    if (!uid || !teamId) return;
    const memberSnap = await getDoc(doc(db, "teams", teamId, "members", uid));
    if (!memberSnap.exists()) {
      await updateDoc(doc(db, "users", uid), { teamId: null, teamName: null });
    }
  }

  return { createTeam, joinTeam, leaveTeam, updateTeamInfo, updateTeamPatch, setMemberRole, removeMember, reconcileMembership };
}
