// Looks up a user's display name once (cached for the session).
import { COLLECTIONS } from "@/config/firebase";
import firestore from "@react-native-firebase/firestore";
import { useEffect, useState } from "react";

const cache = new Map<string, string>();

export function useUserName(userId: string | undefined, fallback = "Teacher"): string {
  const [name, setName] = useState(() => (userId && cache.get(userId)) || fallback);
  useEffect(() => {
    if (!userId) return;
    const hit = cache.get(userId);
    if (hit) {
      setName(hit);
      return;
    }
    let alive = true;
    firestore()
      .collection(COLLECTIONS.USERS)
      .doc(userId)
      .get()
      .then((doc) => {
        const n = (doc.data()?.name as string | undefined) ?? fallback;
        cache.set(userId, n);
        if (alive) setName(n);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [userId, fallback]);
  return name;
}
