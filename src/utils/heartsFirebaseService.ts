import { database } from '../config/firebase';
import { ref, push, set, onValue, off, update, remove, get } from 'firebase/database';
import { HeartsGameState, HeartsPlayer, HeartsGameRoom, HeartsTrick } from '../types/hearts';
import { Card } from '../types/game';
import { createDeck, shuffleDeck } from './cardUtils';
import { getCurrentUserId } from './authService';

/**
 * NOTE: Hearts is ALWAYS 4 players
 */

const PASSING_PATTERN: ('left' | 'right' | 'across' | 'none')[] = ['left', 'right', 'across', 'none'];

/**
 * Create a new Hearts game room (always 4 players)
 */
export const createHeartsGameRoom = async (
  playerId: string,
  playerName: string,
  pushToken?: string
): Promise<string> => {
  const roomsRef = ref(database, 'rooms');
  const newRoomRef = push(roomsRef);
  const roomId = newRoomRef.key!;

  const gameRoom: HeartsGameRoom = {
    id: roomId,
    createdBy: playerId,
    createdAt: Date.now(),
    playerCount: 1,
    maxPlayers: 4,
  };

  const initialGameState: Partial<HeartsGameState> = {
    id: roomId,
    player1: {
      id: playerId,
      name: playerName,
      hand: [],
      tricksTaken: [],
      score: 0,
      totalScore: 0,
      pushToken,
    },
    player2: null,
    player3: null,
    player4: null,
    currentTrick: {
      cards: [],
      leadSuit: null,
      winner: null,
    },
    currentTurn: 0,
    roundNumber: 0,
    trickNumber: 0,
    gameStatus: 'waiting',
    heartsBroken: false,
    firstTrick: true,
    lastAction: 'Waiting for 4 players...',
    lastActionTime: Date.now(),
    winner: null,
    targetScore: 100,
    passingDirection: 'left',
    passedCards: {},
    maxPlayers: 4,
  };

  await set(ref(database, `rooms/${roomId}`), gameRoom);
  await set(ref(database, `games/${roomId}`), initialGameState);

  return roomId;
};

/**
 * Join an existing Hearts game room
 */
export const joinHeartsGameRoom = async (
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
  const room: HeartsGameRoom = roomSnapshot.val();

  if (gameState.gameStatus !== 'waiting' || room.playerCount >= 4) {
    return false;
  }

  const playerSlot = !gameState.player2
    ? 'player2'
    : !gameState.player3
    ? 'player3'
    : 'player4';

  const newPlayerCount = room.playerCount + 1;
  const updates: any = {
    [playerSlot]: {
      id: playerId,
      name: playerName,
      hand: [],
      tricksTaken: [],
      score: 0,
      totalScore: 0,
      pushToken,
    },
    playerCount: newPlayerCount,
    lastAction: `${playerName} joined (${newPlayerCount}/4)`,
    lastActionTime: Date.now(),
  };

  // Start game when 4th player joins
  if (newPlayerCount === 4) {
    // Deal all cards
    const deck = shuffleDeck(createDeck());
    const hands = [
      deck.slice(0, 13),
      deck.slice(13, 26),
      deck.slice(26, 39),
      deck.slice(39, 52),
    ];

    updates.player1 = { ...gameState.player1, hand: hands[0] };
    updates.player2 = { ...updates.player2, hand: hands[1] };
    updates.player3 = { ...updates.player3, hand: hands[2] };
    updates.player4 = { ...updates.player4, hand: hands[3] };

    const players = [updates.player1, updates.player2, updates.player3, updates.player4];
    updates.players = players;

    updates.gameStatus = 'passing';
    updates.roundNumber = 1;
    updates.passingDirection = PASSING_PATTERN[0];
    updates.lastAction = 'Choose 3 cards to pass left';
  }

  await update(gameRef, updates);
  await update(roomRef, { playerCount: newPlayerCount });

  return true;
};

/**
 * Listen to Hearts game state changes
 */
