import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../lib/firebase";

// Team Bookings (2026-11-05). All writes go through Cloud Functions
// (functions/index.js, "Team Bookings" section); these are live reads plus
// thin callable wrappers.

// Tickets waiting for this player to claim, or already claimed and held —
// as the adult recipient, or as a child's guardian. Drives the Home screen
// countdown card and the event page's claim / give-back block.
export function useMyTicketHoldings(uid) {
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!uid) {
      setHoldings([]);
      setLoading(false);
      return undefined;
    }
    const unsub = onSnapshot(
      query(collection(db, "teamTicketHolders"), where("holderUid", "==", uid)),
      (snap) => {
        setHoldings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("useMyTicketHoldings error:", err);
        setLoading(false);
      }
    );
    return unsub;
  }, [uid]);
  return { holdings, holdingsLoading: loading };
}

// The tickets this player bought for one event (any number of purchases).
export function useMyEventTeamTickets(uid, eventId) {
  const [tickets, setTickets] = useState([]);
  useEffect(() => {
    if (!uid || !eventId) {
      setTickets([]);
      return undefined;
    }
    const unsub = onSnapshot(
      query(collection(db, "teamTickets"), where("buyerUid", "==", uid), where("eventId", "==", eventId)),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0) || a.id.localeCompare(b.id));
        setTickets(list);
      },
      (err) => console.error("useMyEventTeamTickets error:", err)
    );
    return unsub;
  }, [uid, eventId]);
  return tickets;
}

const call = (name) => async (data) => (await httpsCallable(functions, name)(data)).data;

export const createTeamTicketCheckout = call("createTeamTicketCheckout");
export const assignTeamTicket = call("assignTeamTicket");
export const acceptTeamTicket = call("acceptTeamTicket");
export const returnTeamTicket = call("returnTeamTicket");
export const searchTeamTicketRecipients = call("searchTeamTicketRecipients");
export const giveTeamTicketVoucher = call("giveTeamTicketVoucher");

// Mirrors teamTickets.js on the server.
export const MAX_TEAM_TICKETS = 20;

export function msOf(ts) {
  if (!ts) return null;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (ts instanceof Date) return ts.getTime();
  return typeof ts === "number" ? ts : null;
}

// Whole days left, rounded up; 0 once under a minute.
export function daysLeft(deadlineMs, nowMs = Date.now()) {
  if (deadlineMs == null) return null;
  const ms = deadlineMs - nowMs;
  if (ms <= 60000) return 0;
  return Math.ceil(ms / 86400000);
}

export function countdownLabel(deadlineMs, nowMs = Date.now()) {
  if (deadlineMs == null) return "";
  const ms = deadlineMs - nowMs;
  if (ms <= 60000) return "time's up";
  const hours = Math.ceil(ms / 3600000);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} left to claim`;
  const days = daysLeft(deadlineMs, nowMs);
  return `${days} day${days === 1 ? "" : "s"} left to claim`;
}

// Friendly text for a callable error: HttpsError messages are written to be
// shown; anything else gets the fallback.
export function callableMessage(err, fallback) {
  const code = String(err?.code || "").replace(/^functions\//, "");
  const known = ["failed-precondition", "already-exists", "not-found", "invalid-argument", "permission-denied", "unauthenticated"].includes(code);
  return known && err?.message ? err.message : fallback;
}
