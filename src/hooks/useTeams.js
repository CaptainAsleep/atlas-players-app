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
  setDoc,
  updateDoc,
  where,
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

// A member's own pending "request officer" ask for a team, if any — gates
// the Request Officer button between its "Request" and "Request Pending"
// states. Doc id is the same {teamId}_{uid} convention the write side
// uses, so this is a single doc read, not a query.
export function useMyOfficerRequest(teamId, uid) {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId || !uid) {
      setRequest(null);
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(doc(db, "officerRequests", `${teamId}_${uid}`), (snap) => {
      setRequest(snap.exists() ? snap.data() : null);
      setLoading(false);
    });
    return unsub;
  }, [teamId, uid]);

  return { myOfficerRequest: request, myOfficerRequestLoading: loading };
}

// Every pending officer-role request for a team — the officer-side queue,
// shown on TeamScreen only to current officers (same as the roster's own
// promote/demote controls).
export function useOfficerRequests(teamId) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) {
      setRequests([]);
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(
      query(collection(db, "officerRequests"), where("teamId", "==", teamId)),
      (snap) => {
        setRequests(snap.docs.map((d) => d.data()));
        setLoading(false);
      },
      (err) => {
        console.error("useOfficerRequests error:", err);
        setLoading(false);
      }
    );
    return unsub;
  }, [teamId]);

  return { officerRequests: requests, officerRequestsLoading: loading };
}

// ── Team event calendar (2026-10-06) ───────────────────────────────────
// Public read, officer-only write. Events are the team's own "we're
// attending this" posts, stored under the team rather than in the bookable
// top-level events collection (see atlas-status.md scope).
export function useTeamEvents(teamId) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) {
      setEvents([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    const unsub = onSnapshot(
      collection(db, "teams", teamId, "events"),
      (snap) => {
        setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("useTeamEvents:", err);
        setLoading(false);
      }
    );
    return unsub;
  }, [teamId]);

  return { events, loading };
}

// Everyone's RSVP for one event. Rules only let team members read the whole
// list, so pass enabled=false for non-members (they use useMyTeamEventRsvp).
export function useTeamEventRsvps(teamId, eventId, enabled) {
  const [rsvps, setRsvps] = useState([]);

  useEffect(() => {
    if (!teamId || !eventId || !enabled) {
      setRsvps([]);
      return undefined;
    }
    const unsub = onSnapshot(
      collection(db, "teams", teamId, "events", eventId, "rsvps"),
      (snap) => setRsvps(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error("useTeamEventRsvps:", err)
    );
    return unsub;
  }, [teamId, eventId, enabled]);

  return rsvps;
}

// The signed-in player's own RSVP on one event (null = none yet).
export function useMyTeamEventRsvp(teamId, eventId, uid) {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!teamId || !eventId || !uid) {
      setStatus(null);
      return undefined;
    }
    const unsub = onSnapshot(
      doc(db, "teams", teamId, "events", eventId, "rsvps", uid),
      (snap) => setStatus(snap.exists() ? snap.data().status : null),
      (err) => console.error("useMyTeamEventRsvp:", err)
    );
    return unsub;
  }, [teamId, eventId, uid]);

  return status;
}

