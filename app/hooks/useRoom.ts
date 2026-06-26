"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase/firestore";
import { RoomDocument } from "@doronuma/shared";

export const useRoom = (roomId: string) => {
  const [room, setRoom] = useState<RoomDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const roomRef = doc(db, "rooms", roomId);
    const unsubscribe = onSnapshot(
      roomRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setRoom(docSnap.data() as RoomDocument);
        } else {
          setRoom(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching room:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [roomId]);

  return { room, loading, error };
};
