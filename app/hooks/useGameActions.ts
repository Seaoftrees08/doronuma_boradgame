"use client";

import { useAuth } from "../contexts/AuthContext";
import { auth } from "../lib/firebase/auth";

export const useGameActions = (roomId: string) => {
  const { user } = useAuth();
  const apiBase = `/api/games/${roomId}`;
  const roomApiBase = `/api/rooms/${roomId}`;

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = await auth.currentUser?.getIdToken();
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }
    return response.json();
  };

  return {
    joinRoom: async (playerName: string) => {
      return fetchWithAuth(`${roomApiBase}/join`, {
        method: "POST",
        body: JSON.stringify({ playerName }),
      });
    },
    toggleReady: async () => {
      return fetchWithAuth(`${roomApiBase}/ready`, { method: "POST" });
    },
    startGame: async () => {
      return fetchWithAuth(`${roomApiBase}/start`, { method: "POST" });
    },
    executeTurn: async (actionType: string, playedCardIds?: string[], targetPlayerId?: string) => {
      return fetchWithAuth(`${apiBase}/action`, {
        method: "POST",
        body: JSON.stringify({ actionType, playedCardIds, targetPlayerId }),
      });
    },
    playInterrupt: async (playedCardId: string, targetPlayerId?: string) => {
      return fetchWithAuth(`${apiBase}/interrupt`, {
        method: "POST",
        body: JSON.stringify({ playedCardId, targetPlayerId }),
      });
    },
    selectTarget: async (targetPlayerId: string) => {
      return fetchWithAuth(`${apiBase}/select-target`, {
        method: "POST",
        body: JSON.stringify({ targetPlayerId }),
      });
    },
    submitDiscard: async (discardedCardIds: string[]) => {
      return fetchWithAuth(`${apiBase}/discard`, {
        method: "POST",
        body: JSON.stringify({ discardedCardIds }),
      });
    },
    checkTimeout: async () => {
      return fetchWithAuth(`${apiBase}/check-timeout`, { method: "POST" });
    },
  };
};
