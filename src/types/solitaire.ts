import { Card, Suit } from './game';

export interface SolitaireGameState {
  id: string;
  // 7 tableau piles (the main play area)
  tableau: Card[][];
  // 4 foundation piles (Ace to King, one per suit)
  foundations: {
    hearts: Card[];
    diamonds: Card[];
    clubs: Card[];
    spades: Card[];
  };
  // Stock pile (face down cards to draw from)
  stock: Card[];
  // Waste pile (face up cards drawn from stock)
  waste: Card[];
  // Number of cards to draw at a time (1 or 3)
  drawCount: number;
  moves: number;
  score: number;
  gameStatus: 'playing' | 'won';
  startTime: number;
  endTime: number | null;
}

export type PileType = 'tableau' | 'foundation' | 'waste' | 'stock';

export interface CardMove {
  from: {
    type: PileType;
    index: number; // tableau index or 0 for foundation/waste
    cardIndex?: number; // index of card in pile
  };
  to: {
    type: PileType;
    index: number;
  };
}
