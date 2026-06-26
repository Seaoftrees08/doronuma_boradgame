"use client";

import { useGameActions } from "../../hooks/useGameActions";
import { GameState, Player, ActionCard } from "@doronuma/shared";
import { useState } from "react";

interface Props {
  roomId: string;
  gameState: GameState;
  players: Record<string, Player>;
  hand: ActionCard[];
  currentUserId?: string;
  selectedCardIds: string[];
}

export default function InterruptPrompt({ roomId, gameState, players, hand, currentUserId, selectedCardIds }: Props) {
  const actions = useGameActions(roomId);
  const [loading, setLoading] = useState(false);

  if (gameState.phase !== 'interrupt') return null;

  const currentAction = gameState.currentAction;
  if (!currentAction) return null;

  const actionPlayer = players[currentAction.playerId];
  const isMe = currentUserId === currentAction.playerId;
  
  const canInterrupt = selectedCardIds.length === 1 && hand.some(c => c.id === selectedCardIds[0] && ['Nullify', 'Deflect', 'DoubleBack'].includes(c.type));

  const handleInterrupt = async () => {
    if (!canInterrupt) return;
    setLoading(true);
    try {
      await actions.playInterrupt(selectedCardIds[0]); 
    } catch (e) {
      console.error(e);
      alert('割り込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-yellow-900/90 border-t-4 border-yellow-500 shadow-[0_-10px_40px_rgba(234,179,8,0.2)] backdrop-blur-md z-40 transform transition-transform">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-yellow-500 mb-1">割り込みチャンス！</h3>
          <p className="text-zinc-200">
            <span className="font-bold text-white">{actionPlayer?.name}</span> が 
            <span className="font-bold text-red-400 mx-1">{currentAction.playedCards.map(c => c.type).join(', ')}</span> 
            を使いました。
          </p>
        </div>
        
        {!isMe && (
          <button
            onClick={handleInterrupt}
            disabled={!canInterrupt || loading}
            className={`px-8 py-3 rounded-xl font-black text-lg transition-all whitespace-nowrap ${
              canInterrupt 
                ? 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)] scale-105' 
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
            }`}
          >
            {loading ? "送信中..." : "このカードで割り込む"}
          </button>
        )}
      </div>
    </div>
  );
}
