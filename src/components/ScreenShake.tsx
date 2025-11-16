import React, { useEffect, forwardRef, useImperativeHandle } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface ScreenShakeProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export interface ScreenShakeRef {
  shake: (intensity?: number) => void;
}

export const ScreenShake = forwardRef<ScreenShakeRef, ScreenShakeProps>(
  ({ children, style }, ref) => {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    const shake = (intensity: number = 10) => {
      // Horizontal shake
      translateX.value = withSequence(
        withTiming(intensity, { duration: 50, easing: Easing.linear }),
        withTiming(-intensity, { duration: 50, easing: Easing.linear }),
        withTiming(intensity * 0.8, { duration: 50, easing: Easing.linear }),
        withTiming(-intensity * 0.8, { duration: 50, easing: Easing.linear }),
        withTiming(intensity * 0.5, { duration: 50, easing: Easing.linear }),
        withTiming(-intensity * 0.5, { duration: 50, easing: Easing.linear }),
        withTiming(0, { duration: 50, easing: Easing.linear })
      );

      // Vertical shake (smaller)
      translateY.value = withSequence(
        withTiming(intensity * 0.5, { duration: 50, easing: Easing.linear }),
        withTiming(-intensity * 0.5, { duration: 50, easing: Easing.linear }),
        withTiming(intensity * 0.3, { duration: 50, easing: Easing.linear }),
        withTiming(-intensity * 0.3, { duration: 50, easing: Easing.linear }),
        withTiming(0, { duration: 100, easing: Easing.linear })
      );
    };

    useImperativeHandle(ref, () => ({
      shake,
    }));

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    }));

    return (
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    );
  }
);

ScreenShake.displayName = 'ScreenShake';
