import { ActionCard, CardType, CARD_COUNTS, VICTORY_POINT_PROBABILITIES, VICTORY_POINT_RANGES } from '@doronuma/shared';

export const createDeck = (suddenDeathRange: number): ActionCard[] => {
  const deck: ActionCard[] = [];
  let idCounter = 0;

  for (const [type, count] of Object.entries(CARD_COUNTS)) {
    if (type === 'SuddenDeath') continue;
    for (let i = 0; i < count; i++) {
      deck.push({ id: `card_${idCounter++}`, type: type as CardType });
    }
  }

  shuffleDeck(deck);

  const suddenDeathCard: ActionCard = { id: `card_${idCounter}`, type: 'SuddenDeath' };
  
  // Insert SuddenDeath in the bottom range
  const range = Math.min(suddenDeathRange, deck.length);
  const insertIndex = deck.length - Math.floor(Math.random() * range);
  deck.splice(insertIndex, 0, suddenDeathCard);

  return deck;
};

export const shuffleDeck = (deck: any[]) => {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
};

export const drawCard = (deck: ActionCard[]): ActionCard | undefined => {
  return deck.pop();
};

export const drawVictoryCard = (): number => {
  const rand = Math.random();
  if (rand < VICTORY_POINT_PROBABILITIES.MINUS) {
    const range = VICTORY_POINT_RANGES.MINUS;
    return range[Math.floor(Math.random() * range.length)];
  } else if (rand < VICTORY_POINT_PROBABILITIES.MINUS + VICTORY_POINT_PROBABILITIES.ZERO) {
    return 0;
  } else {
    const range = VICTORY_POINT_RANGES.PLUS;
    return range[Math.floor(Math.random() * range.length)];
  }
};
