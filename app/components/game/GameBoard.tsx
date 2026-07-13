"use client";

import { useState, useEffect } from "react";
import { useGame } from "../../contexts/GameContext";
import { useAuth } from "../../contexts/AuthContext";
import { useHand } from "../../hooks/useHand";
import { useGameActions } from "../../hooks/useGameActions";
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
  const actions = useGameActions(room?.roomId || "");

  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [discardCardId, setDiscardCardId] = useState<string | null>(null);
  const [excludedCardIds, setExcludedCardIds] = useState<string[]>([]);
  const [hasInterruptedOrSkipped, setHasInterruptedOrSkipped] = useState(false);

  // ターン/フェーズの変更で選択状態をリセット
  useEffect(() => {
    setDiscardCardId(null);
    setSelectedCardIds([]);
    setSelectedTargetId(null);
    setExcludedCardIds([]);
    setHasInterruptedOrSkipped(false);
  }, [gameState?.currentTurnPlayerId, gameState?.phase]);

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
          await actions.checkTimeout();
        } catch (error) {
          console.error("Error invoking timeout check:", error);
        }
      }
    };

    const delay = Math.max(0, deadline - Date.now());
    const timerId = setTimeout(checkTimeout, delay + 1000); // 1秒余裕を持たせる

    return () => clearTimeout(timerId);
  }, [room?.roomId, gameState?.turnDeadline, gameState?.interruptDeadline, gameState?.phase, user]);

  const interruptStackLength = gameState?.interruptStack?.length || 0;
  useEffect(() => {
    if (gameState?.phase !== 'interrupt') {
      setHasInterruptedOrSkipped(false);
    } else {
      // Reset when a new interrupt is played by someone else (or even us, though we immediately set it to true again when we play)
      setHasInterruptedOrSkipped(false);
    }
  }, [gameState?.phase, interruptStackLength]);

  if (roomState.loading || gameStateData.loading || !room || !gameState) {
    return <div className="flex flex-1 items-center justify-center">Loading Game...</div>;
  }

  const handleCardSelect = (cardId: string) => {
    setSelectedCardIds(prev => {
      if (prev.includes(cardId)) {
        return prev.filter(id => id !== cardId);
      }
      return [cardId];
    });
  };

  const handleTargetSelect = (playerId: string) => {
    setSelectedTargetId(prev => prev === playerId ? null : playerId);
  };

  const handleInterrupt = async (cardId: string) => {
    try {
      await actions.playInterrupt(cardId);
      setHasInterruptedOrSkipped(true);
    } catch (error) {
      console.error("Failed to play interrupt:", error);
      alert("割り込みに失敗しました");
    }
  };

  const handleInterruptSkip = async () => {
    setHasInterruptedOrSkipped(true);
    try {
      await actions.skipInterrupt();
    } catch (error) {
      console.error("Failed to skip interrupt:", error);
    }
  };

  const currentPlayer = room.players[user?.uid || ""];
  const isMyTurn = gameState.currentTurnPlayerId === user?.uid;
  const canTarget = isMyTurn && selectedCardIds.length > 0;
  
  const lastActionPlayerId = interruptStackLength > 0 
    ? gameState.interruptStack![interruptStackLength - 1].playerId 
    : gameState.currentAction?.playerId;

  const showInterruptOverlay = 
    gameState.phase === 'interrupt' && 
    lastActionPlayerId !== user?.uid && 
    !hasInterruptedOrSkipped;

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

      {/* Bottom Section: My Hand & Actions */}
      <div className="p-4 border-t border-zinc-800 bg-black/80 backdrop-blur z-20 flex-1 flex flex-col justify-between overflow-y-auto">
        {/* Horizontal Row: Turn Info, Deck/Discard, Actions */}
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between w-full">
          <div className="w-full lg:w-1/3 flex justify-center">
            <TurnIndicator gameState={gameState} players={room.players} currentUserId={user?.uid} />
          </div>
          <div className="hidden lg:block w-px bg-zinc-800 self-stretch" />
          <div className="w-full lg:w-1/3 flex justify-center">
            <DeckArea deckRemaining={gameState.deckRemaining} discardCount={gameState.discardCount} />
          </div>
          <div className="hidden lg:block w-px bg-zinc-800 self-stretch" />
          <div className="w-full lg:w-1/3 flex justify-center">
            <ActionArea 
              roomId={room.roomId}
              gameState={gameState}
              player={currentPlayer}
              hand={hand}
              selectedCardIds={selectedCardIds}
              selectedTargetId={selectedTargetId}
              discardCardId={discardCardId}
              setDiscardCardId={setDiscardCardId}
              setSelectedCardIds={setSelectedCardIds}
              setSelectedTargetId={setSelectedTargetId}
              excludedCardIds={excludedCardIds}
              setExcludedCardIds={setExcludedCardIds}
            />
          </div>
        </div>
        
        <div className="mt-4">
          <PlayerHand 
            hand={hand.filter(c => c.id !== discardCardId && !excludedCardIds.includes(c.id))} 
            onCardSelect={handleCardSelect} 
            selectedCardIds={selectedCardIds}
            disabled={gameState.phase === 'interrupt'}
            showDetailOnSelect={!(isMyTurn && gameState.phase === 'playing')}
          />
        </div>
      </div>

      {/* Overlays */}
      <InterruptOverlay
        currentCardType={
          interruptStackLength > 0
            ? gameState.interruptStack![interruptStackLength - 1].playedCard.type
            : (gameState.currentAction as any)?.cardType || null
        }
        playerHand={hand}
        isActive={showInterruptOverlay}
        onInterrupt={handleInterrupt}
        onSkip={handleInterruptSkip}
      />
      <ResultScreen gameState={gameState} players={room.players} currentUserId={user?.uid} roomId={room.roomId} />
    </div>
  );
}
