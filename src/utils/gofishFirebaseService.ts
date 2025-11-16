import { database } from '../config/firebase';
import { ref, push, set, onValue, off, update, remove, get } from 'firebase/database';
import { GoFishGameState, GoFishPlayer, GoFishGameRoom } from '../types/goFish';
import { Card, Rank } from '../types/game';
import { createDeck, shuffleDeck } from './cardUtils';
import { getCurrentUserId } from './authService';

/**
 * NOTE: All playerId parameters should be Firebase Auth UIDs
 */

const CARDS_PER_PLAYER: Record<number, number> = {
  2: 7,
  3: 7,
  4: 5,
};

/**
 * Create a new Go Fish game room
 */
export const createGoFishGameRoom = async (
  playerId: string,
  playerName: string,
  maxPlayers: number = 2,
  pushToken?: string
): Promise<string> => {
  const roomsRef = ref(database, 'rooms');
  const newRoomRef = push(roomsRef);
  const roomId = newRoomRef.key!;

  const deck = shuffleDeck(createDeck());
  const cardsPerPlayer = CARDS_PER_PLAYER[maxPlayers] || 7;

  const player1Deck = deck.slice(0, cardsPerPlayer);
  const remainingDeck = deck.slice(maxPlayers * cardsPerPlayer);

  const gameRoom: GoFishGameRoom = {
    id: roomId,
    createdBy: playerId,
    createdAt: Date.now(),
    playerCount: 1,
    maxPlayers,
  };

  const initialGameState: GoFishGameState = {
    id: roomId,
    player1: {
      id: playerId,
      name: playerName,
      deck: player1Deck,
      books: [],
      pushToken,
    },
    player2: null,
    player3: maxPlayers >= 3 ? null : undefined,
    player4: maxPlayers >= 4 ? null : undefined,
    players: [],
    drawPile: remainingDeck,
    currentTurn: 0,
    gameStatus: 'waiting',
    lastAction: 'Waiting for players...',
    lastActionTime: Date.now(),
    winner: null,
    playerCount: 1,
    maxPlayers,
    askingPlayer: null,
    targetPlayer: null,
    requestedRank: null,
  };

  await set(ref(database, `rooms/${roomId}`), gameRoom);
  await set(ref(database, `games/${roomId}`), initialGameState);

  return roomId;
};

/**
 * Join an existing Go Fish game room
 */
export const joinGoFishGameRoom = async (
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

  const gameState: GoFishGameState = gameSnapshot.val();
  const room: GoFishGameRoom = roomSnapshot.val();

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
  const cardsPerPlayer = CARDS_PER_PLAYER[room.maxPlayers] || 7;
  const playerDeck = gameState.drawPile.slice(0, cardsPerPlayer);
  const newDrawPile = gameState.drawPile.slice(cardsPerPlayer);

  const newPlayerCount = room.playerCount + 1;
  const updates: any = {
    [playerSlot]: {
      id: playerId,
      name: playerName,
      deck: playerDeck,
      books: [],
      pushToken,
    },
    playerCount: newPlayerCount,
    drawPile: newDrawPile,
    lastAction: `${playerName} joined the game`,
    lastActionTime: Date.now(),
  };

  // Build players array
  const players: GoFishPlayer[] = [gameState.player1];
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
    updates.lastAction = 'Game started! Ask another player for cards.';
  }

  await update(gameRef, updates);
  await update(roomRef, { playerCount: newPlayerCount });

  return true;
};

/**
 * Listen to Go Fish game state changes
 */
