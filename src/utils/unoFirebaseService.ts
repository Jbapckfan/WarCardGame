import { database } from '../config/firebase';
import { ref, push, set, onValue, off, update, remove, get } from 'firebase/database';
import { UnoGameState, UnoPlayer, UnoGameRoom, UnoCard, UnoColor } from '../types/uno';
import { createUnoDeck, shuffleUnoDeck, canPlayCard } from './unoLogic';
import { getCurrentUserId } from './authService';

/**
 * NOTE: All playerId parameters should be Firebase Auth UIDs
 */

const CARDS_PER_PLAYER = 7;

/**
 * Create a new UNO game room
 */
export const createUNOGameRoom = async (
  playerId: string,
  playerName: string,
  maxPlayers: number = 2,
  pushToken?: string
): Promise<string> => {
  const roomsRef = ref(database, 'rooms');
  const newRoomRef = push(roomsRef);
  const roomId = newRoomRef.key!;

  const deck = shuffleUnoDeck(createUnoDeck());

  // Deal cards
  const player1Hand = deck.slice(0, CARDS_PER_PLAYER);
  const startIndex = maxPlayers * CARDS_PER_PLAYER;
  const drawPile = deck.slice(startIndex + 1); // +1 for first discard
  const firstDiscard = deck[startIndex];

  const gameRoom: UnoGameRoom = {
    id: roomId,
    createdBy: playerId,
    createdAt: Date.now(),
    playerCount: 1,
    maxPlayers,
  };

  const initialGameState: UnoGameState = {
    id: roomId,
    player1: {
      id: playerId,
      name: playerName,
      hand: player1Hand,
      pushToken,
    },
    player2: null,
    player3: maxPlayers >= 3 ? null : undefined,
    player4: maxPlayers >= 4 ? null : undefined,
    players: [],
    currentPlayerIndex: 0,
    currentTurn: playerId,
    gameStatus: 'waiting',
    direction: 1,
    discardPile: [firstDiscard],
    drawPile,
    currentColor: firstDiscard.color === 'wild' ? 'red' : firstDiscard.color,
    lastAction: 'Waiting for players...',
    lastActionTime: Date.now(),
    winner: null,
    mustDraw: 0,
    saidUno: {},
    pendingWildColor: false,
    maxPlayers,
  };

  await set(ref(database, `rooms/${roomId}`), gameRoom);
  await set(ref(database, `games/${roomId}`), initialGameState);

  return roomId;
};

/**
 * Join an existing UNO game room
 */
export const joinUNOGameRoom = async (
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

  const gameState: UnoGameState = gameSnapshot.val();
  const room: UnoGameRoom = roomSnapshot.val();

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
      pushToken,
    },
    playerCount: newPlayerCount,
    drawPile: newDrawPile,
    lastAction: `${playerName} joined the game`,
    lastActionTime: Date.now(),
  };

  // Build players array
  const players: UnoPlayer[] = [gameState.player1];
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
    updates.lastAction = `Game started! ${players[0].name}'s turn`;
  }

  await update(gameRef, updates);
  await update(roomRef, { playerCount: newPlayerCount });

  return true;
};

/**
 * Listen to UNO game state changes
 */
