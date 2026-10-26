import { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  GoogleAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import { collection, deleteDoc, doc, getDoc, getDocFromServer, getDocs, increment, onSnapshot, runTransaction, serverTimestamp, setDoc, updateDoc, writeBatch } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { httpsCallable } from "firebase/functions";
import { auth, db, functions, storage } from "../lib/firebase";

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
  //
  // Real report, 2026-09-20/21: a prospective field owner set up his
  // owner account fine, then opened the player app and it hung forever on
  // the loading screen. Root cause: the owner and player apps share one
  // Firebase project/Auth pool (see VITE_FIREBASE_PROJECT_ID in both
  // apps' env config), so his owner email/password was already a valid
  // Firebase Auth user by the time he tried the player app. Tapping
  // "Sign In" there (rather than "Sign Up") authenticated him
  // successfully via plain signIn() below, which — unlike signUp and
  // signInWithGoogle, both of which already create a users/{uid} doc —
  // never creates one. This listener then legitimately found no doc,
  // called setProfile(null), and nothing else was ever going to create
  // one, so `!profile` stayed true forever with no way out. Switching to
  // an email that had never touched Atlas before worked because that
  // went through the real signUp flow instead. Fixed the same way the
  // owner app already self-heals its own equivalent case, and the same
  // way this file's own signInWithGoogle already does: if the doc is
  // missing, create it instead of leaving the account stranded.
  useEffect(() => {
    if (!user) return;
    //
    // Real report, 2026-10-25: an established player (team captain, many
    // patches, a booked event) signed in and was walked through the
    // brand-new-account flow (terms, welcome splash, onboarding wizard),
    // after which his team/patches/bookings were all still there. Cause:
    // this listener used to treat ANY "doc doesn't exist" snapshot as
    // authoritative — including one served from the local cache when the
    // device couldn't reach Firestore yet (Firestore raises a fromCache
    // snapshot with exists() === false once it decides it's offline). The
    // backfill then ran a full setDoc (no merge) over his real users doc
    // and publicProfiles doc, resetting completedOnboarding to false and
    // wiping acceptedTermsVersion, which is exactly what sent him through
    // signup again. Two fixes: (1) a cache-only "missing" is never acted
    // on — profile stays null, so the shared LoadingScreen (with its
    // existing 8s Retry fallback) keeps showing until the server answers;
    // (2) createPlayerDocs is now create-only inside a transaction (which
    // always reads from the server), so even if this path ever fires for
    // an existing account again, it can't overwrite anything.
    const unsub = onSnapshot(
      doc(db, "users", user.uid),
      { includeMetadataChanges: true },
      (snap) => {
        if (snap.exists()) {
          setProfile(snap.data());
          return;
        }
        if (snap.metadata.fromCache) return; // not a real answer yet — keep loading
        setProfile(null);
        createPlayerDocs(user.uid, user.email, null, null).catch((err) =>
          console.error("player profile backfill failed:", err)
        );
      },
      (err) => console.error("profile listener failed:", err)
    );
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
    // From the server, never the cache — a cache "missing" here would
    // overwrite a real public profile (team, featured patch) with blanks.
    getDocFromServer(doc(db, "publicProfiles", user.uid)).then((snap) => {
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
    }).catch(() => {}); // offline — skip; it re-runs on the next profile load
  }, [user, profile?.callsign]);

  // Picks up email verification completed outside the app (the player
  // clicked the link from the welcome email, possibly on a different
  // device/browser than where they use Atlas) — emailVerified doesn't push
  // to an already-open client, so this re-checks it once per account load
  // and catches Firestore up the first time it's true. Skipped entirely
  // once Firestore already says verified, so an already-verified account
  // never costs an extra Auth call on load. Also fixes a related gap: the
  // publicProfiles backfill above only ever sets verified when the public
  // profile doc doesn't exist yet, so without this, a player's own profile
  // could say verified while their public one (what teammates see) stayed
  // stuck on the stale signup-time value.
  //
  // Also exported as syncEmailVerification so the Profile page's "Verify
  // Email" item can re-check on demand ("I've verified — check again")
  // instead of making the player reload the app. Resolves true once the
  // account is verified and Firestore has been caught up.
  async function syncEmailVerification() {
    const u = auth.currentUser;
    if (!u) return false;
    await u.reload();
    await auth.currentUser?.getIdToken(true); // force a fresh ID token so its email_verified claim matches reality for the rules check
    if (!auth.currentUser?.emailVerified) return false;
    const batch = writeBatch(db);
    batch.set(doc(db, "users", u.uid), { verified: true }, { merge: true });
    batch.set(doc(db, "publicProfiles", u.uid), { verified: true }, { merge: true });
    await batch.commit();
    return true;
  }

  useEffect(() => {
    if (!user || !profile || profile.verified === true) return;
    syncEmailVerification().catch((err) => console.error("email-verification sync failed:", err));
  }, [user, profile?.verified]);

  // Profile page "Verify Email" -> "Send verification link". Atlas-branded
  // via the sendPlayerVerificationEmail Cloud Function (Resend); if that's
  // unreachable, falls back to Firebase's own default email so the player
  // still gets a link. Returns { sent, throttled, alreadyVerified, sentTo }.
  async function sendVerificationEmail() {
    const u = auth.currentUser;
    if (!u) throw new Error("Not signed in.");
    try {
      const res = await httpsCallable(functions, "sendPlayerVerificationEmail")();
      return res.data || {};
    } catch (err) {
      console.warn("sendPlayerVerificationEmail failed, using Firebase's default email:", err?.code || err);
      try {
        await sendEmailVerification(u, { url: "https://airsoftatlas.app/verify-email.html" });
      } catch (err2) {
        if (err2?.code === "auth/too-many-requests") return { sent: false, throttled: true, sentTo: u.email };
        throw err2;
      }
      return { sent: true, sentTo: u.email };
    }
  }

  // Shared by email/password signUp and any social sign-in provider: creates
  // the Firestore users/{uid} doc plus its publicProfiles/{uid} mirror for a
  // brand-new account, and bumps the referrer's count if this signup came
  // through a referral link/QR. Callers must only invoke this for a uid that
  // doesn't already have a users/{uid} doc.
  //
  // Create-only (2026-10-25): runs in a transaction that re-reads both docs
  // from the server first and writes only what's genuinely missing, so it
  // can never overwrite an existing account's profile — see the profile
  // listener's comment above for the incident that made this necessary.
  // Resolves true only if it actually created the users doc.
  async function createPlayerDocs(uid, email, callsign, referredBy) {
    const finalCallsign = callsign || (email ? email.split("@")[0] : "Player");
    const userRef = doc(db, "users", uid);
    const pubRef = doc(db, "publicProfiles", uid);
    const created = await runTransaction(db, async (tx) => {
      const existingUser = await tx.get(userRef);
      const existingPub = await tx.get(pubRef);
      if (existingUser.exists()) return false;
      const createdAt = serverTimestamp();
      tx.set(userRef, {
        email,
        callsign: finalCallsign,
        createdAt,
        // Explicitly false, not just absent — this is what the onboarding
        // wizard gates on. Only brand-new accounts from this point forward
        // ever get this field at all, so an existing, already-established
        // account (where this key simply doesn't exist) can never
        // accidentally match the gate and get forced through it.
        completedOnboarding: false,
        // Whoever's referral link/QR they came through, if any — captured
        // once at signup, not editable after.
        ...(referredBy ? { referredBy } : {}),
      });
      // The narrow public mirror — never email/phone/real name, just what
      // another player is allowed to see. Left alone if it already exists.
      if (!existingPub.exists()) tx.set(pubRef, {
        callsign: finalCallsign,
        avatarUrl: null,
        featuredPatch: null,
        teamId: null,
        teamName: null,
        createdAt,
        verified: false,
        referralCount: 0,
      });
      return true;
    });
    // Real referral tracking now: bump the referrer's own public count by
    // one. This has to target THEIR profile, not the new signer's — the
    // one narrow exception in the rules that allows writing to someone
    // else's publicProfiles doc, and only for this exact field.
    if (created && referredBy) {
      await updateDoc(doc(db, "publicProfiles", referredBy), { referralCount: increment(1) }).catch((err) =>
        console.error("referral count increment failed:", err)
      );
    }
    return created;
  }

  async function signUp(email, password, callsign, referredBy) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (callsign) await updateProfile(cred.user, { displayName: callsign });
    await createPlayerDocs(cred.user.uid, email, callsign, referredBy);
    return cred.user;
  }

  async function signIn(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  }

  // Google sign-in via popup — deliberately never signInWithRedirect. A
  // redirect navigates the tab away and back, which is exactly the WebKit
  // smart-app-banner bug that corrupted window.innerHeight/visualViewport
  // on return from the Stripe Connect flow. Popup keeps this tab in place,
  // same fix pattern already used for every Stripe redirect.
  // New-account detection checks for an existing users/{uid} doc (same
  // Firestore-doc-check pattern as the self-healing backfill above) rather
  // than Firebase's own getAdditionalUserInfo().isNewUser, since what this
  // app actually cares about is whether a Firestore profile exists, not the
  // Auth account's own history. Deliberately does NOT use the Google
  // account's real displayName as the callsign — callsign is a chosen
  // public handle, and publicProfiles is explicitly designed to never carry
  // a real name — so this falls back to the email prefix, same default
  // email/password signup uses when no callsign is given.
  async function signInWithGoogle(referredBy) {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const existing = await getDoc(doc(db, "users", cred.user.uid));
    if (!existing.exists()) {
      await createPlayerDocs(cred.user.uid, cred.user.email, null, referredBy);
    }
    return cred.user;
  }

  // "Forgot password?" on the login screen. Signed-out by design. Atlas-
  // branded via the sendPasswordReset Cloud Function (Resend, link to
  // airsoftatlas.app/reset-password.html); if the function is unreachable,
  // falls back to Firebase's own default reset email so the person still
  // gets a link. Never reveals whether an account exists — resolves the
  // same way for unknown emails; only a malformed address throws.
  async function sendPasswordReset(email) {
    try {
      await httpsCallable(functions, "sendPasswordReset")({ email, app: "player" });
    } catch (err) {
      if (err?.code === "functions/invalid-argument") {
        const e = new Error(err.message);
        e.code = "auth/invalid-email";
        throw e;
      }
      console.warn("sendPasswordReset failed, using Firebase's default email:", err?.code || err);
      try {
        await sendPasswordResetEmail(auth, email, { url: "https://playerapp.airsoftatlas.app/" });
      } catch (err2) {
        if (err2?.code === "auth/user-not-found" || err2?.code === "auth/too-many-requests") return;
        throw err2;
      }
    }
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
    // setDoc+merge, not updateDoc: updateDoc fails outright if the profile
    // doc is missing, which is exactly the state a stranded account is in.
    await setDoc(
      doc(db, "users", auth.currentUser.uid),
      { acceptedTermsVersion: version, acceptedTermsAt: serverTimestamp() },
      { merge: true }
    );
  }

  async function completeOnboarding(data) {
    if (!auth.currentUser) return;
    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      ...data,
      completedOnboarding: true,
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
    sendPasswordReset,
    signInWithGoogle,
    signOut,
    updateCallsign,
    updateProfileFields,
    changePassword,
    uploadAvatar,
    updateLanguage,
    deleteAccount,
    acceptTerms,
    completeOnboarding,
    syncEmailVerification,
    sendVerificationEmail,
  };
}
