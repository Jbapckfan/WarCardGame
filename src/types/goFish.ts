import { Card, Player } from './game';

export interface GoFishPlayer extends Player {
  books: string[]; // Array of ranks that form complete sets (4 cards)
}

export interface GoFishGameState {
  id: string;
  players: GoFishPlayer[];
  drawPile: Card[];
  currentTurn: number; // Index of current player
  gameStatus: 'waiting' | 'playing' | 'finished';
  lastAction: string;
  lastActionTime: number;
  winner: number | null; // Index of winning player
  playerCount: number;
  // For asking phase
  askingPlayer: number | null;
  targetPlayer: number | null;
  requestedRank: number | null;
}

export interface GoFishAskResult {
  success: boolean;
  cardsReceived: Card[];
  formedBook: boolean;
  bookRank?: number;
}
