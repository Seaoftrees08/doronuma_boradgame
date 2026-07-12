import { GAME_CONSTANTS, SYNTHESIS_TABLE } from '../constants/game';
import { CardType, VictoryPointCard, VictoryCardType } from '../types/game';
import { SABOTAGE_CARDS, COUNTER_CARDS } from '../constants/cards';

export const canDrawTwo = (deckRemaining: number): boolean => {
  return deckRemaining >= 2;
};

export const canDrawOnePlayOne = (deckRemaining: number, handCount: number): boolean => {
  // 引く前に手札が5枚以上の場合は選択不可
  return deckRemaining >= 1 && handCount >= 1 && handCount < GAME_CONSTANTS.MAX_HAND_SIZE;
};

export const canDiscardPlayTwo = (handCount: number): boolean => {
  // 捨てる前に手札が1枚以下の場合は選択不可
  return handCount >= 2;
};

export const getAvailableActions = (deckRemaining: number, handCount: number) => {
  return {
    drawTwo: canDrawTwo(deckRemaining),
    drawOnePlayOne: canDrawOnePlayOne(deckRemaining, handCount),
    discardPlayTwo: canDiscardPlayTwo(handCount),
    pass: true
  };
};

export function canSynthesize(
  victoryCards: VictoryPointCard[],
  synthesisType: 'small' | 'large'
): boolean {
  const counts: Record<VictoryCardType, number> = {
    PlusOne: 0,
    PlusThree: 0,
    PlusFive: 0,
    MinusThree: 0
  };

  for (const card of victoryCards) {
    counts[card.type]++;
  }

  const table = SYNTHESIS_TABLE[synthesisType];
  for (const [cardType, requiredCount] of Object.entries(table.materials)) {
    const key = cardType as VictoryCardType;
    if (counts[key] < (requiredCount as number)) {
      return false;
    }
  }

  return true;
}

export function canUseCounterCard(
  counterCardType: CardType,
  targetCardType: CardType
): boolean {
  // 対抗カードは妨害系カードにのみ有効
  return COUNTER_CARDS.includes(counterCardType) && SABOTAGE_CARDS.includes(targetCardType);
}

export const isCounterCard = (cardType: CardType): boolean => {
  return COUNTER_CARDS.includes(cardType);
};

