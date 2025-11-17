import { Card } from '../types/game';
import { Pile, PilePosition } from '../types/kings';

export const canPlayCard = (card: Card, pile: Pile): boolean => {
  if (pile.cards.length === 0) {
    // Empty piles can only accept Kings (rank 13)
    return card.rank === 13;
  }

  const topCard = pile.cards[pile.cards.length - 1];

  // For corner piles (with Kings), cards must be descending and alternating colors
  if (pile.isCorner) {
    return isDescendingAndAlternating(card, topCard);
  }

  // For side piles, cards must be descending and alternating colors
  return isDescendingAndAlternating(card, topCard);
};

export const isDescendingAndAlternating = (card: Card, topCard: Card): boolean => {
  // Card rank must be one less than top card
  if (card.rank !== topCard.rank - 1) {
    return false;
  }

  // Colors must alternate
  const isCardRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const isTopRed = topCard.suit === 'hearts' || topCard.suit === 'diamonds';

  return isCardRed !== isTopRed;
};

export const canMergePiles = (sourcePile: Pile, targetPile: Pile): boolean => {
  if (sourcePile.cards.length === 0 || targetPile.cards.length === 0) {
    return false;
  }

  const bottomSourceCard = sourcePile.cards[0];
  const topTargetCard = targetPile.cards[targetPile.cards.length - 1];

  return isDescendingAndAlternating(bottomSourceCard, topTargetCard);
};

export const isKing = (card: Card): boolean => {
  return card.rank === 13;
};

export const getCornerPositions = (): PilePosition[] => {
  return ['nw', 'ne', 'sw', 'se'];
};

export const getSidePositions = (): PilePosition[] => {
  return ['north', 'south', 'east', 'west'];
};
