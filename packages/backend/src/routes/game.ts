import { Router } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { deadlineCheckMiddleware } from '../middleware/deadlineCheck';
import * as admin from 'firebase-admin';

const router = Router();

// 全ゲームAPIにdeadlineCheckをかませて状態を同期
router.use('/:roomId/*', deadlineCheckMiddleware);

router.post('/:roomId/action', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { roomId } = req.params;
    const { actionType, playedCardIds, targetPlayerId } = req.body;
    const playerId = req.user!.uid;

    // TODO: implement turn processing
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/:roomId/interrupt', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    // TODO: implement interrupt logic
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/:roomId/discard', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    // TODO: implement discard logic
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/:roomId/check-timeout', authenticate, async (req: AuthenticatedRequest, res) => {
  // deadlineCheckMiddleware will handle the timeout logic
  res.json({ success: true });
});

export default router;
