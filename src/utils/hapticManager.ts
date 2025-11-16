import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HAPTIC_ENABLED_KEY = '@haptic_enabled';

/**
 * Haptic Feedback Manager
 * Provides tactile feedback for premium feel
 */
class HapticManager {
  private hapticEnabled: boolean = true;
  private isInitialized: boolean = false;

  /**
   * Initialize haptic system
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      const enabled = await AsyncStorage.getItem(HAPTIC_ENABLED_KEY);
      this.hapticEnabled = enabled === null ? true : enabled === 'true';
      this.isInitialized = true;
    } catch (error) {
      console.error('Haptic initialization error:', error);
    }
  }

  /**
   * Light impact (button tap, card select)
   */
  async light() {
    if (!this.hapticEnabled || Platform.OS !== 'ios') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Medium impact (card play, menu selection)
   */
  async medium() {
    if (!this.hapticEnabled || Platform.OS !== 'ios') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Heavy impact (win, special action)
   */
  async heavy() {
    if (!this.hapticEnabled || Platform.OS !== 'ios') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Success notification (win, match, correct action)
   */
  async success() {
    if (!this.hapticEnabled || Platform.OS !== 'ios') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Warning notification (invalid move)
   */
  async warning() {
    if (!this.hapticEnabled || Platform.OS !== 'ios') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Error notification (failed action)
   */
  async error() {
    if (!this.hapticEnabled || Platform.OS !== 'ios') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Selection changed (scrolling, switching)
   */
  async selection() {
    if (!this.hapticEnabled || Platform.OS !== 'ios') return;
    try {
      await Haptics.selectionAsync();
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Toggle haptic feedback
   */
  async toggleHaptic(): Promise<boolean> {
    this.hapticEnabled = !this.hapticEnabled;
    await AsyncStorage.setItem(HAPTIC_ENABLED_KEY, this.hapticEnabled.toString());
    return this.hapticEnabled;
  }

  /**
   * Set haptic enabled state
   */
  async setHapticEnabled(enabled: boolean) {
    this.hapticEnabled = enabled;
    await AsyncStorage.setItem(HAPTIC_ENABLED_KEY, enabled.toString());
  }

  /**
   * Get current haptic enabled state
   */
  isHapticEnabled(): boolean {
    return this.hapticEnabled;
  }
}

// Singleton instance
export const hapticManager = new HapticManager();

/**
 * Haptic feedback helper functions
 */
export const triggerHaptic = {
  // UI interactions
  buttonTap: () => hapticManager.light(),
  cardTap: () => hapticManager.light(),
  menuOpen: () => hapticManager.medium(),

  // Game actions
  cardPlay: () => hapticManager.medium(),
  cardDraw: () => hapticManager.light(),
  cardFlip: () => hapticManager.light(),

  // Game events
  match: () => hapticManager.success(),
  win: () => hapticManager.success(),
  lose: () => hapticManager.warning(),
  invalidMove: () => hapticManager.error(),

  // Special actions
  slap: () => hapticManager.heavy(),
  shuffle: () => hapticManager.medium(),
  deal: () => hapticManager.light(),
};
