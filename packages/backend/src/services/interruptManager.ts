import * as admin from 'firebase-admin';
import { GameState, GameRoom, ActionCard } from '@doronuma/shared';

export const processInterrupt = async (
  transaction: admin.firestore.Transaction,
  roomId: string,
  room: GameRoom,
  gameState: GameState,
  playerId: string,
  playedCard: ActionCard,
  targetPlayerId?: string
) => {
  // TODO: implement interrupt resolution
};
