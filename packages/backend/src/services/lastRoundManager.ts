import * as admin from 'firebase-admin';
import { GameState, GameRoom } from '@doronuma/shared';
import { drawVictoryCard } from './deck';

export const triggerSuddenDeathEnd = async (
  transaction: admin.firestore.Transaction,
  roomId: string,
  room: GameRoom,
  gameState: GameState,
  triggerPlayerId: string,
  reason: 'draw' | 'play' | 'afk'
): Promise<void> => {
  const db = admin.firestore();
  const roomRef = db.collection('rooms').doc(roomId);
  const stateRef = roomRef.collection('gameState').doc('state');

  gameState.suddenDeathTriggered = true;
  gameState.suddenDeathTriggeredBy = triggerPlayerId;
  gameState.phase = 'lastRound';
  
  if (reason === 'afk') {
    gameState.phase = 'finished';
    room.status = 'finished';
  } else {
    // 突然死ペナルティ: -3点カードを1枚付与
    if (!gameState.victoryCards) {
      gameState.victoryCards = {};
    }
    if (!gameState.victoryCards[triggerPlayerId]) {
      gameState.victoryCards[triggerPlayerId] = [];
    }
    gameState.victoryCards[triggerPlayerId].push({ type: 'MinusThree' });

    gameState.targetActionCount = Math.max(...Object.values(gameState.actionCountPerPlayer));
  }

  transaction.update(roomRef, { status: room.status, players: room.players });
  transaction.update(stateRef, { ...gameState });
};

export const handleSuddenDeath = (playerId: string, gameState: GameState): void => {
  if (!gameState.victoryCards) {
    gameState.victoryCards = {};
  }
  if (!gameState.victoryCards[playerId]) {
    gameState.victoryCards[playerId] = [];
  }
  const penaltyCard = drawVictoryCard(); // -3点カード
  gameState.victoryCards[playerId].push(penaltyCard);

  gameState.suddenDeathTriggered = true;
  gameState.suddenDeathTriggeredBy = playerId;
  gameState.phase = 'lastRound';
  gameState.targetActionCount = Math.max(...Object.values(gameState.actionCountPerPlayer));
};

export const processLastRoundAfkPlayer = (playerId: string, gameState: GameState): void => {
  // パス処理（手札変更なし、actionCountのみインクリメント）
  if (gameState.actionCountPerPlayer[playerId] !== undefined) {
    gameState.actionCountPerPlayer[playerId] += 1;
  }
};
