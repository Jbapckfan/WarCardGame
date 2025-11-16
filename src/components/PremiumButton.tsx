import React, { useEffect } from 'react';
import { Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { triggerHaptic } from '../utils/hapticManager';

interface PremiumButtonProps {
  title: string;
  onPress: () => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  size?: 'small' | 'medium' | 'large';
  icon?: string; // Emoji icon
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const scale = useSharedValue(1);
  const iconRotation = useSharedValue(0);
  const successScale = useSharedValue(0);

  // Gradient colors based on variant
  const gradientColors = {
    primary: ['#3B82F6', '#2563EB', '#1D4ED8'],
    secondary: ['#8B5CF6', '#7C3AED', '#6D28D9'],
    success: ['#10B981', '#059669', '#047857'],
    danger: ['#EF4444', '#DC2626', '#B91C1C'],
    warning: ['#F59E0B', '#D97706', '#B45309'],
  };

  const colors = gradientColors[variant];

  // Size configurations
  const sizeConfig = {
    small: { padding: 12, fontSize: 14, iconSize: 16 },
    medium: { padding: 16, fontSize: 16, iconSize: 20 },
    large: { padding: 20, fontSize: 18, iconSize: 24 },
  };

  const config = sizeConfig[size];

  // Animate icon on load
  useEffect(() => {
    if (icon) {
      iconRotation.value = withSequence(
        withSpring(10, { damping: 10, stiffness: 100 }),
        withSpring(-10, { damping: 10, stiffness: 100 }),
        withSpring(0, { damping: 10, stiffness: 100 })
      );
    }
  }, [icon]);

  const handlePress = async () => {
    if (disabled || loading) return;

    // Trigger haptic feedback
    await triggerHaptic.buttonTap();

    // Press animation
    scale.value = withSequence(
      withTiming(0.95, { duration: 100, easing: Easing.out(Easing.ease) }),
      withSpring(1, { damping: 12, stiffness: 150 })
    );

    // Execute callback
    await onPress();
  };

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${iconRotation.value}deg` }],
  }));

  const animatedSuccessStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
    opacity: successScale.value,
  }));

  const buttonStyle: ViewStyle = {
    ...styles.button,
    padding: config.padding,
    opacity: disabled ? 0.5 : 1,
    width: fullWidth ? '100%' : undefined,
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      disabled={disabled || loading}
      style={style}
    >
      <Animated.View style={[animatedButtonStyle]}>
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[buttonStyle, styles.gradientButton]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size={size === 'small' ? 'small' : 'large'} />
          ) : (
            <>
              {icon && (
                <Animated.Text style={[styles.icon, { fontSize: config.iconSize }, animatedIconStyle]}>
                  {icon}
                </Animated.Text>
              )}
              <Text style={[styles.buttonText, { fontSize: config.fontSize }, textStyle]}>
                {title}
              </Text>
            </>
          )}

          {/* Success checkmark overlay */}
          <Animated.View style={[styles.successOverlay, animatedSuccessStyle]}>
            <Text style={styles.successIcon}>✓</Text>
          </Animated.View>
        </LinearGradient>

        {/* Shine effect */}
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shine}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  gradientButton: {
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  icon: {
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: -100,
    right: -100,
    height: '100%',
    opacity: 0.3,
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#10B981',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