// Custom team roles — labels only (title + description), officer-managed.
export function useTeamRoles(teamId) {
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    if (!teamId) {
      setRoles([]);
      return undefined;
    }
    const unsub = onSnapshot(
      collection(db, "teams", teamId, "roles"),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        setRoles(list);
      },
      (err) => console.error("useTeamRoles:", err)
    );
    return unsub;
  }, [teamId]);

  return roles;
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
    batch.update(doc(db, "publicProfiles", uid), { teamId: teamRef.id, teamName: name });
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
    batch.update(doc(db, "publicProfiles", uid), { teamId, teamName });
    await batch.commit();
  }

  async function leaveTeam(uid, teamId) {
    const batch = writeBatch(db);
    batch.delete(doc(db, "teams", teamId, "members", uid));
    batch.update(doc(db, "users", uid), { teamId: null, teamName: null });
    batch.update(doc(db, "publicProfiles", uid), { teamId: null, teamName: null });
    await batch.commit();
  }

  async function updateTeamInfo(teamId, { name, description }) {
    await updateDoc(doc(db, "teams", teamId), { name, description });
    // Keep every current member's denormalized teamName in sync — a rename
    // shouldn't leave the roster or player profiles showing the old name.
    const membersSnap = await getDocs(collection(db, "teams", teamId, "members"));
    await Promise.all(
      membersSnap.docs.flatMap((m) => [
        updateDoc(doc(db, "users", m.id), { teamName: name }).catch(() => {}),
        updateDoc(doc(db, "publicProfiles", m.id), { teamName: name }).catch(() => {}),
      ])
    );
  }

  async function setHomeField(teamId, fieldId, fieldName) {
    await updateDoc(doc(db, "teams", teamId), { homeFieldId: fieldId, homeFieldName: fieldName });
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

  // A plain member asking their team's officers to promote them. Doc id
  // is {teamId}_{uid} — the rules only allow a create here when no doc
  // already exists at that id, so this can never stack up a second
  // pending request for the same team (a re-attempt while one's pending
  // hits an existing doc, which Firestore treats as an update, and
  // updates are denied outright).
  async function requestOfficer(teamId, uid, profile) {
    await setDoc(doc(db, "officerRequests", `${teamId}_${uid}`), {
      teamId,
      uid,
      callsign: profile?.callsign || "Player",
      avatarUrl: profile?.avatarUrl || null,
      requestedAt: serverTimestamp(),
    });
  }

  // Deletes a pending officer-role request. Used two ways: the requester
  // cancelling their own ask, and an officer denying someone else's — same
  // write either way (the rules gate who's allowed to call it), same
  // "decline = delete, no denial record kept" idiom friendRequests already
  // uses (per Michael, 2026-09-23).
  async function deleteOfficerRequest(teamId, uid) {
    await deleteDoc(doc(db, "officerRequests", `${teamId}_${uid}`));
  }

  // Officer approving a pending request — promotes the requester and
  // clears the request doc in one atomic batch, so a request can never be
  // left dangling after its outcome is already decided.
  async function approveOfficerRequest(teamId, uid) {
    const batch = writeBatch(db);
    batch.update(doc(db, "teams", teamId, "members", uid), { role: "officer" });
    batch.delete(doc(db, "officerRequests", `${teamId}_${uid}`));
    await batch.commit();
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
      await updateDoc(doc(db, "publicProfiles", uid), { teamId: null, teamName: null }).catch(() => {});
    }
  }

  // ── Team event calendar ──────────────────────────────────────────────
  // fields: { title, date, endDate, startTime, endTime, fieldId, fieldName,
  // locationName, regionalArea, ticketUrl, opordUrl }. bannerBlob optional.
  // The doc id is generated first so the banner can be uploaded to its own
  // path before the event doc is written.
  async function createTeamEvent(teamId, uid, fields, bannerBlob) {
    const eventRef = doc(collection(db, "teams", teamId, "events"));
    let bannerUrl = null;
    if (bannerBlob) {
      const storageRef = ref(storage, `teamEventBanners/${teamId}/${eventRef.id}/banner.jpg`);
      await uploadBytes(storageRef, bannerBlob, { contentType: "image/jpeg" });
      bannerUrl = await getDownloadURL(storageRef);
    }
    await setDoc(eventRef, {
      ...fields,
      bannerUrl,
      createdBy: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return eventRef.id;
  }

  // bannerBlob: a new image to upload; removeBanner: true to clear it.
  async function updateTeamEvent(teamId, eventId, fields, bannerBlob, removeBanner) {
    const update = { ...fields, updatedAt: serverTimestamp() };
    const storageRef = ref(storage, `teamEventBanners/${teamId}/${eventId}/banner.jpg`);
    if (bannerBlob) {
      await uploadBytes(storageRef, bannerBlob, { contentType: "image/jpeg" });
      update.bannerUrl = await getDownloadURL(storageRef);
    } else if (removeBanner) {
      await deleteObject(storageRef).catch(() => {});
      update.bannerUrl = null;
    }
    await updateDoc(doc(db, "teams", teamId, "events", eventId), update);
  }

  async function deleteTeamEvent(teamId, eventId) {
    await deleteObject(ref(storage, `teamEventBanners/${teamId}/${eventId}/banner.jpg`)).catch(() => {});
    await deleteDoc(doc(db, "teams", teamId, "events", eventId));
  }

  // status: "going" | "interested" | "notGoing". Non-members can only
  // ever write "interested" (enforced in the rules).
  async function setTeamEventRsvp(teamId, eventId, uid, profile, status) {
    await setDoc(doc(db, "teams", teamId, "events", eventId, "rsvps", uid), {
      uid,
      status,
      callsign: profile?.callsign || "Player",
      avatarUrl: profile?.avatarUrl || null,
      updatedAt: serverTimestamp(),
    });
  }

  async function clearTeamEventRsvp(teamId, eventId, uid) {
    await deleteDoc(doc(db, "teams", teamId, "events", eventId, "rsvps", uid));
  }

  // ── Custom roles (labels only — no permissions) ──────────────────────
  async function createTeamRole(teamId, uid, { title, description }) {
    const roleRef = doc(collection(db, "teams", teamId, "roles"));
    await setDoc(roleRef, { title, description, createdBy: uid, createdAt: serverTimestamp() });
    return roleRef.id;
  }

  async function updateTeamRole(teamId, roleId, { title, description }) {
    await updateDoc(doc(db, "teams", teamId, "roles", roleId), { title, description });
  }

  // Deleting a role also strips it from every member holding it, in one
  // batch, so no member doc is left pointing at a role that's gone.
  async function deleteTeamRole(teamId, roleId, members) {
    const batch = writeBatch(db);
    batch.delete(doc(db, "teams", teamId, "roles", roleId));
    (members || [])
      .filter((m) => (m.roleIds || []).includes(roleId))
      .forEach((m) => {
        batch.update(doc(db, "teams", teamId, "members", m.uid), {
          roleIds: m.roleIds.filter((id) => id !== roleId),
        });
      });
    await batch.commit();
  }

  // Cosmetic assignment only — deliberately NOT the permission-bearing
  // `role: "officer" | "member"` field.
  async function setMemberRoleIds(teamId, memberUid, roleIds) {
    await updateDoc(doc(db, "teams", teamId, "members", memberUid), { roleIds });
  }

  return {
    createTeam,
    joinTeam,
    leaveTeam,
    updateTeamInfo,
    setHomeField,
    updateTeamPatch,
    setMemberRole,
    removeMember,
    reconcileMembership,
    requestOfficer,
    deleteOfficerRequest,
    approveOfficerRequest,
    createTeamEvent,
    updateTeamEvent,
    deleteTeamEvent,
    setTeamEventRsvp,
    clearTeamEventRsvp,
    createTeamRole,
    updateTeamRole,
    deleteTeamRole,
    setMemberRoleIds,
  };
}
