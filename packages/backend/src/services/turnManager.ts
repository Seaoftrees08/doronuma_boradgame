import * as admin from 'firebase-admin';
import { GameState, GameRoom, ActionCard, TurnActionType, GAME_CONSTANTS } from '@doronuma/shared';
import { drawCard } from './deck';
import { triggerSuddenDeathEnd } from './lastRoundManager';
import { startSynthesisPhase } from './gameEngine';

export const processTimeoutTurn = async (
  transaction: admin.firestore.Transaction,
  roomId: string,
  room: GameRoom,
  gameState: GameState
): Promise<void> => {
  const db = admin.firestore();
  const roomRef = db.collection('rooms').doc(roomId);
  const stateRef = roomRef.collection('gameState').doc('state');
  const playerId = gameState.currentTurnPlayerId;
  const player = room.players[playerId];

  if (!player) return;

  player.consecutiveTimeouts += 1;

  if (player.consecutiveTimeouts >= GAME_CONSTANTS.AFK_THRESHOLD) {
    player.status = 'afk';
    await triggerSuddenDeathEnd(transaction, roomId, room, gameState, playerId, 'afk');
    return;
  }

  // タイムアウト時のアクションはパス（手札・山札に変更はない）
  advanceTurn(room, gameState);

  transaction.update(roomRef, { players: room.players });
  transaction.update(stateRef, { ...gameState });
};

export const handleTimeout = (playerId: string, gameState: GameState, room?: GameRoom): void => {
  // パス処理（手札変更なし）
  if (room) {
    advanceTurn(room, gameState);
  } else {
    // テスト用に簡易的に次のプレイヤーに切り替える
    const currentIndex = gameState.turnOrder.indexOf(gameState.currentTurnPlayerId);
    const nextPlayerId = gameState.turnOrder[(currentIndex + 1) % gameState.turnOrder.length];
    gameState.currentTurnPlayerId = nextPlayerId;
  }
};

export const skipAfkPlayer = (playerId: string, gameState: GameState, room?: GameRoom): void => {
  // アクションカウントをインクリメント（パス処理）
  if (gameState.actionCountPerPlayer[playerId] !== undefined) {
    gameState.actionCountPerPlayer[playerId] += 1;
  }
  
  if (room) {
    advanceTurn(room, gameState);
  } else {
    const currentIndex = gameState.turnOrder.indexOf(gameState.currentTurnPlayerId);
    const nextPlayerId = gameState.turnOrder[(currentIndex + 1) % gameState.turnOrder.length];
    gameState.currentTurnPlayerId = nextPlayerId;
  }
};

export const startTurn = (playerId: string, gameState: GameState): void => {
  startSynthesisPhase(playerId, gameState);
};

export const advanceTurn = (room: GameRoom, gameState: GameState) => {
  let currentIndex = gameState.turnOrder.indexOf(gameState.currentTurnPlayerId);
  let nextPlayerId = null;

  for (let i = 1; i <= gameState.turnOrder.length; i++) {
    const checkIndex = (currentIndex + i) % gameState.turnOrder.length;
    const pId = gameState.turnOrder[checkIndex];
    if (room.players[pId].status === 'playing') {
      nextPlayerId = pId;
      break;
    }
  }

  if (nextPlayerId) {
    gameState.currentTurnPlayerId = nextPlayerId;
    gameState.turnDeadline = Date.now() + room.settings.turnTimeLimit * 1000;
    gameState.turnNumber += 1;
    gameState.currentAction = null;
  } else {
    gameState.phase = 'finished';
    room.status = 'finished';
  }
};
