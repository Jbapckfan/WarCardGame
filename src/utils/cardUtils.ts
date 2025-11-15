import { Card, Suit, Rank } from '../types/game';

export const createDeck = (): Card[] => {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  const deck: Card[] = [];

  suits.forEach(suit => {
    ranks.forEach(rank => {
      deck.push({
        suit,
        rank,
        id: `${suit}-${rank}`
      });
    });
  });

  return deck;
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const splitDeck = (deck: Card[]): [Card[], Card[]] => {
  const mid = Math.floor(deck.length / 2);
  return [deck.slice(0, mid), deck.slice(mid)];
};

export const splitDeckMultiple = (deck: Card[], numPlayers: number): Card[][] => {
  const decks: Card[][] = Array.from({ length: numPlayers }, () => []);
  deck.forEach((card, index) => {
    decks[index % numPlayers].push(card);
  });
  return decks;
};

export const getRankName = (rank: Rank): string => {
  switch (rank) {
    case 11: return 'J';
    case 12: return 'Q';
    case 13: return 'K';
    case 14: return 'A';
    default: return rank.toString();
  }
};

export const getSuitSymbol = (suit: Suit): string => {
  switch (suit) {
    case 'hearts': return '♥️';
    case 'diamonds': return '♦️';
    case 'clubs': return '♣️';
    case 'spades': return '♠️';
  }
};

export const getSuitColor = (suit: Suit): string => {
  return suit === 'hearts' || suit === 'diamonds' ? '#FF0000' : '#000000';
};
