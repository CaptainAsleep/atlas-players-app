import { useEffect, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "../lib/firebase";

// Self-managed for now — there's no owner-app "award a patch" flow yet, so
// this is honestly a personal collection the player curates themselves
// (real patches they actually own), not an earned-achievement system. Same
// storage/Firestore foundation a real earning system would read from later.
export function usePatches(uid) {
  const [patches, setPatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setPatches([]);
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(
      collection(db, "users", uid, "patches"),
      (snap) => {
        setPatches(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("usePatches error:", err);
        setLoading(false);
      }
    );
    return unsub;
  }, [uid]);

  // Takes an already-resized image Blob (resizing happens where the file
  // picker lives, same as avatar upload) plus a display name.
  async function addPatch(uid, name, blob) {
    const patchId = doc(collection(db, "users", uid, "patches")).id;
    const storageRef = ref(storage, `patches/${uid}/${patchId}.jpg`);
    await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
    const imageUrl = await getDownloadURL(storageRef);
    await setDoc(doc(db, "users", uid, "patches", patchId), {
      name,
      imageUrl,
      addedAt: serverTimestamp(),
    });
    return { id: patchId, name, imageUrl };
  }

  async function removePatch(uid, patchId) {
    await deleteDoc(doc(db, "users", uid, "patches", patchId));
    try {
      await deleteObject(ref(storage, `patches/${uid}/${patchId}.jpg`));
    } catch {
      // File may not exist under this exact path — not worth failing over.
    }
  }

  // Denormalized onto the profile doc (rather than just referencing a patch
  // id) so anywhere that displays the callsign can show the featured patch
  // with a single read, no extra query needed.
  async function setFeaturedPatch(uid, patch) {
    const featuredPatch = patch ? { name: patch.name, imageUrl: patch.imageUrl } : null;
    await updateDoc(doc(db, "users", uid), { featuredPatch });
    await updateDoc(doc(db, "publicProfiles", uid), { featuredPatch });
  }

  return { patches, patchesLoading: loading, addPatch, removePatch, setFeaturedPatch };
}
