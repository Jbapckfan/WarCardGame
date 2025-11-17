import { UnoCard, UnoColor, UnoValue } from '../types/uno';

export const createUnoDeck = (): UnoCard[] => {
  const deck: UnoCard[] = [];
  const colors: UnoColor[] = ['red', 'blue', 'green', 'yellow'];
  const values: UnoValue[] = [
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    'skip', 'reverse', 'draw2'
  ];

  let cardId = 0;

  // Add colored cards (0-9, skip, reverse, draw2)
  colors.forEach(color => {
    values.forEach(value => {
      // Add one '0' card per color, two of everything else
      const count = value === '0' ? 1 : 2;
      for (let i = 0; i < count; i++) {
        deck.push({
          id: `uno_${cardId++}`,
          color,
          value,
        });
      }
    });
  });

  // Add wild cards (4 wild, 4 wild draw 4)
  for (let i = 0; i < 4; i++) {
    deck.push({
      id: `uno_${cardId++}`,
      color: 'wild',
      value: 'wild',
    });
    deck.push({
      id: `uno_${cardId++}`,
      color: 'wild',
      value: 'wild_draw4',
    });
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

export const canPlayCard = (
  card: UnoCard,
  topCard: UnoCard,
  currentColor: UnoColor
): boolean => {
  // Wild cards can always be played
  if (card.color === 'wild') {
    return true;
  }

  // Match color or value
  if (card.color === currentColor || card.color === topCard.color) {
    return true;
  }

  if (card.value === topCard.value) {
    return true;
  }

  return false;
};

export const getCardColor = (card: UnoCard): string => {
  const colorMap: Record<UnoColor | 'wild', string> = {
    red: '#DC2626',
    blue: '#2563EB',
    green: '#16A34A',
    yellow: '#EAB308',
    wild: '#1F2937',
  };
  return colorMap[card.color];
};

export const isActionCard = (card: UnoCard): boolean => {
  return ['skip', 'reverse', 'draw2', 'wild', 'wild_draw4'].includes(card.value);
};
