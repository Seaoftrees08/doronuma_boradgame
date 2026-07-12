import { Router } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { deadlineCheckMiddleware } from '../middleware/deadlineCheck';
import * as admin from 'firebase-admin';
import { GameState, GameRoom, ActionCard, isCounterCard, GAME_CONSTANTS } from '@doronuma/shared';
import { advanceTurn } from '../services/turnManager';

const router = Router();

// 全ゲームAPIにdeadlineCheckをかませて状態を同期
router.use('/:roomId/*', deadlineCheckMiddleware);

router.post('/:roomId/action', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { roomId } = req.params;
    const { actionType, playedCardIds, targetPlayerId } = req.body;
    const playerId = req.user!.uid;

    const db = admin.firestore();
    const roomRef = db.collection('rooms').doc(roomId);
    const stateRef = roomRef.collection('gameState').doc('state');
    const deckRef = roomRef.collection('private').doc('deck');
    const discardRef = roomRef.collection('private').doc('discard');
    const handRef = roomRef.collection('hands').doc(playerId);

    const result = await db.runTransaction(async (transaction) => {
      const roomDoc = await transaction.get(roomRef);
      if (!roomDoc.exists) throw new Error('Room not found');
      const room = roomDoc.data() as GameRoom;

      const stateDoc = await transaction.get(stateRef);
      if (!stateDoc.exists) throw new Error('Game state not found');
      const gameState = stateDoc.data() as GameState;

      // Validation
      if (room.status !== 'playing' || gameState.phase !== 'playing') {
        throw new Error('Game is not in playing phase');
      }
      if (gameState.currentTurnPlayerId !== playerId) {
        throw new Error('Not your turn');
      }

      const handDoc = await transaction.get(handRef);
      const hand = (handDoc.exists ? handDoc.data()?.cards : []) as ActionCard[];

      const deckDoc = await transaction.get(deckRef);
      const deck = (deckDoc.exists ? deckDoc.data()?.cards : []) as ActionCard[];

      const discardDoc = await transaction.get(discardRef);
      const discard = (discardDoc.exists ? discardDoc.data()?.cards : []) as ActionCard[];

      const drawCards = (count: number) => {
        const drawn: ActionCard[] = [];
        for (let i = 0; i < count; i++) {
          const card = deck.pop();
          if (!card) break;
          drawn.push(card);

          if (card.type === 'SuddenDeath') {
            gameState.suddenDeathTriggered = true;
            gameState.suddenDeathTriggeredBy = playerId;
            gameState.phase = 'lastRound';
            if (!gameState.victoryCards) {
              gameState.victoryCards = {};
            }
            if (!gameState.victoryCards[playerId]) {
              gameState.victoryCards[playerId] = [];
            }
            gameState.victoryCards[playerId].push({ type: 'MinusThree' });
            gameState.targetActionCount = Math.max(...Object.values(gameState.actionCountPerPlayer));
          }
        }

        if (deck.length === 0 && !gameState.suddenDeathTriggered) {
          gameState.suddenDeathTriggered = true;
          gameState.suddenDeathTriggeredBy = playerId;
          gameState.phase = 'lastRound';
          gameState.targetActionCount = Math.max(...Object.values(gameState.actionCountPerPlayer));
        }

        gameState.deckRemaining = deck.length;
        return drawn;
      };

      if (actionType === 'drawTwo') {
        if (hand.length >= GAME_CONSTANTS.MAX_HAND_SIZE) {
          throw new Error('手札上限のためこのアクションは実行できません');
        }
        const drawn = drawCards(2);
        const newHand = [...hand, ...drawn];
        room.players[playerId].handCount = newHand.length;

        transaction.set(handRef, { cards: newHand });
        transaction.set(deckRef, { cards: deck });

        if (gameState.actionCountPerPlayer[playerId] !== undefined) {
          gameState.actionCountPerPlayer[playerId] += 1;
        }

        advanceTurn(room, gameState);
      } else if (actionType === 'drawOnePlayOne') {
        const drawn = drawCards(1);
        let currentHand = [...hand, ...drawn];

        if (!playedCardIds || playedCardIds.length !== 1) {
          throw new Error('Must select exactly one card to play');
        }
        const playCardId = playedCardIds[0];
        const cardIndex = currentHand.findIndex(c => c.id === playCardId);
        if (cardIndex === -1) {
          throw new Error('Selected card not in hand');
        }
        const playedCard = currentHand[cardIndex];
        if (isCounterCard(playedCard.type)) {
          throw new Error('Cannot play counter card in action turn');
        }
        currentHand.splice(cardIndex, 1);

        room.players[playerId].handCount = currentHand.length;
        transaction.set(handRef, { cards: currentHand });
        transaction.set(deckRef, { cards: deck });

        const newDiscard = [...discard, playedCard];
        transaction.set(discardRef, { cards: newDiscard });

        if (gameState.actionCountPerPlayer[playerId] !== undefined) {
          gameState.actionCountPerPlayer[playerId] += 1;
        }

        const isSabotage = ['Harassment', 'Accomplice', 'Barrage', 'QuagmireDrag'].includes(playedCard.type);

        if (isSabotage) {
          gameState.phase = 'interrupt';
          gameState.interruptDeadline = Date.now() + room.settings.interruptTimeLimit * 1000;
          gameState.currentAction = {
            type: 'drawOnePlayOne',
            cardId: playCardId,
            cardType: playedCard.type,
            playerId,
            targetPlayerId
          } as any;
          gameState.interruptStack = [];
        } else {
          if (!gameState.victoryCards) {
            gameState.victoryCards = {};
          }
          if (!gameState.victoryCards[playerId]) {
            gameState.victoryCards[playerId] = [];
          }

          if (playedCard.type === 'GainOne') {
            gameState.victoryCards[playerId].push({ type: 'PlusOne' });
          } else if (playedCard.type === 'GainTwo') {
            gameState.victoryCards[playerId].push({ type: 'PlusOne' }, { type: 'PlusOne' });
          } else if (playedCard.type === 'GainThree') {
            gameState.victoryCards[playerId].push({ type: 'PlusOne' }, { type: 'PlusOne' }, { type: 'PlusOne' });
          } else if (playedCard.type === 'Plunder' && targetPlayerId) {
            const targetVictory = gameState.victoryCards[targetPlayerId] || [];
            if (targetVictory.length > 0) {
              const plunderCount = Math.min(2, targetVictory.length);
              for (let i = 0; i < plunderCount; i++) {
                const randIdx = Math.floor(Math.random() * targetVictory.length);
                const stolen = targetVictory.splice(randIdx, 1)[0];
                gameState.victoryCards[playerId].push(stolen);
              }
              gameState.victoryCards[targetPlayerId] = targetVictory;
            }
          } else if (playedCard.type === 'HandRaid' && targetPlayerId) {
            const targetHandRef = roomRef.collection('hands').doc(targetPlayerId);
            const targetHandDoc = await transaction.get(targetHandRef);
            const targetHand = (targetHandDoc.exists ? targetHandDoc.data()?.cards : []) as ActionCard[];
            if (targetHand.length > 0) {
              const randIdx = Math.floor(Math.random() * targetHand.length);
              const stolenCard = targetHand.splice(randIdx, 1)[0];
              
              currentHand.push(stolenCard);
              room.players[playerId].handCount = currentHand.length;
              transaction.set(handRef, { cards: currentHand });

              room.players[targetPlayerId].handCount = targetHand.length;
              transaction.set(targetHandRef, { cards: targetHand });
            }
          } else if (playedCard.type === 'CutDown') {
            for (const pId of gameState.turnOrder) {
              const pVictory = gameState.victoryCards[pId] || [];
              const idx = pVictory.findIndex(c => c.type === 'PlusFive');
              if (idx !== -1) {
                pVictory.splice(idx, 1);
                gameState.victoryCards[pId] = pVictory;
              }
            }
          } else if (playedCard.type === 'Share' && targetPlayerId) {
            const myVictory = gameState.victoryCards[playerId] || [];
            if (myVictory.length > 0) {
              const scoreMap = { MinusThree: -3, PlusOne: 1, PlusThree: 3, PlusFive: 5 };
              let lowestIdx = 0;
              let lowestVal = 9999;
              for (let i = 0; i < myVictory.length; i++) {
                const val = scoreMap[myVictory[i].type as keyof typeof scoreMap] || 0;
                if (val < lowestVal) {
                  lowestVal = val;
                  lowestIdx = i;
                }
              }
              const sharedCard = myVictory.splice(lowestIdx, 1)[0];
              gameState.victoryCards[playerId] = myVictory;

              if (!gameState.victoryCards[targetPlayerId]) {
                gameState.victoryCards[targetPlayerId] = [];
              }
              gameState.victoryCards[targetPlayerId].push(sharedCard);
            }
          }

          advanceTurn(room, gameState);
        }
      } else if (actionType === 'discardPlayTwo') {
        if (!playedCardIds || playedCardIds.length < 1) {
          throw new Error('Must select a card to discard');
        }
        if (playedCardIds.length > 3) {
          throw new Error('Cannot play more than 2 cards');
        }

        let currentHand = [...hand];
        
        const discardCardId = playedCardIds[0];
        const discardIdx = currentHand.findIndex(c => c.id === discardCardId);
        if (discardIdx === -1) {
          throw new Error('Discard card not in hand');
        }
        const discardedCard = currentHand[discardIdx];
        currentHand.splice(discardIdx, 1);

        const playCardIds = playedCardIds.slice(1);
        const playedCards: ActionCard[] = [];
        for (const cid of playCardIds) {
          const pIdx = currentHand.findIndex(c => c.id === cid);
          if (pIdx === -1) {
            throw new Error('Played card not in hand');
          }
          const playedCard = currentHand[pIdx];
          if (isCounterCard(playedCard.type)) {
            throw new Error('Cannot play counter card in action turn');
          }
          playedCards.push(playedCard);
          currentHand.splice(pIdx, 1);
        }

        room.players[playerId].handCount = currentHand.length;
        transaction.set(handRef, { cards: currentHand });

        const newDiscard = [...discard, discardedCard, ...playedCards];
        transaction.set(discardRef, { cards: newDiscard });

        if (gameState.actionCountPerPlayer[playerId] !== undefined) {
          gameState.actionCountPerPlayer[playerId] += 1;
        }

        const hasSabotage = playedCards.some(c => ['Harassment', 'Accomplice', 'Barrage', 'QuagmireDrag'].includes(c.type));

        if (hasSabotage) {
          gameState.phase = 'interrupt';
          gameState.interruptDeadline = Date.now() + room.settings.interruptTimeLimit * 1000;
          const sabotageCard = playedCards.find(c => ['Harassment', 'Accomplice', 'Barrage', 'QuagmireDrag'].includes(c.type))!;
          gameState.currentAction = {
            type: 'discardPlayTwo',
            cardId: sabotageCard.id,
            cardType: sabotageCard.type,
            playerId,
            targetPlayerId
          } as any;
          gameState.interruptStack = [];
        } else {
          if (!gameState.victoryCards) {
            gameState.victoryCards = {};
          }
          if (!gameState.victoryCards[playerId]) {
            gameState.victoryCards[playerId] = [];
          }

          for (const card of playedCards) {
            if (card.type === 'GainOne') {
              gameState.victoryCards[playerId].push({ type: 'PlusOne' });
            } else if (card.type === 'GainTwo') {
              gameState.victoryCards[playerId].push({ type: 'PlusOne' }, { type: 'PlusOne' });
            } else if (card.type === 'GainThree') {
              gameState.victoryCards[playerId].push({ type: 'PlusOne' }, { type: 'PlusOne' }, { type: 'PlusOne' });
            } else if (card.type === 'Plunder' && targetPlayerId) {
              const targetVictory = gameState.victoryCards[targetPlayerId] || [];
              if (targetVictory.length > 0) {
                const plunderCount = Math.min(2, targetVictory.length);
                for (let i = 0; i < plunderCount; i++) {
                  const randIdx = Math.floor(Math.random() * targetVictory.length);
                  const stolen = targetVictory.splice(randIdx, 1)[0];
                  gameState.victoryCards[playerId].push(stolen);
                }
                gameState.victoryCards[targetPlayerId] = targetVictory;
              }
            } else if (card.type === 'HandRaid' && targetPlayerId) {
              const targetHandRef = roomRef.collection('hands').doc(targetPlayerId);
              const targetHandDoc = await transaction.get(targetHandRef);
              const targetHand = (targetHandDoc.exists ? targetHandDoc.data()?.cards : []) as ActionCard[];
              if (targetHand.length > 0) {
                const randIdx = Math.floor(Math.random() * targetHand.length);
                const stolenCard = targetHand.splice(randIdx, 1)[0];
                
                currentHand.push(stolenCard);
                room.players[playerId].handCount = currentHand.length;
                transaction.set(handRef, { cards: currentHand });

                room.players[targetPlayerId].handCount = targetHand.length;
                transaction.set(targetHandRef, { cards: targetHand });
              }
            } else if (card.type === 'CutDown') {
              for (const pId of gameState.turnOrder) {
                const pVictory = gameState.victoryCards[pId] || [];
                const idx = pVictory.findIndex(c => c.type === 'PlusFive');
                if (idx !== -1) {
                  pVictory.splice(idx, 1);
                  gameState.victoryCards[pId] = pVictory;
                }
              }
            } else if (card.type === 'Share' && targetPlayerId) {
              const myVictory = gameState.victoryCards[playerId] || [];
              if (myVictory.length > 0) {
                const scoreMap = { MinusThree: -3, PlusOne: 1, PlusThree: 3, PlusFive: 5 };
                let lowestIdx = 0;
                let lowestVal = 9999;
                for (let i = 0; i < myVictory.length; i++) {
                  const val = scoreMap[myVictory[i].type as keyof typeof scoreMap] || 0;
                  if (val < lowestVal) {
                    lowestVal = val;
                    lowestIdx = i;
                  }
                }
                const sharedCard = myVictory.splice(lowestIdx, 1)[0];
                gameState.victoryCards[playerId] = myVictory;

                if (!gameState.victoryCards[targetPlayerId]) {
                  gameState.victoryCards[targetPlayerId] = [];
                }
                gameState.victoryCards[targetPlayerId].push(sharedCard);
              }
            }
          }

          advanceTurn(room, gameState);
        }
      } else if (actionType === 'pass') {
        if (gameState.actionCountPerPlayer[playerId] !== undefined) {
          gameState.actionCountPerPlayer[playerId] += 1;
        }
        advanceTurn(room, gameState);
      } else {
        throw new Error(`Unsupported action type: ${actionType}`);
      }

      transaction.update(roomRef, { players: room.players });
      transaction.update(stateRef, { ...gameState });

      return { success: true };
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/:roomId/interrupt', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { roomId } = req.params;
    const { playedCardId, targetPlayerId } = req.body;
    const playerId = req.user!.uid;

    const db = admin.firestore();
    const roomRef = db.collection('rooms').doc(roomId);
    const stateRef = roomRef.collection('gameState').doc('state');
    const handRef = roomRef.collection('hands').doc(playerId);
    const discardRef = roomRef.collection('private').doc('discard');

    const result = await db.runTransaction(async (transaction) => {
      const roomDoc = await transaction.get(roomRef);
      if (!roomDoc.exists) throw new Error('Room not found');
      const room = roomDoc.data() as GameRoom;

      const stateDoc = await transaction.get(stateRef);
      if (!stateDoc.exists) throw new Error('Game state not found');
      const gameState = stateDoc.data() as GameState;

      // Validation
      if (gameState.phase !== 'interrupt') {
        throw new Error('Not in interrupt phase');
      }

      if (targetPlayerId && room.players[targetPlayerId]?.status === 'afk') {
        throw new Error('Cannot target AFK player');
      }

      const handDoc = await transaction.get(handRef);
      const hand = (handDoc.exists ? handDoc.data()?.cards : []) as ActionCard[];

      const cardIndex = hand.findIndex(c => c.id === playedCardId);
      if (cardIndex === -1) {
        throw new Error('Card not in hand');
      }
      const counterCard = hand[cardIndex];
      const isCounter = ['Nullify', 'Deflect', 'DoubleBack', 'Repel'].includes(counterCard.type);
      if (!isCounter) {
        throw new Error('Not a counter card');
      }

      // Remove from hand
      hand.splice(cardIndex, 1);
      room.players[playerId].handCount = hand.length;

      // Add to discard
      const discardDoc = await transaction.get(discardRef);
      const discard = (discardDoc.exists ? discardDoc.data()?.cards : []) as ActionCard[];
      const newDiscard = [...discard, counterCard];

      // Add to interrupt stack
      if (!gameState.interruptStack) {
        gameState.interruptStack = [];
      }
      gameState.interruptStack.push({
        playerId,
        playedCard: counterCard,
        targetPlayerId
      });

      // Reset timer
      gameState.interruptDeadline = Date.now() + room.settings.interruptTimeLimit * 1000;

      transaction.set(handRef, { cards: hand });
      transaction.set(discardRef, { cards: newDiscard });
      transaction.update(roomRef, { players: room.players });
      transaction.update(stateRef, { ...gameState });

      return { success: true };
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/:roomId/discard', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { roomId } = req.params;
    const { discardedCardIds } = req.body;
    const playerId = req.user!.uid;

    const db = admin.firestore();
    const roomRef = db.collection('rooms').doc(roomId);
    const handRef = roomRef.collection('hands').doc(playerId);
    const discardRef = roomRef.collection('private').doc('discard');

    const result = await db.runTransaction(async (transaction) => {
      const roomDoc = await transaction.get(roomRef);
      if (!roomDoc.exists) throw new Error('Room not found');
      const room = roomDoc.data() as GameRoom;

      const handDoc = await transaction.get(handRef);
      const hand = (handDoc.exists ? handDoc.data()?.cards : []) as ActionCard[];

      const discardDoc = await transaction.get(discardRef);
      const discard = (discardDoc.exists ? discardDoc.data()?.cards : []) as ActionCard[];

      const remainingHand = [...hand];
      const discarded: ActionCard[] = [];

      for (const cid of discardedCardIds) {
        const idx = remainingHand.findIndex(c => c.id === cid);
        if (idx !== -1) {
          discarded.push(remainingHand.splice(idx, 1)[0]);
        }
      }

      room.players[playerId].handCount = remainingHand.length;
      const newDiscard = [...discard, ...discarded];

      transaction.set(handRef, { cards: remainingHand });
      transaction.set(discardRef, { cards: newDiscard });
      transaction.update(roomRef, { players: room.players });

      return { success: true };
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/:roomId/check-timeout', authenticate, async (req: AuthenticatedRequest, res) => {
  // deadlineCheckMiddleware will handle the timeout logic
  res.json({ success: true });
});

export default router;
