import { database } from '../config/firebase';
import { ref, push, set, onValue, off, update, remove, get } from 'firebase/database';
import { GameState, GameRoom, Player, Card } from '../types/game';
import { createDeck, shuffleDeck, splitDeck } from './cardUtils';
import { getCurrentUserId } from './authService';

/**
 * NOTE: All playerId parameters should be Firebase Auth UIDs
 * Use getCurrentUserId() from authService to get the authenticated user ID
 */

export const createGameRoom = async (
  playerId: string,
  playerName: string,
  sixSevenRuleEnabled: boolean,
  pushToken?: string
): Promise<string> => {
  const roomsRef = ref(database, 'rooms');
  const newRoomRef = push(roomsRef);
  const roomId = newRoomRef.key!;

  const deck = shuffleDeck(createDeck());
  const [player1Deck] = splitDeck(deck);

  const gameRoom: GameRoom = {
    id: roomId,
    createdBy: playerId,
    createdAt: Date.now(),
    playerCount: 1,
    sixSevenRuleEnabled,
  };

  const initialGameState: GameState = {
    id: roomId,
    player1: {
      id: playerId,
      name: playerName,
      deck: player1Deck,
      pushToken,
    },
    player2: null,
    currentTurn: playerId,
    gameStatus: 'waiting',
    sixSevenRuleEnabled,
    warState: null,
    lastAction: 'Game created',
    lastActionTime: Date.now(),
    winner: null,
  };

  await set(ref(database, `rooms/${roomId}`), gameRoom);
  await set(ref(database, `games/${roomId}`), initialGameState);

  return roomId;
};

export const joinGameRoom = async (
  roomId: string,
  playerId: string,
  playerName: string,
  pushToken?: string
): Promise<boolean> => {
  const gameRef = ref(database, `games/${roomId}`);
  const gameSnapshot = await get(gameRef);

  if (!gameSnapshot.exists()) {
    return false;
  }

  const gameState: GameState = gameSnapshot.val();

  if (gameState.player2 !== null || gameState.gameStatus !== 'waiting') {
    return false;
  }

  const deck = shuffleDeck(createDeck());
  const [, player2Deck] = splitDeck(deck);

  await update(gameRef, {
    player2: {
      id: playerId,
      name: playerName,
      deck: player2Deck,
      pushToken,
    },
    gameStatus: 'playing',
    lastAction: `${playerName} joined the game`,
    lastActionTime: Date.now(),
  });

  await update(ref(database, `rooms/${roomId}`), {
    playerCount: 2,
  });

  return true;
};

export const listenToGameState = (
  gameId: string,
  callback: (gameState: GameState | null) => void
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

export const updateGameState = async (
  gameId: string,
  updates: Partial<GameState>
): Promise<void> => {
  const gameRef = ref(database, `games/${gameId}`);
  await update(gameRef, updates);
};

export const playCard = async (
  gameId: string,
  playerId: string,
  card: Card,
  newDeck: Card[]
): Promise<void> => {
  const gameRef = ref(database, `games/${gameId}`);
  const gameSnapshot = await get(gameRef);
  const gameState: GameState = gameSnapshot.val();

  const isPlayer1 = gameState.player1.id === playerId;
  const playerKey = isPlayer1 ? 'player1' : 'player2';

  await update(gameRef, {
    [`${playerKey}.deck`]: newDeck,
    currentTurn: isPlayer1 ? gameState.player2!.id : gameState.player1.id,
    lastAction: `${isPlayer1 ? gameState.player1.name : gameState.player2!.name} played ${card.rank}`,
    lastActionTime: Date.now(),
  });
};

export const getAvailableRooms = async (): Promise<GameRoom[]> => {
  const roomsRef = ref(database, 'rooms');
  const snapshot = await get(roomsRef);

  if (!snapshot.exists()) {
    return [];
  }

  const rooms: GameRoom[] = [];
  snapshot.forEach((childSnapshot) => {
    const room = childSnapshot.val();
    if (room.playerCount < 2) {
      rooms.push(room);
    }
  });

  return rooms.sort((a, b) => b.createdAt - a.createdAt);
};

export const deleteGame = async (gameId: string): Promise<void> => {
  await remove(ref(database, `games/${gameId}`));
  await remove(ref(database, `rooms/${gameId}`));
};
