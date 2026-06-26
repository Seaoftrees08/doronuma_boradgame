"use client";

import { useGameActions } from "../../hooks/useGameActions";
import { getAvailableActions, GameState, Player, ActionCard, TurnActionType } from "@doronuma/shared";
import { useState } from "react";

interface Props {
  roomId: string;
  gameState: GameState;
  player: Player;
  hand: ActionCard[];
  selectedCardIds: string[];
  selectedTargetId: string | null;
}

export default function ActionArea({ roomId, gameState, player, hand, selectedCardIds, selectedTargetId }: Props) {
  const actions = useGameActions(roomId);
  const [loading, setLoading] = useState(false);

  const isMyTurn = gameState.currentTurnPlayerId === player.playerId;
  if (!isMyTurn || gameState.phase !== 'playing' || gameState.needsDiscard) {
    return null;
  }

  const availableActions = getAvailableActions(gameState.deckRemaining, hand.length);
  const selectedCardsCount = selectedCardIds.length;

  const handleAction = async (type: TurnActionType) => {
    setLoading(true);
    try {
      await actions.executeTurn(type, selectedCardIds, selectedTargetId || undefined);
    } catch (e) {
      console.error(e);
      alert('アクションに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const getCardType = (id: string) => hand.find(c => c.id === id)?.type;
  const isAttackCard = selectedCardsCount > 0 && ['Harassment', 'Barrage', 'Plunder', 'CutDown'].includes(getCardType(selectedCardIds[0]) || '');

  const canDrawOnePlayOne = availableActions.drawOnePlayOne && selectedCardsCount === 1 && (!isAttackCard || selectedTargetId);
  const canDiscardPlayTwo = availableActions.discardPlayTwo && selectedCardsCount === 3;

  return (
    <div className="flex flex-wrap gap-4 justify-center mt-6">
      <button
        disabled={loading || !availableActions.drawTwo || selectedCardsCount > 0}
        onClick={() => handleAction('drawTwo')}
        className="px-6 py-3 rounded-lg font-bold bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700 transition-colors"
      >
        2枚引く
      </button>

      <button
        disabled={loading || !canDrawOnePlayOne}
        onClick={() => handleAction('drawOnePlayOne')}
        className={`px-6 py-3 rounded-lg font-bold transition-all ${
          canDrawOnePlayOne ? 'bg-red-600 hover:bg-red-700 shadow-[0_0_15px_rgba(220,38,38,0.3)] text-white' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
        }`}
      >
        1枚引いて1枚使う (選択: {selectedCardsCount}/1)
      </button>

      {/* DiscardPlayTwo could be added here if needed */}

      <button
        disabled={loading || !availableActions.pass || selectedCardsCount > 0}
        onClick={() => handleAction('pass')}
        className="px-6 py-3 rounded-lg font-bold bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700 transition-colors"
      >
        何もしない
      </button>
    </div>
  );
}
