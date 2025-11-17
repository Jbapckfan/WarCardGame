import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
}

interface ParticleEffectProps {
  active: boolean;
  x: number;
  y: number;
  color?: string;
  count?: number;
  duration?: number;
  onComplete?: () => void;
}

export const ParticleEffect: React.FC<ParticleEffectProps> = ({
  active,
  x,
  y,
  color = '#F59E0B',
  count = 20,
  duration = 1000,
  onComplete,
}) => {
  const [particles, setParticles] = React.useState<Particle[]>([]);

  useEffect(() => {
    if (active) {
      // Generate particles
      const newParticles: Particle[] = [];
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const velocity = 100 + Math.random() * 50;
        newParticles.push({
          id: i,
          x: 0,
          y: 0,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          color: color,
          size: 4 + Math.random() * 4,
        });
      }
      setParticles(newParticles);

      // Clear particles after duration
      const timeout = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timeout);
    }
  }, [active]);

  if (!active || particles.length === 0) return null;

  return (
    <View style={[styles.container, { left: x, top: y }]} pointerEvents="none">
      {particles.map((particle) => (
        <ParticleElement
          key={particle.id}
          particle={particle}
          duration={duration}
        />
      ))}
    </View>
  );
};

const ParticleElement: React.FC<{ particle: Particle; duration: number }> = ({
  particle,
  duration,
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    translateX.value = withTiming(particle.vx, {
      duration,
      easing: Easing.out(Easing.quad),
    });
    translateY.value = withTiming(particle.vy + 50, {
      duration,
      easing: Easing.in(Easing.quad),
    });
    opacity.value = withTiming(0, {
      duration: duration * 0.8,
      easing: Easing.out(Easing.quad),
    });
    scale.value = withTiming(0, {
      duration: duration * 0.6,
      easing: Easing.out(Easing.quad),
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: particle.size,
          height: particle.size,
          backgroundColor: particle.color,
        },
        animatedStyle,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
  },
  particle: {
    position: 'absolute',
    borderRadius: 100,
  },
});
