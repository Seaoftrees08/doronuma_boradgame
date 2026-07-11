import * as admin from 'firebase-admin';
import { GameState, GameRoom, ActionCard, CardType, canUseCounterCard } from '@doronuma/shared';

export const processInterrupt = async (
  transaction: admin.firestore.Transaction,
  roomId: string,
  room: GameRoom,
  gameState: GameState,
  playerId: string,
  playedCard: ActionCard,
  targetPlayerId?: string
) => {
  // TODO: implement transaction-based interrupt resolution
};

export const addInterrupt = (
  playerId: string,
  cardType: CardType,
  gameState: GameState
): { success: boolean; error?: string } => {
  const currentAction = gameState.currentAction;
  if (!currentAction) {
    return { success: false, error: 'No active action to interrupt' };
  }

  const targetCardType = (currentAction as any).cardType || (currentAction as any).playedCards?.[0]?.type;
  if (!targetCardType) {
    return { success: false, error: 'Invalid target action type' };
  }

  if (!canUseCounterCard(cardType, targetCardType)) {
    return { success: false, error: 'Cannot use this counter card for the active action' };
  }

  if (!gameState.interruptStack) {
    gameState.interruptStack = [];
  }
  gameState.interruptStack.push({
    playerId,
    playedCard: { id: `counter_${Date.now()}`, type: cardType }
  });

  return { success: true };
};

export const resolveInterrupts = (gameState: GameState): void => {
  const currentAction = gameState.currentAction;
  if (!currentAction) return;

  const targetPlayerId = (currentAction as any).targetId || (currentAction as any).targetPlayerId;
  const targetCardType = (currentAction as any).cardType || (currentAction as any).playedCards?.[0]?.type;

  const stateAny = gameState as any;
  if (targetPlayerId && stateAny.players?.[targetPlayerId]?.status === 'afk') {
    // ターゲットが空席（AFK）の場合は攻撃効果をスキップ
    gameState.currentAction = null;
    gameState.interruptStack = [];
    return;
  }

  // 妨害系カードの効果適用: -3点カードを1枚付与
  const isSabotage = ['Harassment', 'Accomplice', 'Barrage', 'QuagmireDrag'].includes(targetCardType);
  if (isSabotage && targetPlayerId) {
    if (!gameState.victoryCards) {
      gameState.victoryCards = {};
    }
    if (!gameState.victoryCards[targetPlayerId]) {
      gameState.victoryCards[targetPlayerId] = [];
    }
    gameState.victoryCards[targetPlayerId].push({ type: 'MinusThree' });
  }

  gameState.currentAction = null;
  gameState.interruptStack = [];
};
