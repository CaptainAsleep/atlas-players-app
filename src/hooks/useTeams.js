import { useEffect, useState } from "react";
import {
  collection,
  collectionGroup,
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

// ── Team join approval (2026-10-06) ────────────────────────────────────
// A player's own pending request for one team, if any — gates the Join
// button between "Request to Join" and "Approval pending". Single doc read
// at the {teamId}_{uid} id, same as useMyOfficerRequest.
export function useMyJoinRequest(teamId, uid) {
  const [request, setRequest] = useState(null);

  useEffect(() => {
    if (!teamId || !uid) {
      setRequest(null);
      return;
    }
    const unsub = onSnapshot(
      doc(db, "joinRequests", `${teamId}_${uid}`),
      (snap) => setRequest(snap.exists() ? snap.data() : null),
      (err) => console.error("useMyJoinRequest error:", err)
    );
    return unsub;
  }, [teamId, uid]);

  return { myJoinRequest: request };
}

// Multiple teams per player (2026-10-25). The members subcollection under
// each team is the source of truth for which teams a player is on — found
// with one collectionGroup query on uid (needs the {path=**}/members rule and
// the collection-group uid index in firestore.indexes.json). The profile's
// teamId/teamName now only means "the team shown on my profile". There is
// deliberately no teamIds list on the profile: an officer removing someone
// can't write that player's profile, so a list there would drift.
export function useMyTeamMemberships(uid) {
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setMemberships([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = onSnapshot(
      query(collectionGroup(db, "members"), where("uid", "==", uid)),
      (snap) => {
        setMemberships(snap.docs.map(membershipFromDoc));
        setLoading(false);
      },
      (err) => {
        console.error("useMyTeamMemberships error:", err);
        setLoading(false);
      }
    );
    return unsub;
  }, [uid]);

  return { memberships, membershipsLoading: loading };
}

function membershipFromDoc(d) {
  const data = d.data();
  return {
    teamId: d.ref.parent.parent.id,
    role: data.role,
    joinedAtMs: data.joinedAt?.toMillis?.() ?? 0,
  };
}

// The team a player's profile should fall back to when the one it shows is
// gone (they left, or an officer removed them): the earliest-joined team
// they're still on, or none. Returns { teamId, teamName } with nulls for none.
async function nextDisplayTeam(uid, excludeTeamId) {
  let rows = [];
  try {
    const snap = await getDocs(query(collectionGroup(db, "members"), where("uid", "==", uid)));
    rows = snap.docs.map(membershipFromDoc).filter((m) => m.teamId !== excludeTeamId);
  } catch (err) {
    // e.g. the collection-group index isn't built yet — show no team rather
    // than block the leave itself.
    console.error("nextDisplayTeam lookup failed:", err);
    return { teamId: null, teamName: null };
  }
  rows.sort((a, b) => a.joinedAtMs - b.joinedAtMs);
  for (const m of rows) {
    const t = await getDoc(doc(db, "teams", m.teamId));
    if (t.exists()) return { teamId: m.teamId, teamName: t.data().name || "" };
  }
  return { teamId: null, teamName: null };
}

// Every join request this player has made, across teams. App-level, so an
// approval is noticed (and the join finished) wherever they are in the app.
export function useMyJoinRequests(uid) {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    if (!uid) {
      setRequests([]);
      return;
    }
    const unsub = onSnapshot(
      query(collection(db, "joinRequests"), where("uid", "==", uid)),
      (snap) => setRequests(snap.docs.map((d) => d.data())),
      (err) => console.error("useMyJoinRequests error:", err)
    );
    return unsub;
  }, [uid]);

  return { myJoinRequests: requests };
}

// Every pending join request for a team — the officer-side queue.
export function useJoinRequests(teamId) {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    if (!teamId) {
      setRequests([]);
      return;
    }
    const unsub = onSnapshot(
      query(collection(db, "joinRequests"), where("teamId", "==", teamId)),
      (snap) => setRequests(snap.docs.map((d) => d.data()).filter((r) => r.approved !== true)),
      (err) => console.error("useJoinRequests error:", err)
    );
    return unsub;
  }, [teamId]);

  return { joinRequests: requests };
}