export const listenToHeartsGameState = (
  gameId: string,
  callback: (gameState: HeartsGameState | null) => void
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
 * Pass cards to another player
 */
export const passHeartsCards = async (
  gameId: string,
  playerId: string,
  cards: [Card, Card, Card]
): Promise<void> => {
  const gameRef = ref(database, `games/${gameId}`);
  const gameSnapshot = await get(gameRef);
  const gameState: HeartsGameState = gameSnapshot.val();

  // Store passed cards
  const updates: any = {
    [`passedCards/${playerId}`]: cards,
    lastActionTime: Date.now(),
  };

  // Check if all 4 players have passed
  const passedCount = Object.keys(gameState.passedCards || {}).length + 1;
  if (passedCount === 4) {
    // Distribute cards
    const players = gameState.players;
    const direction = gameState.passingDirection;

    players.forEach((player, index) => {
      const passedCards = (gameState.passedCards || {})[player.id] || cards;
      let targetIndex = index;

      switch (direction) {
        case 'left':
          targetIndex = (index + 1) % 4;
          break;
        case 'right':
          targetIndex = (index + 3) % 4;
          break;
        case 'across':
          targetIndex = (index + 2) % 4;
          break;
      }

      if (direction !== 'none') {
        const targetPlayer = players[targetIndex];
        const newHand = [...targetPlayer.hand.filter(c =>
          !passedCards.find(pc => pc.id === c.id)
        ), ...passedCards];

        updates[`players/${targetIndex}/hand`] = newHand;
      }
    });

    // Find player with 2 of clubs
    let twoClubsPlayer = 0;
    players.forEach((player, index) => {
      if (player.hand.find(c => c.suit === 'clubs' && c.rank === 2)) {
        twoClubsPlayer = index;
      }
    });

    updates.gameStatus = 'playing';
    updates.currentTurn = twoClubsPlayer;
    updates.firstTrick = true;
    updates.passedCards = {};
    updates.lastAction = `${players[twoClubsPlayer].name} starts (has 2♣)`;
  }

  await update(gameRef, updates);
};

/**
 * Play a Hearts card
 */
export const playHeartsCard = async (
  gameId: string,
  playerId: string,
  card: Card
): Promise<void> => {
  const gameRef = ref(database, `games/${gameId}`);
  const gameSnapshot = await get(gameRef);
  const gameState: HeartsGameState = gameSnapshot.val();

  const playerIndex = gameState.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) {
    throw new Error('Player not found');
  }

  const player = gameState.players[playerIndex];

  // Validate card can be played
  const currentTrick = gameState.currentTrick;

  // First trick: cannot play hearts or Q♠
  if (gameState.firstTrick && (card.suit === 'hearts' || (card.suit === 'spades' && card.rank === 12))) {
    throw new Error('Cannot play hearts or Q♠ on first trick');
  }

  // Must follow suit if possible
  if (currentTrick.cards.length > 0 && currentTrick.leadSuit) {
    const hasSuit = player.hand.some(c => c.suit === currentTrick.leadSuit);
    if (hasSuit && card.suit !== currentTrick.leadSuit) {
      throw new Error('Must follow suit');
    }
  }

  // Cannot lead hearts unless broken (or only hearts left)
  if (currentTrick.cards.length === 0 && card.suit === 'hearts' && !gameState.heartsBroken) {
    const hasOnlyHearts = player.hand.every(c => c.suit === 'hearts');
    if (!hasOnlyHearts) {
      throw new Error('Hearts not broken yet');
    }
  }

  // Remove card from hand
  const newHand = player.hand.filter(c => c.id !== card.id);
  const newTrick = {
    ...currentTrick,
    cards: [...currentTrick.cards, { playerId, card }],
    leadSuit: currentTrick.cards.length === 0 ? card.suit : currentTrick.leadSuit,
  };

  const updates: any = {
    [`players/${playerIndex}/hand`]: newHand,
    currentTrick: newTrick,
    lastActionTime: Date.now(),
  };

  // Check if hearts broken
  if (card.suit === 'hearts') {
    updates.heartsBroken = true;
  }

  // If trick complete (4 cards), resolve it
  if (newTrick.cards.length === 4) {
    const trickWinnerIndex = determineTrickWinner(newTrick);
    const trickWinner = gameState.players[trickWinnerIndex];

    // Calculate points in trick
    let points = 0;
    newTrick.cards.forEach(({ card }) => {
      if (card.suit === 'hearts') points += 1;
      if (card.suit === 'spades' && card.rank === 12) points += 13;
    });

    updates[`players/${trickWinnerIndex}/score`] = trickWinner.score + points;
    updates[`players/${trickWinnerIndex}/tricksTaken`] = [
      ...trickWinner.tricksTaken,
      newTrick.cards.map(c => c.card),
    ];

    updates.currentTrick = { cards: [], leadSuit: null, winner: null };
    updates.currentTurn = trickWinnerIndex;
    updates.firstTrick = false;
    updates.trickNumber = gameState.trickNumber + 1;
    updates.lastAction = `${trickWinner.name} won the trick`;

    // If round complete (13 tricks)
    if (gameState.trickNumber + 1 === 13) {
      // Check for shoot the moon
      const scores = gameState.players.map((p, i) =>
        i === trickWinnerIndex ? trickWinner.score + points : p.score
      );

      const shootTheMoonPlayer = scores.findIndex(s => s === 26);
      if (shootTheMoonPlayer !== -1) {
        // Give everyone else 26 points
        gameState.players.forEach((p, i) => {
          if (i !== shootTheMoonPlayer) {
            updates[`players/${i}/totalScore`] = p.totalScore + 26;
            updates[`players/${i}/score`] = 0;
          } else {
            updates[`players/${shootTheMoonPlayer}/score`] = 0;
          }
        });
      } else {
        // Add scores to totals
        gameState.players.forEach((p, i) => {
          updates[`players/${i}/totalScore`] = p.totalScore + scores[i];
          updates[`players/${i}/score`] = 0;
        });
      }

      // Check for game end
      const maxScore = Math.max(...gameState.players.map((p, i) =>
        updates[`players/${i}/totalScore`] || p.totalScore
      ));

      if (maxScore >= gameState.targetScore) {
        const winnerIndex = gameState.players.findIndex((p, i) =>
          (updates[`players/${i}/totalScore`] || p.totalScore) === Math.min(...gameState.players.map((p, j) =>
            updates[`players/${j}/totalScore`] || p.totalScore
          ))
        );

        updates.gameStatus = 'finished';
        updates.winner = winnerIndex;
        updates.lastAction = `${gameState.players[winnerIndex].name} wins!`;
      } else {
        // Start new round
        const nextRound = gameState.roundNumber + 1;
        const nextPassingDirection = PASSING_PATTERN[(nextRound - 1) % 4];

        updates.roundNumber = nextRound;
        updates.passingDirection = nextPassingDirection;
        updates.trickNumber = 0;
        updates.heartsBroken = false;
        updates.firstTrick = true;

        if (nextPassingDirection === 'none') {
          updates.gameStatus = 'playing';
          // Deal new cards
          const deck = shuffleDeck(createDeck());
          gameState.players.forEach((p, i) => {
            updates[`players/${i}/hand`] = deck.slice(i * 13, (i + 1) * 13);
          });
        } else {
          updates.gameStatus = 'passing';
          updates.lastAction = `Round ${nextRound}: Pass 3 cards ${nextPassingDirection}`;
        }
      }
    }
  } else {
    // Next player's turn
    updates.currentTurn = (playerIndex + 1) % 4;
    updates.lastAction = `${player.name} played ${card.suit} ${card.rank}`;
  }

  await update(gameRef, updates);
};

