import { Card } from '../types/game';
import { Phase10Phase, PHASE_REQUIREMENTS } from '../types/phase10';

export const isSet = (cards: Card[]): boolean => {
  if (cards.length < 2) return false;
  const ranks = cards.map(c => c.rank);
  const uniqueRanks = new Set(ranks);
  return uniqueRanks.size === 1;
};

export const isRun = (cards: Card[]): boolean => {
  if (cards.length < 3) return false;
  const ranks = cards.map(c => c.rank).sort((a, b) => a - b);

  for (let i = 0; i < ranks.length - 1; i++) {
    if (ranks[i + 1] !== ranks[i] + 1) {
      return false;
    }
  }
  return true;
};

export const isSameColor = (cards: Card[]): boolean => {
  if (cards.length === 0) return false;
  const isRed = (suit: string) => suit === 'hearts' || suit === 'diamonds';
  const firstCardIsRed = isRed(cards[0].suit);

  return cards.every(card => isRed(card.suit) === firstCardIsRed);
};

export const validatePhase = (
  phaseNumber: number,
  sets: Card[][],
  runs: Card[][]
): boolean => {
  const phaseType = PHASE_REQUIREMENTS[phaseNumber];

  switch (phaseType) {
    case 'TWO_SETS_OF_3':
      return sets.length === 2 && sets.every(s => s.length >= 3 && isSet(s));

    case 'ONE_SET_OF_3_ONE_RUN_OF_4':
      return sets.length === 1 && sets[0].length >= 3 && isSet(sets[0]) &&
             runs.length === 1 && runs[0].length >= 4 && isRun(runs[0]);

    case 'ONE_SET_OF_4_ONE_RUN_OF_4':
      return sets.length === 1 && sets[0].length >= 4 && isSet(sets[0]) &&
             runs.length === 1 && runs[0].length >= 4 && isRun(runs[0]);

    case 'ONE_RUN_OF_7':
      return runs.length === 1 && runs[0].length >= 7 && isRun(runs[0]);

    case 'ONE_RUN_OF_8':
      return runs.length === 1 && runs[0].length >= 8 && isRun(runs[0]);

    case 'ONE_RUN_OF_9':
      return runs.length === 1 && runs[0].length >= 9 && isRun(runs[0]);

    case 'TWO_SETS_OF_4':
      return sets.length === 2 && sets.every(s => s.length >= 4 && isSet(s));

    case 'SEVEN_CARDS_OF_ONE_COLOR':
      const allCards = [...sets.flat(), ...runs.flat()];
      return allCards.length >= 7 && isSameColor(allCards);

    case 'ONE_SET_OF_5_ONE_SET_OF_2':
      return sets.length === 2 &&
             ((sets[0].length >= 5 && sets[1].length >= 2) ||
              (sets[0].length >= 2 && sets[1].length >= 5)) &&
             sets.every(s => isSet(s));

    case 'ONE_SET_OF_5_ONE_SET_OF_3':
      return sets.length === 2 &&
             ((sets[0].length >= 5 && sets[1].length >= 3) ||
              (sets[0].length >= 3 && sets[1].length >= 5)) &&
             sets.every(s => isSet(s));

    default:
      return false;
  }
};

export const calculateScore = (hand: Card[]): number => {
  return hand.reduce((score, card) => {
    if (card.rank >= 10) return score + 10;
    if (card.rank >= 1 && card.rank <= 9) return score + 5;
    return score;
  }, 0);
};
