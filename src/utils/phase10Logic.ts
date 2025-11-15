import { Phase10Card, Phase10Color, Phase10Value, Phase10GameState, PHASES, Phase } from '../types/phase10';

export const createPhase10Deck = (): Phase10Card[] => {
  const deck: Phase10Card[] = [];
  const colors: Phase10Color[] = ['red', 'blue', 'green', 'yellow'];
  const numbers: Phase10Value[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

  let cardId = 0;

  // Two complete sets of number cards (2 of each color/number combo)
  for (let set = 0; set < 2; set++) {
    colors.forEach(color => {
      numbers.forEach(number => {
        deck.push({ id: `card_${cardId++}`, color, value: number });
      });
    });
  }

  // Wild cards (8 total)
  for (let i = 0; i < 8; i++) {
    deck.push({ id: `card_${cardId++}`, color: 'wild', value: 'wild' });
  }

  // Skip cards (4 total)
  for (let i = 0; i < 4; i++) {
    deck.push({ id: `card_${cardId++}`, color: 'wild', value: 'skip' });
  }

  return deck;
};

export const shufflePhase10Deck = (deck: Phase10Card[]): Phase10Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const dealPhase10Cards = (deck: Phase10Card[], cardsPerPlayer: number = 10): {
  player1Hand: Phase10Card[];
  player2Hand: Phase10Card[];
  remaining: Phase10Card[];
} => {
  const player1Hand = deck.slice(0, cardsPerPlayer);
  const player2Hand = deck.slice(cardsPerPlayer, cardsPerPlayer * 2);
  const remaining = deck.slice(cardsPerPlayer * 2);

  return { player1Hand, player2Hand, remaining };
};

export const canPlayOnPhase = (
  card: Phase10Card,
  phaseCards: Phase10Card[]
): boolean => {
  if (phaseCards.length === 0) return false;
  if (card.value === 'skip') return false;

  // Check if it's a set (all same number)
  const firstCard = phaseCards[0];
  const isSet = phaseCards.every(c =>
    c.value === firstCard.value || c.value === 'wild'
  );

  if (isSet) {
    // Can play if same value or wild
    return card.value === firstCard.value || card.value === 'wild';
  }

  // Check if it's a run (sequential numbers)
  const numbers = phaseCards
    .filter(c => c.value !== 'wild')
    .map(c => parseInt(c.value, 10))
    .sort((a, b) => a - b);

  if (numbers.length > 0) {
    const cardNum = parseInt(card.value, 10);
    const minNum = numbers[0];
    const maxNum = numbers[numbers.length - 1];

    // Can play if it extends the run or is wild
    return (
      card.value === 'wild' ||
      cardNum === minNum - 1 ||
      cardNum === maxNum + 1 ||
      (cardNum >= minNum && cardNum <= maxNum)
    );
  }

  return false;
};

export const isValidSet = (cards: Phase10Card[], requiredSize: number): boolean => {
  if (cards.length < requiredSize) return false;

  const nonWildCards = cards.filter(c => c.value !== 'wild');
  if (nonWildCards.length === 0) return false; // Can't have all wilds

  const firstValue = nonWildCards[0].value;
  return nonWildCards.every(c => c.value === firstValue);
};

export const isValidRun = (cards: Phase10Card[], requiredLength: number): boolean => {
  if (cards.length < requiredLength) return false;

  const nonWildCards = cards.filter(c => c.value !== 'wild');
  const numbers = nonWildCards.map(c => parseInt(c.value, 10)).sort((a, b) => a - b);

  if (numbers.length === 0) return false; // Can't have all wilds

  // Check for sequential numbers (accounting for wilds)
  const wildCount = cards.length - numbers.length;
  let expectedLength = numbers.length;

  for (let i = 1; i < numbers.length; i++) {
    const gap = numbers[i] - numbers[i - 1] - 1;
    if (gap > wildCount) return false; // Not enough wilds to fill gaps
    expectedLength += gap;
  }

  return expectedLength >= requiredLength;
};

export const isValidColorSet = (cards: Phase10Card[], requiredCount: number): boolean => {
  if (cards.length < requiredCount) return false;

  const nonWildCards = cards.filter(c => c.value !== 'wild');
  if (nonWildCards.length === 0) return false;

  const firstColor = nonWildCards[0].color;
  return nonWildCards.every(c => c.color === firstColor);
};

export const validatePhaseCompletion = (
  phase: Phase,
  laidDownCards: Phase10Card[][]
): boolean => {
  if (laidDownCards.length === 0) return false;

  // Phase 1: 2 sets of 3
  if (phase.id === 1) {
    return laidDownCards.length === 2 &&
      isValidSet(laidDownCards[0], 3) &&
      isValidSet(laidDownCards[1], 3);
  }

  // Phase 2: 1 set of 3 + 1 run of 4
  if (phase.id === 2) {
    return laidDownCards.length === 2 &&
      ((isValidSet(laidDownCards[0], 3) && isValidRun(laidDownCards[1], 4)) ||
       (isValidRun(laidDownCards[0], 4) && isValidSet(laidDownCards[1], 3)));
  }

  // Phase 3: 1 set of 4 + 1 run of 4
  if (phase.id === 3) {
    return laidDownCards.length === 2 &&
      ((isValidSet(laidDownCards[0], 4) && isValidRun(laidDownCards[1], 4)) ||
       (isValidRun(laidDownCards[0], 4) && isValidSet(laidDownCards[1], 4)));
  }

  // Phase 4: 1 run of 7
  if (phase.id === 4) {
    return laidDownCards.length === 1 && isValidRun(laidDownCards[0], 7);
  }

  // Phase 5: 1 run of 8
  if (phase.id === 5) {
    return laidDownCards.length === 1 && isValidRun(laidDownCards[0], 8);
  }

  // Phase 6: 1 run of 9
  if (phase.id === 6) {
    return laidDownCards.length === 1 && isValidRun(laidDownCards[0], 9);
  }

  // Phase 7: 2 sets of 4
  if (phase.id === 7) {
    return laidDownCards.length === 2 &&
      isValidSet(laidDownCards[0], 4) &&
      isValidSet(laidDownCards[1], 4);
  }

  // Phase 8: 7 cards of one color
  if (phase.id === 8) {
    return laidDownCards.length === 1 && isValidColorSet(laidDownCards[0], 7);
  }

  // Phase 9: 1 set of 5 + 1 set of 2
  if (phase.id === 9) {
    return laidDownCards.length === 2 &&
      ((isValidSet(laidDownCards[0], 5) && isValidSet(laidDownCards[1], 2)) ||
       (isValidSet(laidDownCards[0], 2) && isValidSet(laidDownCards[1], 5)));
  }

  // Phase 10: 1 set of 5 + 1 set of 3
  if (phase.id === 10) {
    return laidDownCards.length === 2 &&
      ((isValidSet(laidDownCards[0], 5) && isValidSet(laidDownCards[1], 3)) ||
       (isValidSet(laidDownCards[0], 3) && isValidSet(laidDownCards[1], 5)));
  }

  return false;
};

export const drawCards = (drawPile: Phase10Card[], count: number): {
  drawnCards: Phase10Card[];
  remainingPile: Phase10Card[];
} => {
  if (drawPile.length < count) {
    const drawnCards = [...drawPile];
    return { drawnCards, remainingPile: [] };
  }

  const drawnCards = drawPile.slice(0, count);
  const remainingPile = drawPile.slice(count);

  return { drawnCards, remainingPile };
};

export const reshuffleDiscardPile = (
  discardPile: Phase10Card[],
  drawPile: Phase10Card[]
): { newDrawPile: Phase10Card[]; newDiscardPile: Phase10Card[] } => {
  if (discardPile.length <= 1) {
    return { newDrawPile: drawPile, newDiscardPile: discardPile };
  }

  const topCard = discardPile[discardPile.length - 1];
  const cardsToShuffle = discardPile.slice(0, -1);

  const newDrawPile = shufflePhase10Deck([...drawPile, ...cardsToShuffle]);
  const newDiscardPile = [topCard];

  return { newDrawPile, newDiscardPile };
};

export const calculatePhase10Score = (hand: Phase10Card[]): number => {
  return hand.reduce((score, card) => {
    if (card.value === 'wild' || card.value === 'skip') return score + 25;
    if (parseInt(card.value, 10) >= 10) return score + 10;
    return score + 5;
  }, 0);
};

export const checkRoundWinner = (gameState: Phase10GameState): string | null => {
  if (gameState.player1.hand.length === 0) {
    return gameState.player1.id;
  }
  if (gameState.player2 && gameState.player2.hand.length === 0) {
    return gameState.player2.id;
  }
  return null;
};

export const checkGameWinner = (gameState: Phase10GameState): string | null => {
  // Winner is first to complete Phase 10
  if (gameState.player1.currentPhase > 10) {
    return gameState.player1.id;
  }
  if (gameState.player2 && gameState.player2.currentPhase > 10) {
    return gameState.player2.id;
  }
  return null;
};

export const getCurrentPhase = (phaseNumber: number): Phase => {
  return PHASES[Math.min(phaseNumber - 1, PHASES.length - 1)];
};