export const listenToGoFishGameState = (
  gameId: string,
  callback: (gameState: GoFishGameState | null) => void
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
 * Update Go Fish game state
 */
export const updateGoFishGameState = async (
  gameId: string,
  updates: Partial<GoFishGameState>
): Promise<void> => {
  const gameRef = ref(database, `games/${gameId}`);
  await update(gameRef, {
    ...updates,
    lastActionTime: Date.now(),
  });
};

/**
 * Ask another player for cards
 */
export const askForCards = async (
  gameId: string,
  askingPlayerId: string,
  targetPlayerId: string,
  rank: Rank
): Promise<void> => {
  const gameRef = ref(database, `games/${gameId}`);
  const gameSnapshot = await get(gameRef);
  const gameState: GoFishGameState = gameSnapshot.val();

  const askingPlayer = gameState.players.find(p => p.id === askingPlayerId);
  const targetPlayer = gameState.players.find(p => p.id === targetPlayerId);

  if (!askingPlayer || !targetPlayer) {
    throw new Error('Player not found');
  }

  // Find matching cards
  const matchingCards = targetPlayer.deck.filter(c => c.rank === rank);

  const updates: any = {
    lastActionTime: Date.now(),
  };

  if (matchingCards.length > 0) {
    // Success - give cards to asking player
    const newTargetDeck = targetPlayer.deck.filter(c => c.rank !== rank);
    const newAskingDeck = [...askingPlayer.deck, ...matchingCards];

    // Update decks in gameState
    gameState.players.forEach((p, index) => {
      if (p.id === askingPlayerId) {
        updates[`players/${index}/deck`] = newAskingDeck;
      } else if (p.id === targetPlayerId) {
        updates[`players/${index}/deck`] = newTargetDeck;
      }
    });

    // Check for book formation (4 of a kind)
    const rankCounts: Record<number, number> = {};
    newAskingDeck.forEach(card => {
      rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
    });

    let formedBook = false;
    Object.entries(rankCounts).forEach(([r, count]) => {
      if (count === 4 && !askingPlayer.books.includes(r)) {
        askingPlayer.books.push(r);
        formedBook = true;
        // Remove the 4 cards from deck
        const rankNum = parseInt(r);
        const newDeck = newAskingDeck.filter(c => c.rank !== rankNum);
        gameState.players.forEach((p, index) => {
          if (p.id === askingPlayerId) {
            updates[`players/${index}/deck`] = newDeck;
            updates[`players/${index}/books`] = askingPlayer.books;
          }
        });
      }
    });

    updates.lastAction = `${askingPlayer.name} got ${matchingCards.length} card(s) from ${targetPlayer.name}${formedBook ? ' and formed a book!' : ''}`;
    // Asking player goes again
    updates.currentTurn = gameState.currentTurn;
  } else {
    // Go Fish - draw a card
    if (gameState.drawPile.length > 0) {
      const drawnCard = gameState.drawPile[0];
      const newDrawPile = gameState.drawPile.slice(1);
      const newAskingDeck = [...askingPlayer.deck, drawnCard];

      gameState.players.forEach((p, index) => {
        if (p.id === askingPlayerId) {
          updates[`players/${index}/deck`] = newAskingDeck;
        }
      });

      updates.drawPile = newDrawPile;
      updates.lastAction = `Go Fish! ${askingPlayer.name} drew a card`;
    } else {
      updates.lastAction = `Go Fish! No cards left to draw`;
    }

    // Next player's turn
    updates.currentTurn = (gameState.currentTurn + 1) % gameState.players.length;
  }

  await update(gameRef, updates);
};

/**
 * Get available Go Fish game rooms
 */
export const getAvailableGoFishRooms = async (): Promise<GoFishGameRoom[]> => {
  const roomsRef = ref(database, 'rooms');
  const snapshot = await get(roomsRef);

  if (!snapshot.exists()) {
    return [];
  }

  const rooms: GoFishGameRoom[] = [];
  snapshot.forEach((childSnapshot) => {
    const room = childSnapshot.val();
    // Check if it's a Go Fish room (has maxPlayers field)
    if (room.maxPlayers && room.playerCount < room.maxPlayers) {
      rooms.push(room);
    }
  });

  return rooms.sort((a, b) => b.createdAt - a.createdAt);
};

/**
 * Delete a Go Fish game
 */
export const deleteGoFishGame = async (gameId: string): Promise<void> => {
  await remove(ref(database, `games/${gameId}`));
  await remove(ref(database, `rooms/${gameId}`));
};
