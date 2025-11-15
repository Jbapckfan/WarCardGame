import { Card, Player } from './game';

export interface ERSGameState {
  id: string;
  player1: Player;
  player2: Player | null;
  pile: Card[];
  currentTurn: string;
  gameStatus: 'waiting' | 'playing' | 'finished';
  lastAction: string;
  lastActionTime: number;
  winner: string | null;
  faceCardChallenge: {
    active: boolean;
    cardsToPlay: number;
    remainingCards: number;
    challenger: string;
  } | null;
  canSlap: boolean;
  lastSlap: {
    playerId: string;
    timestamp: number;
    successful: boolean;
  } | null;
}

export type SlapRule = 'double' | 'sandwich' | 'tens' | 'marriage' | 'divorce';

export interface SlapRuleCheck {
  rule: SlapRule;
  valid: boolean;
}
