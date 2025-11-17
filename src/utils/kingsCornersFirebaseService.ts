import { database } from '../config/firebase';
import { ref, push, set, onValue, off, update, remove, get } from 'firebase/database';
import { KingsGameState, KingsPlayer, KingsGameRoom, KingsCard } from '../types/kingsCorners';
import {
  createKingsDeck,
  shuffleKingsDeck,
  dealKingsGame,
  canPlaceCard,
  canMovePile,
  isKing
} from './kingsCornersLogic';
import { getCurrentUserId } from './authService';

/**
 * NOTE: All playerId parameters should be Firebase Auth UIDs
 */

/**
 * Create a new Kings in Corners game room
 */
export const createKingsCornersGameRoom = async (
  playerId: string,
  playerName: string,
  maxPlayers: number = 2,
  pushToken?: string
): Promise<string> => {
  const roomsRef = ref(database, 'rooms');
  const newRoomRef = push(roomsRef);
  const roomId = newRoomRef.key!;

  const deck = createKingsDeck();
  const { hands, sideN, sideE, sideS, sideW, remaining } = dealKingsGame(deck, maxPlayers);

  const gameRoom: KingsGameRoom = {
    id: roomId,
    createdBy: playerId,
    createdAt: Date.now(),
    playerCount: 1,
    maxPlayers,
  };

  const initialGameState: Partial<KingsGameState> = {
    id: roomId,
    player1: {
      id: playerId,
      name: playerName,
      deck: hands[0],
      pushToken,
    },
    player2: null,
    player3: maxPlayers >= 3 ? null : undefined,
    player4: maxPlayers >= 4 ? null : undefined,
    players: [],
    drawPile: remaining,
    cornerPiles: [[], [], [], []], // NW, NE, SW, SE (all start empty)
    sidePiles: [sideN, sideE, sideS, sideW], // N, E, S, W
    currentPlayerIndex: 0,
    playerCount: 1,
    maxPlayers,
    gameStatus: 'waiting',
    winner: null,
    lastAction: 'Waiting for players...',
    lastActionTime: Date.now(),
    hasDrawn: false,
  };

  await set(ref(database, `rooms/${roomId}`), gameRoom);
  await set(ref(database, `games/${roomId}`), initialGameState);

  return roomId;
};

/**
 * Join an existing Kings in Corners game room
 */
