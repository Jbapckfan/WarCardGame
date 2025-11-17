import { database } from '../config/firebase';
import { ref, push, set, onValue, off, update, remove, get } from 'firebase/database';
import { Phase10GameState, Phase10Player, Phase10GameRoom, Phase10Card } from '../types/phase10';
import {
  createPhase10Deck,
  shufflePhase10Deck,
  validatePhaseCompletion,
  canPlayOnPhase,
  calculatePhase10Score,
  getCurrentPhase,
  reshuffleDiscardPile
} from './phase10Logic';
import { getCurrentUserId } from './authService';

/**
 * NOTE: All playerId parameters should be Firebase Auth UIDs
 */

const CARDS_PER_PLAYER = 10;

/**
 * Create a new Phase 10 game room
 */
export const createPhase10GameRoom = async (
  playerId: string,
  playerName: string,
  maxPlayers: number = 2,
  pushToken?: string
): Promise<string> => {
  const roomsRef = ref(database, 'rooms');
  const newRoomRef = push(roomsRef);
  const roomId = newRoomRef.key!;

  const deck = shufflePhase10Deck(createPhase10Deck());

  // Deal cards to all player slots
  const player1Hand = deck.slice(0, CARDS_PER_PLAYER);
  const startIndex = maxPlayers * CARDS_PER_PLAYER;
  const drawPile = deck.slice(startIndex + 1); // +1 for first discard
  const firstDiscard = deck[startIndex];

  const gameRoom: Phase10GameRoom = {
    id: roomId,
    createdBy: playerId,
    createdAt: Date.now(),
    playerCount: 1,
    maxPlayers,
  };

  const initialGameState: Partial<Phase10GameState> = {
    id: roomId,
    player1: {
      id: playerId,
      name: playerName,
      hand: player1Hand,
      currentPhase: 1,
      completedPhase: false,
      laidDownCards: [],
      score: 0,
      pushToken,
    },
    player2: null,
    player3: maxPlayers >= 3 ? null : undefined,
    player4: maxPlayers >= 4 ? null : undefined,
    players: [],
    currentPlayerIndex: 0,
    currentTurn: playerId,
    gameStatus: 'waiting',
    discardPile: [firstDiscard],
    drawPile,
    lastAction: 'Waiting for players...',
    lastActionTime: Date.now(),
    winner: null,
    roundNumber: 0,
    hasDrawn: false,
    maxPlayers,
  };

  await set(ref(database, `rooms/${roomId}`), gameRoom);
  await set(ref(database, `games/${roomId}`), initialGameState);

  return roomId;
};

/**
 * Join an existing Phase 10 game room
 */
export const joinPhase10GameRoom = async (
  roomId: string,
  playerId: string,
  playerName: string,
  pushToken?: string
): Promise<boolean> => {
  const gameRef = ref(database, `games/${roomId}`);
  const roomRef = ref(database, `rooms/${roomId}`);

  const [gameSnapshot, roomSnapshot] = await Promise.all([
    get(gameRef),
    get(roomRef)
  ]);

  if (!gameSnapshot.exists() || !roomSnapshot.exists()) {
    return false;
  }

  const gameState: any = gameSnapshot.val();
  const room: Phase10GameRoom = roomSnapshot.val();

  if (gameState.gameStatus !== 'waiting' || room.playerCount >= room.maxPlayers) {
    return false;
  }

  // Determine which player slot to fill
  const playerSlot = !gameState.player2
    ? 'player2'
    : !gameState.player3 && room.maxPlayers >= 3
    ? 'player3'
    : !gameState.player4 && room.maxPlayers >= 4
    ? 'player4'
    : null;

  if (!playerSlot) {
    return false;
  }

  // Deal cards from draw pile
  const playerHand = gameState.drawPile.slice(0, CARDS_PER_PLAYER);
  const newDrawPile = gameState.drawPile.slice(CARDS_PER_PLAYER);

  const newPlayerCount = room.playerCount + 1;
  const updates: any = {
    [playerSlot]: {
      id: playerId,
      name: playerName,
      hand: playerHand,
      currentPhase: 1,
      completedPhase: false,
      laidDownCards: [],
      score: 0,
      pushToken,
    },
    playerCount: newPlayerCount,
    drawPile: newDrawPile,
    lastAction: `${playerName} joined the game`,
    lastActionTime: Date.now(),
  };

  // Build players array
  const players: Phase10Player[] = [gameState.player1];
  if (playerSlot === 'player2' || gameState.player2) {
    players.push(playerSlot === 'player2' ? updates.player2 : gameState.player2!);
  }
  if (gameState.player3 || playerSlot === 'player3') {
    players.push(playerSlot === 'player3' ? updates.player3 : gameState.player3!);
  }
  if (gameState.player4 || playerSlot === 'player4') {
    players.push(playerSlot === 'player4' ? updates.player4 : gameState.player4!);
  }

  updates.players = players;

  // Start game if all players have joined
  if (newPlayerCount === room.maxPlayers) {
    updates.gameStatus = 'playing';
    updates.roundNumber = 1;
    updates.lastAction = `Round 1 started! ${players[0].name}'s turn`;
  }

  await update(gameRef, updates);
  await update(roomRef, { playerCount: newPlayerCount });

  return true;
};

