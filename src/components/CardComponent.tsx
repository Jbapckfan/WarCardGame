import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
}

export const CardComponent: React.FC<CardComponentProps> = ({
  card,
  faceDown = false,
  animated = false,
  scale = 1,
  slideIn = false,
  delay = 0,
}) => {
  const rotation = useSharedValue(faceDown ? 180 : 0);
  const scaleValue = useSharedValue(slideIn ? 0.8 : 1);
  const translateY = useSharedValue(slideIn ? -50 : 0);
  const opacity = useSharedValue(slideIn ? 0 : 1);

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

  const suitColor = getSuitColor(card.suit);
  const rankName = getRankName(card.rank);
  const suitSymbol = getSuitSymbol(card.suit);

  return (
    <Animated.View style={[styles.cardContainer, animatedStyle]}>
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
            <View style={styles.cardBorder} />
            <View style={styles.cardFront}>
              <View style={styles.cornerTop}>
                <Text style={[styles.rank, { color: suitColor }]}>{rankName}</Text>
                <Text style={[styles.suitSmall, { color: suitColor }]}>{suitSymbol}</Text>
              </View>
              <Text style={[styles.suitLarge, { color: suitColor }]}>{suitSymbol}</Text>
              <View style={styles.cornerBottom}>
                <Text style={[styles.rank, { color: suitColor }]}>{rankName}</Text>
                <Text style={[styles.suitSmall, { color: suitColor }]}>{suitSymbol}</Text>
              </View>
            </View>
          </>
        )}
      </View>
    </Animated.View>
  );
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
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  suitSmall: {
    fontSize: 16,
    marginTop: -2,
  },
  suitLarge: {
    fontSize: 56,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
});
