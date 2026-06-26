import { Request, Response, NextFunction } from 'express';
import { checkAndProcessExpiredDeadlines } from '../services/deadlineChecker';

export const deadlineCheckMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const roomId = req.params.roomId;
  if (roomId) {
    try {
      await checkAndProcessExpiredDeadlines(roomId);
    } catch (error) {
      console.error(`Error processing deadlines for room ${roomId}:`, error);
      // We log but don't fail the request if deadline processing throws,
      // though typically we want to wait for it so the state is consistent.
    }
  }
  next();
};
