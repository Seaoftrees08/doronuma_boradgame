import { VictoryCardType } from '../types/game';

export const GAME_CONSTANTS = {
  MAX_HAND_SIZE: 5,
  MIN_PLAYERS: 3,
  MAX_PLAYERS: 5,
  DEFAULT_TURN_TIME: 120, // seconds
  DEFAULT_INTERRUPT_TIME: 90, // seconds
  INITIAL_HAND_SIZES: [3, 4, 5, 5, 5],
  SUDDEN_DEATH_PENALTY_CARD: 'MinusThree' as VictoryCardType,
  AFK_THRESHOLD: 2, // consecutive timeouts
  AFK_AUTO_ACTION: 'pass' as const,
  TIMEOUT_ACTION: 'pass' as const,
};

export const SYNTHESIS_TABLE = {
  small: { materials: { PlusOne: 2 }, result: { PlusThree: 1 } },
  large: { materials: { PlusThree: 2, MinusThree: 1 }, result: { PlusFive: 1 } }
} as const;
