import * as admin from 'firebase-admin';
import { GameRoom, GameState, ActionCard, GAME_CONSTANTS, canSynthesize, TurnAction, VictoryPointCard } from '@doronuma/shared';
import { createDeck, grantPlusOneCard } from './deck';

export const initializeGame = async (roomId: string, hostId: string): Promise<void> => {
  const db = admin.firestore();
  const roomRef = db.collection('rooms').doc(roomId);
  const stateRef = roomRef.collection('gameState').doc('state');

  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(roomRef);
    if (!doc.exists) throw new Error('Room not found');

    const room = doc.data() as GameRoom;
    if (room.hostId !== hostId) throw new Error('Only host can start game');
    
    const activePlayers = Object.values(room.players).filter(p => p.status === 'ready');
    if (activePlayers.length < GAME_CONSTANTS.MIN_PLAYERS) {
      throw new Error('Not enough ready players');
    }

    // Initialize Deck
    const fullDeck = createDeck(room.settings.suddenDeathRange);
    
    // Sort players randomly for turn order
    const turnOrder = activePlayers.map(p => p.playerId).sort(() => Math.random() - 0.5);

    // Deal cards
    const hands: Record<string, ActionCard[]> = {};
    const initialHandSizes = GAME_CONSTANTS.INITIAL_HAND_SIZES.slice(0, turnOrder.length);
    
    for (let i = 0; i < turnOrder.length; i++) {
      const pId = turnOrder[i];
      hands[pId] = [];
      const drawCount = initialHandSizes[i];
      for (let j = 0; j < drawCount; j++) {
        const card = fullDeck.pop();
        if (card) hands[pId].push(card);
      }
      room.players[pId].handCount = hands[pId].length;
      room.players[pId].status = 'playing';
      room.players[pId].consecutiveTimeouts = 0;
    }

    room.status = 'playing';

    const gameState: GameState = {
      phase: 'playing',
      currentTurnPlayerId: turnOrder[0],
      turnOrder,
      turnNumber: 1,
      deckRemaining: fullDeck.length,
      discardCount: 0,
      suddenDeathTriggered: false,
      suddenDeathTriggeredBy: null,
      targetActionCount: null,
      actionCountPerPlayer: Object.fromEntries(turnOrder.map(id => [id, 0])),
      turnDeadline: Date.now() + room.settings.turnTimeLimit * 1000,
      interruptDeadline: null,
      currentAction: null,
      interruptStack: [],
      synthesisPhase: false,
      victoryCards: Object.fromEntries(turnOrder.map(id => [id, []]))
    };

    // Save state
    transaction.update(roomRef, {
      status: 'playing',
      players: room.players
    });
    transaction.set(stateRef, gameState);

    // Save hands
    for (const [pId, cards] of Object.entries(hands)) {
      transaction.set(roomRef.collection('hands').doc(pId), { cards });
    }
    
    // Save remaining deck
    transaction.set(roomRef.collection('private').doc('deck'), { cards: fullDeck });
    transaction.set(roomRef.collection('private').doc('discard'), { cards: [] });
  });
};

export const startSynthesisPhase = (playerId: string, gameState: GameState): void => {
  grantPlusOneCard(playerId, gameState);
  gameState.synthesisPhase = true;
};

export const handleSynthesis = (
  playerId: string,
  synthesisType: 'small' | 'large',
  gameState: GameState
): { success: boolean; error?: string } => {
  if (!gameState.synthesisPhase) {
    return { success: false, error: 'Not in synthesis phase' };
  }
  if (gameState.currentTurnPlayerId !== playerId) {
    return { success: false, error: 'Not your turn' };
  }

  const pCards = gameState.victoryCards[playerId] || [];
  if (!canSynthesize(pCards, synthesisType)) {
    return { success: false, error: 'Insufficient materials for synthesis' };
  }

  const updatedCards = [...pCards];

  if (synthesisType === 'small') {
    let count = 0;
    for (let i = updatedCards.length - 1; i >= 0; i--) {
      if (updatedCards[i].type === 'PlusOne') {
        updatedCards.splice(i, 1);
        count++;
        if (count === 2) break;
      }
    }
    updatedCards.push({ type: 'PlusThree' });
  } else {
    let plusThreeCount = 0;
    let minusThreeCount = 0;

    for (let i = updatedCards.length - 1; i >= 0; i--) {
      if (updatedCards[i].type === 'PlusThree' && plusThreeCount < 2) {
        updatedCards.splice(i, 1);
        plusThreeCount++;
      } else if (updatedCards[i].type === 'MinusThree' && minusThreeCount < 1) {
        updatedCards.splice(i, 1);
        minusThreeCount++;
      }
    }
    updatedCards.push({ type: 'PlusFive' });
  }

  gameState.victoryCards[playerId] = updatedCards;
  return { success: true };
};

export const endSynthesisPhase = (playerId: string, gameState: GameState): void => {
  if (gameState.currentTurnPlayerId === playerId) {
    gameState.synthesisPhase = false;
  }
};

export const executeTurnAction = (
  playerId: string,
  action: TurnAction,
  gameState: GameState
): { success: boolean; error?: string } => {
  if (gameState.currentTurnPlayerId !== playerId) {
    return { success: false, error: 'Not your turn' };
  }

  // 手札上限チェック
  if (action.type === 'drawOnePlayOne') {
    const stateAny = gameState as any;
    const hand = stateAny.hands?.[playerId]?.cards || [];
    if (hand.length >= GAME_CONSTANTS.MAX_HAND_SIZE) {
      return { success: false, error: '手札上限のためこのアクションは実行できません' };
    }
  }

  // 今後 core logic が追加される
  return { success: true };
};

export const calculateFinalScores = (
  victoryCards: Record<string, VictoryPointCard[]>,
  afkPlayerIds: string[]
): Record<string, number> => {
  const scores: Record<string, number> = {};
  const { VICTORY_CARD_POINTS } = require('@doronuma/shared');

  for (const [playerId, cards] of Object.entries(victoryCards)) {
    if (afkPlayerIds.includes(playerId)) {
      scores[playerId] = -9999; // 空席プレイヤーは強制最下位
    } else {
      let score = 0;
      for (const card of cards) {
        score += (VICTORY_CARD_POINTS[card.type] as number) || 0;
      }
      scores[playerId] = score;
    }
  }
  return scores;
};
