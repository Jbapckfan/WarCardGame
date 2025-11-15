import { KingsCard, KingsGameState } from '../types/kingsCorners';

const SUITS: Array<'hearts' | 'diamonds' | 'clubs' | 'spades'> = ['hearts', 'diamonds', 'clubs', 'spades'];
const VALUES: Array<'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'> =
  ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const getCardColor = (suit: string): 'red' | 'black' => {
  return suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black';
};

export const getCardValue = (value: string): number => {
  const values: { [key: string]: number } = {
    'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
    '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13
  };
  return values[value] || 0;
};

export const createKingsDeck = (): KingsCard[] => {
  const deck: KingsCard[] = [];
  let id = 0;

  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({
        id: `${suit}_${value}_${id++}`,
        suit,
        value,
        color: getCardColor(suit),
      });
    }
  }

  return deck;
};

export const shuffleKingsDeck = (deck: KingsCard[]): KingsCard[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const dealKingsGame = (deck: KingsCard[], playerCount: number): {
  hands: KingsCard[][];
  sideN: KingsCard[];
  sideE: KingsCard[];
  sideS: KingsCard[];
  sideW: KingsCard[];
  remaining: KingsCard[];
} => {
  const shuffled = shuffleKingsDeck(deck);

  // Deal 7 cards to each player
  const hands: KingsCard[][] = [];
  let index = 0;

  for (let p = 0; p < playerCount; p++) {
    hands.push(shuffled.slice(index, index + 7));
    index += 7;
  }

  // Deal 4 cards to side piles (N, E, S, W)
  const sideN = [shuffled[index++]];
  const sideE = [shuffled[index++]];
  const sideS = [shuffled[index++]];
  const sideW = [shuffled[index++]];

  const remaining = shuffled.slice(index);

  return { hands, sideN, sideE, sideS, sideW, remaining };
};

/**
 * Check if a card can be placed on top of a pile
 * Must be descending rank and alternating color
 */
export const canPlaceCard = (card: KingsCard, topCard: KingsCard): boolean => {
  const cardVal = getCardValue(card.value);
  const topVal = getCardValue(topCard.value);

  // Must be one less in value
  if (cardVal !== topVal - 1) return false;

  // Must be alternating color
  if (card.color === topCard.color) return false;

  return true;
};

/**
 * Check if a pile can be moved onto another pile
 * The bottom card of the moving pile must be valid on top of the target pile
 */
export const canMovePile = (movingPile: KingsCard[], targetPile: KingsCard[]): boolean => {
  if (movingPile.length === 0 || targetPile.length === 0) return false;

  const bottomCard = movingPile[0]; // First card in pile (bottom of visual stack)
  const targetTop = targetPile[targetPile.length - 1]; // Top card of target

  return canPlaceCard(bottomCard, targetTop);
};

/**
 * Check if a card is a King
 */
export const isKing = (card: KingsCard): boolean => {
  return card.value === 'K';
};

/**
 * Check for win condition
 * Player wins when their hand is empty
 */
export const checkWinner = (state: KingsGameState): number | null => {
  if (state.currentPlayerHand.length === 0) {
    return state.currentTurn;
  }
  return null;
};

/**
 * Check if game is stuck (no more valid moves)
 */
export const isGameStuck = (state: KingsGameState): boolean => {
  // If draw pile is empty and player has no valid moves, game might be stuck
  // This is a simplified check
  if (state.drawPile.length === 0 && state.currentPlayerHand.length > 0) {
    // Check if any card in hand can be played
    const hand = state.currentPlayerHand;
    const allPiles = [
      ...state.cornerNW, ...state.cornerNE, ...state.cornerSW, ...state.cornerSE,
      ...state.sideN, ...state.sideE, ...state.sideS, ...state.sideW
    ];

    // Simplified: if no cards can be played anywhere, stuck
    // In real game, would check all possible moves
    return false; // For now, assume game can continue
  }

  return false;
};

/**
 * Get display name for pile
 */
export const getPileName = (pile: string): string => {
  const names: { [key: string]: string } = {
    'cornerNW': 'NW Corner',
    'cornerNE': 'NE Corner',
    'cornerSW': 'SW Corner',
    'cornerSE': 'SE Corner',
    'sideN': 'North',
    'sideE': 'East',
    'sideS': 'South',
    'sideW': 'West',
  };
  return names[pile] || pile;
};
