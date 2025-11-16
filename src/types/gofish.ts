import { Card, Player, Rank } from './game';

export interface GoFishPlayer extends Player {
  deck: Card[];
  books: Rank[]; // Ranks where player has collected all 4
}

export interface GoFishGameState {
  id: string;
  players: GoFishPlayer[]; // 2-4 players
  currentPlayerIndex: number;
  drawPile: Card[];
  gameStatus: 'waiting' | 'playing' | 'finished';
  lastAction: string;
  lastActionTime: number;
  winner: string | null;
  lastAsk: {
    asker: string;
    askee: string;
    rank: Rank;
    success: boolean;
    cardsReceived: number;
  } | null;
  maxPlayers: number;
}

export interface GoFishAskAction {
  targetPlayerId: string;
  rank: Rank;
}
