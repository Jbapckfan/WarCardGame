import { Card, Player } from './game';

export interface HeartsPlayer extends Player {
  hand: Card[];
  tricksTaken: Card[][];
  score: number;
  passedCards: Card[]; // Cards to pass at start of round
}

export type PassDirection = 'left' | 'right' | 'across' | 'none';

export interface HeartsGameState {
  id: string;
  players: HeartsPlayer[]; // Must be exactly 4 players
  currentPlayerIndex: number;
  currentTrick: Card[];
  currentTrickPlayerIds: string[]; // Track who played each card in trick
  leadingSuit: string | null;
  roundNumber: number;
  passDirection: PassDirection;
  gameStatus: 'waiting' | 'passing' | 'playing' | 'finished';
  lastAction: string;
  lastActionTime: number;
  winner: string | null;
  heartsBroken: boolean;
  playPhase: 'passing' | 'playing';
}
