import { database } from '../config/firebase';
import { ref, push, set, onValue, off, update, remove, get } from 'firebase/database';
import { ERSGameState } from '../types/ers';
import { Player, Card } from '../types/game';
import { createDeck, shuffleDeck, splitDeckMultiple } from './cardUtils';
import { getCurrentUserId } from './authService';

/**
 * NOTE: All playerId parameters should be Firebase Auth UIDs
 * Use getCurrentUserId() from authService to get the authenticated user ID
 */

export interface ERSGameRoom {
  id: string;
  createdBy: string;
  createdAt: number;
  playerCount: number; // Current count
  maxPlayers: number; // 2, 3, or 4
}

/**
 * Create a new ERS game room
 */
export const createERSGameRoom = async (
  playerId: string,
  playerName: string,
  maxPlayers: number = 2,
  pushToken?: string
): Promise<string> => {
  const roomsRef = ref(database, 'rooms');
  const newRoomRef = push(roomsRef);
  const roomId = newRoomRef.key!;

  const deck = shuffleDeck(createDeck());
  const playerDecks = splitDeckMultiple(deck, maxPlayers);

  const gameRoom: ERSGameRoom = {
    id: roomId,
    createdBy: playerId,
    createdAt: Date.now(),
    playerCount: 1,
    maxPlayers,
  };

  const initialGameState: ERSGameState = {
    id: roomId,
    player1: {
      id: playerId,
      name: playerName,
      deck: playerDecks[0],
      pushToken,
    },
    player2: null,
    player3: maxPlayers >= 3 ? null : undefined,
    player4: maxPlayers >= 4 ? null : undefined,
    playerCount: 1,
    pile: [],
    currentTurn: playerId,
    gameStatus: 'waiting',
    lastAction: 'Waiting for players...',
    lastActionTime: Date.now(),
    winner: null,
    faceCardChallenge: null,
    canSlap: false,
    lastSlap: null,
  };

  await set(ref(database, `rooms/${roomId}`), gameRoom);
  await set(ref(database, `games/${roomId}`), initialGameState);

  return roomId;
};

/**
 * Join an existing ERS game room
 */
export const joinERSGameRoom = async (
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

  const gameState: ERSGameState = gameSnapshot.val();
  const room: ERSGameRoom = roomSnapshot.val();

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

  // Re-shuffle and split deck to include new player
  const deck = shuffleDeck(createDeck());
  const playerDecks = splitDeckMultiple(deck, room.maxPlayers);

  const newPlayerCount = room.playerCount + 1;
  const updates: any = {
    [playerSlot]: {
      id: playerId,
      name: playerName,
      deck: playerDecks[newPlayerCount - 1],
      pushToken,
    },
    playerCount: newPlayerCount,
    lastAction: `${playerName} joined the game`,
    lastActionTime: Date.now(),
  };

  // Start game if all players have joined
  if (newPlayerCount === room.maxPlayers) {
    updates.gameStatus = 'playing';
    updates.lastAction = 'Game started!';
  }

  await update(gameRef, updates);
  await update(roomRef, { playerCount: newPlayerCount });

  return true;
};

/**
 * Listen to ERS game state changes
 */
