export type Phase10Color = 'red' | 'blue' | 'green' | 'yellow' | 'wild';
export type Phase10Value = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | 'skip' | 'wild';

export interface Phase10Card {
  id: string;
  color: Phase10Color;
  value: Phase10Value;
}

export interface Phase {
  id: number;
  name: string;
  description: string;
  sets?: number; // Number of sets required
  setSize?: number; // Cards per set
  run?: number; // Length of run required
  color?: boolean; // Must be same color
  cards?: number; // Total cards needed
}

export const PHASES: Phase[] = [
  { id: 1, name: 'Phase 1', description: '2 sets of 3', sets: 2, setSize: 3 },
  { id: 2, name: 'Phase 2', description: '1 set of 3 + 1 run of 4', sets: 1, setSize: 3, run: 4 },
  { id: 3, name: 'Phase 3', description: '1 set of 4 + 1 run of 4', sets: 1, setSize: 4, run: 4 },
  { id: 4, name: 'Phase 4', description: '1 run of 7', run: 7 },
  { id: 5, name: 'Phase 5', description: '1 run of 8', run: 8 },
  { id: 6, name: 'Phase 6', description: '1 run of 9', run: 9 },
  { id: 7, name: 'Phase 7', description: '2 sets of 4', sets: 2, setSize: 4 },
  { id: 8, name: 'Phase 8', description: '7 cards of one color', cards: 7, color: true },
  { id: 9, name: 'Phase 9', description: '1 set of 5 + 1 set of 2', sets: 2, setSize: 5 },
  { id: 10, name: 'Phase 10', description: '1 set of 5 + 1 set of 3', sets: 2, setSize: 5 },
];

export interface Phase10Player {
  id: string;
  name: string;
  hand: Phase10Card[];
  currentPhase: number; // 1-10
  completedPhase: boolean; // Did they complete their phase this round?
  laidDownCards: Phase10Card[][]; // Cards they've laid down
  score: number;
  pushToken?: string;
}

export interface Phase10GameState {
  id: string;
  player1: Phase10Player;
  player2: Phase10Player | null;
  currentTurn: string;
  gameStatus: 'waiting' | 'playing' | 'finished';
  discardPile: Phase10Card[];
  drawPile: Phase10Card[];
  lastAction: string;
  lastActionTime: number;
  winner: string | null;
  roundNumber: number;
}

export interface Phase10GameRoom {
  id: string;
  createdBy: string;
  createdAt: number;
  playerCount: number;
}