export const listenToUNOGameState = (
  gameId: string,
  callback: (gameState: UnoGameState | null) => void
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
 * Update UNO game state
 */
export const updateUNOGameState = async (
  gameId: string,
  updates: Partial<UnoGameState>
): Promise<void> => {
  const gameRef = ref(database, `games/${gameId}`);
  await update(gameRef, {
    ...updates,
    lastActionTime: Date.now(),
  });
};

/**
 * Play a UNO card
 */
export const playUNOCard = async (
  gameId: string,
  playerId: string,
  card: UnoCard,
  chosenColor?: UnoColor
): Promise<void> => {
  const gameRef = ref(database, `games/${gameId}`);
  const gameSnapshot = await get(gameRef);
  const gameState: UnoGameState = gameSnapshot.val();

  const playerIndex = gameState.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) {
    throw new Error('Player not found');
  }

  const player = gameState.players[playerIndex];
  const topCard = gameState.discardPile[gameState.discardPile.length - 1];

  // Validate card can be played
  if (!canPlayCard(card, topCard, gameState.currentColor)) {
    throw new Error('Cannot play this card');
  }

  // Remove card from player's hand
  const newHand = player.hand.filter(c => c.id !== card.id);
  const newDiscardPile = [...gameState.discardPile, card];

  const updates: any = {
    [`players/${playerIndex}/hand`]: newHand,
    discardPile: newDiscardPile,
    lastActionTime: Date.now(),
    pendingWildColor: false,
  };

  // Apply card effects
  let skipNextPlayer = false;
  let reverseDirection = false;
  let drawCards = 0;

  switch (card.value) {
    case 'skip':
      skipNextPlayer = true;
      updates.lastAction = `${player.name} played Skip!`;
      break;

    case 'reverse':
      reverseDirection = true;
      updates.direction = gameState.direction === 1 ? -1 : 1;
      updates.lastAction = `${player.name} played Reverse!`;
      // In 2-player, reverse acts like skip
      if (gameState.players.length === 2) {
        skipNextPlayer = true;
      }
      break;

    case 'draw2':
      drawCards = 2;
      updates.mustDraw = (gameState.mustDraw || 0) + 2;
      updates.lastAction = `${player.name} played Draw 2! Next player must draw`;
      break;

    case 'wild':
      if (!chosenColor) {
        throw new Error('Must choose a color for wild card');
      }
      updates.currentColor = chosenColor;
      updates.lastAction = `${player.name} played Wild and chose ${chosenColor}`;
      break;

    case 'wild4':
      if (!chosenColor) {
        throw new Error('Must choose a color for wild draw 4');
      }
      drawCards = 4;
      updates.currentColor = chosenColor;
      updates.mustDraw = (gameState.mustDraw || 0) + 4;
      updates.lastAction = `${player.name} played Wild Draw 4 and chose ${chosenColor}`;
      break;

    default:
      // Number card
      updates.currentColor = card.color;
      updates.lastAction = `${player.name} played ${card.color} ${card.value}`;
  }

  // Check for UNO (1 card left)
  if (newHand.length === 1 && !gameState.saidUno[playerId]) {
    updates.lastAction += ` - Forgot to say UNO!`;
  }

  // Check for win
  if (newHand.length === 0) {
    updates.gameStatus = 'finished';
    updates.winner = playerId;
    updates.lastAction = `${player.name} wins!`;
  } else {
    // Determine next player
    let nextIndex = playerIndex;
    if (skipNextPlayer) {
      // Skip one player (or current in 2-player reverse/skip)
      nextIndex = (playerIndex + (gameState.direction === 1 ? 2 : -2) + gameState.players.length) % gameState.players.length;
    } else if (reverseDirection && gameState.players.length > 2) {
      // Normal next in new direction
      nextIndex = (playerIndex + updates.direction + gameState.players.length) % gameState.players.length;
    } else {
      // Normal next player
      nextIndex = (playerIndex + gameState.direction + gameState.players.length) % gameState.players.length;
    }

    updates.currentPlayerIndex = nextIndex;
    updates.currentTurn = gameState.players[nextIndex].id;
  }

  await update(gameRef, updates);
};

/**
 * Draw a UNO card
 */
