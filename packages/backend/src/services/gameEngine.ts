import * as admin from 'firebase-admin';
import { GameRoom, GameState, ActionCard, GAME_CONSTANTS } from '@doronuma/shared';
import { createDeck } from './deck';

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
      needsDiscard: false,
      discardPlayerId: null
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
