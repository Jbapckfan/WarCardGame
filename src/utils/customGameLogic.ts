import { GameTemplate, MatchRule, CustomGameState } from '../types/customGame';
import { UnoCard, UnoColor } from '../types/uno';
import { Card } from '../types/game';
import { createUnoDeck, shuffleUnoDeck } from './unoLogic';
import { createDeck, shuffleDeck } from './cardUtils';

export const initializeCustomGame = (
  template: GameTemplate,
  gameId: string,
  playerId: string,
  playerName: string
): CustomGameState => {
  // Create and shuffle appropriate deck
  let deck: any[];
  if (template.deckType === 'uno') {
    deck = shuffleUnoDeck(createUnoDeck());
  } else {
    deck = shuffleDeck(createDeck());
  }

  // Deal cards
  const player1Hand = deck.slice(0, template.startingCards);
  const player2Hand = deck.slice(template.startingCards, template.startingCards * 2);
  const remaining = deck.slice(template.startingCards * 2);

  // Set up initial game state
  const drawPile = remaining.slice(1);
  const discardPile = [remaining[0]];

  return {
    id: gameId,
    template,
    player1: {
      id: playerId,
      name: playerName || 'You',
      hand: player1Hand,
      score: 0,
    },
    player2: {
      id: 'ai_player',
      name: 'AI',
      hand: player2Hand,
      score: 0,
    },
    pile: [],
    discardPile,
    drawPile,
    currentTurn: playerId,
    currentColor: template.deckType === 'uno' ? (discardPile[0] as UnoCard).color : undefined,
    gameStatus: 'playing',
    lastAction: `${template.name} started!`,
    lastActionTime: Date.now(),
    winner: null,
  };
};

export const canPlayCardCustom = (
  card: any,
  topCard: any,
  matchRule: MatchRule,
  currentColor?: string
): boolean => {
  if (!topCard) return true;

  switch (matchRule) {
    case 'any':
      return true;

    case 'exact_match':
      return card.rank === topCard.rank && card.suit === topCard.suit;

    case 'color':
      // Uno-style color matching
      if (card.value === 'wild' || card.value === 'wild4') return true;
      if (currentColor) return card.color === currentColor;
      return card.color === topCard.color;

    case 'number':
      // Uno-style number matching
      if (card.value === 'wild' || card.value === 'wild4') return true;
      return card.value === topCard.value;

    case 'color_or_number':
      // Standard Uno rules
      if (card.value === 'wild' || card.value === 'wild4') return true;
      if (currentColor && card.color === currentColor) return true;
      return card.color === topCard.color || card.value === topCard.value;

    case 'suit':
      // Standard deck suit matching
      return card.suit === topCard.suit;

    case 'rank':
      // Standard deck rank matching
      return card.rank === topCard.rank;

    case 'suit_or_rank':
      // Crazy Eights style
      return card.suit === topCard.suit || card.rank === topCard.rank || card.rank === '8';

    case 'higher_rank':
      // War style - not used for playability check
      return true;

    default:
      return false;
  }
};

export const getCardValue = (card: any): number => {
  if ('value' in card) {
    // Uno card
    const unoValues: { [key: string]: number } = {
      '0': 0, '1': 1, '2': 2, '3': 3, '4': 4,
      '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
      'skip': 10, 'reverse': 10, 'draw2': 10,
      'wild': 11, 'wild4': 12,
    };
    return unoValues[card.value] || 0;
  } else {
    // Standard card
    const rankValues: { [key: string]: number } = {
      '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
      '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
    };
    return rankValues[card.rank] || 0;
  }
};

export const makeAIMove = (
  gameState: CustomGameState
): {
  action: 'play' | 'draw';
  card?: any;
  chosenColor?: UnoColor;
} => {
  if (!gameState.player2) {
    return { action: 'draw' };
  }

  const topCard = gameState.discardPile[gameState.discardPile.length - 1];
  const aiHand = gameState.player2.hand;

  // Find playable cards
  const playableCards = aiHand.filter((card) =>
    canPlayCardCustom(card, topCard, gameState.template.matchRule, gameState.currentColor)
  );

  if (playableCards.length > 0) {
    // Play first valid card
    const cardToPlay = playableCards[0];

    // Choose color for wild cards
    let chosenColor: UnoColor | undefined;
    if (gameState.template.deckType === 'uno' && (cardToPlay.value === 'wild' || cardToPlay.value === 'wild4')) {
      // Pick most common color in hand
      const colorCounts: { [key in UnoColor]: number } = { red: 0, blue: 0, green: 0, yellow: 0, wild: 0 };
      aiHand.forEach((c: UnoCard) => {
        if (c.color !== 'wild') colorCounts[c.color]++;
      });
      const colors = Object.entries(colorCounts)
        .filter(([color]) => color !== 'wild')
        .sort(([, a], [, b]) => b - a);
      chosenColor = (colors[0]?.[0] as UnoColor) || 'red';
    }

    return { action: 'play', card: cardToPlay, chosenColor };
  }

  // Must draw
  return { action: 'draw' };
};

export const checkCustomGameWinner = (gameState: CustomGameState): string | null => {
  if (!gameState.player2) return null;

  switch (gameState.template.winCondition) {
    case 'empty_hand':
      if (gameState.player1.hand.length === 0) return gameState.player1.id;
      if (gameState.player2.hand.length === 0) return gameState.player2.id;
      return null;

    case 'most_cards':
      // Check after certain number of rounds or when draw pile empty
      if (gameState.drawPile.length === 0) {
        if (gameState.player1.hand.length > gameState.player2.hand.length) {
          return gameState.player1.id;
        }
        if (gameState.player2.hand.length > gameState.player1.hand.length) {
          return gameState.player2.id;
        }
        return null; // Tie
      }
      return null;

    case 'least_cards':
      if (gameState.drawPile.length === 0) {
        if (gameState.player1.hand.length < gameState.player2.hand.length) {
          return gameState.player1.id;
        }
        if (gameState.player2.hand.length < gameState.player1.hand.length) {
          return gameState.player2.id;
        }
        return null;
      }
      return null;

    case 'first_to_points':
      if (gameState.template.targetPoints) {
        if (gameState.player1.score >= gameState.template.targetPoints) {
          return gameState.player1.id;
        }
        if (gameState.player2.score >= gameState.template.targetPoints) {
          return gameState.player2.id;
        }
      }
      return null;

    case 'lowest_points':
      // Not implemented yet
      return null;

    default:
      return null;
  }
};

export const getCardDisplay = (card: any): string => {
  if ('value' in card) {
    // Uno card
    return `${card.color} ${card.value}`;
  } else {
    // Standard card
    return `${card.rank}${card.suit}`;
  }
};

export const reshuffleIfNeeded = (
  drawPile: any[],
  discardPile: any[],
  cardsNeeded: number
): { drawPile: any[]; discardPile: any[] } => {
  if (drawPile.length >= cardsNeeded) {
    return { drawPile, discardPile };
  }

  if (discardPile.length <= 1) {
    // Not enough cards to reshuffle
    return { drawPile, discardPile };
  }

  // Keep top card, shuffle rest into draw pile
  const topCard = discardPile[discardPile.length - 1];
  const cardsToShuffle = discardPile.slice(0, -1);

  // Shuffle
  const shuffled = [...cardsToShuffle, ...drawPile];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return {
    drawPile: shuffled,
    discardPile: [topCard],
  };
};
