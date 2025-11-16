import { Card } from '../types/game';
import { GoFishGameState, GoFishPlayer, GoFishAskResult } from '../types/goFish';
import { createDeck, shuffleDeck } from './cardUtils';

/**
 * Initialize a new Go Fish game
 */
export const dealGoFishGame = (
  gameId: string,
  playerCount: number,
  playerNames: string[]
): GoFishGameState => {
  const deck = shuffleDeck(createDeck());

  // Deal 7 cards for 2-3 players, 5 cards for 4+ players
  const cardsPerPlayer = playerCount <= 3 ? 7 : 5;

  const players: GoFishPlayer[] = [];
  let deckIndex = 0;

  for (let i = 0; i < playerCount; i++) {
    const hand = deck.slice(deckIndex, deckIndex + cardsPerPlayer);
    deckIndex += cardsPerPlayer;

    players.push({
      id: `player${i}`,
      name: playerNames[i] || `Player ${i + 1}`,
      deck: hand,
      books: [],
    });
  }

  const drawPile = deck.slice(deckIndex);

  return {
    id: gameId,
    players,
    drawPile,
    currentTurn: 0,
    gameStatus: 'playing',
    lastAction: 'Game started! Ask for cards.',
    lastActionTime: Date.now(),
    winner: null,
    playerCount,
    askingPlayer: null,
    targetPlayer: null,
    requestedRank: null,
  };
};

/**
 * Check if a player has cards of a specific rank
 */
export const hasCardsOfRank = (player: GoFishPlayer, rank: number): boolean => {
  return player.deck.some(card => card.rank === rank);
};

/**
 * Get all cards of a specific rank from a player's hand
 */
export const getCardsOfRank = (player: GoFishPlayer, rank: number): Card[] => {
  return player.deck.filter(card => card.rank === rank);
};

/**
 * Remove cards of a specific rank from a player's hand
 */
export const removeCardsOfRank = (player: GoFishPlayer, rank: number): GoFishPlayer => {
  return {
    ...player,
    deck: player.deck.filter(card => card.rank !== rank),
  };
};

/**
 * Check if player has 4 cards of the same rank (a book)
 */
export const checkForBooks = (player: GoFishPlayer): { player: GoFishPlayer; newBooks: number[] } => {
  const rankCounts: { [rank: number]: number } = {};

  // Count cards of each rank
  player.deck.forEach(card => {
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
  });

  // Find ranks with 4 cards
  const newBooks: number[] = [];
  Object.entries(rankCounts).forEach(([rank, count]) => {
    const rankNum = parseInt(rank);
    if (count === 4 && !player.books.includes(rank)) {
      newBooks.push(rankNum);
    }
  });

  if (newBooks.length === 0) {
    return { player, newBooks: [] };
  }

  // Remove books from hand and add to books array
  let updatedPlayer = { ...player };
  newBooks.forEach(rank => {
    updatedPlayer = removeCardsOfRank(updatedPlayer, rank);
    updatedPlayer.books.push(rank.toString());
  });

  return { player: updatedPlayer, newBooks };
};

/**
 * Ask another player for cards of a specific rank
 */
