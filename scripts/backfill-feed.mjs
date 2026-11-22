// Social Feed launch backfill (2026-11-22). Fills everyone's Feed with the
// last 30 days of their friends' activity, so it isn't empty on first open.
// Uses the same helpers as the live triggers (functions/feedStore.js), so it
// writes exactly the same docs. Safe to re-run: activity ids are
// deterministic and existing ones are left alone.
//
// Run AFTER deploying firestore rules/indexes and functions, BEFORE pushing
// the app:
//   node scripts/backfill-feed.mjs           # dry run — prints what it would post, writes nothing
//   node scripts/backfill-feed.mjs --write   # do it
//
// Also writes first-save markers (activityKeys) for every CURRENT favorite,
// even old ones, so un-saving and re-saving something you saved before the
// feed existed doesn't post it as new (decision 10).
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";
import * as feed from "../functions/feed.js";
import * as feedStore from "../functions/feedStore.js";

initializeApp({ credential: cert(JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)))) });
const db = getFirestore();
const WRITE = process.argv.includes("--write");
const now = Date.now();
const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Detroit" });
const inWindow = (v) => feed.withinWindow(feed.toMs(v), now);

const plans = []; // { actorUid, type, refId, data, createdAt }
const markers = []; // { uid, type, refId }
const counts = {};
const add = (p) => { plans.push(p); counts[p.type] = (counts[p.type] || 0) + 1; };

const eventCache = new Map(), fieldCache = new Map(), teamCache = new Map();
const cached = async (map, key, load) => (map.has(key) ? map.get(key) : map.set(key, await load()).get(key));

const players = (await db.collection("publicProfiles").get()).docs.map((d) => ({ uid: d.id, callsign: d.data().callsign || "Player" }));
console.log(`${WRITE ? "WRITE" : "DRY RUN — nothing written"}. ${players.length} players. Window: last ${feed.FEED_DAYS} days.`);

for (const { uid } of players) {
  const userRef = db.collection("users").doc(uid);
  const [favs, bookings, patches] = await Promise.all([
    userRef.collection("favorites").get(),
    userRef.collection("bookings").get(),
    userRef.collection("patches").get(),
  ]);

  // Bookings first: a booking or check-in replaces "interested" for that event.
  const eventsWithBooking = new Set();
  for (const b of bookings.docs) {
    const d = b.data();
    if (feed.bookingIsSilent(d)) continue;
    eventsWithBooking.add(b.id);
    const ev = await cached(eventCache, b.id, () => feedStore.eventData(db, b.id));
    const display = ev || feed.eventDisplayFromBooking(b.id, d);
    if (d.checkedIn === true) {
      const at = d.checkedInAt || d.bookedAt;
      if (inWindow(at)) add({ actorUid: uid, type: "checkedIn", refId: b.id, data: display, createdAt: new Date(feed.toMs(at)) });
    } else if (inWindow(d.bookedAt)) {
      const last = display.endDate || display.date;
      if (!last || last >= today) add({ actorUid: uid, type: "booked", refId: b.id, data: display, createdAt: new Date(feed.toMs(d.bookedAt)) });
    }
  }

  for (const f of favs.docs) {
    const d = f.data();
    const m = feed.favoriteActivity(d);
    if (!m) continue;
    markers.push({ uid, type: m.type, refId: m.refId });
    if (!inWindow(d.savedAt)) continue;
    if (m.type === "interested") {
      if (eventsWithBooking.has(m.refId)) continue;
      const ev = await cached(eventCache, m.refId, () => feedStore.eventData(db, m.refId));
      if (!ev) continue;
      const last = ev.endDate || ev.date;
      if (last && last < today) continue;
      add({ actorUid: uid, type: "interested", refId: m.refId, data: ev, createdAt: new Date(feed.toMs(d.savedAt)) });
    } else {
      const fd = await cached(fieldCache, m.refId, () => feedStore.fieldData(db, m.refId));
      if (fd) add({ actorUid: uid, type: "savedField", refId: m.refId, data: fd, createdAt: new Date(feed.toMs(d.savedAt)) });
    }
  }

  // Patches: same 10-minute grouping as the live trigger.
  const recent = patches.docs
    .map((p) => ({ id: p.id, data: p.data(), ms: feed.toMs(p.data().addedAt) }))
    .filter((p) => p.data.inherited !== true && inWindow(p.ms))
    .sort((a, b) => a.ms - b.ms);
  let group = null;
  for (const p of recent) {
    if (group && p.ms - group.startMs <= feed.PATCH_GROUP_MS) {
      group.patches.push(feed.patchEntry(p.id, p.data));
    } else {
      group = { startMs: p.ms, firstId: p.id, patches: [feed.patchEntry(p.id, p.data)] };
      add({ actorUid: uid, type: "patch", refId: p.id, data: group, createdAt: new Date(p.ms) });
    }
  }
}
// Turn patch groups into the stored shape.
for (const p of plans) if (p.type === "patch") p.data = { patches: p.data.patches, patchIds: p.data.patches.map((x) => x.id) };

// Team joins (adults only).
const members = await db.collectionGroup("members").get();
for (const m of members.docs) {
  const d = m.data();
  const memberUid = m.id;
  if (feed.isChildPublicId(memberUid) || d.kind === "child" || !inWindow(d.joinedAt)) continue;
  const teamId = m.ref.parent.parent.id;
  const td = await cached(teamCache, teamId, () => feedStore.teamData(db, teamId));
  if (td) add({ actorUid: memberUid, type: "joinedTeam", refId: teamId, data: td, createdAt: new Date(feed.toMs(d.joinedAt)) });
}

// Card collections.
const collections = await db.collection("cardCollections").get();
for (const c of collections.docs) {
  const d = c.data();
  if (!d.collectorUid || !d.ownerId || !inWindow(d.collectedAt)) continue;
  const cd = await feedStore.cardOwnerData(db, d.ownerId, d.ownerKind);
  if (cd) add({ actorUid: d.collectorUid, type: "cardCollected", refId: d.ownerId, data: cd, createdAt: new Date(feed.toMs(d.collectedAt)) });
}

const nameOf = new Map(players.map((p) => [p.uid, p.callsign]));
console.log(`\nActivity to post: ${plans.length}`, counts);
console.log(`First-save markers: ${markers.length}`);
for (const p of plans.sort((a, b) => a.createdAt - b.createdAt)) {
  const what = p.data.eventTitle || p.data.fieldName || p.data.teamName || p.data.ownerCallsign || (p.data.patches || []).map((x) => x.name).join(", ");
  console.log(`  ${p.createdAt.toISOString().slice(0, 10)}  ${(nameOf.get(p.actorUid) || p.actorUid).padEnd(18)} ${p.type.padEnd(13)} ${what || ""}`);
}

if (!WRITE) {
  console.log("\nDry run only. Re-run with --write to post these.");
  process.exit(0);
}

let posted = 0, existed = 0;
for (const m of markers) await feedStore.claimMarker(db, m.uid, m.type, m.refId);
for (const p of plans) {
  const r = await feedStore.postActivity(db, p);
  if (r.created) posted++; else existed++;
}
console.log(`\nDone. Posted ${posted} new, ${existed} already existed. Markers written for ${markers.length} favorites.`);
