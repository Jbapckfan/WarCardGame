import { Player } from './game';

export type UnoColor = 'red' | 'blue' | 'green' | 'yellow';
export type UnoValue =
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild_draw4';

export interface UnoCard {
  id: string;
  color: UnoColor | 'wild';
  value: UnoValue;
}

export interface UnoPlayer extends Player {
  hand: UnoCard[];
  calledUno: boolean;
}

export interface UnoGameState {
  id: string;
  players: UnoPlayer[];
  currentPlayerIndex: number;
  direction: 1 | -1; // 1 for clockwise, -1 for counter-clockwise
  deck: UnoCard[];
  discardPile: UnoCard[];
  currentColor: UnoColor; // For wild cards
  gameStatus: 'waiting' | 'playing' | 'finished';
  lastAction: string;
  lastActionTime: number;
  winner: string | null;
  mustDraw: boolean; // Track if current player must draw
  drawCount: number; // For stacking Draw 2 / Wild Draw 4
}
