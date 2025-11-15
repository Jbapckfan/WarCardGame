export type UnoColor = 'red' | 'blue' | 'green' | 'yellow' | 'wild';
export type UnoValue = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' |
  'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4';

export interface UnoCard {
  id: string;
  color: UnoColor;
  value: UnoValue;
}

export interface UnoPlayer {
  id: string;
  name: string;
  hand: UnoCard[];
  pushToken?: string;
}

export interface UnoGameState {
  id: string;
  player1: UnoPlayer;
  player2: UnoPlayer | null;
  currentTurn: string;
  gameStatus: 'waiting' | 'playing' | 'finished';
  direction: 1 | -1; // 1 = clockwise, -1 = counter-clockwise
  discardPile: UnoCard[];
  drawPile: UnoCard[];
  currentColor: UnoColor; // For wild cards
  lastAction: string;
  lastActionTime: number;
  winner: string | null;
  mustDraw: number; // Number of cards player must draw (for draw2/wild4 stacking)
  saidUno: { [playerId: string]: boolean }; // Track who said "UNO"
}

export interface UnoGameRoom {
  id: string;
  createdBy: string;
  createdAt: number;
  playerCount: number;
}
