import { Card } from './game';

export interface HeartsPlayer {
  id: string;
  name: string;
  hand: Card[];
  tricksTaken: Card[][];
  score: number;
  totalScore: number; // Running total across rounds
}

export interface HeartsTrick {
  cards: { playerId: string; card: Card }[];
  leadSuit: string | null;
  winner: string | null;
}

export interface HeartsGameState {
  id: string;
  players: HeartsPlayer[];
  currentTrick: HeartsTrick;
  currentTurn: number; // Index of player whose turn it is
  roundNumber: number;
  gameStatus: 'playing' | 'roundEnd' | 'gameEnd';
  heartsBroken: boolean; // Whether hearts have been played yet
  firstTrick: boolean; // First trick has special rules
  lastAction: string;
  lastActionTime: number;
  winner: number | null; // Index of winning player
  targetScore: number; // Game ends when someone reaches this (usually 100)
}

export interface CardPlayResult {
  valid: boolean;
  reason?: string;
}
