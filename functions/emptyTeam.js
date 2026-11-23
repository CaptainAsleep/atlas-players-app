// Empty-team cleanup (2026-11-23). When a team ends up with nobody in it,
// Atlas emails its creator a link with two choices: rejoin (back on the
// roster as officer, since joinPolicy "approval" means nobody else can let
// them in) or delete the team. Same shape as post-event feedback: the email
// carries a random token, the public page at airsoftatlas.app/team.html
// trades it for context and then for the action. Only the token's SHA-256
// is stored (emptyTeamTokens/{hash}), same as childGraduations, so a leaked
// database row can't be replayed as a link. No client rules: Admin SDK only.
//
// The buttons in the email open a confirm page; nothing happens on a plain
// GET, so mail scanners that pre-open links can't rejoin or delete anything.
import { randomBytes, createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

export const EMPTY_TEAM_EMAIL_FROM = "Airsoft Atlas <teams@airsoftatlas.app>";
export const EMPTY_TEAM_REPLY_TO = "Michael@airsoftatlas.app";
export const EMPTY_TEAM_PAGE_URL = "https://airsoftatlas.app/team.html";
export const EMPTY_TEAM_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const template = readFileSync(path.join(__dirname, "templates", "empty-team.html"), "utf-8");

export function newToken() {
  return randomBytes(24).toString("base64url"); // 32 chars, URL-safe
}
export function hashToken(token) {
  return createHash("sha256").update(String(token)).digest("hex");
}
export function isWellFormedToken(token) {
  return typeof token === "string" && /^[A-Za-z0-9_-]{20,64}$/.test(token);
}

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fill = (h, r) => Object.entries(r).reduce((o, [k, v]) => o.split(k).join(v), h);

export function renderEmail({ callsign, teamName, token }) {
  const base = `${EMPTY_TEAM_PAGE_URL}?t=${encodeURIComponent(token)}`;
  const name = esc(teamName || "your team");
  return {
    subject: `${teamName || "Your team"} has no members — rejoin or delete it?`,
    html: fill(template, {
      "[CALLSIGN]": esc(callsign || "Operator"),
      "[TEAM]": name,
      "[REJOIN_URL]": `${base}&amp;a=rejoin`,
      "[DELETE_URL]": `${base}&amp;a=delete`,
    }),
  };
}

// Creates the token doc for one team + its creator. Returns the raw token
// (goes in the email only; never stored).
export async function createOffer(db, { teamId, uid, email }) {
  const token = newToken();
  await db.collection("emptyTeamTokens").doc(hashToken(token)).set({
    teamId, uid, email: email || null,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + EMPTY_TEAM_TOKEN_TTL_MS),
    usedAt: null, result: null,
  });
  return token;
}

async function loadToken(db, token) {
  if (!isWellFormedToken(token)) return null;
  const ref = db.collection("emptyTeamTokens").doc(hashToken(token));
  const snap = await ref.get();
  if (!snap.exists) return null;
  return { ref, ...snap.data() };
}

const expired = (t) => {
  const ms = t.expiresAt?.toMillis ? t.expiresAt.toMillis() : new Date(t.expiresAt).getTime();
  return Number.isFinite(ms) && Date.now() > ms;
};

// What the confirm page shows. status: "open" | "used" | "expired" | "gone"
export async function getContext(db, token) {
  const t = await loadToken(db, token);
  if (!t) return null;
  const team = await db.collection("teams").doc(t.teamId).get();
  const teamName = team.exists ? team.data().name || "your team" : (t.teamName || "your team");
  if (t.usedAt) return { status: "used", result: t.result, teamName };
  if (!team.exists) return { status: "gone", teamName };
  if (expired(t)) return { status: "expired", teamName };
  const members = await team.ref.collection("members").limit(1).get();
  return { status: "open", teamName, hasMembers: !members.empty };
}

export class EmptyTeamError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

// action: "rejoin" | "delete". One-shot: the token is marked used either way.
export async function resolve(db, storage, token, action) {
  if (action !== "rejoin" && action !== "delete") throw new EmptyTeamError("invalid-argument", "Unknown action.");
  const t = await loadToken(db, token);
  if (!t) throw new EmptyTeamError("not-found", "This link isn't valid.");
  if (t.usedAt) throw new EmptyTeamError("failed-precondition", "This link has already been used.");
  if (expired(t)) throw new EmptyTeamError("failed-precondition", "This link has expired. Reply to the email and we'll sort it out.");

  const teamRef = db.collection("teams").doc(t.teamId);
  const team = await teamRef.get();
  if (!team.exists) throw new EmptyTeamError("not-found", "This team no longer exists.");
  const teamName = team.data().name || "your team";

  if (action === "rejoin") {
    const [userSnap, pubSnap] = await Promise.all([
      db.collection("users").doc(t.uid).get(),
      db.collection("publicProfiles").doc(t.uid).get(),
    ]);
    if (!userSnap.exists) throw new EmptyTeamError("not-found", "We couldn't find your Atlas account.");
    const user = userSnap.data(), pub = pubSnap.exists ? pubSnap.data() : {};
    const batch = db.batch();
    // Same member record createTeam writes for a founder.
    batch.set(teamRef.collection("members").doc(t.uid), {
      uid: t.uid,
      callsign: pub.callsign || user.callsign || "Player",
      avatarUrl: pub.avatarUrl ?? user.avatarUrl ?? null,
      role: "officer",
      joinedAt: new Date(),
    });
    // Same display rule as createTeam/joinTeam: never replaces a team
    // already shown on the profile.
    if (!user.teamId) {
      batch.update(userSnap.ref, { teamId: t.teamId, teamName });
      if (pubSnap.exists) batch.update(pubSnap.ref, { teamId: t.teamId, teamName });
    }
    batch.update(t.ref, { usedAt: new Date(), result: "rejoined" });
    await batch.commit();
    return { result: "rejoined", teamName };
  }

  // Delete: only while the team is still empty. If someone got onto the
  // roster since the email went out, an officer should delete it in-app.
  const members = await teamRef.collection("members").limit(1).get();
  if (!members.empty) throw new EmptyTeamError("failed-precondition", "Someone has joined this team since we emailed you, so we didn't delete it. Open Atlas to manage it.");

  // Loose ends keyed by teamId (all top-level).
  for (const coll of ["joinRequests", "teamInvites", "officerRequests"]) {
    const s = await db.collection(coll).where("teamId", "==", t.teamId).get();
    for (const d of s.docs) await d.ref.delete();
  }
  await db.recursiveDelete(teamRef); // events, roles, ranks, patch library, etc.
  // Storage: the team's own patch, event banners and rank insignia. Patch
  // library images (teamPatches/{teamId}/lib-*.png) are left alone, since
  // patches already granted to past members may still point at them.
  if (storage) {
    const bucket = storage.bucket();
    await bucket.file(`teamPatches/${t.teamId}/patch.jpg`).delete().catch(() => {});
    await bucket.deleteFiles({ prefix: `teamEventBanners/${t.teamId}/` }).catch(() => {});
    await bucket.deleteFiles({ prefix: `teamRanks/${t.teamId}/` }).catch(() => {});
  }
  await t.ref.update({ usedAt: new Date(), result: "deleted", teamName });
  return { result: "deleted", teamName };
}
