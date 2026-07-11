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

  const originalPlayerId = (currentAction as any).playerId;
  let targetPlayerId = (currentAction as any).targetPlayerId;
  const targetCardType = (currentAction as any).cardType || (currentAction as any).playedCards?.[0]?.type;

  let isCanceled = false;
  let effectMultiplier = 1;
  let finalRecipientId = targetPlayerId;

  if (gameState.interruptStack && gameState.interruptStack.length > 0) {
    const lastInterrupt = gameState.interruptStack[gameState.interruptStack.length - 1];
    const counterType = lastInterrupt.playedCard.type;

    if (counterType === 'Nullify') {
      isCanceled = true;
    } else if (counterType === 'Deflect') {
      if (lastInterrupt.targetPlayerId) {
        finalRecipientId = lastInterrupt.targetPlayerId;
      }
    } else if (counterType === 'DoubleBack') {
      finalRecipientId = originalPlayerId;
      effectMultiplier = 2;
    } else if (counterType === 'Repel') {
      finalRecipientId = originalPlayerId;
    }
  }

  if (!isCanceled && finalRecipientId) {
    const stateAny = gameState as any;
    const isTargetAfk = stateAny.players?.[finalRecipientId]?.status === 'afk';
    
    if (!isTargetAfk && targetCardType) {
      if (!gameState.victoryCards) {
        gameState.victoryCards = {};
      }

      if (targetCardType === 'Harassment') {
        const total = 1 * effectMultiplier;
        if (!gameState.victoryCards[finalRecipientId]) {
          gameState.victoryCards[finalRecipientId] = [];
        }
        for (let i = 0; i < total; i++) {
          gameState.victoryCards[finalRecipientId].push({ type: 'MinusThree' });
        }
      } else if (targetCardType === 'Barrage') {
        const total = 2 * effectMultiplier;
        if (!gameState.victoryCards[finalRecipientId]) {
          gameState.victoryCards[finalRecipientId] = [];
        }
        for (let i = 0; i < total; i++) {
          gameState.victoryCards[finalRecipientId].push({ type: 'MinusThree' });
        }
      } else if (targetCardType === 'Accomplice') {
        for (const pId of gameState.turnOrder) {
          if (pId !== originalPlayerId) {
            const recipient = counterCardTargetCheck(pId, originalPlayerId, gameState.interruptStack);
            if (recipient && stateAny.players?.[recipient]?.status !== 'afk') {
              if (!gameState.victoryCards[recipient]) {
                gameState.victoryCards[recipient] = [];
              }
              gameState.victoryCards[recipient].push({ type: 'MinusThree' });
            }
          }
        }
      } else if (targetCardType === 'QuagmireDrag') {
        if (stateAny.players?.[finalRecipientId]?.status !== 'afk') {
          if (!gameState.victoryCards[finalRecipientId]) {
            gameState.victoryCards[finalRecipientId] = [];
          }
          for (let i = 0; i < effectMultiplier; i++) {
            gameState.victoryCards[finalRecipientId].push({ type: 'MinusThree' });
          }
        }

        for (const pId of gameState.turnOrder) {
          if (pId !== originalPlayerId) {
            if (stateAny.players?.[pId]?.status !== 'afk') {
              if (!gameState.victoryCards[pId]) {
                gameState.victoryCards[pId] = [];
              }
              gameState.victoryCards[pId].push({ type: 'MinusThree' });
            }
          }
        }
      }
    }
  }

  gameState.currentAction = null;
  gameState.interruptStack = [];
};

const counterCardTargetCheck = (pId: string, attackerId: string, stack: any[]): string | null => {
  if (!stack || stack.length === 0) return pId;
  const playerCounter = stack.find(s => s.playerId === pId);
  if (!playerCounter) return pId;

  const counterType = playerCounter.playedCard.type;
  if (counterType === 'Nullify') {
    return null;
  } else if (counterType === 'Deflect') {
    return playerCounter.targetPlayerId || pId;
  } else if (counterType === 'DoubleBack' || counterType === 'Repel') {
    return attackerId;
  }
  return pId;
};
