import { CardType, VictoryCardType } from '../types/game';

export const CARD_COUNTS: Record<CardType, number> = {
  GainOne: 5,
  GainTwo: 3,
  GainThree: 2,
  Harassment: 8,
  Accomplice: 4,
  Barrage: 4,
  QuagmireDrag: 4,
  Nullify: 2,
  Deflect: 2,
  DoubleBack: 1,
  Repel: 5,
  Plunder: 3,
  HandRaid: 2,
  CutDown: 2,
  Share: 2,
  SuddenDeath: 1
};

export const TOTAL_CARDS = Object.values(CARD_COUNTS).reduce((a, b) => a + b, 0);

export const SABOTAGE_CARDS: CardType[] = ['Harassment', 'Accomplice', 'Barrage', 'QuagmireDrag'];
export const COUNTER_CARDS: CardType[] = ['Nullify', 'Deflect', 'DoubleBack', 'Repel'];

export const VICTORY_CARD_POINTS: Record<VictoryCardType, number> = {
  PlusOne: 1,
  PlusThree: 3,
  PlusFive: 5,
  MinusThree: -3
};