export const joinKingsCornersGameRoom = async (
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
  const room: KingsGameRoom = roomSnapshot.val();

  if (gameState.gameStatus !== 'waiting' || room.playerCount >= room.maxPlayers) {
    return false;
  }

  // Re-deal with correct number of players
  const deck = createKingsDeck();
  const newPlayerCount = room.playerCount + 1;
  const { hands, sideN, sideE, sideS, sideW, remaining } = dealKingsGame(deck, newPlayerCount);

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

  const updates: any = {
    [playerSlot]: {
      id: playerId,
      name: playerName,
      deck: hands[newPlayerCount - 1],
      pushToken,
    },
    playerCount: newPlayerCount,
    lastAction: `${playerName} joined the game`,
    lastActionTime: Date.now(),
  };

  // Re-deal hands for all players
  updates.player1 = { ...gameState.player1, deck: hands[0] };
  if (gameState.player2 || playerSlot === 'player2') {
    updates.player2 = { ...(gameState.player2 || updates.player2), deck: hands[1] };
  }
  if (gameState.player3 || playerSlot === 'player3') {
    updates.player3 = { ...(gameState.player3 || updates.player3), deck: hands[2] };
  }

  // Update piles and draw pile
  updates.sidePiles = [sideN, sideE, sideS, sideW];
  updates.drawPile = remaining;

  // Build players array
  const players: KingsPlayer[] = [updates.player1];
  if (updates.player2) players.push(updates.player2);
  if (updates.player3) players.push(updates.player3);
  if (updates.player4) players.push(updates.player4);

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
 * Listen to Kings in Corners game state changes
 */
export const listenToKingsCornersGameState = (
  gameId: string,
  callback: (gameState: KingsGameState | null) => void
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
 * Play a card to a pile
 */
export const playCardToPile = async (
  gameId: string,
  playerId: string,
  card: KingsCard,
  pileType: 'corner' | 'side',
  pileIndex: 0 | 1 | 2 | 3
): Promise<void> => {
  const gameRef = ref(database, `games/${gameId}`);
  const gameSnapshot = await get(gameRef);
  const gameState: KingsGameState = gameSnapshot.val();

  const playerIndex = gameState.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) {
    throw new Error('Player not found');
  }

  const player = gameState.players[playerIndex];
  const targetPile = pileType === 'corner'
    ? gameState.cornerPiles[pileIndex]
    : gameState.sidePiles[pileIndex];

  // Validate card can be played
  if (pileType === 'corner') {
    // Corner piles: must be King to start empty pile
    if (targetPile.length === 0) {
      if (!isKing(card)) {
        throw new Error('Only Kings can start corner piles');
      }
    } else {
      if (!canPlaceCard(card, targetPile[targetPile.length - 1])) {
        throw new Error('Card cannot be placed on this pile');
      }
    }
  } else {
    // Side piles: cannot start with King
    if (targetPile.length === 0) {
      if (isKing(card)) {
        throw new Error('Kings cannot start side piles');
      }
    } else {
      if (!canPlaceCard(card, targetPile[targetPile.length - 1])) {
        throw new Error('Card cannot be placed on this pile');
      }
    }
  }

  // Remove card from player's hand
  const newHand = player.deck.filter(c => c.id !== card.id);
  const newPile = [...targetPile, card];

  const updates: any = {
    [`players/${playerIndex}/deck`]: newHand,
    lastActionTime: Date.now(),
  };

  if (pileType === 'corner') {
    const newCornerPiles = [...gameState.cornerPiles];
    newCornerPiles[pileIndex] = newPile;
    updates.cornerPiles = newCornerPiles;
    updates.lastAction = `${player.name} played ${card.value} to corner ${pileIndex + 1}`;
  } else {
    const newSidePiles = [...gameState.sidePiles];
    newSidePiles[pileIndex] = newPile;
    updates.sidePiles = newSidePiles;
    const pileNames = ['North', 'East', 'South', 'West'];
    updates.lastAction = `${player.name} played ${card.value} to ${pileNames[pileIndex]}`;
  }

  // Check for win
  if (newHand.length === 0) {
    updates.gameStatus = 'finished';
    updates.winner = playerIndex;
    updates.lastAction = `${player.name} wins!`;
  }

  await update(gameRef, updates);
};

/**
 * Move a King from side pile to empty corner
 */
export const moveKingToCorner = async (
  gameId: string,
  playerId: string,
  sidePileIndex: 0 | 1 | 2 | 3,
  cornerPileIndex: 0 | 1 | 2 | 3
): Promise<void> => {
  const gameRef = ref(database, `games/${gameId}`);
  const gameSnapshot = await get(gameRef);
  const gameState: KingsGameState = gameSnapshot.val();

  const playerIndex = gameState.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) {
    throw new Error('Player not found');
  }

  const sidePile = gameState.sidePiles[sidePileIndex];
  const cornerPile = gameState.cornerPiles[cornerPileIndex];

  // Validate move
  if (sidePile.length === 0) {
    throw new Error('Side pile is empty');
  }

  const topCard = sidePile[sidePile.length - 1];
  if (!isKing(topCard)) {
    throw new Error('Top card must be a King');
  }

  if (cornerPile.length > 0) {
    throw new Error('Corner pile must be empty');
  }

  // Move entire pile to corner
  const newSidePiles = [...gameState.sidePiles];
  newSidePiles[sidePileIndex] = [];

  const newCornerPiles = [...gameState.cornerPiles];
  newCornerPiles[cornerPileIndex] = sidePile;

  const player = gameState.players[playerIndex];

  await update(gameRef, {
    sidePiles: newSidePiles,
    cornerPiles: newCornerPiles,
    lastAction: `${player.name} moved King to corner`,
    lastActionTime: Date.now(),
  });
};

/**
 * Merge two piles
 */