export const drawUNOCard = async (
  gameId: string,
  playerId: string
): Promise<void> => {
  const gameRef = ref(database, `games/${gameId}`);
  const gameSnapshot = await get(gameRef);
  const gameState: UnoGameState = gameSnapshot.val();

  const playerIndex = gameState.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) {
    throw new Error('Player not found');
  }

  const player = gameState.players[playerIndex];

  if (gameState.drawPile.length === 0) {
    // Reshuffle discard pile (keep top card)
    const topCard = gameState.discardPile[gameState.discardPile.length - 1];
    const cardsToShuffle = gameState.discardPile.slice(0, -1);
    const shuffled = shuffleUnoDeck(cardsToShuffle);

    await update(gameRef, {
      drawPile: shuffled,
      discardPile: [topCard],
    });

    // Re-get game state
    const newSnapshot = await get(gameRef);
    const newGameState: UnoGameState = newSnapshot.val();

    if (newGameState.drawPile.length === 0) {
      throw new Error('No cards left to draw');
    }
  }

  const cardsToDraw = gameState.mustDraw > 0 ? gameState.mustDraw : 1;
  const drawnCards = gameState.drawPile.slice(0, cardsToDraw);
  const newDrawPile = gameState.drawPile.slice(cardsToDraw);
  const newHand = [...player.hand, ...drawnCards];

  const updates: any = {
    [`players/${playerIndex}/hand`]: newHand,
    drawPile: newDrawPile,
    mustDraw: 0,
    lastAction: `${player.name} drew ${cardsToDraw} card(s)`,
    lastActionTime: Date.now(),
  };

  // Next player's turn
  const nextIndex = (playerIndex + gameState.direction + gameState.players.length) % gameState.players.length;
  updates.currentPlayerIndex = nextIndex;
  updates.currentTurn = gameState.players[nextIndex].id;

  await update(gameRef, updates);
};

/**
 * Call UNO
 */
export const callUNO = async (
  gameId: string,
  playerId: string
): Promise<void> => {
  const gameRef = ref(database, `games/${gameId}`);
  const updates: any = {
    [`saidUno/${playerId}`]: true,
    lastActionTime: Date.now(),
  };
  await update(gameRef, updates);
};

/**
 * Challenge UNO (catch player who didn't say UNO)
 */
export const challengeUNO = async (
  gameId: string,
  challengerId: string,
  targetId: string
): Promise<void> => {
  const gameRef = ref(database, `games/${gameId}`);
  const gameSnapshot = await get(gameRef);
  const gameState: UnoGameState = gameSnapshot.val();

  const targetIndex = gameState.players.findIndex(p => p.id === targetId);
  if (targetIndex === -1) {
    throw new Error('Target player not found');
  }

  const target = gameState.players[targetIndex];

  // Check if target has 1 card and didn't say UNO
  if (target.hand.length === 1 && !gameState.saidUno[targetId]) {
    // Penalty: draw 2 cards
    if (gameState.drawPile.length >= 2) {
      const penaltyCards = gameState.drawPile.slice(0, 2);
      const newDrawPile = gameState.drawPile.slice(2);
      const newHand = [...target.hand, ...penaltyCards];

      await update(gameRef, {
        [`players/${targetIndex}/hand`]: newHand,
        drawPile: newDrawPile,
        lastAction: `${target.name} was caught! Drew 2 penalty cards`,
        lastActionTime: Date.now(),
      });
    }
  }
};

/**
 * Get available UNO game rooms
 */
export const getAvailableUNORooms = async (): Promise<UnoGameRoom[]> => {
  const roomsRef = ref(database, 'rooms');
  const snapshot = await get(roomsRef);

  if (!snapshot.exists()) {
    return [];
  }

  const rooms: UnoGameRoom[] = [];
  snapshot.forEach((childSnapshot) => {
    const room = childSnapshot.val();
    if (room.maxPlayers && room.playerCount < room.maxPlayers) {
      rooms.push(room);
    }
  });

  return rooms.sort((a, b) => b.createdAt - a.createdAt);
};

/**
 * Delete a UNO game
 */
export const deleteUNOGame = async (gameId: string): Promise<void> => {
  await remove(ref(database, `games/${gameId}`));
  await remove(ref(database, `rooms/${gameId}`));
};
