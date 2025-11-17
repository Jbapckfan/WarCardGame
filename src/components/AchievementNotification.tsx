import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { ParticleEffect } from './ParticleEffect';

interface AchievementNotificationProps {
  visible: boolean;
  achievement: {
    name: string;
    description: string;
    icon: string;
    reward: {
      xp: number;
      cardBack?: string;
      theme?: string;
    };
  } | null;
  onClose: () => void;
}

export const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  visible,
  achievement,
  onClose,
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-50);

  useEffect(() => {
    if (visible && achievement) {
      // Animate in
      scale.value = withSpring(1, { damping: 10, stiffness: 100 });
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, { damping: 12 });

      // Auto-dismiss after 3 seconds
      const timeout = setTimeout(() => {
        scale.value = withTiming(0.8, { duration: 200 });
        opacity.value = withTiming(0, { duration: 200 });
        translateY.value = withTiming(50, { duration: 200 });
        setTimeout(onClose, 250);
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [visible, achievement]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!achievement) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, animatedStyle]}>
          <View style={styles.badge}>
            <Text style={styles.icon}>{achievement.icon}</Text>
          </View>
          <View style={styles.content}>
            <Text style={styles.title}>Achievement Unlocked!</Text>
            <Text style={styles.achievementName}>{achievement.name}</Text>
            <Text style={styles.description}>{achievement.description}</Text>
            <View style={styles.rewards}>
              <Text style={styles.rewardText}>+{achievement.reward.xp} XP</Text>
              {achievement.reward.cardBack && (
                <Text style={styles.rewardText}>🎴 {achievement.reward.cardBack}</Text>
              )}
              {achievement.reward.theme && (
                <Text style={styles.rewardText}>🎨 {achievement.reward.theme}</Text>
              )}
            </View>
          </View>
        </Animated.View>
        {visible && (
          <ParticleEffect
            active={visible}
            x={200}
            y={300}
            color="#F59E0B"
            count={30}
            duration={1500}
          />
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  container: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    borderWidth: 3,
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 16,
  },
  badge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    borderWidth: 4,
    borderColor: '#FBBF24',
  },
  icon: {
    fontSize: 40,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F59E0B',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  achievementName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 16,
  },
  rewards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  rewardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
});
