import { Card, Suit } from '../types/game';
import { SolitaireGameState } from '../types/solitaire';
import { createDeck, shuffleDeck, getSuitColor } from './cardUtils';

/**
 * Initialize a new Solitaire game
 */
export const dealSolitaireGame = (gameId: string, drawCount: number = 3): SolitaireGameState => {
  const deck = shuffleDeck(createDeck());

  // Deal tableau piles (1, 2, 3, 4, 5, 6, 7 cards)
  const tableau: Card[][] = [[], [], [], [], [], [], []];
  let deckIndex = 0;

  for (let pile = 0; pile < 7; pile++) {
    for (let card = 0; card <= pile; card++) {
      tableau[pile].push(deck[deckIndex]);
      deckIndex++;
    }
  }

  // Remaining cards go to stock
  const stock = deck.slice(deckIndex);

  return {
    id: gameId,
    tableau,
    foundations: {
      hearts: [],
      diamonds: [],
      clubs: [],
      spades: [],
    },
    stock,
    waste: [],
    drawCount,
    moves: 0,
    score: 0,
    gameStatus: 'playing',
    startTime: Date.now(),
    endTime: null,
  };
};

/**
 * Check if a card can be placed on a tableau pile
 */
export const canPlaceOnTableau = (card: Card, pile: Card[]): boolean => {
  if (pile.length === 0) {
    // Only Kings can be placed on empty tableau piles
    return card.rank === 13;
  }

  const topCard = pile[pile.length - 1];

  // Must be descending rank
  if (card.rank !== topCard.rank - 1) {
    return false;
  }

  // Must be alternating colors
  const cardColor = getSuitColor(card.suit);
  const topCardColor = getSuitColor(topCard.suit);
  return cardColor !== topCardColor;
};

/**
 * Check if a card can be placed on a foundation pile
 */
export const canPlaceOnFoundation = (card: Card, foundationPile: Card[]): boolean => {
  if (foundationPile.length === 0) {
    // Only Aces can start a foundation
    return card.rank === 14; // Ace
  }

  const topCard = foundationPile[foundationPile.length - 1];

  // Must be same suit
  if (card.suit !== topCard.suit) {
    return false;
  }

  // Must be ascending rank (Ace=14, 2=2, ..., King=13)
  // In foundation, we go A(14) -> 2 -> 3 -> ... -> K(13)
  if (topCard.rank === 14) {
    return card.rank === 2;
  }
  return card.rank === topCard.rank + 1;
};

/**
 * Get a sequence of cards from a tableau pile starting at index
 */
export const getTableauSequence = (pile: Card[], startIndex: number): Card[] => {
  const sequence: Card[] = [];

  for (let i = startIndex; i < pile.length; i++) {
    sequence.push(pile[i]);

    // Validate sequence continues properly
    if (i < pile.length - 1) {
      const current = pile[i];
      const next = pile[i + 1];

      if (next.rank !== current.rank - 1 ||
          getSuitColor(next.suit) === getSuitColor(current.suit)) {
        // Sequence broken
        break;
      }
    }
  }

  return sequence;
};

/**
 * Move card(s) from one location to another
 */
