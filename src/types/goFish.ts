import { Card, Player } from './game';

export interface GoFishPlayer extends Player {
  books: string[]; // Array of ranks that form complete sets (4 cards)
}

export interface GoFishGameState {
  id: string;
  player1: GoFishPlayer;
  player2: GoFishPlayer | null;
  player3?: GoFishPlayer | null;
  player4?: GoFishPlayer | null;
  players: GoFishPlayer[]; // Array of all active players (2-4)
  drawPile: Card[];
  currentTurn: number; // Index of current player
  gameStatus: 'waiting' | 'playing' | 'finished';
  lastAction: string;
  lastActionTime: number;
  winner: number | null; // Index of winning player
  playerCount: number;
  maxPlayers: number; // 2, 3, or 4
  // For asking phase
  askingPlayer: number | null;
  targetPlayer: number | null;
  requestedRank: number | null;
}

export interface GoFishGameRoom {
  id: string;
  createdBy: string;
  createdAt: number;
  playerCount: number;
  maxPlayers: number; // 2, 3, or 4
}

export interface GoFishAskResult {
  success: boolean;
  cardsReceived: Card[];
  formedBook: boolean;
  bookRank?: number;
}
