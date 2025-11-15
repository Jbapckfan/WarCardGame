import { UnoCard, UnoColor, UnoValue, UnoGameState } from '../types/uno';

export const createUnoDeck = (): UnoCard[] => {
  const deck: UnoCard[] = [];
  const colors: UnoColor[] = ['red', 'blue', 'green', 'yellow'];
  const numbers: UnoValue[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const actions: UnoValue[] = ['skip', 'reverse', 'draw2'];

  let cardId = 0;

  // Number cards (0 has 1 per color, 1-9 have 2 per color)
  colors.forEach(color => {
    // One 0 per color
    deck.push({ id: `card_${cardId++}`, color, value: '0' });

    // Two of each 1-9 per color
    for (let i = 1; i < numbers.length; i++) {
      deck.push({ id: `card_${cardId++}`, color, value: numbers[i] });
      deck.push({ id: `card_${cardId++}`, color, value: numbers[i] });
    }

    // Two of each action card per color
    actions.forEach(action => {
      deck.push({ id: `card_${cardId++}`, color, value: action });
      deck.push({ id: `card_${cardId++}`, color, value: action });
    });
  });

  // Wild cards (4 of each)
  for (let i = 0; i < 4; i++) {
    deck.push({ id: `card_${cardId++}`, color: 'wild', value: 'wild' });
    deck.push({ id: `card_${cardId++}`, color: 'wild', value: 'wild4' });
  }

  return deck;
};

export const shuffleUnoDeck = (deck: UnoCard[]): UnoCard[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const dealUnoCards = (deck: UnoCard[], cardsPerPlayer: number = 7): {
  player1Hand: UnoCard[];
  player2Hand: UnoCard[];
  remaining: UnoCard[];
} => {
  const player1Hand = deck.slice(0, cardsPerPlayer);
  const player2Hand = deck.slice(cardsPerPlayer, cardsPerPlayer * 2);
  const remaining = deck.slice(cardsPerPlayer * 2);

  return { player1Hand, player2Hand, remaining };
};

export const canPlayCard = (
  card: UnoCard,
  topCard: UnoCard,
  currentColor: UnoColor
): boolean => {
  // Wild cards can always be played
  if (card.value === 'wild' || card.value === 'wild4') {
    return true;
  }

  // If top card is wild, match the chosen color
  if (topCard.value === 'wild' || topCard.value === 'wild4') {
    return card.color === currentColor;
  }

  // Match color or value
  return card.color === topCard.color || card.value === topCard.value;
};

export const applyCardEffect = (
  gameState: UnoGameState,
  playedCard: UnoCard,
  chosenColor?: UnoColor
): Partial<UnoGameState> => {
  const updates: Partial<UnoGameState> = {
    discardPile: [...gameState.discardPile, playedCard],
    lastActionTime: Date.now(),
  };

  switch (playedCard.value) {
    case 'skip':
      // Skip opponent's turn - current player goes again
      updates.lastAction = 'Skip! Same player goes again';
      // Don't change turn
      break;

    case 'reverse':
      // In 2-player, reverse acts like skip
      updates.direction = gameState.direction === 1 ? -1 : 1;
      updates.lastAction = 'Reverse! Same player goes again';
      // Don't change turn
      break;

    case 'draw2':
      updates.mustDraw = (gameState.mustDraw || 0) + 2;
      updates.lastAction = 'Draw 2! Opponent must draw 2 cards';
      updates.currentTurn = gameState.currentTurn === gameState.player1.id
        ? gameState.player2!.id
        : gameState.player1.id;
      break;

    case 'wild':
      updates.currentColor = chosenColor || 'red';
      updates.lastAction = `Wild card played! Color is now ${chosenColor}`;
      updates.currentTurn = gameState.currentTurn === gameState.player1.id
        ? gameState.player2!.id
        : gameState.player1.id;
      break;

    case 'wild4':
      updates.mustDraw = (gameState.mustDraw || 0) + 4;
      updates.currentColor = chosenColor || 'red';
      updates.lastAction = `Wild Draw 4! Opponent must draw 4 cards. Color is now ${chosenColor}`;
      updates.currentTurn = gameState.currentTurn === gameState.player1.id
        ? gameState.player2!.id
        : gameState.player1.id;
      break;

    default:
      // Regular number card
      updates.currentColor = playedCard.color;
      updates.lastAction = `Played ${playedCard.color} ${playedCard.value}`;
      updates.currentTurn = gameState.currentTurn === gameState.player1.id
        ? gameState.player2!.id
        : gameState.player1.id;
  }

  return updates;
};

export const drawCards = (drawPile: UnoCard[], count: number): {
  drawnCards: UnoCard[];
  remainingPile: UnoCard[];
} => {
  if (drawPile.length < count) {
    // Not enough cards - would need to reshuffle discard pile in real game
    const drawnCards = [...drawPile];
    return { drawnCards, remainingPile: [] };
  }

  const drawnCards = drawPile.slice(0, count);
  const remainingPile = drawPile.slice(count);

  return { drawnCards, remainingPile };
};

export const reshuffleDiscardPile = (
  discardPile: UnoCard[],
  drawPile: UnoCard[]
): { newDrawPile: UnoCard[]; newDiscardPile: UnoCard[] } => {
  if (discardPile.length <= 1) {
    return { newDrawPile: drawPile, newDiscardPile: discardPile };
  }

  // Keep top card of discard pile, shuffle rest into draw pile
  const topCard = discardPile[discardPile.length - 1];
  const cardsToShuffle = discardPile.slice(0, -1);

  const newDrawPile = shuffleUnoDeck([...drawPile, ...cardsToShuffle]);
  const newDiscardPile = [topCard];

  return { newDrawPile, newDiscardPile };
};

export const checkWinner = (gameState: UnoGameState): string | null => {
  if (gameState.player1.hand.length === 0) {
    return gameState.player1.id;
  }
  if (gameState.player2 && gameState.player2.hand.length === 0) {
    return gameState.player2.id;
  }
  return null;
};

export const checkUnoCall = (playerId: string, gameState: UnoGameState): boolean => {
  const player = gameState.player1.id === playerId ? gameState.player1 : gameState.player2;
  if (!player) return false;

  // Player should call UNO when they have exactly 1 card
  return player.hand.length === 1;
};

export const calculateUnoScore = (hand: UnoCard[]): number => {
  return hand.reduce((score, card) => {
    if (card.value === 'wild' || card.value === 'wild4') return score + 50;
    if (card.value === 'skip' || card.value === 'reverse' || card.value === 'draw2') return score + 20;
    return score + parseInt(card.value || '0', 10);
  }, 0);
};
