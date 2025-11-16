/**
 * Staggered Dealing Animations
 * Provides smooth, cascading card dealing effects for premium feel
 */

export interface DealingConfig {
  totalCards: number;
  baseDelay?: number; // milliseconds between each card
  fromPosition?: { x: number; y: number };
  rotationVariance?: number; // degrees of random rotation
}

/**
 * Calculate delay for staggered card animations
 * @param cardIndex - Index of the card being dealt
 * @param config - Configuration for dealing animation
 * @returns Delay in milliseconds
 */
export const getCardDealDelay = (cardIndex: number, config: DealingConfig): number => {
  const { baseDelay = 50 } = config;
  return cardIndex * baseDelay;
};

/**
 * Get random rotation for card dealing (adds natural variance)
 * @param config - Configuration for dealing animation
 * @returns Rotation in degrees
 */
export const getCardDealRotation = (config: DealingConfig): number => {
  const { rotationVariance = 5 } = config;
  return (Math.random() - 0.5) * 2 * rotationVariance;
};

/**
 * Calculate dealing animations for a hand of cards
 * @param handSize - Number of cards to deal
 * @param playerIndex - Which player (for position offset)
 * @returns Array of animation configs
 */
export const generateDealingAnimations = (
  handSize: number,
  playerIndex: number = 0
): { delay: number; rotation: number }[] => {
  return Array.from({ length: handSize }, (_, i) => ({
    delay: getCardDealDelay(i, { totalCards: handSize }),
    rotation: getCardDealRotation({ totalCards: handSize }),
  }));
};

/**
 * Shuffle animation (for deck)
 * Returns a sequence of positions for shuffle effect
 */
export const getShuffleKeyframes = (iterations: number = 3) => {
  const keyframes: { x: number; y: number; rotation: number }[] = [];

  for (let i = 0; i < iterations; i++) {
    keyframes.push({
      x: (Math.random() - 0.5) * 20,
      y: (Math.random() - 0.5) * 10,
      rotation: (Math.random() - 0.5) * 10,
    });
  }

  // Return to center
  keyframes.push({ x: 0, y: 0, rotation: 0 });

  return keyframes;
};
