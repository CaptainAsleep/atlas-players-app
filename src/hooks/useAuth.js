import { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "../lib/firebase";

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

  // Self-healing backfill: accounts created before the public-profile
  // mirror existed have a real users/{uid} doc but no publicProfiles/{uid}
  // counterpart, so they're invisible to search and can't be viewed or
  // friended. Rather than requiring a one-time migration script, this
  // quietly creates the missing mirror the next time that account's own
  // profile loads — each user can only write their own doc anyway, so this
  // naturally heals the whole existing user base over time as people use
  // the app, no manual step needed.
  useEffect(() => {
    if (!user || !profile) return;
    getDoc(doc(db, "publicProfiles", user.uid)).then((snap) => {
      if (!snap.exists()) {
        setDoc(doc(db, "publicProfiles", user.uid), {
          callsign: profile.callsign || "Player",
          avatarUrl: profile.avatarUrl || null,
          featuredPatch: profile.featuredPatch || null,
          teamId: profile.teamId || null,
          teamName: profile.teamName || null,
          createdAt: profile.createdAt || serverTimestamp(),
          verified: profile.verified || false,
        }).catch((err) => console.error("public profile backfill failed:", err));
      }
    });
  }, [user, profile?.callsign]);

  async function signUp(email, password, callsign, referredBy) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const finalCallsign = callsign || email.split("@")[0];
    if (callsign) await updateProfile(cred.user, { displayName: callsign });
    const createdAt = serverTimestamp();
    await setDoc(doc(db, "users", cred.user.uid), {
      email,
      callsign: finalCallsign,
      createdAt,
      // Whoever's referral link/QR they came through, if any — captured
      // once at signup, not editable after. No reward mechanism wired to
      // this yet, just an honest record of the relationship for whenever
      // one gets built.
      ...(referredBy ? { referredBy } : {}),
    });
    // The narrow public mirror — never email/phone/real name, just what
    // another player is allowed to see.
    await setDoc(doc(db, "publicProfiles", cred.user.uid), {
      callsign: finalCallsign,
      avatarUrl: null,
      featuredPatch: null,
      teamId: null,
      teamName: null,
      createdAt,
      verified: false,
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

  // Updates the callsign everywhere it's stored: the Firestore profile doc
  // (what the app actually displays) and Auth's displayName (kept in sync
  // for consistency, in case anything reads it directly later).
  async function updateCallsign(newCallsign) {
    if (!auth.currentUser) return;
    await updateDoc(doc(db, "users", auth.currentUser.uid), { callsign: newCallsign });
    await updateDoc(doc(db, "publicProfiles", auth.currentUser.uid), { callsign: newCallsign });
    await updateProfile(auth.currentUser, { displayName: newCallsign });
  }

  // Batched update for the My Account page — callsign, first/last name, and
  // phone in one write. Callsign changes still sync Auth's displayName and
  // the public profile mirror; first/last name and phone never do — those
  // are exactly the fields the public mirror is deliberately built to
  // exclude.
  async function updateProfileFields({ callsign, firstName, lastName, phone }) {
    if (!auth.currentUser) return;
    await updateDoc(doc(db, "users", auth.currentUser.uid), { callsign, firstName, lastName, phone });
    if (callsign) {
      await updateDoc(doc(db, "publicProfiles", auth.currentUser.uid), { callsign });
      await updateProfile(auth.currentUser, { displayName: callsign });
    }
  }

  // Records that this account has agreed to the current version of the
  // Terms/Privacy Policy/EULA. Bumping CURRENT_TERMS_VERSION (in
  // legalText.js) makes every existing account fail this check again,
  // forcing re-acceptance the same way a first-time signup does.
  async function acceptTerms(version) {
    if (!auth.currentUser) return;
    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      acceptedTermsVersion: version,
      acceptedTermsAt: serverTimestamp(),
    });
  }

  // Saves the preference only — the app doesn't actually translate its UI
  // yet, so this is honestly just laying groundwork for when real i18n
  // gets built, not claiming a feature that doesn't exist.
  async function updateLanguage(newLanguage) {
    if (!auth.currentUser) return;
    await updateDoc(doc(db, "users", auth.currentUser.uid), { language: newLanguage });
  }

  // Firebase requires proving the current password (re-authenticating)
  // before allowing a password change — this isn't optional, it's how
  // Firebase Auth protects against someone with a stale open session
  // changing the password on a shared/unlocked device.
  async function changePassword(currentPassword, newPassword) {
    if (!auth.currentUser?.email) return;
    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, credential);
    await updatePassword(auth.currentUser, newPassword);
  }

  // Takes an already-resized image Blob (resizing happens in the component,
  // right where the file picker lives), uploads it to this user's own
  // Storage folder, and saves the resulting URL to their profile doc.
  async function uploadAvatar(blob) {
    if (!auth.currentUser) return;
    const storageRef = ref(storage, `avatars/${auth.currentUser.uid}/profile.jpg`);
    await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
    const url = await getDownloadURL(storageRef);
    await updateDoc(doc(db, "users", auth.currentUser.uid), { avatarUrl: url });
    await updateDoc(doc(db, "publicProfiles", auth.currentUser.uid), { avatarUrl: url });
    await updateProfile(auth.currentUser, { photoURL: url });
    return url;
  }

  // Permanently deletes the account. Requires re-authentication for the
  // same reason password changes do — this is irreversible, so Firebase
  // (correctly) won't allow it on a stale session. Cleans up what it safely
  // can: favorites and the avatar file. Deliberately does NOT touch
  // waiverSignatures — those are permanent legal records the Firestore
  // rules already block deleting, and that's correct: a field owner's
  // proof someone signed shouldn't vanish because the player's account did.
  async function deleteAccount(currentPassword) {
    if (!auth.currentUser?.email) return;
    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, credential);

    const uid = auth.currentUser.uid;
    const favSnap = await getDocs(collection(db, "users", uid, "favorites"));
    await Promise.all(favSnap.docs.map((d) => deleteDoc(d.ref)));

    try {
      await deleteObject(ref(storage, `avatars/${uid}/profile.jpg`));
    } catch {
      // No avatar on file — nothing to clean up.
    }

    await deleteDoc(doc(db, "users", uid));
    await deleteDoc(doc(db, "publicProfiles", uid)).catch(() => {});
    await deleteUser(auth.currentUser);
  }

  return {
    user,
    profile,
    authLoading,
    signUp,
    signIn,
    signOut,
    updateCallsign,
    updateProfileFields,
    changePassword,
    uploadAvatar,
    updateLanguage,
    deleteAccount,
    acceptTerms,
  };
}
