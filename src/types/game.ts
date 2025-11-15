export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14; // 11=J, 12=Q, 13=K, 14=A

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string;
}

export interface Player {
  id: string;
  name: string;
  deck: Card[];
  pushToken?: string;
}

export interface WarState {
  cardsPlayed: Card[];
  player1Cards: Card[];
  player2Cards: Card[];
}

export interface GameState {
  id: string;
  player1: Player;
  player2: Player | null;
  currentTurn: string; // player id
  gameStatus: 'waiting' | 'playing' | 'finished';
  sixSevenRuleEnabled: boolean;
  warState: WarState | null;
  lastAction: string;
  lastActionTime: number;
  winner: string | null;
}

export interface GameRoom {
  id: string;
  createdBy: string;
  createdAt: number;
  playerCount: number;
  sixSevenRuleEnabled: boolean;
}
