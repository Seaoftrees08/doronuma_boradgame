"use client";

import { useGameActions } from "../../hooks/useGameActions";
import { GameState, ActionCard, GAME_CONSTANTS } from "@doronuma/shared";
import { useState } from "react";

interface Props {
  roomId: string;
  gameState: GameState;
  hand: ActionCard[];
  selectedCardIds: string[];
}

export default function DiscardPrompt({ roomId, gameState, hand, selectedCardIds }: Props) {
  const actions = useGameActions(roomId);
  const [loading, setLoading] = useState(false);

  if (!gameState.needsDiscard || gameState.discardPlayerId !== gameState.currentTurnPlayerId) {
    return null;
  }

  const discardCountNeeded = hand.length - GAME_CONSTANTS.MAX_HAND_SIZE;
  if (discardCountNeeded <= 0) return null;

  const canDiscard = selectedCardIds.length === discardCountNeeded;

  const handleDiscard = async () => {
    setLoading(true);
    try {
      await actions.submitDiscard(selectedCardIds);
    } catch (e) {
      console.error(e);
      alert('捨てる処理に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
        <div>
          <h2 className="text-2xl font-black text-red-500 mb-2">手札が多すぎます</h2>
          <p className="text-zinc-400">
            手札の上限は {GAME_CONSTANTS.MAX_HAND_SIZE} 枚です。<br/>
            捨てるカードを {discardCountNeeded} 枚選んでください。
          </p>
        </div>

        <div className="text-xl font-bold">
          選択中: <span className={canDiscard ? "text-green-500" : "text-zinc-500"}>{selectedCardIds.length} / {discardCountNeeded}</span>
        </div>

        <button
          disabled={!canDiscard || loading}
          onClick={handleDiscard}
          className={`w-full py-4 rounded-xl font-black text-lg transition-all ${
            canDiscard 
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]' 
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
          }`}
        >
          {loading ? "送信中..." : "捨てる"}
        </button>
      </div>
    </div>
  );
}
