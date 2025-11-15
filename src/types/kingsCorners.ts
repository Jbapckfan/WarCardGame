// Kings in the Corners Game Types

export interface KingsCard {
  id: string;
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  value: 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
  color: 'red' | 'black';
}

export interface KingsGameState {
  id: string;
  drawPile: KingsCard[];

  // 4 corner piles (NW, NE, SW, SE) - only Kings can start these
  cornerNW: KingsCard[];
  cornerNE: KingsCard[];
  cornerSW: KingsCard[];
  cornerSE: KingsCard[];

  // 4 side piles (N, E, S, W) - any card except King
  sideN: KingsCard[];
  sideE: KingsCard[];
  sideS: KingsCard[];
  sideW: KingsCard[];

  currentPlayerHand: KingsCard[];
  playerCount: number;
  currentTurn: number; // 0, 1, 2, or 3 for 4 players
  gameStatus: 'playing' | 'finished';
  winner: number | null;
  lastAction: string;
  lastActionTime: number;
  moveCount: number;
}

export interface PlayerInfo {
  id: string;
  name: string;
  handSize: number;
}