/**
 * Listen to Phase 10 game state changes
 */
export const listenToPhase10GameState = (
  gameId: string,
  callback: (gameState: Phase10GameState | null) => void
): (() => void) => {
  if (!database) {
    return () => {};
  }
  const gameRef = ref(database, `games/${gameId}`);

  onValue(gameRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  });

  return () => off(gameRef);
};

/**
 * Draw a Phase 10 card (from draw pile or discard pile)
 */
export const drawPhase10Card = async (
  gameId: string,
  playerId: string,
  fromDiscard: boolean = false
): Promise<void> => {
  const gameRef = ref(database, `games/${gameId}`);
  const gameSnapshot = await get(gameRef);
  const gameState: Phase10GameState = gameSnapshot.val();

  const playerIndex = gameState.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) {
    throw new Error('Player not found');
  }

  if (gameState.hasDrawn) {
    throw new Error('Already drew this turn');
  }

  const player = gameState.players[playerIndex];
  let drawnCard: Phase10Card;
  const updates: any = {
    hasDrawn: true,
    lastActionTime: Date.now(),
  };

  if (fromDiscard && gameState.discardPile.length > 0) {
    // Draw from discard pile
    drawnCard = gameState.discardPile[gameState.discardPile.length - 1];
    const newDiscardPile = gameState.discardPile.slice(0, -1);
    updates.discardPile = newDiscardPile;
    updates.lastAction = `${player.name} drew from discard pile`;
  } else {
    // Draw from draw pile
    if (gameState.drawPile.length === 0) {
      // Reshuffle discard pile
      const { newDrawPile, newDiscardPile } = reshuffleDiscardPile(
        gameState.discardPile,
        gameState.drawPile
      );

      if (newDrawPile.length === 0) {
        throw new Error('No cards left to draw');
      }

      drawnCard = newDrawPile[0];
      updates.drawPile = newDrawPile.slice(1);
      updates.discardPile = newDiscardPile;
    } else {
      drawnCard = gameState.drawPile[0];
      updates.drawPile = gameState.drawPile.slice(1);
    }
    updates.lastAction = `${player.name} drew a card`;
  }

  const newHand = [...player.hand, drawnCard];
  updates[`players/${playerIndex}/hand`] = newHand;

  await update(gameRef, updates);
};

/**
 * Discard a Phase 10 card
 */
