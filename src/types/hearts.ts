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
  player1: HeartsPlayer;
  player2: HeartsPlayer | null;
  player3: HeartsPlayer | null;
  player4: HeartsPlayer | null;
  players: [HeartsPlayer, HeartsPlayer, HeartsPlayer, HeartsPlayer]; // Exactly 4 players
  currentTrick: HeartsTrick;
  currentTurn: number; // Index of player whose turn it is
  roundNumber: number;
  trickNumber: number;
  gameStatus: 'waiting' | 'passing' | 'playing' | 'round_end' | 'finished';
  heartsBroken: boolean; // Whether hearts have been played yet
  firstTrick: boolean; // First trick has special rules
  lastAction: string;
  lastActionTime: number;
  winner: number | null; // Index of winning player
  targetScore: number; // Game ends when someone reaches this (usually 100)
  passingDirection: 'left' | 'right' | 'across' | 'none';
  passedCards: { [playerId: string]: Card[] }; // Cards being passed
  maxPlayers: 4; // Always 4
}

export interface HeartsGameRoom {
  id: string;
  createdBy: string;
  createdAt: number;
  playerCount: number;
  maxPlayers: 4; // Always 4 for Hearts
}

export interface CardPlayResult {
  valid: boolean;
  reason?: string;
}
