// Profile copy sync (2026-10-27).
//
// Several docs keep their own copy of a player's callsign/avatarUrl, written
// once when the doc was created: team rosters (teams/*/members), team event
// RSVPs, event "interested" lists, join/officer requests, friend requests,
// and event bookings. Profile edits only ever touched users/{uid} and
// publicProfiles/{uid}, so every one of those copies went stale the moment a
// player renamed themselves or changed their photo (e.g. whyustaring ->
// Snakebite still showing as whyustaring on the La Plaga roster).
//
// syncProfileCopies (index.js) calls collectProfileCopyUpdates whenever
// publicProfiles/{uid} changes callsign or avatarUrl; the one-time backfill
// (scripts/backfill-profile-copies.mjs) reuses the same patch helpers.
//
// Only callsign/avatarUrl (and the adult entry's callsign in a party
// booking's attendees list) are ever written — never payment, status or
// any other booking field. Bookings are only updated for events that
// haven't ended yet, so past rosters keep the name the player booked under.

export function profileChanged(before = {}, after = {}) {
  return (before.callsign || "") !== (after.callsign || "") ||
    (before.avatarUrl || null) !== (after.avatarUrl || null);
}

// YYYY-MM-DD in Michigan time — the same string format events use for date.
export function todayInDetroit(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Detroit", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

// An event counts as upcoming through its last day. No date -> not upcoming
// (leave it alone rather than guess).
export function isUpcoming(dateLike, today) {
  const d = dateLike?.endDate || dateLike?.date;
  return typeof d === "string" && d.slice(0, 10) >= today;
}

// Patch for a doc holding its own copy under nameKey/avatarKey, or null if
// it's already current.
export function copyPatch(data, profile, nameKey = "callsign", avatarKey = "avatarUrl") {
  const callsign = profile.callsign || "Player";
  const avatarUrl = profile.avatarUrl || null;
  const patch = {};
  if ((data?.[nameKey] || "") !== callsign) patch[nameKey] = callsign;
  if ((data?.[avatarKey] || null) !== avatarUrl) patch[avatarKey] = avatarUrl;
  return Object.keys(patch).length ? patch : null;
}

// Party bookings list the guardian as { kind: "adult", callsign }. Returns
// the corrected array, or null if nothing changes. Children's callsigns
// come from dependents and are left untouched.
export function attendeesPatch(attendees, callsign) {
  if (!Array.isArray(attendees)) return null;
  let changed = false;
  const next = attendees.map((a) => {
    if (a?.kind === "adult" && a.callsign !== callsign) { changed = true; return { ...a, callsign }; }
    return a;
  });
  return changed ? next : null;
}

// Booking doc on events/{eventId}/bookings/{uid}.
export function eventBookingPatch(data, profile) {
  const patch = copyPatch(data, profile) || {};
  const att = attendeesPatch(data?.attendees, profile.callsign || "Player");
  if (att) patch.attendees = att;
  return Object.keys(patch).length ? patch : null;
}

// Player's own mirror users/{uid}/bookings/{eventId} — only the attendees
// list carries a callsign there.
export function bookingMirrorPatch(data, profile) {
  const att = attendeesPatch(data?.attendees, profile.callsign || "Player");
  return att ? { attendees: att } : null;
}

// Finds every stale copy for one player. Returns [{ ref, patch }].
// Each section is isolated so one failing query (e.g. an index still
// building) doesn't stop the rest.
export async function collectProfileCopyUpdates(db, uid, profile, today) {
  const out = [];
  const add = (ref, patch) => { if (patch) out.push({ ref, patch }); };
  const section = async (name, fn) => {
    try { await fn(); } catch (err) { console.error(`profileSync ${name} failed for ${uid}:`, err); }
  };

  await section("members", async () => {
    const s = await db.collectionGroup("members").where("uid", "==", uid).get();
    s.docs.forEach((d) => add(d.ref, copyPatch(d.data(), profile)));
  });
  await section("rsvps", async () => {
    const s = await db.collectionGroup("rsvps").where("uid", "==", uid).get();
    s.docs.forEach((d) => add(d.ref, copyPatch(d.data(), profile)));
  });
  await section("interested", async () => {
    const s = await db.collectionGroup("interested").where("uid", "==", uid).get();
    s.docs.forEach((d) => add(d.ref, copyPatch(d.data(), profile)));
  });
  for (const c of ["joinRequests", "officerRequests"]) {
    await section(c, async () => {
      const s = await db.collection(c).where("uid", "==", uid).get();
      s.docs.forEach((d) => add(d.ref, copyPatch(d.data(), profile)));
    });
  }
  await section("friendRequests", async () => {
    const [from, to] = await Promise.all([
      db.collection("friendRequests").where("fromUid", "==", uid).get(),
      db.collection("friendRequests").where("toUid", "==", uid).get(),
    ]);
    from.docs.forEach((d) => add(d.ref, copyPatch(d.data(), profile, "fromCallsign", "fromAvatarUrl")));
    to.docs.forEach((d) => add(d.ref, copyPatch(d.data(), profile, "toCallsign", "toAvatarUrl")));
  });
  await section("bookings", async () => {
    const mirrors = await db.collection("users").doc(uid).collection("bookings").get();
    const upcoming = mirrors.docs.filter((d) => isUpcoming(d.data(), today));
    for (const m of upcoming) {
      add(m.ref, bookingMirrorPatch(m.data(), profile));
      const eventId = m.data().eventId || m.id;
      const bRef = db.collection("events").doc(eventId).collection("bookings").doc(uid);
      const b = await bRef.get();
      if (b.exists) add(bRef, eventBookingPatch(b.data(), profile));
    }
  });
  return out;
}

export async function applyProfileCopyUpdates(db, updates) {
  for (let i = 0; i < updates.length; i += 400) {
    const batch = db.batch();
    updates.slice(i, i + 400).forEach(({ ref, patch }) => batch.update(ref, patch));
    await batch.commit();
  }
}