export const moveCards = (
  state: SolitaireGameState,
  fromType: 'tableau' | 'foundation' | 'waste',
  fromIndex: number,
  toType: 'tableau' | 'foundation',
  toIndex: number,
  cardIndex: number = -1 // -1 means last card
): SolitaireGameState | null => {
  let cardsToMove: Card[] = [];
  let newState = { ...state };

  // Get cards to move
  if (fromType === 'tableau') {
    const pile = state.tableau[fromIndex];
    if (pile.length === 0) return null;

    const startIndex = cardIndex >= 0 ? cardIndex : pile.length - 1;
    cardsToMove = getTableauSequence(pile, startIndex);

    if (cardsToMove.length === 0) return null;

    // Remove cards from source
    newState.tableau[fromIndex] = pile.slice(0, startIndex);
  } else if (fromType === 'waste') {
    if (state.waste.length === 0) return null;
    cardsToMove = [state.waste[state.waste.length - 1]];
    newState.waste = state.waste.slice(0, -1);
  } else if (fromType === 'foundation') {
    const foundationKey = (['hearts', 'diamonds', 'clubs', 'spades'] as const)[fromIndex];
    const pile = state.foundations[foundationKey];
    if (pile.length === 0) return null;
    cardsToMove = [pile[pile.length - 1]];
    newState.foundations[foundationKey] = pile.slice(0, -1);
  }

  // Place cards at destination
  if (toType === 'tableau') {
    const targetPile = newState.tableau[toIndex];

    // Check if first card can be placed
    if (!canPlaceOnTableau(cardsToMove[0], targetPile)) {
      return null;
    }

    newState.tableau[toIndex] = [...targetPile, ...cardsToMove];
  } else if (toType === 'foundation') {
    // Can only move single cards to foundation
    if (cardsToMove.length !== 1) return null;

    const foundationKey = (['hearts', 'diamonds', 'clubs', 'spades'] as const)[toIndex];
    const targetPile = newState.foundations[foundationKey];

    if (!canPlaceOnFoundation(cardsToMove[0], targetPile)) {
      return null;
    }

    newState.foundations[foundationKey] = [...targetPile, cardsToMove[0]];
    newState.score += 10; // Points for moving to foundation
  }

  newState.moves++;
  return newState;
};

/**
 * Draw card(s) from stock to waste
 */
export const drawFromStock = (state: SolitaireGameState): SolitaireGameState => {
  if (state.stock.length === 0) {
    // Recycle waste back to stock
    return {
      ...state,
      stock: [...state.waste].reverse(),
      waste: [],
    };
  }

  const cardsToDraw = Math.min(state.drawCount, state.stock.length);
  const drawnCards = state.stock.slice(0, cardsToDraw);

  return {
    ...state,
    stock: state.stock.slice(cardsToDraw),
    waste: [...state.waste, ...drawnCards],
    moves: state.moves + 1,
  };
};

/**
 * Auto-move cards to foundation if possible (hint feature)
 */
export const getAutoMoveToFoundation = (state: SolitaireGameState): SolitaireGameState | null => {
  // Try to move top card from each tableau pile to foundation
  for (let i = 0; i < state.tableau.length; i++) {
    const pile = state.tableau[i];
    if (pile.length === 0) continue;

    const topCard = pile[pile.length - 1];
    const foundationIndex = ['hearts', 'diamonds', 'clubs', 'spades'].indexOf(topCard.suit);

    const newState = moveCards(state, 'tableau', i, 'foundation', foundationIndex);
    if (newState) return newState;
  }

  // Try to move from waste
  if (state.waste.length > 0) {
    const topCard = state.waste[state.waste.length - 1];
    const foundationIndex = ['hearts', 'diamonds', 'clubs', 'spades'].indexOf(topCard.suit);

    const newState = moveCards(state, 'waste', 0, 'foundation', foundationIndex);
    if (newState) return newState;
  }

  return null;
};

/**
 * Check if game is won
 */
export const checkSolitaireWin = (state: SolitaireGameState): boolean => {
  // All foundations must have 13 cards (Ace through King)
  return (
    state.foundations.hearts.length === 13 &&
    state.foundations.diamonds.length === 13 &&
    state.foundations.clubs.length === 13 &&
    state.foundations.spades.length === 13
  );
};

/**
 * Calculate final score
 */
export const calculateScore = (state: SolitaireGameState): number => {
  let score = state.score;

  // Bonus for winning
  if (state.gameStatus === 'won') {
    score += 1000;

    // Time bonus (faster = more points)
    if (state.endTime) {
      const timeInSeconds = (state.endTime - state.startTime) / 1000;
      const timeBonus = Math.max(0, 10000 - timeInSeconds * 2);
      score += Math.floor(timeBonus);
    }
  }

  return score;
};
