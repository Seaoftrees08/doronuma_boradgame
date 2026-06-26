import * as admin from 'firebase-admin';
import { GameRoom } from '@doronuma/shared';

export const transferHost = async (roomId: string, currentHostId: string): Promise<void> => {
  const roomRef = admin.firestore().collection('rooms').doc(roomId);
  await admin.firestore().runTransaction(async (transaction) => {
    const doc = await transaction.get(roomRef);
    if (!doc.exists) return;
    const room = doc.data() as GameRoom;

    if (room.hostId === currentHostId) {
      const activePlayers = Object.values(room.players).filter(p => p.playerId !== currentHostId && p.status !== 'observer');
      if (activePlayers.length > 0) {
        const nextHost = activePlayers[Math.floor(Math.random() * activePlayers.length)];
        transaction.update(roomRef, { hostId: nextHost.playerId });
      }
    }
  });
};
