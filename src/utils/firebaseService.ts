import { database } from '../config/firebase';
import { ref, push, set, onValue, off, update, remove, get, Database } from 'firebase/database';
import { GameState, GameRoom, Player, Card } from '../types/game';
import { createDeck, shuffleDeck, splitDeck } from './cardUtils';
import { sendPushNotification } from './notificationService';

const ensureDatabase = (): Database => {
  if (!database) {
    throw new Error('Firebase is not configured.');
  }
  return database;
};

export const createGameRoom = async (
  playerId: string,
  playerName: string,
  sixSevenRuleEnabled: boolean,
  pushToken?: string
): Promise<string> => {
  const db = ensureDatabase();
  const roomsRef = ref(db, 'rooms');
  const newRoomRef = push(roomsRef);
  const roomId = newRoomRef.key!;

  const deck = shuffleDeck(createDeck());
  const [player1Deck, player2Deck] = splitDeck(deck);

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
    pendingPlayer2Deck: player2Deck,
  };

  await set(ref(db, `rooms/${roomId}`), gameRoom);
  await set(ref(db, `games/${roomId}`), initialGameState);

  return roomId;
};

type JoinGameResult =
  | { success: true; gameState: GameState }
  | { success: false; reason: 'not_found' | 'full' | 'invalid_status' };

export const joinGameRoom = async (
  roomId: string,
  playerId: string,
  playerName: string,
  pushToken?: string
): Promise<JoinGameResult> => {
  const db = ensureDatabase();
  const gameRef = ref(db, `games/${roomId}`);
  const gameSnapshot = await get(gameRef);

  if (!gameSnapshot.exists()) {
    return { success: false, reason: 'not_found' };
  }

  const gameState: GameState = gameSnapshot.val();

  if (gameState.player2 !== null || gameState.gameStatus !== 'waiting') {
    return { success: false, reason: gameState.player2 !== null ? 'full' : 'invalid_status' };
  }

  const [, fallbackPlayer2Deck] = splitDeck(shuffleDeck(createDeck()));
  const player2Deck = gameState.pendingPlayer2Deck?.length
    ? gameState.pendingPlayer2Deck
    : fallbackPlayer2Deck;

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
    pendingPlayer2Deck: null,
  });

  await update(ref(db, `rooms/${roomId}`), {
    playerCount: 2,
  });

  if (gameState.player1.pushToken) {
    await sendPushNotification(
      gameState.player1.pushToken,
      'A player joined your game',
      `${playerName} is ready to battle in WAR!`,
      { roomId }
    );
  }

  const updatedSnapshot = await get(gameRef);
  const updatedGameState: GameState = updatedSnapshot.val();

  return { success: true, gameState: updatedGameState };
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
  updates: Partial<GameState> & Record<string, unknown>
): Promise<void> => {
  const db = ensureDatabase();
  const gameRef = ref(db, `games/${gameId}`);
  await update(gameRef, updates);
};

export const playCard = async (
  gameId: string,
  playerId: string,
  card: Card,
  newDeck: Card[]
): Promise<void> => {
  const db = ensureDatabase();
  const gameRef = ref(db, `games/${gameId}`);
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
  const db = ensureDatabase();
  const roomsRef = ref(db, 'rooms');
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
  const db = ensureDatabase();
  await remove(ref(db, `games/${gameId}`));
  await remove(ref(db, `rooms/${gameId}`));
};

export const getGameState = async (gameId: string): Promise<GameState | null> => {
  const db = ensureDatabase();
  const gameRef = ref(db, `games/${gameId}`);
  const snapshot = await get(gameRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.val();
};
