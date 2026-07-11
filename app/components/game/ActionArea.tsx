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
  const [pendingAction, setPendingAction] = useState<TurnActionType | null>(null);

  const isMyTurn = gameState.currentTurnPlayerId === player.playerId;
  if (!isMyTurn || gameState.phase !== 'playing' || gameState.needsDiscard) {
    return null;
  }

  const availableActions = getAvailableActions(gameState.deckRemaining, hand.length);
  const selectedCardsCount = selectedCardIds.length;

  const getCardType = (id: string) => hand.find(c => c.id === id)?.type;
  const isAttackCard = selectedCardsCount > 0 && ['Harassment', 'Barrage', 'Plunder', 'CutDown'].includes(getCardType(selectedCardIds[0]) || '');

  // 実行可能性チェックとエラーメッセージの定義
  const checkDrawTwo = () => {
    if (!availableActions.drawTwo) return { valid: false, reason: "山札が2枚未満です" };
    if (selectedCardsCount > 0) return { valid: false, reason: "カードの選択を解除してください" };
    return { valid: true };
  };

  const checkDrawOnePlayOne = () => {
    if (!availableActions.drawOnePlayOne) return { valid: false, reason: "山札がないか、手札がありません" };
    if (selectedCardsCount !== 1) return { valid: false, reason: "カードを1枚だけ選んでください" };
    if (isAttackCard && !selectedTargetId) return { valid: false, reason: "対象プレイヤーを選んでください" };
    return { valid: true };
  };

  const checkPass = () => {
    if (!availableActions.pass) return { valid: false, reason: "パスできません" };
    if (selectedCardsCount > 0) return { valid: false, reason: "カードの選択を解除してください" };
    return { valid: true };
  };

  const drawTwoStatus = checkDrawTwo();
  const drawOnePlayOneStatus = checkDrawOnePlayOne();
  const passStatus = checkPass();

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    setLoading(true);
    try {
      await actions.executeTurn(pendingAction, selectedCardIds, selectedTargetId || undefined);
      setPendingAction(null);
    } catch (e) {
      console.error(e);
      alert('アクションに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const getActionName = (type: TurnActionType) => {
    switch (type) {
      case 'drawTwo': return '2枚引いて終了';
      case 'drawOnePlayOne': return '1枚引いて1枚使う';
      case 'pass': return 'パス（何もしない）';
      default: return '';
    }
  };

  return (
    <div className="flex flex-col items-center w-full mt-6 bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/80 max-w-2xl mx-auto">
      {pendingAction ? (
        /* 確定画面 */
        <div className="flex flex-col items-center space-y-4 py-4 w-full animate-fadeIn">
          <div className="text-zinc-400 text-sm font-bold tracking-wider uppercase">選択したアクション</div>
          <div className="text-2xl font-black text-red-500 tracking-wide">
            {getActionName(pendingAction)}
          </div>
          {pendingAction === 'drawOnePlayOne' && selectedCardIds.length > 0 && (
            <div className="text-zinc-300 text-sm bg-zinc-800/80 px-3 py-1.5 rounded-lg border border-zinc-700/50">
              使用するカード: <span className="font-bold text-white">{getCardType(selectedCardIds[0])}</span>
              {selectedTargetId && (
                <>
                  {" → 対象: "}
                  <span className="font-bold text-white">
                    {gameState.turnOrder.find(id => id === selectedTargetId) ? gameState.turnOrder.indexOf(selectedTargetId) + 1 + "番目のプレイヤー" : "選択した相手"}
                  </span>
                </>
              )}
            </div>
          )}
          <div className="flex gap-4 w-full max-w-xs pt-2">
            <button
              disabled={loading}
              onClick={() => setPendingAction(null)}
              className="flex-1 py-3 rounded-xl font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-all cursor-pointer"
            >
              キャンセル
            </button>
            <button
              disabled={loading}
              onClick={handleConfirmAction}
              className="flex-1 py-3 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all cursor-pointer"
            >
              {loading ? "送信中..." : "確定する"}
            </button>
          </div>
        </div>
      ) : (
        /* アクション選択画面 */
        <div className="w-full flex flex-col space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* 2枚引く */}
            <div className="flex flex-col items-center space-y-1">
              <button
                disabled={loading || !drawTwoStatus.valid}
                onClick={() => setPendingAction('drawTwo')}
                className={`w-full py-3 px-4 rounded-xl font-bold transition-all border ${
                  drawTwoStatus.valid
                    ? 'bg-zinc-800 text-white hover:bg-zinc-700 hover:border-zinc-600 cursor-pointer'
                    : 'bg-zinc-900/60 text-zinc-650 border-zinc-850 opacity-40 cursor-not-allowed'
                }`}
              >
                2枚引く
              </button>
              {!drawTwoStatus.valid && (
                <span className="text-[10px] text-zinc-500 font-bold">{drawTwoStatus.reason}</span>
              )}
            </div>

            {/* 1枚引いて1枚使う */}
            <div className="flex flex-col items-center space-y-1">
              <button
                disabled={loading || !drawOnePlayOneStatus.valid}
                onClick={() => setPendingAction('drawOnePlayOne')}
                className={`w-full py-3 px-4 rounded-xl font-bold transition-all border ${
                  drawOnePlayOneStatus.valid
                    ? 'bg-red-600 text-white hover:bg-red-700 hover:border-red-500 shadow-[0_0_12px_rgba(220,38,38,0.25)] cursor-pointer'
                    : 'bg-zinc-900/60 text-zinc-650 border-zinc-850 opacity-40 cursor-not-allowed'
                }`}
              >
                1枚引いて1枚使う
              </button>
              {!drawOnePlayOneStatus.valid && (
                <span className="text-[10px] text-zinc-500 font-bold text-center leading-tight">
                  {drawOnePlayOneStatus.reason}
                </span>
              )}
            </div>

            {/* パス */}
            <div className="flex flex-col items-center space-y-1">
              <button
                disabled={loading || !passStatus.valid}
                onClick={() => setPendingAction('pass')}
                className={`w-full py-3 px-4 rounded-xl font-bold transition-all border ${
                  passStatus.valid
                    ? 'bg-zinc-800 text-white hover:bg-zinc-700 hover:border-zinc-600 cursor-pointer'
                    : 'bg-zinc-900/60 text-zinc-650 border-zinc-850 opacity-40 cursor-not-allowed'
                }`}
              >
                何もしない（パス）
              </button>
              {!passStatus.valid && (
                <span className="text-[10px] text-zinc-500 font-bold">{passStatus.reason}</span>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
