import * as admin from 'firebase-admin';
import { GameState, GameRoom, GAME_CONSTANTS } from '@doronuma/shared';
import { processTimeoutTurn, advanceTurn } from './turnManager';
// import { triggerSuddenDeathEnd } from './lastRoundManager';

export const checkAndProcessExpiredDeadlines = async (roomId: string): Promise<void> => {
  const db = admin.firestore();
  const roomRef = db.collection('rooms').doc(roomId);
  const stateRef = roomRef.collection('gameState').doc('state');

  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(stateRef);
    if (!doc.exists) return;
    const gameState = doc.data() as GameState;
    if (gameState.phase !== 'playing' && gameState.phase !== 'interrupt') return;

    const now = Date.now();
    const isTurnTimeout = gameState.phase === 'playing' && gameState.turnDeadline <= now;
    const isInterruptTimeout = gameState.phase === 'interrupt' && gameState.interruptDeadline && gameState.interruptDeadline <= now;

    if (!isTurnTimeout && !isInterruptTimeout) {
      return; // No timeout
    }

    const roomDoc = await transaction.get(roomRef);
    const room = roomDoc.data() as GameRoom;

    if (isTurnTimeout) {
      // Process turn timeout
      await processTimeoutTurn(transaction, roomId, room, gameState);
    } else if (isInterruptTimeout) {
      // Process interrupt timeout (no one interrupted)
      // Resolve the original action
      gameState.phase = 'playing';
      gameState.interruptDeadline = null;
      gameState.currentAction = null;
      gameState.interruptStack = [];
      advanceTurn(room, gameState);

      transaction.update(roomRef, { players: room.players });
      transaction.update(stateRef, { ...gameState });
    }
  });
};
