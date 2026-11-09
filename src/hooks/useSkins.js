import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../lib/firebase";

// Paid skins (2026-11-09). Ownership lives at users/{uid}/skins/{skinId} and
// is written ONLY by the Stripe webhook — this hook just listens, so a
// purchase shows up here the moment payment is confirmed.
export function useOwnedSkins(uid) {
  const [owned, setOwned] = useState([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setOwned([]);
    setLoaded(false);
    if (!uid) return undefined;
    return onSnapshot(
      collection(db, "users", uid, "skins"),
      (snap) => { setOwned(snap.docs.map((d) => d.id)); setLoaded(true); },
      (err) => { console.error("useOwnedSkins:", err); setLoaded(true); }
    );
  }, [uid]);
  return { owned, loaded };
}

// Saves the equipped look on the account. The rule refuses anything but
// "light", "dark" or a skin this player owns.
export async function saveAppearance(uid, lookId) {
  await updateDoc(doc(db, "users", uid), { appearance: lookId });
}

// "Notify me" for the next limited drop.
export async function setSkinDropAlerts(uid, on) {
  await updateDoc(doc(db, "users", uid), { skinDropAlerts: !!on });
}

// { skinIds: [...] } or { bundle: true } -> Stripe Checkout URL. The server
// prices it; the client never sends a price.
export async function startSkinCheckout(req) {
  const call = httpsCallable(functions, "createSkinCheckout");
  const result = await call(req);
  return result.data.url;
}