export const askForCards = (
  state: GoFishGameState,
  askingPlayerIndex: number,
  targetPlayerIndex: number,
  requestedRank: number
): { newState: GoFishGameState; result: GoFishAskResult } => {
  const askingPlayer = state.players[askingPlayerIndex];
  const targetPlayer = state.players[targetPlayerIndex];

  // Check if asking player has at least one card of that rank
  if (!hasCardsOfRank(askingPlayer, requestedRank)) {
    return {
      newState: state,
      result: {
        success: false,
        cardsReceived: [],
        formedBook: false,
      },
    };
  }

  // Check if target has cards of that rank
  const hasCards = hasCardsOfRank(targetPlayer, requestedRank);

  if (hasCards) {
    // Transfer cards
    const cardsToTransfer = getCardsOfRank(targetPlayer, requestedRank);
    const updatedTarget = removeCardsOfRank(targetPlayer, requestedRank);
    const updatedAsking = {
      ...askingPlayer,
      deck: [...askingPlayer.deck, ...cardsToTransfer],
    };

    // Check for books
    const { player: finalAsking, newBooks } = checkForBooks(updatedAsking);

    const newPlayers = [...state.players];
    newPlayers[askingPlayerIndex] = finalAsking;
    newPlayers[targetPlayerIndex] = updatedTarget;

    return {
      newState: {
        ...state,
        players: newPlayers,
        lastAction: `${askingPlayer.name} got ${cardsToTransfer.length} card(s) from ${targetPlayer.name}!`,
        lastActionTime: Date.now(),
        // Player gets another turn if successful
      },
      result: {
        success: true,
        cardsReceived: cardsToTransfer,
        formedBook: newBooks.length > 0,
        bookRank: newBooks[0],
      },
    };
  } else {
    // Go Fish! Draw a card
    if (state.drawPile.length === 0) {
      // No cards to draw, turn ends
      return {
        newState: {
          ...state,
          currentTurn: (state.currentTurn + 1) % state.playerCount,
          lastAction: `${askingPlayer.name} asked for ${requestedRank}s. Go Fish! (No cards to draw)`,
          lastActionTime: Date.now(),
        },
        result: {
          success: false,
          cardsReceived: [],
          formedBook: false,
        },
      };
    }

    const drawnCard = state.drawPile[0];
    const newDrawPile = state.drawPile.slice(1);

    let updatedAsking = {
      ...askingPlayer,
      deck: [...askingPlayer.deck, drawnCard],
    };

    // Check for books after drawing
    const { player: finalAsking, newBooks } = checkForBooks(updatedAsking);

    const newPlayers = [...state.players];
    newPlayers[askingPlayerIndex] = finalAsking;

    // If drawn card matches requested rank, player gets another turn
    const gotRequestedCard = drawnCard.rank === requestedRank;

    return {
      newState: {
        ...state,
        players: newPlayers,
        drawPile: newDrawPile,
        currentTurn: gotRequestedCard ? state.currentTurn : (state.currentTurn + 1) % state.playerCount,
        lastAction: gotRequestedCard
          ? `${askingPlayer.name} drew the requested card!`
          : `${askingPlayer.name} asked for ${requestedRank}s. Go Fish!`,
        lastActionTime: Date.now(),
      },
      result: {
        success: gotRequestedCard,
        cardsReceived: [drawnCard],
        formedBook: newBooks.length > 0,
        bookRank: newBooks[0],
      },
    };
  }
};

/**
 * Check for winner (player with most books when all books are collected)
 */
export const checkGoFishWinner = (state: GoFishGameState): number | null => {
  // Game ends when all 13 books are collected (13 ranks in deck)
  const totalBooks = state.players.reduce((sum, p) => sum + p.books.length, 0);

  if (totalBooks === 13) {
    // Find player with most books
    let maxBooks = 0;
    let winnerIndex = 0;

    state.players.forEach((player, index) => {
      if (player.books.length > maxBooks) {
        maxBooks = player.books.length;
        winnerIndex = index;
      }
    });

    return winnerIndex;
  }

  // Also check if all players have no cards and draw pile is empty
  const allPlayersEmpty = state.players.every(p => p.deck.length === 0);
  if (allPlayersEmpty && state.drawPile.length === 0) {
    let maxBooks = 0;
    let winnerIndex = 0;

    state.players.forEach((player, index) => {
      if (player.books.length > maxBooks) {
        maxBooks = player.books.length;
        winnerIndex = index;
      }
    });

    return winnerIndex;
  }

  return null;
};

/**
 * Get rank name for display
 */
export const getRankDisplayName = (rank: number): string => {
  switch (rank) {
    case 11: return 'Jack';
    case 12: return 'Queen';
    case 13: return 'King';
    case 14: return 'Ace';
    default: return rank.toString();
  }
};
