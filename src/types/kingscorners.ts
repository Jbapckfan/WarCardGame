import { Card, Player } from './game';

export interface KingsCornersPlayer extends Player {
  deck: Card[];
}

export interface KingsCornersGameState {
  id: string;
  players: KingsCornersPlayer[]; // 2-4 players
  currentPlayerIndex: number;
  cornerPiles: [Card[], Card[], Card[], Card[]]; // 4 corner piles (for Kings)
  sidePiles: [Card[], Card[], Card[], Card[]]; // 4 side piles (N, E, S, W)
  drawPile: Card[];
  gameStatus: 'waiting' | 'playing' | 'finished';
  lastAction: string;
  lastActionTime: number;
  winner: string | null;
  hasDrawn: boolean; // Current player has drawn
  maxPlayers: number;
}

export type PileType = 'corner' | 'side';
export type PileIndex = 0 | 1 | 2 | 3;

export interface KingsCornersPile {
  type: PileType;
  index: PileIndex;
  cards: Card[];
}
