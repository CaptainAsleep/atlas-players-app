import { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Track the Firebase Auth session itself.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (!u) setProfile(null);
    });
    return unsub;
  }, []);

  // Once signed in, subscribe to that user's profile document.
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      setProfile(snap.exists() ? snap.data() : null);
    });
    return unsub;
  }, [user]);

  async function signUp(email, password, callsign) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (callsign) await updateProfile(cred.user, { displayName: callsign });
    await setDoc(doc(db, "users", cred.user.uid), {
      email,
      callsign: callsign || email.split("@")[0],
      createdAt: serverTimestamp(),
    });
    return cred.user;
  }

  async function signIn(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  }

  async function signOut() {
    await firebaseSignOut(auth);
  }

  return { user, profile, authLoading, signUp, signIn, signOut };
}