export const discardPhase10Card = async (
  gameId: string,
  playerId: string,
  card: Phase10Card
): Promise<void> => {
  const gameRef = ref(database, `games/${gameId}`);
  const gameSnapshot = await get(gameRef);
  const gameState: Phase10GameState = gameSnapshot.val();

  const playerIndex = gameState.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) {
    throw new Error('Player not found');
  }

  if (!gameState.hasDrawn) {
    throw new Error('Must draw before discarding');
  }

  const player = gameState.players[playerIndex];

  // Remove card from hand
  const newHand = player.hand.filter(c => c.id !== card.id);
  const newDiscardPile = [...gameState.discardPile, card];

  const updates: any = {
    [`players/${playerIndex}/hand`]: newHand,
    discardPile: newDiscardPile,
    hasDrawn: false,
    lastActionTime: Date.now(),
  };

  // Apply skip card effect
  if (card.value === 'skip') {
    const nextPlayerIndex = (playerIndex + 1) % gameState.players.length;
    const skippedNextIndex = (playerIndex + 2) % gameState.players.length;
    updates.currentPlayerIndex = skippedNextIndex;
    updates.currentTurn = gameState.players[skippedNextIndex].id;
    updates.lastAction = `${player.name} played Skip! ${gameState.players[nextPlayerIndex].name} is skipped`;
  } else {
    // Next player's turn
    const nextIndex = (playerIndex + 1) % gameState.players.length;
    updates.currentPlayerIndex = nextIndex;
    updates.currentTurn = gameState.players[nextIndex].id;
    updates.lastAction = `${player.name} discarded. ${gameState.players[nextIndex].name}'s turn`;
  }

  // Check if player went out (empty hand)
  if (newHand.length === 0) {
    updates.gameStatus = 'round_end';
    updates.lastAction = `${player.name} went out! Round ${gameState.roundNumber} over`;

    // Calculate scores for remaining cards
    gameState.players.forEach((p, i) => {
      if (i !== playerIndex) {
        const handScore = calculatePhase10Score(p.hand);
        updates[`players/${i}/score`] = p.score + handScore;
      }
    });

    // Check if anyone completed Phase 10
    let gameWinner: string | null = null;
    gameState.players.forEach((p, i) => {
      if (p.completedPhase && p.currentPhase === 10) {
        updates[`players/${i}/currentPhase`] = 11;
        gameWinner = p.id;
      } else if (p.completedPhase) {
        updates[`players/${i}/currentPhase`] = p.currentPhase + 1;
      }
      // Reset for next round
      updates[`players/${i}/completedPhase`] = false;
      updates[`players/${i}/laidDownCards`] = [];
    });

    if (gameWinner) {
      updates.gameStatus = 'finished';
      updates.winner = gameWinner;
      const winnerIndex = gameState.players.findIndex(p => p.id === gameWinner);
      updates.lastAction = `${gameState.players[winnerIndex].name} wins! Completed all 10 phases!`;
    }
  }

  await update(gameRef, updates);
};

/**
 * Lay down a phase
 */
export const layDownPhase = async (
  gameId: string,
  playerId: string,
  laidDownCards: Phase10Card[][]
): Promise<void> => {
  const gameRef = ref(database, `games/${gameId}`);
  const gameSnapshot = await get(gameRef);
  const gameState: Phase10GameState = gameSnapshot.val();

  const playerIndex = gameState.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) {
    throw new Error('Player not found');
  }

  const player = gameState.players[playerIndex];

  if (player.completedPhase) {
    throw new Error('Already completed phase this round');
  }

  // Get current phase requirements
  const currentPhase = getCurrentPhase(player.currentPhase);

  // Validate phase completion
  if (!validatePhaseCompletion(currentPhase, laidDownCards)) {
    throw new Error(`Cards do not meet Phase ${player.currentPhase} requirements`);
  }

  // Remove laid down cards from hand
  const laidCardIds = laidDownCards.flat().map(c => c.id);
  const newHand = player.hand.filter(c => !laidCardIds.includes(c.id));

  const updates: any = {
    [`players/${playerIndex}/hand`]: newHand,
    [`players/${playerIndex}/laidDownCards`]: laidDownCards,
    [`players/${playerIndex}/completedPhase`]: true,
    lastAction: `${player.name} completed Phase ${player.currentPhase}!`,
    lastActionTime: Date.now(),
  };

  await update(gameRef, updates);
};

/**
 * Hit on a phase (add cards to existing laid down cards)
 */
