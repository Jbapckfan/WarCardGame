import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ParticleEffect } from './ParticleEffect';

interface SlapFeedbackAnimationProps {
  active: boolean;
  success: boolean;
  message: string;
  x: number;
  y: number;
}

export const SlapFeedbackAnimation: React.FC<SlapFeedbackAnimationProps> = ({
  active,
  success,
  message,
  x,
  y,
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotateZ = useSharedValue(0);
  const translateY = useSharedValue(0);
  const [showParticles, setShowParticles] = React.useState(false);

  useEffect(() => {
    if (active) {
      // Feedback animation
      if (success) {
        // Success: scale up with bounce
        scale.value = withSequence(
          withSpring(1.5, { damping: 8, stiffness: 100 }),
          withTiming(1, { duration: 200 })
        );
        opacity.value = withSequence(
          withTiming(1, { duration: 100 }),
          withTiming(1, { duration: 1200 }),
          withTiming(0, { duration: 300 })
        );
        translateY.value = withSequence(
          withSpring(-20, { damping: 10 }),
          withTiming(-40, { duration: 1500, easing: Easing.out(Easing.quad) })
        );
        setShowParticles(true);
      } else {
        // Failure: shake animation
        scale.value = withSequence(
          withTiming(1.2, { duration: 100 }),
          withTiming(1, { duration: 200 })
        );
        opacity.value = withSequence(
          withTiming(1, { duration: 100 }),
          withTiming(1, { duration: 800 }),
          withTiming(0, { duration: 300 })
        );
        rotateZ.value = withSequence(
          withTiming(-15, { duration: 100 }),
          withTiming(15, { duration: 100 }),
          withTiming(-10, { duration: 100 }),
          withTiming(10, { duration: 100 }),
          withTiming(0, { duration: 100 })
        );
        translateY.value = withTiming(20, {
          duration: 500,
          easing: Easing.out(Easing.bounce),
        });
      }

      // Reset after animation
      setTimeout(() => {
        scale.value = 0;
        opacity.value = 0;
        rotateZ.value = 0;
        translateY.value = 0;
        setShowParticles(false);
      }, 1600);
    }
  }, [active]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
        { rotateZ: `${rotateZ.value}deg` },
      ],
      opacity: opacity.value,
    };
  });

  if (!active) return null;

  return (
    <>
      <Animated.View style={[styles.container, { left: x - 75, top: y - 50 }, animatedStyle]}>
        <View style={[styles.badge, success ? styles.successBadge : styles.failBadge]}>
          <Text style={styles.emoji}>{success ? '✅' : '❌'}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
      </Animated.View>
      {success && showParticles && (
        <ParticleEffect
          active={showParticles}
          x={x}
          y={y}
          color="#10B981"
          count={25}
          duration={1200}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1001,
  },
  badge: {
    borderRadius: 16,
    padding: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 150,
  },
  successBadge: {
    backgroundColor: '#10B981',
  },
  failBadge: {
    backgroundColor: '#EF4444',
  },
  emoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
});
