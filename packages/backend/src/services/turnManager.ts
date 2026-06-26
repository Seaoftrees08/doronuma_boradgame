import * as admin from 'firebase-admin';
import { GameState, GameRoom, ActionCard, TurnActionType, GAME_CONSTANTS } from '@doronuma/shared';
import { drawCard } from './deck';
import { triggerSuddenDeathEnd } from './lastRoundManager';

export const processTimeoutTurn = async (
  transaction: admin.firestore.Transaction,
  roomId: string,
  room: GameRoom,
  gameState: GameState
): Promise<void> => {
  const db = admin.firestore();
  const roomRef = db.collection('rooms').doc(roomId);
  const stateRef = roomRef.collection('gameState').doc('state');
  const playerId = gameState.currentTurnPlayerId;
  const player = room.players[playerId];

  if (!player) return;

  player.consecutiveTimeouts += 1;

  if (player.consecutiveTimeouts >= GAME_CONSTANTS.AFK_THRESHOLD) {
    player.status = 'afk';
    await triggerSuddenDeathEnd(transaction, roomId, room, gameState, playerId, 'afk');
    return;
  }

  const handRef = roomRef.collection('hands').doc(playerId);
  const handDoc = await transaction.get(handRef);
  const handCards = handDoc.data()?.cards || [];
  
  const deckRef = roomRef.collection('private').doc('deck');
  const deckDoc = await transaction.get(deckRef);
  const deckCards = deckDoc.data()?.cards || [];

  const discardRef = roomRef.collection('private').doc('discard');
  const discardDoc = await transaction.get(discardRef);
  const discardCards = discardDoc.data()?.cards || [];

  if (gameState.needsDiscard) {
    while (handCards.length > GAME_CONSTANTS.MAX_HAND_SIZE) {
      const dropIndex = Math.floor(Math.random() * handCards.length);
      const dropped = handCards.splice(dropIndex, 1)[0];
      discardCards.push(dropped);
    }
    gameState.needsDiscard = false;
    gameState.discardPlayerId = null;
  } else {
    for (let i = 0; i < 2; i++) {
      const card = drawCard(deckCards);
      if (card) {
        if (card.type === 'SuddenDeath') {
          await triggerSuddenDeathEnd(transaction, roomId, room, gameState, playerId, 'draw');
          return;
        }
        handCards.push(card);
      }
    }

    while (handCards.length > GAME_CONSTANTS.MAX_HAND_SIZE) {
      const dropIndex = Math.floor(Math.random() * handCards.length);
      const dropped = handCards.splice(dropIndex, 1)[0];
      discardCards.push(dropped);
    }
  }

  player.handCount = handCards.length;
  gameState.deckRemaining = deckCards.length;
  gameState.discardCount = discardCards.length;

  advanceTurn(room, gameState);

  transaction.update(roomRef, { players: room.players });
  transaction.update(stateRef, { ...gameState });
  transaction.update(handRef, { cards: handCards });
  transaction.update(deckRef, { cards: deckCards });
  transaction.update(discardRef, { cards: discardCards });
};

export const advanceTurn = (room: GameRoom, gameState: GameState) => {
  let currentIndex = gameState.turnOrder.indexOf(gameState.currentTurnPlayerId);
  let nextPlayerId = null;

  for (let i = 1; i <= gameState.turnOrder.length; i++) {
    const checkIndex = (currentIndex + i) % gameState.turnOrder.length;
    const pId = gameState.turnOrder[checkIndex];
    if (room.players[pId].status === 'playing') {
      nextPlayerId = pId;
      break;
    }
  }

  if (nextPlayerId) {
    gameState.currentTurnPlayerId = nextPlayerId;
    gameState.turnDeadline = Date.now() + room.settings.turnTimeLimit * 1000;
    gameState.turnNumber += 1;
    gameState.needsDiscard = false;
    gameState.discardPlayerId = null;
    gameState.currentAction = null;
  } else {
    gameState.phase = 'finished';
    room.status = 'finished';
  }
};
