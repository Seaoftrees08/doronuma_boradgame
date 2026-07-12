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
  setSelectedTargetId: React.Dispatch<React.SetStateAction<string | null>>;
  excludedCardIds: string[];
  setExcludedCardIds: React.Dispatch<React.SetStateAction<string[]>>;
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
  setSelectedCardIds,
  setSelectedTargetId,
  excludedCardIds,
  setExcludedCardIds
}: Props) {
  const actions = useGameActions(roomId);
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<TurnActionType | null>(null);
  const [tempDiscardCardId, setTempDiscardCardId] = useState<string | null>(null);

  const [playStep, setPlayStep] = useState<1 | 2>(1);
  const [playCardId1, setPlayCardId1] = useState<string | null>(null);
  const [playTargetId1, setPlayTargetId1] = useState<string | null>(null);

  const isDrawOnePlayOneActive = 
    gameState.currentAction !== null && 
    gameState.currentAction.type === 'drawOnePlayOne' && 
    (gameState.currentAction as any).step === 'draw' &&
    gameState.currentAction.playerId === player.playerId;

  useEffect(() => {
    if (discardCardId === null) {
      setTempDiscardCardId(null);
      setPlayStep(1);
      setPlayCardId1(null);
      setPlayTargetId1(null);
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
    if (!pendingAction && !isDrawOnePlayOneActive) return;
    setLoading(true);
    try {
      if (isDrawOnePlayOneActive) {
        await actions.executeTurn('drawOnePlayOnePlay', selectedCardIds, selectedTargetId || undefined);
        setSelectedCardIds([]);
      } else if (pendingAction === 'discardPlayTwo') {
        const playedCardIds: string[] = [discardCardId!];
        const targetPlayerIds: string[] = [];

        if (playCardId1) {
          playedCardIds.push(playCardId1);
          targetPlayerIds.push(playTargetId1 || '');
        }
        if (selectedCardIds[0]) {
          playedCardIds.push(selectedCardIds[0]);
          targetPlayerIds.push(selectedTargetId || '');
        }

        await actions.executeTurn('discardPlayTwo', playedCardIds, undefined, targetPlayerIds);
        setPendingAction(null);
        setDiscardCardId(null);
        setPlayStep(1);
        setPlayCardId1(null);
        setPlayTargetId1(null);
        setSelectedCardIds([]);
        setExcludedCardIds([]);
      } else {
        await actions.executeTurn(pendingAction!, selectedCardIds, selectedTargetId || undefined);
        setPendingAction(null);
        setSelectedCardIds([]);
      }
    } catch (e) {
      console.error(e);
      alert('アクションに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const checkCardAttack = (id: string) => {
    const type = getCardType(id);
    return ['Harassment', 'Barrage', 'Plunder', 'CutDown'].includes(type || '');
  };

  const checkCardCounter = (id: string) => {
    const type = getCardType(id);
    return ['Nullify', 'Deflect', 'DoubleBack', 'Repel'].includes(type || '');
  };

  return (
    <div className="flex flex-col items-center w-full mt-6 bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/80 max-w-2xl mx-auto">
      {(pendingAction || isDrawOnePlayOneActive) ? (
        (pendingAction === 'discardPlayTwo' && discardCardId === null) ? (
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
        ) : pendingAction === 'discardPlayTwo' && discardCardId !== null ? (
          /* discardPlayTwo: カード個別プレイ & 対象選択UI (ステップ式) */
          <div className="flex flex-col items-center space-y-4 py-4 w-full animate-fadeIn">
            {playStep === 1 ? (
              /* ステップ1：1枚目のカードと対象の選択 */
              <div className="flex flex-col items-center space-y-4 py-2 w-full">
                <div className="text-zinc-400 text-sm font-bold tracking-wider uppercase">1枚目のプレイカード選択 (1/2)</div>
                <div className="flex flex-col space-y-2 bg-zinc-800/80 p-4 rounded-lg border border-zinc-700/50 text-sm text-zinc-300 w-full max-w-sm">
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-700/40">
                    <span>🗑️ 捨てるカード: <span className="font-bold text-white">{getCardI18n(getCardType(discardCardId)!).name}</span></span>
                    <button
                      onClick={() => {
                        setDiscardCardId(null);
                        setSelectedCardIds([]);
                      }}
                      className="text-xs text-red-400 hover:underline cursor-pointer"
                    >
                      [戻る]
                    </button>
                  </div>
                  
                  <div className="pt-1">
                    1枚目に使うカード:{" "}
                    {selectedCardIds.length === 0 ? (
                      <span className="text-yellow-500 italic block mt-1 font-semibold">⚠️ 手札からカードを1枚クリックして選択してください（使わない場合は「使わない（スキップ）」を選択）</span>
                    ) : (
                      <span className="font-bold text-white">{getCardI18n(getCardType(selectedCardIds[0])!).name}</span>
                    )}
                  </div>

                  {selectedCardIds.length > 0 && checkCardAttack(selectedCardIds[0]) && (
                    <div className="pt-1">
                      対象:{" "}
                      {!selectedTargetId ? (
                        <span className="text-red-400 italic block mt-1 font-semibold">⚠️ 相手リストから対象プレイヤーを選んでください</span>
                      ) : (
                        <span className="font-bold text-white">
                          {gameState.turnOrder.find(id => id === selectedTargetId) ? gameState.turnOrder.indexOf(selectedTargetId) + 1 + "番目のプレイヤー" : "選択した相手"}
                        </span>
                      )}
                    </div>
                  )}

                  {selectedCardIds.length > 0 && checkCardCounter(selectedCardIds[0]) && (
                    <div className="text-xs text-red-400 font-bold">⚠️ 対抗カードは自分のターンに使用できません</div>
                  )}
                </div>

                <div className="flex gap-4 w-full max-w-xs pt-2">
                  <button
                    onClick={() => {
                      setPendingAction(null);
                      setDiscardCardId(null);
                      setSelectedCardIds([]);
                    }}
                    className="flex-1 py-2.5 rounded-xl font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-all cursor-pointer text-sm"
                  >
                    キャンセル
                  </button>
                  <button
                    disabled={
                      selectedCardIds.length > 0 &&
                      (checkCardCounter(selectedCardIds[0]) || (checkCardAttack(selectedCardIds[0]) && !selectedTargetId))
                    }
                    onClick={() => {
                      if (selectedCardIds.length > 0) {
                        setPlayCardId1(selectedCardIds[0]);
                        setPlayTargetId1(selectedTargetId);
                        setExcludedCardIds([selectedCardIds[0]]);
                      } else {
                        setPlayCardId1(null);
                        setPlayTargetId1(null);
                        setExcludedCardIds([]);
                      }
                      setSelectedCardIds([]);
                      setSelectedTargetId(null);
                      setPlayStep(2);
                    }}
                    className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-red-600 hover:bg-red-700 text-white border-red-500 shadow-[0_0_12px_rgba(220,38,38,0.25)] cursor-pointer"
                  >
                    {selectedCardIds.length === 0 ? "使わない（スキップ）" : "次のカードへ"}
                  </button>
                </div>
              </div>
            ) : (
              /* ステップ2：2枚目のカードと対象の選択（確定画面） */
              <div className="flex flex-col items-center space-y-4 py-2 w-full">
                <div className="text-zinc-400 text-sm font-bold tracking-wider uppercase">2枚目のプレイカード選択 (2/2)</div>
                <div className="flex flex-col space-y-2 bg-zinc-800/80 p-4 rounded-lg border border-zinc-700/50 text-sm text-zinc-300 w-full max-w-sm">
                  <div className="pb-2 border-b border-zinc-700/40">
                    🗑️ 捨てるカード: <span className="font-bold text-white">{getCardI18n(getCardType(discardCardId)!).name}</span>
                  </div>
                  
                  <div className="pb-2 border-b border-zinc-700/40">
                    1枚目:{" "}
                    {playCardId1 ? (
                      <span className="font-bold text-white">
                        {getCardI18n(getCardType(playCardId1)!).name}
                        {playTargetId1 && ` (対象: ${gameState.turnOrder.indexOf(playTargetId1) + 1}番目のプレイヤー)`}
                      </span>
                    ) : (
                      <span className="text-zinc-500 italic">スキップ</span>
                    )}
                  </div>

                  <div className="pt-1">
                    2枚目に使うカード:{" "}
                    {selectedCardIds.length === 0 ? (
                      <span className="text-yellow-500 italic block mt-1 font-semibold">⚠️ 手札からカードを1枚クリックして選択してください（使わない場合は「使わない（スキップ）」を選択）</span>
                    ) : (
                      <span className="font-bold text-white">{getCardI18n(getCardType(selectedCardIds[0])!).name}</span>
                    )}
                  </div>

                  {selectedCardIds.length > 0 && checkCardAttack(selectedCardIds[0]) && (
                    <div className="pt-1">
                      対象:{" "}
                      {!selectedTargetId ? (
                        <span className="text-red-400 italic block mt-1 font-semibold">⚠️ 相手リストから対象プレイヤーを選んでください</span>
                      ) : (
                        <span className="font-bold text-white">
                          {gameState.turnOrder.find(id => id === selectedTargetId) ? gameState.turnOrder.indexOf(selectedTargetId) + 1 + "番目のプレイヤー" : "選択した相手"}
                        </span>
                      )}
                    </div>
                  )}

                  {selectedCardIds.length > 0 && checkCardCounter(selectedCardIds[0]) && (
                    <div className="text-xs text-red-400 font-bold">⚠️ 対抗カードは自分のターンに使用できません</div>
                  )}
                </div>

                <div className="flex gap-4 w-full max-w-xs pt-2">
                  <button
                    onClick={() => {
                      setPlayStep(1);
                      setExcludedCardIds([]);
                      setSelectedCardIds(playCardId1 ? [playCardId1] : []);
                      setSelectedTargetId(playTargetId1);
                    }}
                    className="flex-1 py-2.5 rounded-xl font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-all cursor-pointer text-sm"
                  >
                    1枚目に戻る
                  </button>
                  <button
                    disabled={
                      loading ||
                      (selectedCardIds.length > 0 &&
                        (checkCardCounter(selectedCardIds[0]) || (checkCardAttack(selectedCardIds[0]) && !selectedTargetId)))
                    }
                    onClick={handleConfirmAction}
                    className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-red-600 hover:bg-red-700 text-white border-red-500 shadow-[0_0_12px_rgba(220,38,38,0.25)] cursor-pointer"
                  >
                    {loading ? "送信中..." : "確定する"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* drawOnePlayOne などの確定画面 */
          <div className="flex flex-col items-center space-y-4 py-4 w-full animate-fadeIn">
            <div className="text-zinc-400 text-sm font-bold tracking-wider uppercase">選択したアクション</div>
            <div className="text-2xl font-black text-red-500 tracking-wide">
              {getActionName(pendingAction || 'drawOnePlayOne')}
            </div>

            {isDrawOnePlayOneActive && (
              <div className="text-xs text-yellow-500 font-semibold bg-yellow-950/20 px-3 py-1.5 rounded-lg border border-yellow-900/40">
                ⚠️ カードをドローしたため、このアクションはキャンセルできません。カードを1枚選んで使用してください。
              </div>
            )
            }
            
            {(pendingAction === 'drawOnePlayOne' || isDrawOnePlayOneActive) && (
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

            <div className="flex gap-4 w-full max-w-xs pt-2">
              <button
                disabled={loading || isDrawOnePlayOneActive}
                onClick={() => {
                  setPendingAction(null);
                  setDiscardCardId(null);
                  setSelectedCardIds([]);
                }}
                className={`flex-1 py-3 rounded-xl font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-all ${
                  isDrawOnePlayOneActive ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                キャンセル
              </button>
              <button
                disabled={
                  loading ||
                  ((pendingAction === 'drawOnePlayOne' || isDrawOnePlayOneActive) && !drawOnePlayOneExecutionStatus.valid)
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
                onClick={async () => {
                  setLoading(true);
                  try {
                    await actions.executeTurn('drawOnePlayOneDraw');
                  } catch (e) {
                    console.error(e);
                    alert('カードのドローに失敗しました');
                  } finally {
                    setLoading(false);
                  }
                }}
                className={`w-full py-3 px-4 rounded-xl font-bold transition-all border ${
                  drawOnePlayOneStatus.valid
                    ? 'bg-red-600 text-white hover:bg-red-700 hover:border-red-500 shadow-[0_0_12px_rgba(220,38,38,0.25)] cursor-pointer'
                    : 'bg-zinc-900/60 text-zinc-650 border-zinc-850 opacity-40 cursor-not-allowed'
                }`}
              >
                行動カードを1枚引いた後、1枚使う
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

          <div className="flex justify-center pt-4 border-t border-zinc-800/40 w-full">
            <button
              disabled={loading}
              onClick={async () => {
                if (window.confirm("本当にリザイン（降参）しますか？\nゲームから退出となり、強制終了またはAI（スキップ）扱いになります。")) {
                  setLoading(true);
                  try {
                    await actions.resign();
                  } catch (e) {
                    console.error(e);
                    alert("リザインに失敗しました");
                  } finally {
                    setLoading(false);
                  }
                }
              }}
              className="px-4 py-2 text-xs font-bold text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/40 border border-red-900/60 hover:border-red-800/80 rounded-lg transition-all cursor-pointer"
            >
              リザイン（降参）する
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
