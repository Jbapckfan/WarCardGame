import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../types/game';
import { getRankName, getSuitSymbol, getSuitColor } from '../utils/cardUtils';

interface CardComponentProps {
  card: Card;
  faceDown?: boolean;
  animated?: boolean;
  scale?: number;
  slideIn?: boolean;
  delay?: number;
  selected?: boolean;
  onPress?: () => void;
}

export const CardComponent: React.FC<CardComponentProps> = ({
  card,
  faceDown = false,
  animated = false,
  scale = 1,
  slideIn = false,
  delay = 0,
  selected = false,
  onPress,
}) => {
  const rotation = useSharedValue(faceDown ? 180 : 0);
  const scaleValue = useSharedValue(slideIn ? 0.8 : 1);
  const translateY = useSharedValue(slideIn ? -50 : 0);
  const opacity = useSharedValue(slideIn ? 0 : 1);
  const glowIntensity = useSharedValue(selected ? 1 : 0);
  const shadowElevation = useSharedValue(selected ? 12 : 6);

  useEffect(() => {
    if (animated) {
      scaleValue.value = withSequence(
        withSpring(1.15, { damping: 8, stiffness: 100 }),
        withSpring(1, { damping: 10, stiffness: 120 })
      );
    }
  }, [animated]);

  useEffect(() => {
    if (slideIn) {
      // Slide in from above with fade
      scaleValue.value = withTiming(1, { duration: 300 });
      translateY.value = withTiming(0, { duration: 400 });
      opacity.value = withTiming(1, { duration: 300 });
    }
  }, [slideIn]);

  useEffect(() => {
    // Smooth flip animation when faceDown changes
    rotation.value = withSpring(faceDown ? 180 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [faceDown]);

  useEffect(() => {
    // Animate selection state with glow and elevation
    glowIntensity.value = withSpring(selected ? 1 : 0, {
      damping: 12,
      stiffness: 120,
    });
    shadowElevation.value = withSpring(selected ? 12 : 6, {
      damping: 10,
      stiffness: 100,
    });
    if (selected) {
      scaleValue.value = withSequence(
        withSpring(1.05, { damping: 10, stiffness: 150 }),
        withSpring(1.02, { damping: 12, stiffness: 140 })
      );
    } else {
      scaleValue.value = withSpring(1, { damping: 12, stiffness: 120 });
    }
  }, [selected]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotateY: `${rotation.value}deg` },
        { scale: scaleValue.value * scale },
        { translateY: translateY.value },
      ],
      opacity: opacity.value,
    };
  });

  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      shadowOpacity: 0.2 + (shadowElevation.value / 100),
      shadowRadius: shadowElevation.value,
      elevation: shadowElevation.value,
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: glowIntensity.value * 0.6,
    };
  });

  const suitColor = getSuitColor(card.suit);
  const rankName = getRankName(card.rank);
  const suitSymbol = getSuitSymbol(card.suit);
  const isFaceCard = card.rank >= 11; // Jack, Queen, King

  const cardContent = (
    <Animated.View style={[styles.cardContainer, containerAnimatedStyle, animatedStyle]}>
      {/* Selection Glow Effect */}
      {selected && !faceDown && (
        <Animated.View style={[styles.glowEffect, glowStyle]} />
      )}

      <View style={[styles.card, faceDown && styles.cardBack]}>
        {faceDown ? (
          <LinearGradient
            colors={['#1E3A8A', '#3B82F6', '#1E3A8A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardBackGradient}
          >
            <View style={styles.cardBackPattern}>
              <Text style={styles.cardBackText}>♠</Text>
              <Text style={styles.cardBackText}>♥</Text>
              <Text style={styles.cardBackText}>♣</Text>
              <Text style={styles.cardBackText}>♦</Text>
            </View>
          </LinearGradient>
        ) : (
          <>
            {/* Premium gradient overlay */}
            <LinearGradient
              colors={['rgba(255,255,255,0.9)', 'rgba(248,248,248,1)', 'rgba(245,245,245,1)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.cardFaceGradient}
            />

            <View style={styles.cardBorder} />

            {/* Holographic shine for face cards */}
            {isFaceCard && (
              <LinearGradient
                colors={['transparent', 'rgba(255,215,0,0.15)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.holographicShine}
              />
            )}

            <View style={styles.cardFront}>
              <View style={styles.cornerTop}>
                <Text style={[styles.rank, { color: suitColor }]}>{rankName}</Text>
                <LinearGradient
                  colors={suitColor === '#DC2626'
                    ? ['#DC2626', '#B91C1C', '#991B1B']
                    : ['#1F2937', '#111827', '#000000']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.suitGradientContainer}
                >
                  <Text style={[styles.suitSmall, { color: '#FFFFFF' }]}>{suitSymbol}</Text>
                </LinearGradient>
              </View>

              <LinearGradient
                colors={suitColor === '#DC2626'
                  ? ['#DC2626', '#B91C1C', '#991B1B']
                  : ['#1F2937', '#111827', '#000000']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.suitLargeGradient}
              >
                <Text style={[styles.suitLarge, { color: '#FFFFFF' }]}>{suitSymbol}</Text>
              </LinearGradient>

              <View style={styles.cornerBottom}>
                <Text style={[styles.rank, { color: suitColor }]}>{rankName}</Text>
                <LinearGradient
                  colors={suitColor === '#DC2626'
                    ? ['#DC2626', '#B91C1C', '#991B1B']
                    : ['#1F2937', '#111827', '#000000']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.suitGradientContainer}
                >
                  <Text style={[styles.suitSmall, { color: '#FFFFFF' }]}>{suitSymbol}</Text>
                </LinearGradient>
              </View>
            </View>
          </>
        )}
      </View>
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  cardContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  card: {
    width: 80,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  glowEffect: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 14,
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 20,
  },
  cardFaceGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },
  holographicShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },
  cardBorder: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardBack: {
    backgroundColor: '#1E3A8A',
  },
  cardBackGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBackPattern: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    opacity: 0.3,
  },
  cardBackText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  cardFront: {
    flex: 1,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerTop: {
    position: 'absolute',
    top: 8,
    left: 8,
    alignItems: 'center',
  },
  cornerBottom: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    alignItems: 'center',
    transform: [{ rotate: '180deg' }],
  },
  rank: {
    fontSize: 20,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  suitGradientContainer: {
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginTop: 2,
  },
  suitSmall: {
    fontSize: 14,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  suitLargeGradient: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  suitLarge: {
    fontSize: 52,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
