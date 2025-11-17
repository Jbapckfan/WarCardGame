import { Card, Player } from './game';

export interface KingsPlayer extends Player {
  hand: Card[];
}

export type PilePosition = 'north' | 'south' | 'east' | 'west' | 'nw' | 'ne' | 'sw' | 'se';

export interface Pile {
  cards: Card[];
  position: PilePosition;
  isCorner: boolean;
}

export interface KingsGameState {
  id: string;
  players: KingsPlayer[];
  currentPlayerIndex: number;
  deck: Card[];
  piles: {
    north: Pile;
    south: Pile;
    east: Pile;
    west: Pile;
    nw: Pile; // northwest corner
    ne: Pile; // northeast corner
    sw: Pile; // southwest corner
    se: Pile; // southeast corner
  };
  gameStatus: 'waiting' | 'playing' | 'finished';
  lastAction: string;
  lastActionTime: number;
  winner: string | null;
}
