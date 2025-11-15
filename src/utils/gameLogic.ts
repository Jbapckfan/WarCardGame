import { Card, GameState, Player, WarState } from '../types/game';

export const compareCards = (card1: Card, card2: Card): number => {
  return card1.rank - card2.rank;
};

export const isWarTriggered = (card1: Card, card2: Card, sixSevenRuleEnabled: boolean): boolean => {
  // Regular war: same rank
  if (card1.rank === card2.rank) return true;

  // 6-7 rule: if one card is 6 and the other is 7
  if (sixSevenRuleEnabled) {
    const ranks = [card1.rank, card2.rank].sort();
    if (ranks[0] === 6 && ranks[1] === 7) return true;
  }

  return false;
};

export const playRound = (
  player1: Player,
  player2: Player,
  sixSevenRuleEnabled: boolean
): {
  winner: string | null;
  player1NewDeck: Card[];
  player2NewDeck: Card[];
  cardsWon: Card[];
  isWar: boolean;
  warType: 'regular' | 'six-seven' | null;
} => {
  if (player1.deck.length === 0 || player2.deck.length === 0) {
    return {
      winner: player1.deck.length > 0 ? player1.id : player2.id,
      player1NewDeck: player1.deck,
      player2NewDeck: player2.deck,
      cardsWon: [],
      isWar: false,
      warType: null,
    };
  }

  const card1 = player1.deck[0];
  const card2 = player2.deck[0];

  const player1DeckAfterDraw = player1.deck.slice(1);
  const player2DeckAfterDraw = player2.deck.slice(1);

  // Check if war is triggered
  const warTriggered = isWarTriggered(card1, card2, sixSevenRuleEnabled);

  if (warTriggered) {
    const ranks = [card1.rank, card2.rank].sort();
    const isSixSevenWar = ranks[0] === 6 && ranks[1] === 7;

    return {
      winner: null,
      player1NewDeck: player1DeckAfterDraw,
      player2NewDeck: player2DeckAfterDraw,
      cardsWon: [card1, card2],
      isWar: true,
      warType: isSixSevenWar ? 'six-seven' : 'regular',
    };
  }

  // Determine winner
  const comparison = compareCards(card1, card2);

  if (comparison > 0) {
    // Player 1 wins
    return {
      winner: player1.id,
      player1NewDeck: [...player1DeckAfterDraw, card1, card2],
      player2NewDeck: player2DeckAfterDraw,
      cardsWon: [card1, card2],
      isWar: false,
      warType: null,
    };
  } else {
    // Player 2 wins
    return {
      winner: player2.id,
      player1NewDeck: player1DeckAfterDraw,
      player2NewDeck: [...player2DeckAfterDraw, card1, card2],
      cardsWon: [card1, card2],
      isWar: false,
      warType: null,
    };
  }
};

export const resolveWar = (
  player1: Player,
  player2: Player,
  warCards: Card[],
  warType: 'regular' | 'six-seven'
): {
  winner: string | null;
  player1NewDeck: Card[];
  player2NewDeck: Card[];
  continueWar: boolean;
} => {
  const faceDownCards = warType === 'six-seven' ? 1 : 3;

  // Check if either player has enough cards
  if (player1.deck.length < faceDownCards + 1) {
    return {
      winner: player2.id,
      player1NewDeck: [],
      player2NewDeck: [...player2.deck, ...warCards],
      continueWar: false,
    };
  }

  if (player2.deck.length < faceDownCards + 1) {
    return {
      winner: player1.id,
      player1NewDeck: [...player1.deck, ...warCards],
      player2NewDeck: [],
      continueWar: false,
    };
  }

  // Draw face-down cards
  const player1FaceDown = player1.deck.slice(0, faceDownCards);
  const player2FaceDown = player2.deck.slice(0, faceDownCards);

  // Draw face-up cards
  const player1FaceUp = player1.deck[faceDownCards];
  const player2FaceUp = player2.deck[faceDownCards];

  const allWarCards = [
    ...warCards,
    ...player1FaceDown,
    ...player2FaceDown,
    player1FaceUp,
    player2FaceUp,
  ];

  const player1DeckAfter = player1.deck.slice(faceDownCards + 1);
  const player2DeckAfter = player2.deck.slice(faceDownCards + 1);

  // Check if another war is triggered
  if (player1FaceUp.rank === player2FaceUp.rank) {
    return {
      winner: null,
      player1NewDeck: player1DeckAfter,
      player2NewDeck: player2DeckAfter,
      continueWar: true,
    };
  }

  // Determine winner
  if (player1FaceUp.rank > player2FaceUp.rank) {
    return {
      winner: player1.id,
      player1NewDeck: [...player1DeckAfter, ...allWarCards],
      player2NewDeck: player2DeckAfter,
      continueWar: false,
    };
  } else {
    return {
      winner: player2.id,
      player1NewDeck: player1DeckAfter,
      player2NewDeck: [...player2DeckAfter, ...allWarCards],
      continueWar: false,
    };
  }
};
