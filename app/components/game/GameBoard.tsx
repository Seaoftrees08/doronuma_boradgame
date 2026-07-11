"use client";

import { useState, useEffect } from "react";
import { useGame } from "../../contexts/GameContext";
import { useAuth } from "../../contexts/AuthContext";
import { useHand } from "../../hooks/useHand";
import PlayerHand from "./PlayerHand";
import OpponentList from "./OpponentList";
import ActionArea from "./ActionArea";
import DeckArea from "./DeckArea";
import TurnIndicator from "./TurnIndicator";
import { InterruptOverlay } from "./InterruptOverlay";
import ResultScreen from "./ResultScreen";

export default function GameBoard() {
  const { roomState, gameStateData } = useGame();
  const { user } = useAuth();
  
  const room = roomState.room;
  const gameState = gameStateData.gameState;
  const { hand } = useHand(room?.roomId || "", user?.uid || "");

  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);

  // タイムアウト監視とバックエンド自動通知
  useEffect(() => {
    if (!room || !gameState) return;

    const deadline = gameState.phase === 'interrupt' && gameState.interruptDeadline
      ? gameState.interruptDeadline
      : gameState.turnDeadline;

    if (!deadline) return;

    const checkTimeout = async () => {
      const now = Date.now();
      if (now >= deadline) {
        try {
          const response = await fetch(`/api/games/${room.roomId}/check-timeout`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${await user?.getIdToken()}`
            }
          });
          if (!response.ok) {
            console.error("Timeout check failed");
          }
        } catch (error) {
          console.error("Error invoking timeout check:", error);
        }
      }
    };

    const delay = Math.max(0, deadline - Date.now());
    const timerId = setTimeout(checkTimeout, delay + 1000); // 1秒余裕を持たせる

    return () => clearTimeout(timerId);
  }, [room?.roomId, gameState?.turnDeadline, gameState?.interruptDeadline, gameState?.phase, user]);

  if (roomState.loading || gameStateData.loading || !room || !gameState) {
    return <div className="flex flex-1 items-center justify-center">Loading Game...</div>;
  }

  const handleCardSelect = (cardId: string) => {
    setSelectedCardIds(prev => {
      if (prev.includes(cardId)) {
        return prev.filter(id => id !== cardId);
      }
      return [...prev, cardId];
    });
  };

  const handleTargetSelect = (playerId: string) => {
    setSelectedTargetId(prev => prev === playerId ? null : playerId);
  };

  const currentPlayer = room.players[user?.uid || ""];
  const isMyTurn = gameState.currentTurnPlayerId === user?.uid;
  const canTarget = isMyTurn && selectedCardIds.length > 0;

  return (
    <div className="flex flex-col flex-1 bg-black text-white relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black -z-10" />

      {/* Top Section: Opponents */}
      <div className="p-4 border-b border-zinc-800 bg-black/50 backdrop-blur z-10">
        <OpponentList 
          players={room.players} 
          gameState={gameState} 
          currentUserId={user?.uid}
          onSelectTarget={handleTargetSelect}
          selectedTargetId={selectedTargetId}
          canTarget={canTarget}
        />
      </div>

      {/* Middle Section: Board / Turn Info */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 relative">
        <TurnIndicator gameState={gameState} players={room.players} currentUserId={user?.uid} />
        <DeckArea deckRemaining={gameState.deckRemaining} discardCount={gameState.discardCount} />
      </div>

      {/* Bottom Section: My Hand & Actions */}
      <div className="p-4 border-t border-zinc-800 bg-black/80 backdrop-blur z-20">
        <ActionArea 
          roomId={room.roomId}
          gameState={gameState}
          player={currentPlayer}
          hand={hand}
          selectedCardIds={selectedCardIds}
          selectedTargetId={selectedTargetId}
        />
        
        <div className="mt-4">
          <PlayerHand 
            hand={hand} 
            onCardSelect={handleCardSelect} 
            selectedCardIds={selectedCardIds}
            disabled={gameState.phase === 'interrupt'}
          />
        </div>
      </div>

      {/* Overlays */}
      <InterruptOverlay
        currentCardType={gameState.currentAction && 'playedCards' in gameState.currentAction
          ? (gameState.currentAction as any).playedCards?.[0]?.type || null
          : null}
        playerHand={hand}
        isActive={gameState.phase === 'interrupt'}
      />
      <ResultScreen gameState={gameState} players={room.players} currentUserId={user?.uid} />
    </div>
  );
}
