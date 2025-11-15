// Custom Game Template System
// Allows users to create custom card games from templates

export type DeckType = 'standard' | 'uno';

export type MatchRule =
  | 'color'
  | 'number'
  | 'suit'
  | 'rank'
  | 'color_or_number'
  | 'suit_or_rank'
  | 'exact_match'
  | 'higher_rank'
  | 'any';

export type WinCondition =
  | 'empty_hand'
  | 'most_cards'
  | 'least_cards'
  | 'first_to_points'
  | 'lowest_points';

export type SpecialCard =
  | 'skip'
  | 'reverse'
  | 'draw2'
  | 'wild'
  | 'wild4';

export interface GameTemplate {
  id: string;
  name: string;
  description: string;
  emoji: string;
  baseGame: 'uno' | 'war' | 'shedding' | 'matching';

  // Deck configuration
  deckType: DeckType;

  // Core rules
  matchRule: MatchRule;
  canPlayMultiple: boolean;
  mustDraw: boolean;
  drawCount: number;

  // Win condition
  winCondition: WinCondition;
  targetPoints?: number;

  // Special cards (for Uno-style games)
  specialCards: SpecialCard[];

  // Gameplay settings
  startingCards: number;
  maxPlayers: 2; // For now, only 2-player

  // Custom rules
  rules: string[]; // Human-readable rules

  // Customizable options
  customizable: {
    matchRule?: MatchRule[];
    drawCount?: number[];
    startingCards?: number[];
    specialCards?: boolean;
  };
}

export interface CustomGameState {
  id: string;
  template: GameTemplate;
  player1: {
    id: string;
    name: string;
    hand: any[]; // Card type depends on deck
    score: number;
  };
  player2: {
    id: string;
    name: string;
    hand: any[];
    score: number;
  } | null;
  pile: any[];
  discardPile: any[];
  drawPile: any[];
  currentTurn: string;
  currentColor?: string; // For Uno-style games
  gameStatus: 'waiting' | 'playing' | 'finished';
  lastAction: string;
  lastActionTime: number;
  winner: string | null;
}

export interface SavedCustomGame {
  id: string;
  name: string;
  template: GameTemplate;
  createdAt: number;
  playCount: number;
  lastPlayed: number;
}

// Pre-built game templates
export const GAME_TEMPLATES: GameTemplate[] = [
  {
    id: 'speed_uno',
    name: 'Speed Uno',
    description: 'Fast-paced Uno with 5 cards and no special cards',
    emoji: '⚡',
    baseGame: 'uno',
    deckType: 'uno',
    matchRule: 'color_or_number',
    canPlayMultiple: false,
    mustDraw: true,
    drawCount: 1,
    winCondition: 'empty_hand',
    specialCards: [],
    startingCards: 5,
    maxPlayers: 2,
    rules: [
      'Match color or number',
      'Draw 1 if no match',
      'First to empty hand wins',
      'No special cards - pure speed!',
    ],
    customizable: {
      startingCards: [3, 5, 7],
      drawCount: [1, 2],
    },
  },

  {
    id: 'crazy_eights',
    name: 'Crazy Eights',
    description: 'Classic matching game - 8s are wild!',
    emoji: '🎱',
    baseGame: 'matching',
    deckType: 'standard',
    matchRule: 'suit_or_rank',
    canPlayMultiple: false,
    mustDraw: true,
    drawCount: 1,
    winCondition: 'empty_hand',
    specialCards: [],
    startingCards: 7,
    maxPlayers: 2,
    rules: [
      'Match suit or rank',
      'Eights are wild - play on anything',
      'Choose new suit when playing an 8',
      'Draw 1 if you cannot play',
      'First to empty hand wins',
    ],
    customizable: {
      startingCards: [5, 7, 9],
      drawCount: [1, 2, 3],
    },
  },

  {
    id: 'quick_war',
    name: 'Quick War',
    description: 'Fast War - first to 15 rounds wins',
    emoji: '⚔️',
    baseGame: 'war',
    deckType: 'standard',
    matchRule: 'higher_rank',
    canPlayMultiple: false,
    mustDraw: false,
    drawCount: 0,
    winCondition: 'most_cards',
    specialCards: [],
    startingCards: 26,
    maxPlayers: 2,
    rules: [
      'Play cards simultaneously',
      'Higher card wins both cards',
      'Ties trigger mini-war (1 card down)',
      'Play for 15 rounds',
      'Most cards wins',
    ],
    customizable: {
      drawCount: [1, 3], // Cards face down in war
    },
  },

  {
    id: 'color_match',
    name: 'Color Match',
    description: 'Uno but only colors matter',
    emoji: '🌈',
    baseGame: 'uno',
    deckType: 'uno',
    matchRule: 'color',
    canPlayMultiple: false,
    mustDraw: true,
    drawCount: 1,
    winCondition: 'empty_hand',
    specialCards: ['wild'],
    startingCards: 7,
    maxPlayers: 2,
    rules: [
      'Match color only',
      'Numbers do not matter',
      'Wild cards change color',
      'Draw 1 if no match',
      'First to empty hand wins',
    ],
    customizable: {
      startingCards: [5, 7, 9],
      specialCards: true,
    },
  },

  {
    id: 'number_match',
    name: 'Number Match',
    description: 'Uno but only numbers matter',
    emoji: '🔢',
    baseGame: 'uno',
    deckType: 'uno',
    matchRule: 'number',
    canPlayMultiple: false,
    mustDraw: true,
    drawCount: 2,
    winCondition: 'empty_hand',
    specialCards: [],
    startingCards: 7,
    maxPlayers: 2,
    rules: [
      'Match number only',
      'Colors do not matter',
      'Draw 2 if no match',
      'First to empty hand wins',
    ],
    customizable: {
      startingCards: [5, 7, 9],
      drawCount: [1, 2, 3],
    },
  },
];