// ── Officer Team Invites (2026-10-27) ──────────────────────────────────
// teamInvites/{teamId}_{uid}: an officer invites a player, the player
// accepts (their own self-join, allowed while the invite exists) or
// declines (delete). See firestore.rules teamInvites.

// Every pending invite for this player, across teams. App-level, for the
// Social tab's Team Invites block and the nav badge.
export function useMyTeamInvites(uid) {
  const [invites, setInvites] = useState([]);

  useEffect(() => {
    if (!uid) {
      setInvites([]);
      return;
    }
    const unsub = onSnapshot(
      query(collection(db, "teamInvites"), where("uid", "==", uid)),
      (snap) => setInvites(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error("useMyTeamInvites error:", err)
    );
    return unsub;
  }, [uid]);

  return { myTeamInvites: invites };
}

// Every pending invite a team has sent — officer-side. Pass enabled=false
// for non-officers (the rules only let officers list them).
export function useTeamInvites(teamId, enabled) {
  const [invites, setInvites] = useState([]);

  useEffect(() => {
    if (!teamId || !enabled) {
      setInvites([]);
      return;
    }
    const unsub = onSnapshot(
      query(collection(db, "teamInvites"), where("teamId", "==", teamId)),
      (snap) => setInvites(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error("useTeamInvites error:", err)
    );
    return unsub;
  }, [teamId, enabled]);

  return { teamInvites: invites };
}

// Officer inviting a player. teamName must match the team doc exactly (the
// rules pin it), so it's read fresh rather than trusted from the caller.
export async function sendTeamInvite(teamId, officerUid, inviteeUid) {
  const teamSnap = await getDoc(doc(db, "teams", teamId));
  await setDoc(doc(db, "teamInvites", `${teamId}_${inviteeUid}`), {
    teamId,
    teamName: teamSnap.exists() ? teamSnap.data().name || "" : "",
    uid: inviteeUid,
    invitedBy: officerUid,
    createdAt: serverTimestamp(),
  });
}

// Invitee declining, or an officer revoking. Same write; rules gate who.
export async function deleteTeamInvite(teamId, uid) {
  await deleteDoc(doc(db, "teamInvites", `${teamId}_${uid}`));
}

// Invitee accepting: their own member doc + clearing the invite in one
// batch, and showing this team on their profile only if they don't show
// one yet (same rule as joinTeam). If they're already on the team (joined
// some other way meanwhile), just clear the invite — re-setting an existing
// member doc is an update, which only officers may do.
export async function acceptTeamInvite(uid, profile, invite) {
  const memberRef = doc(db, "teams", invite.teamId, "members", uid);
  const inviteRef = doc(db, "teamInvites", `${invite.teamId}_${uid}`);
  if ((await getDoc(memberRef)).exists()) {
    await deleteDoc(inviteRef);
    return;
  }
  const teamSnap = await getDoc(doc(db, "teams", invite.teamId));
  const teamName = teamSnap.exists() ? teamSnap.data().name || "" : invite.teamName || "";
  // A join request they'd also sent to this team is now moot. Only delete it
  // if it exists: deleting a missing doc fails the rule and the whole batch.
  const joinRequestRef = doc(db, "joinRequests", `${invite.teamId}_${uid}`);
  const joinRequestSnap = await getDoc(joinRequestRef).catch(() => null);
  const batch = writeBatch(db);
  if (joinRequestSnap?.exists()) batch.delete(joinRequestRef);
  batch.set(memberRef, {
    uid,
    callsign: profile?.callsign || "Player",
    avatarUrl: profile?.avatarUrl || null,
    role: "member",
    joinedAt: serverTimestamp(),
  });
  batch.delete(inviteRef);
  if (!profile?.teamId) {
    batch.update(doc(db, "users", uid), { teamId: invite.teamId, teamName });
    batch.update(doc(db, "publicProfiles", uid), { teamId: invite.teamId, teamName });
  }
  await batch.commit();
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
// Team ranks (2026-10-06): the officer-defined ladder, highest first.
export function useTeamRanks(teamId) {
  const [ranks, setRanks] = useState([]);

  useEffect(() => {
    if (!teamId) {
      setRanks([]);
      return undefined;
    }
    const unsub = onSnapshot(
      collection(db, "teams", teamId, "ranks"),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setRanks(list);
      },
      (err) => console.error("useTeamRanks:", err)
    );
    return unsub;
  }, [teamId]);

  return ranks;
}

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
        // Officer-set order first. Roles made before ordering existed have
        // no `order`; they sort after ordered ones, alphabetically, until an
        // officer's first move/add writes a position to every role.
        list.sort((a, b) => {
          const ao = a.order ?? Infinity;
          const bo = b.order ?? Infinity;
          if (ao !== bo) return ao < bo ? -1 : 1;
          return (a.title || "").localeCompare(b.title || "");
        });
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
      // New teams default to officer approval (2026-10-06); officers can
      // switch to "open" in team settings. Teams that predate this have no
      // joinPolicy field at all, which the rules read as "open".
      joinPolicy: "approval",
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
    // A player already showing a team keeps showing it; they can switch on
    // the new team's page. Only a player showing none gets this one.
    const showOnProfile = !profile?.teamId;
    if (showOnProfile) {
      batch.update(doc(db, "publicProfiles", uid), { teamId: teamRef.id, teamName: name });
    }
    await batch.commit();

    if (showOnProfile) {
      await updateDoc(doc(db, "users", uid), { teamId: teamRef.id, teamName: name });
    }

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
    // Same rule as createTeam: joining never replaces the team already shown.
    if (!profile?.teamId) {
      batch.update(doc(db, "users", uid), { teamId, teamName });
      batch.update(doc(db, "publicProfiles", uid), { teamId, teamName });
    }
    await batch.commit();
  }

  // Leaving the team that's shown on the profile falls back to the
  // earliest-joined team they're still on (or none). Leaving any other team
  // leaves the profile alone.
  async function leaveTeam(uid, teamId, profile) {
    const batch = writeBatch(db);
    batch.delete(doc(db, "teams", teamId, "members", uid));
    if (profile?.teamId === teamId) {
      const next = await nextDisplayTeam(uid, teamId);
      batch.update(doc(db, "users", uid), next);
      batch.update(doc(db, "publicProfiles", uid), next);
    }
    await batch.commit();
  }

  // "Display this team on my profile" from a team page the player is on.
  async function setDisplayedTeam(uid, teamId, teamName) {
    const batch = writeBatch(db);
    batch.update(doc(db, "users", uid), { teamId, teamName });
    batch.update(doc(db, "publicProfiles", uid), { teamId, teamName });
    await batch.commit();
  }

  async function updateTeamInfo(teamId, { name, description }) {
    await updateDoc(doc(db, "teams", teamId), { name, description });
    // Keep every current member's denormalized teamName in sync — a rename
    // shouldn't leave the roster or player profiles showing the old name.
    // Only for members actually showing this team: with several teams per
    // player (2026-10-25), writing teamName blindly would put this name next
    // to a different team's id on someone showing another team.
    const membersSnap = await getDocs(collection(db, "teams", teamId, "members"));
    await Promise.all(
      membersSnap.docs.map(async (m) => {
        const pub = await getDoc(doc(db, "publicProfiles", m.id)).catch(() => null);
        if (pub?.data()?.teamId !== teamId) return;
        await updateDoc(doc(db, "users", m.id), { teamName: name }).catch(() => {});
        await updateDoc(doc(db, "publicProfiles", m.id), { teamName: name }).catch(() => {});
      })
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

  // Team social/Discord/website links — a plain map on the team doc
  // (public read, officer-only update, both already enforced by the teams
  // rules). Replaces the whole map; callers pass only the non-empty keys.
  async function updateTeamLinks(teamId, links) {
    await updateDoc(doc(db, "teams", teamId), { links });
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

  // ── Team join approval (2026-10-06) ──────────────────────────────────
  // Officer flipping a team between "open" and "approval". Just a field on
  // the team doc, so the existing officer-only team update rule covers it.
  async function setJoinPolicy(teamId, joinPolicy) {
    if (joinPolicy !== "open" && joinPolicy !== "approval") return;
    await updateDoc(doc(db, "teams", teamId), { joinPolicy });
  }

  // Player asking to join an approval-required team. Same {teamId}_{uid}
  // idiom as requestOfficer, so a second ask while one is pending can't
  // stack up (it would hit an existing doc, which is an update, and the
  // rules only let an officer do that).
  async function requestToJoin(teamId, uid, profile) {
    await setDoc(doc(db, "joinRequests", `${teamId}_${uid}`), {
      teamId,
      uid,
      callsign: profile?.callsign || "Player",
      avatarUrl: profile?.avatarUrl || null,
      requestedAt: serverTimestamp(),
      approved: false,
    });
  }

  // Requester cancelling, or an officer denying. Same write either way
  // (the rules gate who may); denial leaves no record, per Michael.
  async function deleteJoinRequest(teamId, uid) {
    await deleteDoc(doc(db, "joinRequests", `${teamId}_${uid}`));
  }

  // Officer approving: creates the member doc and flags the request
  // approved in one atomic batch. It deliberately can't touch the player's
  // own users/publicProfiles docs (rules are self-only), so those are
  // finished by the player's own app, see finishApprovedJoin.
  async function approveJoinRequest(teamId, request) {
    const batch = writeBatch(db);
    batch.set(doc(db, "teams", teamId, "members", request.uid), {
      uid: request.uid,
      callsign: request.callsign || "Player",
      avatarUrl: request.avatarUrl || null,
      role: "member",
      joinedAt: serverTimestamp(),
    });
    batch.update(doc(db, "joinRequests", `${teamId}_${request.uid}`), { approved: true });
    await batch.commit();
  }

  // Runs on the player's own client once their request shows approved:
  // clears the request and, if they aren't showing a team yet, shows this
  // one. If an officer already removed them again, just clears the request.
  // (Before 2026-10-25 an approval for a second team was undone here; players
  // can now be on several teams.)
  async function finishApprovedJoin(uid, profile, teamId) {
    const memberRef = doc(db, "teams", teamId, "members", uid);
    const requestRef = doc(db, "joinRequests", `${teamId}_${uid}`);
    const memberSnap = await getDoc(memberRef);
    if (!memberSnap.exists() || profile?.teamId) {
      await deleteDoc(requestRef);
      return;
    }
    const teamSnap = await getDoc(doc(db, "teams", teamId));
    const teamName = teamSnap.exists() ? teamSnap.data().name : "";
    const b = writeBatch(db);
    b.update(doc(db, "users", uid), { teamId, teamName });
    b.update(doc(db, "publicProfiles", uid), { teamId, teamName });
    b.delete(requestRef);
    await b.commit();
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
      // Removed from the team they were showing: fall back the same way a
      // leave does.
      const next = await nextDisplayTeam(uid, teamId);
      await updateDoc(doc(db, "users", uid), next);
      await updateDoc(doc(db, "publicProfiles", uid), next).catch(() => {});
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
  // existingRoles = the roles as currently displayed. Their positions are
  // written in the same batch (so older roles with no `order` get one and
  // the new role can't sort ahead of them); the new role goes last.
  async function createTeamRole(teamId, uid, { title, description }, existingRoles = []) {
    const roleRef = doc(collection(db, "teams", teamId, "roles"));
    const batch = writeBatch(db);
    existingRoles.forEach((r, i) => batch.update(doc(db, "teams", teamId, "roles", r.id), { order: i }));
    batch.set(roleRef, { title, description, order: existingRoles.length, createdBy: uid, createdAt: serverTimestamp() });
    await batch.commit();
    return roleRef.id;
  }

  // Writes a position to every role in the given display order, in one batch.
  async function reorderTeamRoles(teamId, orderedRoles) {
    const batch = writeBatch(db);
    orderedRoles.forEach((r, i) => batch.update(doc(db, "teams", teamId, "roles", r.id), { order: i }));
    await batch.commit();
  }

  async function updateTeamRole(teamId, roleId, { title, description }) {
    await updateDoc(doc(db, "teams", teamId, "roles", roleId), { title, description });
  }

  // ── Team ranks (2026-10-06) ───────────────────────────────────────────
  // Image is optional. The rank doc id is generated first so the insignia
  // can be uploaded to its own path before the doc is written. PNG, not
  // JPEG, so a transparent insignia keeps its transparency. `order` 0 =
  // highest; new ranks go to the bottom (callers pass the next position).
  async function createTeamRank(teamId, uid, { title, requirements, imageBlob, order }) {
    const rankRef = doc(collection(db, "teams", teamId, "ranks"));
    let imageUrl = null;
    if (imageBlob) {
      const storageRef = ref(storage, `teamRanks/${teamId}/${rankRef.id}/rank.png`);
      await uploadBytes(storageRef, imageBlob, { contentType: "image/png" });
      imageUrl = await getDownloadURL(storageRef);
    }
    await setDoc(rankRef, { title, requirements, imageUrl, order, createdBy: uid, createdAt: serverTimestamp() });
    return rankRef.id;
  }

  // imageBlob = new image; removeImage = true clears the existing one;
  // neither = leave the image as is.
  async function updateTeamRank(teamId, rankId, { title, requirements, imageBlob, removeImage }) {
    const update = { title, requirements };
    const storageRef = ref(storage, `teamRanks/${teamId}/${rankId}/rank.png`);
    if (imageBlob) {
      await uploadBytes(storageRef, imageBlob, { contentType: "image/png" });
      const url = await getDownloadURL(storageRef);
      // Same path every time, so bust the browser cache or an old insignia
      // can keep showing after a replace.
      update.imageUrl = `${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`;
    } else if (removeImage) {
      update.imageUrl = null;
      await deleteObject(storageRef).catch(() => {});
    }
    await updateDoc(doc(db, "teams", teamId, "ranks", rankId), update);
  }

  // Deleting a rank clears it from every member holding it, in one batch,
  // so no member doc is left pointing at a rank that's gone; the image is
  // removed best-effort afterward.
  async function deleteTeamRank(teamId, rankId, members) {
    const batch = writeBatch(db);
    batch.delete(doc(db, "teams", teamId, "ranks", rankId));
    (members || [])
      .filter((m) => m.rankId === rankId)
      .forEach((m) => {
        batch.update(doc(db, "teams", teamId, "members", m.uid), { rankId: null });
      });
    await batch.commit();
    await deleteObject(ref(storage, `teamRanks/${teamId}/${rankId}/rank.png`)).catch(() => {});
  }

  // Swaps two neighboring ranks' positions in one batch.
  async function swapTeamRankOrder(teamId, a, b) {
    const batch = writeBatch(db);
    batch.update(doc(db, "teams", teamId, "ranks", a.id), { order: b.order });
    batch.update(doc(db, "teams", teamId, "ranks", b.id), { order: a.order });
    await batch.commit();
  }

  // One rank per member; null clears it. Cosmetic, like roleIds: deliberately
  // NOT the permission-bearing `role` field.
  async function setMemberRank(teamId, memberUid, rankId) {
    await updateDoc(doc(db, "teams", teamId, "members", memberUid), { rankId: rankId || null });
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
    setDisplayedTeam,
    updateTeamInfo,
    setHomeField,
    updateTeamPatch,
    updateTeamLinks,
    setMemberRole,
    removeMember,
    reconcileMembership,
    requestOfficer,
    deleteOfficerRequest,
    approveOfficerRequest,
    setJoinPolicy,
    requestToJoin,
    deleteJoinRequest,
    approveJoinRequest,
    finishApprovedJoin,
    createTeamEvent,
    updateTeamEvent,
    deleteTeamEvent,
    setTeamEventRsvp,
    clearTeamEventRsvp,
    createTeamRank,
    updateTeamRank,
    deleteTeamRank,
    swapTeamRankOrder,
    setMemberRank,
    createTeamRole,
    reorderTeamRoles,
    updateTeamRole,
    deleteTeamRole,
    setMemberRoleIds,
  };
}

// ── Team patch library (2026-10-27) ──────────────────────────────────────
// teams/{teamId}/teamPatches/{libId} — the patches this team's officers can
// hand out. Catalog-linked entries (DTB, WhiteHorse, …) were seeded by
// script and use the catalog id as grantDocId so existing holders are
// recognised; officer uploads get "team-{teamId}-{libId}". Grants land in the
// recipient's own users/{uid}/patches/{grantDocId} (rules: officer of this
// team, recipient a current member, exact match to the library entry).
export function useTeamPatchLibrary(teamId) {
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!teamId) {
      setLibrary([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    const unsub = onSnapshot(
      collection(db, "teams", teamId, "teamPatches"),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));
        setLibrary(list);
        setLoading(false);
      },
      (err) => {
        console.error("useTeamPatchLibrary error:", err);
        setLoading(false);
      }
    );
    return unsub;
  }, [teamId]);
  return { library, libraryLoading: loading };
}

// pngBlob: already resized (transparent PNG). The doc id is generated first so
// the image can go to its own path (covered by the existing officer-only
// teamPatches/{teamId}/{fileName} Storage rule).
export async function addTeamPatch(teamId, uid, { name, details }, pngBlob) {
  const libRef = doc(collection(db, "teams", teamId, "teamPatches"));
  const storageRef = ref(storage, `teamPatches/${teamId}/lib-${libRef.id}.png`);
  await uploadBytes(storageRef, pngBlob, { contentType: "image/png" });
  const imageUrl = await getDownloadURL(storageRef);
  await setDoc(libRef, {
    name,
    imageUrl,
    details: details || null,
    grantDocId: `team-${teamId}-${libRef.id}`,
    catalogId: null,
    createdBy: uid,
    createdAt: serverTimestamp(),
  });
  return libRef.id;
}

// Removes it from the library only — anyone already given it keeps it.
export async function deleteTeamPatch(teamId, libId) {
  await deleteDoc(doc(db, "teams", teamId, "teamPatches", libId));
}

// Which of these uids already hold this patch (users/{uid}/patches is public
// read). One doc read per member.
export async function fetchPatchHolders(grantDocId, uids) {
  const snaps = await Promise.all(uids.map((uid) => getDoc(doc(db, "users", uid, "patches", grantDocId)).catch(() => null)));
  return new Set(uids.filter((uid, i) => snaps[i]?.exists()));
}

// Gives one library patch to several members. Skips anyone who already has
// it (same read-before-write idempotency as grantPatch). Writes are
// independent, so one rejected recipient (e.g. they just left the team)
// doesn't block the rest.
export async function grantTeamPatch(teamId, entry, uids, grantedBy) {
  const result = { granted: 0, already: 0, failed: 0 };
  await Promise.all(
    uids.map(async (uid) => {
      const target = doc(db, "users", uid, "patches", entry.grantDocId);
      try {
        const existing = await getDoc(target);
        if (existing.exists()) {
          result.already += 1;
          return;
        }
        await setDoc(target, {
          name: entry.name,
          imageUrl: entry.imageUrl,
          details: entry.details || null,
          addedAt: serverTimestamp(),
          granted: true,
          seen: false,
          teamId,
          teamPatchId: entry.id,
          grantedBy,
        });
        result.granted += 1;
      } catch (err) {
        console.error("grantTeamPatch failed for", uid, err);
        result.failed += 1;
      }
    })
  );
  return result;
}
