"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase/firestore";
import { GameStateDocument } from "@doronuma/shared";

export const useGameState = (roomId: string) => {
  const [gameState, setGameState] = useState<GameStateDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const stateRef = doc(db, "rooms", roomId, "gameState", "state");
    const unsubscribe = onSnapshot(
      stateRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setGameState(docSnap.data() as GameStateDocument);
        } else {
          setGameState(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching game state:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [roomId]);

  return { gameState, loading, error };
};