/**
 * Determine trick winner (highest card of lead suit)
 */
const determineTrickWinner = (trick: HeartsTrick): number => {
  let winnerIndex = 0;
  let highestRank = 0;

  trick.cards.forEach(({ playerId, card }, index) => {
    if (card.suit === trick.leadSuit && card.rank > highestRank) {
      highestRank = card.rank;
      winnerIndex = index;
    }
  });

  return winnerIndex;
};

/**
 * Update Hearts game state
 */
export const updateHeartsGameState = async (
  gameId: string,
  updates: Partial<HeartsGameState>
): Promise<void> => {
  const gameRef = ref(database, `games/${gameId}`);
  await update(gameRef, {
    ...updates,
    lastActionTime: Date.now(),
  });
};

/**
 * Get available Hearts game rooms
 */
export const getAvailableHeartsRooms = async (): Promise<HeartsGameRoom[]> => {
  const roomsRef = ref(database, 'rooms');
  const snapshot = await get(roomsRef);

  if (!snapshot.exists()) {
    return [];
  }

  const rooms: HeartsGameRoom[] = [];
  snapshot.forEach((childSnapshot) => {
    const room = childSnapshot.val();
    if (room.maxPlayers === 4 && room.playerCount < 4) {
      rooms.push(room);
    }
  });

  return rooms.sort((a, b) => b.createdAt - a.createdAt);
};

/**
 * Delete a Hearts game
 */
export const deleteHeartsGame = async (gameId: string): Promise<void> => {
  await remove(ref(database, `games/${gameId}`));
  await remove(ref(database, `rooms/${gameId}`));
};
