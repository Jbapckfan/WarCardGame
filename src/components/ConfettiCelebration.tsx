import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withDelay,
  Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface ConfettiPieceProps {
  delay: number;
  color: string;
  startX: number;
}

const ConfettiPiece: React.FC<ConfettiPieceProps> = ({ delay, color, startX }) => {
  const translateY = useSharedValue(-20);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    // Fall down
    translateY.value = withDelay(
      delay,
      withTiming(height + 100, { duration: 3000, easing: Easing.cubic })
    );

    // Drift sideways
    translateX.value = withDelay(
      delay,
      withTiming(Math.random() * 200 - 100, { duration: 3000, easing: Easing.inOut(Easing.ease) })
    );

    // Rotate
    rotate.value = withDelay(
      delay,
      withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        3,
        false
      )
    );

    // Fade out near the end
    opacity.value = withDelay(
      delay + 2500,
      withTiming(0, { duration: 500 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        { backgroundColor: color, left: startX },
        animatedStyle,
      ]}
    />
  );
};

interface ConfettiCelebrationProps {
  show: boolean;
}

export const ConfettiCelebration: React.FC<ConfettiCelebrationProps> = ({ show }) => {
  if (!show) return null;

  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];
  const confettiCount = 50;

  const confettiPieces = Array.from({ length: confettiCount }, (_, i) => ({
    id: i,
    delay: Math.random() * 500,
    color: colors[Math.floor(Math.random() * colors.length)],
    startX: Math.random() * width,
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      {confettiPieces.map((piece) => (
        <ConfettiPiece
          key={piece.id}
          delay={piece.delay}
          color={piece.color}
          startX={piece.startX}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  confettiPiece: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});
