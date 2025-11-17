import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { ParticleEffect } from './ParticleEffect';

interface LevelUpNotificationProps {
  visible: boolean;
  newLevel: number;
  onClose: () => void;
}

export const LevelUpNotification: React.FC<LevelUpNotificationProps> = ({
  visible,
  newLevel,
  onClose,
}) => {
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Animate in with rotation
      scale.value = withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 10 })
      );
      rotation.value = withSequence(
        withTiming(360, { duration: 600 }),
        withTiming(0, { duration: 0 })
      );
      opacity.value = withTiming(1, { duration: 300 });

      // Auto-dismiss after 2.5 seconds
      const timeout = setTimeout(() => {
        scale.value = withTiming(0, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 });
        setTimeout(onClose, 350);
      }, 2500);

      return () => clearTimeout(timeout);
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotateZ: `${rotation.value}deg` }],
    opacity: opacity.value,
  }));

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, animatedStyle]}>
          <Text style={styles.sparkle}>✨</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelNumber}>{newLevel}</Text>
          </View>
          <Text style={styles.title}>LEVEL UP!</Text>
          <Text style={styles.subtitle}>Congratulations!</Text>
        </Animated.View>
        {visible && (
          <>
            <ParticleEffect
              active={visible}
              x={200}
              y={250}
              color="#F59E0B"
              count={40}
              duration={1800}
            />
            <ParticleEffect
              active={visible}
              x={200}
              y={250}
              color="#10B981"
              count={30}
              duration={2000}
            />
          </>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  container: {
    alignItems: 'center',
  },
  sparkle: {
    fontSize: 60,
    marginBottom: 16,
  },
  levelBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 6,
    borderColor: '#FBBF24',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
    marginBottom: 24,
  },
  levelNumber: {
    fontSize: 56,
    fontWeight: 'bold',
    color: 'white',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginBottom: 8,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 18,
    color: 'white',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