export const listenToERSGameState = (
  gameId: string,
  callback: (gameState: ERSGameState | null) => void
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
 * Update ERS game state
 */
export const updateERSGameState = async (
  gameId: string,
  updates: Partial<ERSGameState>
): Promise<void> => {
  const gameRef = ref(database, `games/${gameId}`);
  await update(gameRef, {
    ...updates,
    lastActionTime: Date.now(),
  });
};

/**
 * Play a card in ERS
 */
export const playERSCard = async (
  gameId: string,
  playerId: string,
  card: Card,
  newDeck: Card[],
  newPile: Card[]
): Promise<void> => {
  const gameRef = ref(database, `games/${gameId}`);
  const gameSnapshot = await get(gameRef);
  const gameState: ERSGameState = gameSnapshot.val();

  // Determine which player is playing
  let playerKey: string;
  let playerName: string;
  if (gameState.player1.id === playerId) {
    playerKey = 'player1';
    playerName = gameState.player1.name;
  } else if (gameState.player2?.id === playerId) {
    playerKey = 'player2';
    playerName = gameState.player2.name;
  } else if (gameState.player3?.id === playerId) {
    playerKey = 'player3';
    playerName = gameState.player3.name;
  } else if (gameState.player4?.id === playerId) {
    playerKey = 'player4';
    playerName = gameState.player4.name;
  } else {
    throw new Error('Player not found in game');
  }

  // Determine next player turn (round-robin)
  const activePlayers = [
    gameState.player1,
    gameState.player2,
    gameState.player3,
    gameState.player4,
  ].filter(p => p !== null && p !== undefined);

  const currentIndex = activePlayers.findIndex(p => p!.id === playerId);
  const nextIndex = (currentIndex + 1) % activePlayers.length;
  const nextPlayer = activePlayers[nextIndex]!;

  await update(gameRef, {
    [`${playerKey}.deck`]: newDeck,
    pile: newPile,
    currentTurn: nextPlayer.id,
    lastAction: `${playerName} played a card`,
    lastActionTime: Date.now(),
  });
};

/**
 * Handle a slap attempt
 */
export const handleERSSlap = async (
  gameId: string,
  playerId: string,
  successful: boolean,
  wonPile: Card[] | null
): Promise<void> => {
  const gameRef = ref(database, `games/${gameId}`);
  const gameSnapshot = await get(gameRef);
  const gameState: ERSGameState = gameSnapshot.val();

  // Determine which player slapped
  let playerKey: string;
  let playerName: string;
  let currentDeck: Card[];

  if (gameState.player1.id === playerId) {
    playerKey = 'player1';
    playerName = gameState.player1.name;
    currentDeck = gameState.player1.deck;
  } else if (gameState.player2?.id === playerId) {
    playerKey = 'player2';
    playerName = gameState.player2.name;
    currentDeck = gameState.player2.deck;
  } else if (gameState.player3?.id === playerId) {
    playerKey = 'player3';
    playerName = gameState.player3.name;
    currentDeck = gameState.player3.deck;
  } else if (gameState.player4?.id === playerId) {
    playerKey = 'player4';
    playerName = gameState.player4.name;
    currentDeck = gameState.player4.deck;
  } else {
    throw new Error('Player not found in game');
  }

  const updates: any = {
    lastSlap: {
      playerId,
      timestamp: Date.now(),
      successful,
    },
    lastActionTime: Date.now(),
  };

  if (successful && wonPile) {
    // Player wins the pile
    updates[`${playerKey}.deck`] = [...currentDeck, ...wonPile];
    updates.pile = [];
    updates.lastAction = `${playerName} won the pile!`;
    updates.canSlap = false;
  } else {
    // Failed slap - penalty
    const penaltyCard = currentDeck[0];
    if (penaltyCard) {
      updates[`${playerKey}.deck`] = currentDeck.slice(1);
      updates.pile = [...gameState.pile, penaltyCard];
      updates.lastAction = `${playerName} slapped incorrectly - penalty!`;
    } else {
      updates.lastAction = `${playerName} tried to slap but has no cards`;
    }
  }

  await update(gameRef, updates);
};

/**
 * Get available ERS game rooms
 */
export const getAvailableERSRooms = async (): Promise<ERSGameRoom[]> => {
  const roomsRef = ref(database, 'rooms');
  const snapshot = await get(roomsRef);

  if (!snapshot.exists()) {
    return [];
  }

  const rooms: ERSGameRoom[] = [];
  snapshot.forEach((childSnapshot) => {
    const room = childSnapshot.val();
    // Only show ERS rooms (check if maxPlayers exists, which War doesn't have)
    if (room.maxPlayers && room.playerCount < room.maxPlayers) {
      rooms.push(room);
    }
  });

  return rooms.sort((a, b) => b.createdAt - a.createdAt);
};

/**
 * Delete an ERS game
 */
export const deleteERSGame = async (gameId: string): Promise<void> => {
  await remove(ref(database, `games/${gameId}`));
  await remove(ref(database, `rooms/${gameId}`));
};
