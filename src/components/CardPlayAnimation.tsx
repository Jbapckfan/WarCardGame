import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { CardComponent } from './CardComponent';
import { Card } from '../types/game';

interface CardPlayAnimationProps {
  card: Card | null;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  onComplete?: () => void;
}

export const CardPlayAnimation: React.FC<CardPlayAnimationProps> = ({
  card,
  fromX,
  fromY,
  toX,
  toY,
  onComplete,
}) => {
  const translateX = useSharedValue(fromX);
  const translateY = useSharedValue(fromY);
  const rotateZ = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (card) {
      opacity.value = 1;

      // Arc animation - card moves in parabolic curve
      const duration = 500;
      const arcHeight = -100; // Negative to go up

      // Calculate control point for bezier curve
      const midX = (fromX + toX) / 2;
      const midY = (fromY + toY) / 2 + arcHeight;

      // Animate to mid point with arc
      translateX.value = withSequence(
        withTiming(midX, {
          duration: duration / 2,
          easing: Easing.out(Easing.quad),
        }),
        withTiming(toX, {
          duration: duration / 2,
          easing: Easing.in(Easing.quad),
        })
      );

      translateY.value = withSequence(
        withTiming(midY, {
          duration: duration / 2,
          easing: Easing.out(Easing.quad),
        }),
        withTiming(toY, {
          duration: duration / 2,
          easing: Easing.in(Easing.quad),
        })
      );

      // Rotation during flight
      rotateZ.value = withSequence(
        withTiming(15, {
          duration: duration / 2,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(0, {
          duration: duration / 2,
          easing: Easing.inOut(Easing.quad),
        })
      );

      // Scale up during flight
      scale.value = withSequence(
        withTiming(1.1, {
          duration: duration / 2,
          easing: Easing.out(Easing.quad),
        }),
        withTiming(1, {
          duration: duration / 2,
          easing: Easing.in(Easing.quad),
        })
      );

      // Callback after animation
      setTimeout(() => {
        opacity.value = withTiming(0, { duration: 100 });
        if (onComplete) {
          setTimeout(onComplete, 100);
        }
      }, duration);
    }
  }, [card]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotateZ: `${rotateZ.value}deg` },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  if (!card) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <CardComponent card={card} faceUp={true} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 999,
  },
});
