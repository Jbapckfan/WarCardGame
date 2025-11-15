import { Card, Rank } from '../types/game';
import { SlapRule } from '../types/ers';

export const isFaceCard = (rank: Rank): boolean => {
  return rank >= 11; // J, Q, K, A
};

export const getFaceCardValue = (rank: Rank): number => {
  switch (rank) {
    case 11: return 1; // Jack
    case 12: return 2; // Queen
    case 13: return 3; // King
    case 14: return 4; // Ace
    default: return 0;
  }
};

export const checkDouble = (pile: Card[]): boolean => {
  if (pile.length < 2) return false;
  const lastTwo = pile.slice(-2);
  return lastTwo[0].rank === lastTwo[1].rank;
};

export const checkSandwich = (pile: Card[]): boolean => {
  if (pile.length < 3) return false;
  const lastThree = pile.slice(-3);
  return lastThree[0].rank === lastThree[2].rank;
};

export const checkTens = (pile: Card[]): boolean => {
  if (pile.length < 2) return false;
  const lastTwo = pile.slice(-2);
  const sum = lastTwo[0].rank + lastTwo[1].rank;
  return sum === 10 || sum === 20; // 10 or two face cards that sum to 10
};

export const checkMarriage = (pile: Card[]): boolean => {
  if (pile.length < 2) return false;
  const lastTwo = pile.slice(-2);
  const ranks = [lastTwo[0].rank, lastTwo[1].rank].sort();
  return (ranks[0] === 12 && ranks[1] === 13); // Queen and King
};

export const checkDivorce = (pile: Card[]): boolean => {
  if (pile.length < 3) return false;
  const lastThree = pile.slice(-3);
  // King-card-Queen or Queen-card-King
  const first = lastThree[0].rank;
  const third = lastThree[2].rank;
  return (first === 12 && third === 13) || (first === 13 && third === 12);
};

export const checkValidSlap = (pile: Card[]): { valid: boolean; rules: SlapRule[] } => {
  const validRules: SlapRule[] = [];

  // Only allow slapping on doubles
  if (checkDouble(pile)) validRules.push('double');

  return {
    valid: validRules.length > 0,
    rules: validRules,
  };
};

export const shouldStartFaceCardChallenge = (card: Card): number => {
  return getFaceCardValue(card.rank);
};

export const penaltyCards = (playerDeck: Card[], count: number): Card[] => {
  const penalty = playerDeck.slice(0, Math.min(count, playerDeck.length));
  return penalty;
};

export const formatSlapRules = (rules: SlapRule[]): string => {
  return rules
    .map((rule) => {
      switch (rule) {
        case 'double':
          return 'Double';
        case 'sandwich':
          return 'Sandwich';
        case 'tens':
          return 'Tens';
        case 'marriage':
          return 'Marriage';
        case 'divorce':
          return 'Divorce';
      }
    })
    .join(', ');
};
