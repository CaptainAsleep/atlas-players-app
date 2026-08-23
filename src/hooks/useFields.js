import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../lib/firebase";

export function useFields() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "fields"), orderBy("name"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setFields(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("useFields error:", err);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  return { fields, loading };
}
