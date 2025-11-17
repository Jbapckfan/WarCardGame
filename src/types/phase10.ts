import { Card, Player } from './game';

export type Phase10Phase =
  | 'TWO_SETS_OF_3'
  | 'ONE_SET_OF_3_ONE_RUN_OF_4'
  | 'ONE_SET_OF_4_ONE_RUN_OF_4'
  | 'ONE_RUN_OF_7'
  | 'ONE_RUN_OF_8'
  | 'ONE_RUN_OF_9'
  | 'TWO_SETS_OF_4'
  | 'SEVEN_CARDS_OF_ONE_COLOR'
  | 'ONE_SET_OF_5_ONE_SET_OF_2'
  | 'ONE_SET_OF_5_ONE_SET_OF_3';

export interface Phase10Player extends Player {
  hand: Card[];
  currentPhase: number; // 1-10
  hasLaidDownPhase: boolean;
  score: number;
}

export interface Phase10GameState {
  id: string;
  players: Phase10Player[];
  currentPlayerIndex: number;
  deck: Card[];
  discardPile: Card[];
  gameStatus: 'waiting' | 'playing' | 'finished';
  lastAction: string;
  lastActionTime: number;
  winner: string | null;
  mustDraw: boolean; // Track if current player must draw before discarding
  laidDownPhases: {
    [playerId: string]: {
      sets: Card[][];
      runs: Card[][];
    };
  };
}

export interface Phase10Set {
  cards: Card[];
  type: 'set' | 'run';
}

export const PHASE_REQUIREMENTS: Record<number, Phase10Phase> = {
  1: 'TWO_SETS_OF_3',
  2: 'ONE_SET_OF_3_ONE_RUN_OF_4',
  3: 'ONE_SET_OF_4_ONE_RUN_OF_4',
  4: 'ONE_RUN_OF_7',
  5: 'ONE_RUN_OF_8',
  6: 'ONE_RUN_OF_9',
  7: 'TWO_SETS_OF_4',
  8: 'SEVEN_CARDS_OF_ONE_COLOR',
  9: 'ONE_SET_OF_5_ONE_SET_OF_2',
  10: 'ONE_SET_OF_5_ONE_SET_OF_3',
};

export const PHASE_DESCRIPTIONS: Record<Phase10Phase, string> = {
  'TWO_SETS_OF_3': '2 sets of 3',
  'ONE_SET_OF_3_ONE_RUN_OF_4': '1 set of 3 + 1 run of 4',
  'ONE_SET_OF_4_ONE_RUN_OF_4': '1 set of 4 + 1 run of 4',
  'ONE_RUN_OF_7': '1 run of 7',
  'ONE_RUN_OF_8': '1 run of 8',
  'ONE_RUN_OF_9': '1 run of 9',
  'TWO_SETS_OF_4': '2 sets of 4',
  'SEVEN_CARDS_OF_ONE_COLOR': '7 cards of one color',
  'ONE_SET_OF_5_ONE_SET_OF_2': '1 set of 5 + 1 set of 2',
  'ONE_SET_OF_5_ONE_SET_OF_3': '1 set of 5 + 1 set of 3',
};
