import { Router } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import * as admin from 'firebase-admin';
import { GameRoom, Player, GAME_CONSTANTS } from '@doronuma/shared';
import { initializeGame } from '../services/gameEngine';

const router = Router();
const db = admin.firestore();

// 部屋の作成
router.post('/', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { hostName } = req.body;
    const hostId = req.user!.uid;

    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const roomRef = db.collection('rooms').doc(roomId);

    const newRoom: GameRoom = {
      roomId,
      hostId,
      status: 'lobby',
      createdAt: Date.now(),
      settings: {
        maxPlayers: 5,
        turnTimeLimit: GAME_CONSTANTS.DEFAULT_TURN_TIME,
        interruptTimeLimit: GAME_CONSTANTS.DEFAULT_INTERRUPT_TIME,
        suddenDeathRange: 25,
        deckConfig: {}
      },
      players: {
        [hostId]: {
          playerId: hostId,
          name: hostName,
          score: 0,
          handCount: 0,
          status: 'waiting',
          joinedAt: Date.now(),
          consecutiveTimeouts: 0
        }
      }
    };

    await roomRef.set(newRoom);
    res.json({ roomId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// 部屋に参加
router.post('/:roomId/join', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { roomId } = req.params;
    const { playerName } = req.body;
    const playerId = req.user!.uid;

    const roomRef = db.collection('rooms').doc(roomId);
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(roomRef);
      if (!doc.exists) throw new Error('Room not found');

      const room = doc.data() as GameRoom;
      
      if (room.players[playerId]) {
        // 既に参加済み
        return;
      }

      const activePlayerCount = Object.values(room.players).filter(p => p.status !== 'observer').length;
      
      const newPlayer: Player = {
        playerId,
        name: playerName,
        score: 0,
        handCount: 0,
        status: (room.status === 'playing' || activePlayerCount >= room.settings.maxPlayers) ? 'observer' : 'waiting',
        joinedAt: Date.now(),
        consecutiveTimeouts: 0
      };

      room.players[playerId] = newPlayer;
      transaction.update(roomRef, { players: room.players });
    });

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Ready トグル
router.post('/:roomId/ready', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { roomId } = req.params;
    const playerId = req.user!.uid;

    const roomRef = db.collection('rooms').doc(roomId);
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(roomRef);
      if (!doc.exists) throw new Error('Room not found');

      const room = doc.data() as GameRoom;
      const player = room.players[playerId];

      if (!player || player.status === 'observer' || player.status === 'playing') {
        throw new Error('Invalid player state');
      }

      player.status = player.status === 'ready' ? 'waiting' : 'ready';
      transaction.update(roomRef, { [`players.${playerId}`]: player });
    });

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// 設定変更
router.patch('/:roomId/settings', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { roomId } = req.params;
    const { settings } = req.body;
    const playerId = req.user!.uid;

    const roomRef = db.collection('rooms').doc(roomId);
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(roomRef);
      if (!doc.exists) throw new Error('Room not found');

      const room = doc.data() as GameRoom;
      if (room.hostId !== playerId) throw new Error('Only host can change settings');
      if (room.status !== 'lobby') throw new Error('Cannot change settings after game started');

      transaction.update(roomRef, { settings });
    });

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// ゲーム開始
router.post('/:roomId/start', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { roomId } = req.params;
    const playerId = req.user!.uid;

    await initializeGame(roomId, playerId);

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;
