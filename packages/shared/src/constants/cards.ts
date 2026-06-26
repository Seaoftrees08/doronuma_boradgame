import { CardType } from '../types/game';

export const CARD_COUNTS: Record<CardType, number> = {
  Harassment: 15,
  Accomplice: 8,
  Barrage: 4,
  Nullify: 7,
  Deflect: 6,
  DoubleBack: 4,
  Plunder: 3,
  CutDown: 2,
  SuddenDeath: 1
};

export const TOTAL_CARDS = Object.values(CARD_COUNTS).reduce((a, b) => a + b, 0);

// Victory point probabilities
export const VICTORY_POINT_PROBABILITIES = {
  MINUS: 0.80, // 80% chance (-1 to -5)
  ZERO: 0.15,  // 15% chance (0)
  PLUS: 0.05   // 5% chance (+2 to +5)
};

export const VICTORY_POINT_RANGES = {
  MINUS: [-1, -2, -3, -4, -5],
  ZERO: [0],
  PLUS: [2, 3, 4, 5]
};
