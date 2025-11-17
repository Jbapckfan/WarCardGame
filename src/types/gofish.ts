import { Card, Player } from './game';

export interface GoFishPlayer extends Player {
  hand: Card[];
  books: Card[][]; // Sets of 4 cards of the same rank
}

export interface GoFishGameState {
  id: string;
  players: GoFishPlayer[];
  currentPlayerIndex: number;
  deck: Card[];
  gameStatus: 'waiting' | 'playing' | 'finished';
  lastAction: string;
  lastActionTime: number;
  winner: string | null;
  lastAskedRank: number | null; // Track what rank was last asked for
  lastAskedPlayerId: string | null; // Track who was asked
}
