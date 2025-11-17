import { Card } from '../types/game';
import { GoFishPlayer } from '../types/gofish';

export const hasRank = (hand: Card[], rank: number): boolean => {
  return hand.some(card => card.rank === rank);
};

export const getCardsOfRank = (hand: Card[], rank: number): Card[] => {
  return hand.filter(card => card.rank === rank);
};

export const checkForBooks = (hand: Card[]): { books: Card[][], remainingHand: Card[] } => {
  const books: Card[][] = [];
  const rankCounts = new Map<number, Card[]>();

  // Group cards by rank
  hand.forEach(card => {
    if (!rankCounts.has(card.rank)) {
      rankCounts.set(card.rank, []);
    }
    rankCounts.get(card.rank)!.push(card);
  });

  const remainingHand: Card[] = [];

  // Check for sets of 4
  rankCounts.forEach((cards, rank) => {
    if (cards.length === 4) {
      books.push(cards);
    } else {
      remainingHand.push(...cards);
    }
  });

  return { books, remainingHand };
};

export const calculateWinner = (players: GoFishPlayer[]): string | null => {
  let maxBooks = 0;
  let winnerId: string | null = null;

  players.forEach(player => {
    if (player.books.length > maxBooks) {
      maxBooks = player.books.length;
      winnerId = player.id;
    }
  });

  return winnerId;
};

export const isGameOver = (players: GoFishPlayer[], deckSize: number): boolean => {
  // Game is over when deck is empty and at least one player has no cards
  if (deckSize === 0) {
    return players.some(player => player.hand.length === 0);
  }
  return false;
};
