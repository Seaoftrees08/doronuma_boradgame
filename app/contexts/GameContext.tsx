"use client";

import React, { createContext, useContext } from "react";
import { useRoom } from "../hooks/useRoom";
import { useGameState } from "../hooks/useGameState";

interface GameContextType {
  roomState: ReturnType<typeof useRoom>;
  gameStateData: ReturnType<typeof useGameState>;
}

const GameContext = createContext<GameContextType | null>(null);

export const GameProvider = ({ roomId, children }: { roomId: string, children: React.ReactNode }) => {
  const roomState = useRoom(roomId);
  const gameStateData = useGameState(roomId);

  return (
    <GameContext.Provider value={{ roomState, gameStateData }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};