export const mergePiles = async (
  gameId: string,
  playerId: string,
  fromPileType: 'corner' | 'side',
  fromPileIndex: 0 | 1 | 2 | 3,
  toPileType: 'corner' | 'side',
  toPileIndex: 0 | 1 | 2 | 3
): Promise<void> => {
  const gameRef = ref(database, `games/${gameId}`);
  const gameSnapshot = await get(gameRef);
  const gameState: KingsGameState = gameSnapshot.val();

  const playerIndex = gameState.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) {
    throw new Error('Player not found');
  }

  const fromPile = fromPileType === 'corner'
    ? gameState.cornerPiles[fromPileIndex]
    : gameState.sidePiles[fromPileIndex];

  const toPile = toPileType === 'corner'
    ? gameState.cornerPiles[toPileIndex]
    : gameState.sidePiles[toPileIndex];

  // Validate merge
  if (!canMovePile(fromPile, toPile)) {
    throw new Error('Cannot merge these piles');
  }

  // Merge piles
  const newFromPile: KingsCard[] = [];
  const newToPile = [...toPile, ...fromPile];

  const updates: any = {
    lastActionTime: Date.now(),
  };

  // Update from pile
  if (fromPileType === 'corner') {
    const newCornerPiles = [...gameState.cornerPiles];
    newCornerPiles[fromPileIndex] = newFromPile;
    updates.cornerPiles = newCornerPiles;
  } else {
    const newSidePiles = [...gameState.sidePiles];
    newSidePiles[fromPileIndex] = newFromPile;
    updates.sidePiles = newSidePiles;
  }

  // Update to pile
  if (toPileType === 'corner') {
    const newCornerPiles = updates.cornerPiles || [...gameState.cornerPiles];
    newCornerPiles[toPileIndex] = newToPile;
    updates.cornerPiles = newCornerPiles;
  } else {
    const newSidePiles = updates.sidePiles || [...gameState.sidePiles];
    newSidePiles[toPileIndex] = newToPile;
    updates.sidePiles = newSidePiles;
  }

  const player = gameState.players[playerIndex];
  updates.lastAction = `${player.name} merged piles`;

  await update(gameRef, updates);
};

/**
 * Draw a card and end turn
 */
export const drawCardAndEndTurn = async (
  gameId: string,
  playerId: string
): Promise<void> => {
  const gameRef = ref(database, `games/${gameId}`);
  const gameSnapshot = await get(gameRef);
  const gameState: KingsGameState = gameSnapshot.val();

  const playerIndex = gameState.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) {
    throw new Error('Player not found');
  }

  const player = gameState.players[playerIndex];
  const updates: any = {
    lastActionTime: Date.now(),
  };

  // Draw card if available
  if (gameState.drawPile.length > 0) {
    const drawnCard = gameState.drawPile[0];
    const newDrawPile = gameState.drawPile.slice(1);
    const newHand = [...player.deck, drawnCard];

    updates.drawPile = newDrawPile;
    updates[`players/${playerIndex}/deck`] = newHand;
    updates.lastAction = `${player.name} drew a card`;
  } else {
    updates.lastAction = `${player.name} passed (no cards to draw)`;
  }

  // Next player's turn
  const nextIndex = (playerIndex + 1) % gameState.players.length;
  updates.currentPlayerIndex = nextIndex;
  updates.hasDrawn = false;

  const nextPlayer = gameState.players[nextIndex];
  updates.lastAction += `. ${nextPlayer.name}'s turn`;

  await update(gameRef, updates);
};

/**
 * End turn without drawing (when player has no valid moves)
 */
export const endTurnWithoutDraw = async (
  gameId: string,
  playerId: string
): Promise<void> => {
  const gameRef = ref(database, `games/${gameId}`);
  const gameSnapshot = await get(gameRef);
  const gameState: KingsGameState = gameSnapshot.val();

  const playerIndex = gameState.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) {
    throw new Error('Player not found');
  }

  const player = gameState.players[playerIndex];

  // Next player's turn
  const nextIndex = (playerIndex + 1) % gameState.players.length;
  const nextPlayer = gameState.players[nextIndex];

  await update(gameRef, {
    currentPlayerIndex: nextIndex,
    hasDrawn: false,
    lastAction: `${player.name} passed. ${nextPlayer.name}'s turn`,
    lastActionTime: Date.now(),
  });
};

/**
 * Update Kings in Corners game state
 */
export const updateKingsCornersGameState = async (
  gameId: string,
  updates: Partial<KingsGameState>
): Promise<void> => {
  const gameRef = ref(database, `games/${gameId}`);
  await update(gameRef, {
    ...updates,
    lastActionTime: Date.now(),
  });
};

/**
 * Get available Kings in Corners game rooms
 */
export const getAvailableKingsCornersRooms = async (): Promise<KingsGameRoom[]> => {
  const roomsRef = ref(database, 'rooms');
  const snapshot = await get(roomsRef);

  if (!snapshot.exists()) {
    return [];
  }

  const rooms: KingsGameRoom[] = [];
  snapshot.forEach((childSnapshot) => {
    const room = childSnapshot.val();
    if (room.maxPlayers && room.playerCount < room.maxPlayers) {
      rooms.push(room);
    }
  });

  return rooms.sort((a, b) => b.createdAt - a.createdAt);
};

/**
 * Delete a Kings in Corners game
 */
export const deleteKingsCornersGame = async (gameId: string): Promise<void> => {
  await remove(ref(database, `games/${gameId}`));
  await remove(ref(database, `rooms/${gameId}`));
};
