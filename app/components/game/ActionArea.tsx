"use client";

import { useGameActions } from "../../hooks/useGameActions";
import { getAvailableActions, GameState, Player, ActionCard, TurnActionType, GAME_CONSTANTS } from "@doronuma/shared";
import { useState, useEffect } from "react";
import Image from "next/image";
import { CARD_IMAGE_PATHS } from "../../lib/cardImages";
import { getCardI18n, getActionName } from "../../lib/i18n";

interface Props {
  roomId: string;
  gameState: GameState;
  player: Player;
  hand: ActionCard[];
  selectedCardIds: string[];
  selectedTargetId: string | null;
  discardCardId: string | null;
  setDiscardCardId: (id: string | null) => void;
  setSelectedCardIds: React.Dispatch<React.SetStateAction<string[]>>;
}



export default function ActionArea({
  roomId,
  gameState,
  player,
  hand,
  selectedCardIds,
  selectedTargetId,
  discardCardId,
  setDiscardCardId,
  setSelectedCardIds
}: Props) {
  const actions = useGameActions(roomId);
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<TurnActionType | null>(null);
  const [tempDiscardCardId, setTempDiscardCardId] = useState<string | null>(null);

  useEffect(() => {
    if (discardCardId === null) {
      setTempDiscardCardId(null);
    }
  }, [discardCardId]);

  const isMyTurn = gameState.currentTurnPlayerId === player.playerId;
  if (!isMyTurn || gameState.phase !== 'playing') {
    return null;
  }

  const availableActions = getAvailableActions(gameState.deckRemaining, hand.length);
  const selectedCardsCount = selectedCardIds.length;

  const getCardType = (id: string) => hand.find(c => c.id === id)?.type;
  
  // Calculate isAttackCard based on selected cards to play
  const selectedCardsTypes = selectedCardIds.map(id => getCardType(id));
  const isAttackCard = selectedCardsTypes.some(type =>
    ['Harassment', 'Barrage', 'Plunder', 'CutDown'].includes(type || '')
  );

  const hasCounterCard = selectedCardsTypes.some(type =>
    ['Nullify', 'Deflect', 'DoubleBack', 'Repel'].includes(type || '')
  );

  // 実行可能性チェックとエラーメッセージの定義
  const checkDrawTwo = () => {
    if (!availableActions.drawTwo) {
      if (hand.length > GAME_CONSTANTS.MAX_HAND_SIZE - 2) {
        return { valid: false, reason: "手札が上限枚数(5枚)に達しているため使用できません" };
      }
      return { valid: false, reason: "山札が2枚未満です" };
    }
    if (selectedCardsCount > 0) return { valid: false, reason: "カードの選択を解除してください" };
    return { valid: true };
  };

  const checkDrawOnePlayOne = () => {
    if (!availableActions.drawOnePlayOne) {
      if (hand.length >= GAME_CONSTANTS.MAX_HAND_SIZE) {
        return { valid: false, reason: "手札が上限枚数(5枚)のため選択できません" };
      }
      return { valid: false, reason: "山札がないか、手札がありません" };
    }
    return { valid: true };
  };

  const checkDrawOnePlayOneExecution = () => {
    if (selectedCardsCount !== 1) return { valid: false, reason: "カードを1枚だけ選んでください" };
    if (hasCounterCard) return { valid: false, reason: "対抗カードは自分のターンに使用できません" };
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
  const drawOnePlayOneExecutionStatus = checkDrawOnePlayOneExecution();
  const discardPlayTwoStatus = {
    valid: availableActions.discardPlayTwo,
    reason: !availableActions.discardPlayTwo ? "手札が2枚以上必要です" : ""
  };
  const passStatus = checkPass();

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    setLoading(true);
    try {
      const filteredSelectedCardIds = selectedCardIds.filter(id => id !== discardCardId);
      const playedCardIds = pendingAction === 'discardPlayTwo'
        ? [discardCardId!, ...filteredSelectedCardIds]
        : selectedCardIds;
      await actions.executeTurn(pendingAction, playedCardIds, selectedTargetId || undefined);
      setPendingAction(null);
      setDiscardCardId(null);
    } catch (e) {
      console.error(e);
      alert('アクションに失敗しました');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="flex flex-col items-center w-full mt-6 bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/80 max-w-2xl mx-auto">
      {pendingAction ? (
        pendingAction === 'discardPlayTwo' && discardCardId === null ? (
          /* discardPlayTwo: 捨てるカード選択UI */
          <div className="flex flex-col items-center space-y-4 py-4 w-full animate-fadeIn">
            <div className="text-zinc-400 text-sm font-bold tracking-wider uppercase">行動カードを1枚捨てて2枚まで使う</div>
            <div className="text-lg font-bold text-white text-center">捨てるカードを1枚選んでください：</div>
            <div className="flex gap-2 overflow-x-auto p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 w-full justify-center">
              {hand.map((card) => {
                const isSelected = tempDiscardCardId === card.id;
                const imagePath = CARD_IMAGE_PATHS[card.type];
                return (
                  <div
                    key={card.id}
                    className={`
                      relative min-w-[90px] h-[126px] transition-all
                      ${isSelected ? '-translate-y-2' : 'hover:-translate-y-1'}
                    `}
                  >
                    <button
                      onClick={() => {
                        setTempDiscardCardId(prev => prev === card.id ? null : card.id);
                      }}
                      className={`
                        w-full h-full rounded-lg transition-all
                        flex flex-col items-center justify-center text-center overflow-hidden
                        ${isSelected ? 'ring-4 ring-red-500' : ''}
                        cursor-pointer bg-zinc-800 border-2 border-zinc-700
                      `}
                    >
                      {imagePath ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={imagePath}
                            alt={card.type}
                            fill
                            sizes="90px"
                            className="object-cover"
                            priority
                          />
                        </div>
                      ) : (
                        <span className="font-bold text-white text-xs">{card.type}</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 w-full max-w-xs pt-2">
              <button
                onClick={() => {
                  setPendingAction(null);
                  setDiscardCardId(null);
                  setTempDiscardCardId(null);
                }}
                className="flex-1 py-2.5 rounded-xl font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-all cursor-pointer text-sm"
              >
                キャンセル
              </button>
              <button
                disabled={tempDiscardCardId === null}
                onClick={() => {
                  setDiscardCardId(tempDiscardCardId);
                  setSelectedCardIds([]);
                }}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all border ${
                  tempDiscardCardId !== null
                    ? 'bg-red-600 hover:bg-red-700 text-white border-red-500 shadow-[0_0_12px_rgba(220,38,38,0.25)] cursor-pointer'
                    : 'bg-zinc-900/60 text-zinc-650 border-zinc-850 opacity-40 cursor-not-allowed'
                }`}
              >
                確定
              </button>
            </div>
          </div>
        ) : (
          /* 確定画面 */
          <div className="flex flex-col items-center space-y-4 py-4 w-full animate-fadeIn">
            <div className="text-zinc-400 text-sm font-bold tracking-wider uppercase">選択したアクション</div>
            <div className="text-2xl font-black text-red-500 tracking-wide">
              {getActionName(pendingAction)}
            </div>
            
            {pendingAction === 'drawOnePlayOne' && (
              selectedCardIds.length > 0 ? (
                <div className="flex flex-col space-y-2 bg-zinc-800/80 p-4 rounded-lg border border-zinc-700/50 text-sm text-zinc-300 w-full max-w-sm">
                  <div>
                    使用するカード: <span className="font-bold text-white">{getCardI18n(getCardType(selectedCardIds[0])!).name}</span>
                  </div>
                  {selectedTargetId && (
                    <div>
                      対象: <span className="font-bold text-white">
                        {gameState.turnOrder.find(id => id === selectedTargetId) ? gameState.turnOrder.indexOf(selectedTargetId) + 1 + "番目のプレイヤー" : "選択した相手"}
                      </span>
                    </div>
                  )}
                  {selectedCardIds.length > 1 && (
                    <div className="text-xs text-red-400 font-bold">⚠️ 使うカードは1枚だけ選んでください</div>
                  )}
                  {hasCounterCard && (
                    <div className="text-xs text-red-400 font-bold">⚠️ 対抗カードは自分のターンに使用できません</div>
                  )}
                  {isAttackCard && !selectedTargetId && (
                    <div className="text-xs text-red-400 font-bold">⚠️ 対象プレイヤーを選んでください</div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-yellow-400 font-bold bg-zinc-850/80 px-4 py-3 rounded-lg border border-yellow-700/30 w-full max-w-sm text-center">
                  ⚠️ 使用するカードを手札から1枚選んでください
                </div>
              )
            )}

            {pendingAction === 'discardPlayTwo' && discardCardId !== null && (
              <div className="flex flex-col space-y-2 bg-zinc-800/80 p-4 rounded-lg border border-zinc-700/50 text-sm text-zinc-300 w-full max-w-sm">
                <div className="flex justify-between items-center">
                  <span>🗑️ 捨てるカード: <span className="font-bold text-white">{getCardI18n(getCardType(discardCardId)!).name}</span></span>
                  <button
                    onClick={() => {
                      setDiscardCardId(null);
                      setSelectedCardIds([]);
                    }}
                    className="text-xs text-red-400 hover:underline cursor-pointer"
                  >
                    [変更]
                  </button>
                </div>
                <div>
                  🃏 使うカード (最大2枚):{" "}
                  {selectedCardIds.filter(id => id !== discardCardId).length === 0 ? (
                    <span className="text-yellow-500 italic block mt-1 font-semibold">⚠️ 使うカードが選択されていません。手札から最大2枚クリックして選択してください。選択しない場合はカードを捨てるだけのターンになります。</span>
                  ) : (
                    <span className="font-bold text-white">
                      {selectedCardIds.filter(id => id !== discardCardId).map(id => getCardI18n(getCardType(id)!).name).join(", ")}
                    </span>
                  )}
                </div>
                {selectedCardIds.filter(id => id !== discardCardId).length > 2 && (
                  <div className="text-xs text-red-400 font-bold">⚠️ 使うカードは2枚までです（現在{selectedCardIds.filter(id => id !== discardCardId).length}枚選択中）</div>
                )}
                {hasCounterCard && (
                  <div className="text-xs text-red-400 font-bold">⚠️ 対抗カードは自分のターンに使用できません</div>
                )}
                {isAttackCard && !selectedTargetId && (
                  <div className="text-xs text-red-400 font-bold">⚠️ 対象プレイヤーを選んでください</div>
                )}
              </div>
            )}

            <div className="flex gap-4 w-full max-w-xs pt-2">
              <button
                disabled={loading}
                onClick={() => {
                  setPendingAction(null);
                  setDiscardCardId(null);
                  setSelectedCardIds([]);
                }}
                className="flex-1 py-3 rounded-xl font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-all cursor-pointer"
              >
                キャンセル
              </button>
              <button
                disabled={
                  loading ||
                  (pendingAction === 'discardPlayTwo' && (selectedCardIds.filter(id => id !== discardCardId).length > 2 || hasCounterCard || (isAttackCard && !selectedTargetId))) ||
                  (pendingAction === 'drawOnePlayOne' && (!drawOnePlayOneStatus.valid || !drawOnePlayOneExecutionStatus.valid))
                }
                onClick={handleConfirmAction}
                className="flex-1 py-3 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all cursor-pointer"
              >
                {loading ? "送信中..." : "確定する"}
              </button>
            </div>
          </div>
        )
      ) : (
        /* アクション選択画面 */
        <div className="w-full flex flex-col space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
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

            {/* 引かずに捨てて2枚まで使う */}
            <div className="flex flex-col items-center space-y-1">
              <button
                disabled={loading || !discardPlayTwoStatus.valid}
                onClick={() => setPendingAction('discardPlayTwo')}
                className={`w-full py-3 px-4 rounded-xl font-bold transition-all border ${
                  discardPlayTwoStatus.valid
                    ? 'bg-red-600 text-white hover:bg-red-700 hover:border-red-500 shadow-[0_0_12px_rgba(220,38,38,0.25)] cursor-pointer'
                    : 'bg-zinc-900/60 text-zinc-650 border-zinc-850 opacity-40 cursor-not-allowed'
                }`}
              >
                行動カードを1枚捨てて2枚まで使う
              </button>
              {!discardPlayTwoStatus.valid && (
                <span className="text-[10px] text-zinc-500 font-bold text-center leading-tight">
                  {discardPlayTwoStatus.reason}
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
