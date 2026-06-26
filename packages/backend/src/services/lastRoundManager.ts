import * as admin from 'firebase-admin';
import { GameState, GameRoom } from '@doronuma/shared';

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
    room.players[triggerPlayerId].score -= 999;
    gameState.phase = 'finished';
    room.status = 'finished';
  } else {
    gameState.targetActionCount = Math.max(...Object.values(gameState.actionCountPerPlayer));
  }

  transaction.update(roomRef, { status: room.status, players: room.players });
  transaction.update(stateRef, { ...gameState });
};
