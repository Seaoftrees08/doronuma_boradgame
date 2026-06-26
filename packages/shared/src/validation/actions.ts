import { GAME_CONSTANTS } from '../constants/game';

export const canDrawTwo = (deckRemaining: number): boolean => {
  return deckRemaining >= 2;
};

export const canDrawOnePlayOne = (deckRemaining: number, handCount: number): boolean => {
  return deckRemaining >= 1 && handCount >= 1;
};

export const canDiscardPlayTwo = (handCount: number): boolean => {
  // Requires at least 3 cards (1 to discard, 2 to play)
  return handCount >= 3;
};

export const needsDiscard = (handCount: number): boolean => {
  return handCount > GAME_CONSTANTS.MAX_HAND_SIZE;
};

export const getAvailableActions = (deckRemaining: number, handCount: number) => {
  return {
    drawTwo: canDrawTwo(deckRemaining),
    drawOnePlayOne: canDrawOnePlayOne(deckRemaining, handCount),
    discardPlayTwo: canDiscardPlayTwo(handCount),
    pass: true // Pass is generally always available
  };
};
