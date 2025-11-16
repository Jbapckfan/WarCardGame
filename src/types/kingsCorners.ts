// Kings in the Corners Game Types

export interface KingsCard {
  id: string;
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  value: 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
  color: 'red' | 'black';
}

export interface KingsPlayer {
  id: string;
  name: string;
  deck: KingsCard[];
  pushToken?: string;
}

export interface KingsGameState {
  id: string;
  player1: KingsPlayer;
  player2: KingsPlayer | null;
  player3?: KingsPlayer | null;
  player4?: KingsPlayer | null;
  players: KingsPlayer[]; // Array of all active players (2-4)
  drawPile: KingsCard[];

  // 4 corner piles (NW, NE, SW, SE) - only Kings can start these
  cornerPiles: [KingsCard[], KingsCard[], KingsCard[], KingsCard[]];

  // 4 side piles (N, E, S, W) - any card except King
  sidePiles: [KingsCard[], KingsCard[], KingsCard[], KingsCard[]];

  currentPlayerIndex: number; // Index of current player
  playerCount: number;
  maxPlayers: number; // 2, 3, or 4
  gameStatus: 'waiting' | 'playing' | 'finished';
  winner: number | null;
  lastAction: string;
  lastActionTime: number;
  hasDrawn: boolean; // Current player has drawn this turn
}

export interface KingsGameRoom {
  id: string;
  createdBy: string;
  createdAt: number;
  playerCount: number;
  maxPlayers: number; // 2, 3, or 4
}

export interface PlayerInfo {
  id: string;
  name: string;
  handSize: number;
}
