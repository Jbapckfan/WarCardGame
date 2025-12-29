import { useMemo } from 'react';

interface ScalingRule {
  minCards: number;
  scale: number;
}

interface UseCardHandOptions {
  handSize: number;
  defaultScale?: number;
  scalingRules?: ScalingRule[];
}

const DEFAULT_SCALING_RULES: ScalingRule[] = [
  { minCards: 15, scale: 0.35 },
  { minCards: 12, scale: 0.45 },
  { minCards: 10, scale: 0.5 },
  { minCards: 8, scale: 0.55 },
  { minCards: 7, scale: 0.6 },
];

export const useCardHand = ({
  handSize,
  defaultScale = 0.7,
  scalingRules = DEFAULT_SCALING_RULES,
}: UseCardHandOptions) => {
  // Calculate card scale based on hand size
  const cardScale = useMemo(() => {
    const sortedRules = [...scalingRules].sort((a, b) => b.minCards - a.minCards);

    for (const rule of sortedRules) {
      if (handSize >= rule.minCards) {
        return rule.scale;
      }
    }

    return defaultScale;
  }, [handSize, defaultScale, scalingRules]);

  // Calculate card overlap (negative marginLeft)
  const cardOverlap = useMemo(() => {
    if (handSize <= 5) return 0;
    if (handSize <= 8) return -10;
    if (handSize <= 12) return -20;
    return -30;
  }, [handSize]);

  // Calculate if hand should wrap
  const shouldWrap = useMemo(() => {
    return handSize > 7;
  }, [handSize]);

  // Calculate optimal gap between cards
  const cardGap = useMemo(() => {
    if (handSize <= 5) return 8;
    if (handSize <= 10) return 4;
    return 2;
  }, [handSize]);

  return {
    cardScale,
    cardOverlap,
    shouldWrap,
    cardGap,
    handContainerStyle: {
      flexDirection: 'row' as const,
      flexWrap: shouldWrap ? ('wrap' as const) : ('nowrap' as const),
      justifyContent: 'center' as const,
      gap: cardGap,
      marginLeft: cardOverlap,
    },
    cardWrapperStyle: {
      marginLeft: -cardOverlap,
      marginVertical: shouldWrap ? 4 : 0,
    },
  };
};
