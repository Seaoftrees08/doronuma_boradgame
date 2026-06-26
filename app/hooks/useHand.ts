"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase/firestore";
import { ActionCard } from "@doronuma/shared";

export const useHand = (roomId: string, playerId: string) => {
  const [hand, setHand] = useState<ActionCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId || !playerId) return;

    const handRef = doc(db, "rooms", roomId, "hands", playerId);
    const unsubscribe = onSnapshot(handRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setHand(data.cards || []);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId, playerId]);

  return { hand, loading };
};
