import React, { useEffect } from 'react';
import { Modal, View, StyleSheet, TouchableWithoutFeedback, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';

interface BlurModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  blurIntensity?: number;
  closeOnBackdropPress?: boolean;
}

export const BlurModal: React.FC<BlurModalProps> = ({
  visible,
  onClose,
  children,
  blurIntensity = 20,
  closeOnBackdropPress = true,
}) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const translateY = useSharedValue(20);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) });
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      scale.value = withTiming(0.9, { duration: 150 });
      translateY.value = withTiming(20, { duration: 150 });
    }
  }, [visible]);

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  const handleBackdropPress = () => {
    if (closeOnBackdropPress) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Blur backdrop for iOS, dark overlay for Android */}
        {Platform.OS === 'ios' ? (
          <BlurView intensity={blurIntensity} style={StyleSheet.absoluteFill} tint="dark">
            <TouchableWithoutFeedback onPress={handleBackdropPress}>
              <Animated.View style={[styles.backdrop, backdropAnimatedStyle]} />
            </TouchableWithoutFeedback>
          </BlurView>
        ) : (
          <TouchableWithoutFeedback onPress={handleBackdropPress}>
            <Animated.View style={[styles.backdrop, styles.androidBackdrop, backdropAnimatedStyle]} />
          </TouchableWithoutFeedback>
        )}

        {/* Modal content */}
        <Animated.View style={[styles.contentContainer, contentAnimatedStyle]}>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  androidBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  contentContainer: {
    maxWidth: 500,
    width: '100%',
    backgroundColor: 'transparent',
    borderRadius: 20,
    overflow: 'hidden',
    // Elevated above backdrop
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 24,
  },
});