export const hitOnPhase = async (
  gameId: string,
  playerId: string,
  targetPlayerId: string,
  groupIndex: number,
  cards: Phase10Card[]
): Promise<void> => {
  const gameRef = ref(database, `games/${gameId}`);
  const gameSnapshot = await get(gameRef);
  const gameState: Phase10GameState = gameSnapshot.val();

  const playerIndex = gameState.players.findIndex(p => p.id === playerId);
  const targetIndex = gameState.players.findIndex(p => p.id === targetPlayerId);

  if (playerIndex === -1 || targetIndex === -1) {
    throw new Error('Player not found');
  }

  const player = gameState.players[playerIndex];
  const targetPlayer = gameState.players[targetIndex];

  if (!player.completedPhase) {
    throw new Error('Must complete your phase before hitting');
  }

  if (!targetPlayer.completedPhase) {
    throw new Error('Target player has not laid down yet');
  }

  if (groupIndex >= targetPlayer.laidDownCards.length) {
    throw new Error('Invalid group index');
  }

  const targetGroup = targetPlayer.laidDownCards[groupIndex];

  // Validate all cards can be played on the group
  for (const card of cards) {
    if (!canPlayOnPhase(card, targetGroup)) {
      throw new Error(`Card ${card.value} ${card.color} cannot be played on this group`);
    }
  }

  // Remove cards from player's hand
  const cardIds = cards.map(c => c.id);
  const newHand = player.hand.filter(c => !cardIds.includes(c.id));

  // Add cards to target group
  const newLaidDownCards = [...targetPlayer.laidDownCards];
  newLaidDownCards[groupIndex] = [...targetGroup, ...cards];

  const updates: any = {
    [`players/${playerIndex}/hand`]: newHand,
    [`players/${targetIndex}/laidDownCards`]: newLaidDownCards,
    lastAction: `${player.name} hit on ${targetPlayer.name}'s phase`,
    lastActionTime: Date.now(),
  };

  await update(gameRef, updates);
};

/**
 * Start a new round after round_end
 */
export const startNewPhase10Round = async (gameId: string): Promise<void> => {
  const gameRef = ref(database, `games/${gameId}`);
  const gameSnapshot = await get(gameRef);
  const gameState: Phase10GameState = gameSnapshot.val();

  if (gameState.gameStatus !== 'round_end') {
    throw new Error('Can only start new round after round ends');
  }

  // Create and shuffle new deck
  const deck = shufflePhase10Deck(createPhase10Deck());

  // Deal new hands
  const updates: any = {
    roundNumber: gameState.roundNumber + 1,
    gameStatus: 'playing',
    hasDrawn: false,
    currentPlayerIndex: 0,
    currentTurn: gameState.players[0].id,
    lastAction: `Round ${gameState.roundNumber + 1} started!`,
    lastActionTime: Date.now(),
  };

  // Deal cards to each player
  gameState.players.forEach((player, i) => {
    const hand = deck.slice(i * CARDS_PER_PLAYER, (i + 1) * CARDS_PER_PLAYER);
    updates[`players/${i}/hand`] = hand;
    updates[`players/${i}/laidDownCards`] = [];
    updates[`players/${i}/completedPhase`] = false;
  });

  // Set up draw and discard piles
  const startIndex = gameState.players.length * CARDS_PER_PLAYER;
  updates.drawPile = deck.slice(startIndex + 1);
  updates.discardPile = [deck[startIndex]];

  await update(gameRef, updates);
};

/**
 * Update Phase 10 game state
 */
export const updatePhase10GameState = async (
  gameId: string,
  updates: Partial<Phase10GameState>
): Promise<void> => {
  const gameRef = ref(database, `games/${gameId}`);
  await update(gameRef, {
    ...updates,
    lastActionTime: Date.now(),
  });
};

/**
 * Get available Phase 10 game rooms
 */
export const getAvailablePhase10Rooms = async (): Promise<Phase10GameRoom[]> => {
  const roomsRef = ref(database, 'rooms');
  const snapshot = await get(roomsRef);

  if (!snapshot.exists()) {
    return [];
  }

  const rooms: Phase10GameRoom[] = [];
  snapshot.forEach((childSnapshot) => {
    const room = childSnapshot.val();
    if (room.maxPlayers && room.playerCount < room.maxPlayers) {
      rooms.push(room);
    }
  });

  return rooms.sort((a, b) => b.createdAt - a.createdAt);
};

/**
 * Delete a Phase 10 game
 */
export const deletePhase10Game = async (gameId: string): Promise<void> => {
  await remove(ref(database, `games/${gameId}`));
  await remove(ref(database, `rooms/${gameId}`));
};
