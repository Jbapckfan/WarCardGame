import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = 'app_settings';

class HapticService {
  private enabled: boolean = true;

  async initialize() {
    try {
      const settings = await AsyncStorage.getItem(SETTINGS_KEY);
      if (settings) {
        const parsed = JSON.parse(settings);
        this.enabled = parsed.hapticsEnabled !== false;
      }
    } catch (error) {
      console.error('Error loading haptic settings:', error);
    }
  }

  /**
   * Light impact - for button taps, card selections
   */
  async light() {
    if (!this.enabled) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Haptic error:', error);
    }
  }

  /**
   * Medium impact - for card plays, confirmations
   */
  async medium() {
    if (!this.enabled) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('Haptic error:', error);
    }
  }

  /**
   * Heavy impact - for slaps, important actions
   */
  async heavy() {
    if (!this.enabled) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      console.error('Haptic error:', error);
    }
  }

  /**
   * Success notification - for achievements, wins
   */
  async success() {
    if (!this.enabled) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Haptic error:', error);
    }
  }

  /**
   * Warning notification - for warnings
   */
  async warning() {
    if (!this.enabled) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      console.error('Haptic error:', error);
    }
  }

  /**
   * Error notification - for errors, bad slaps
   */
  async error() {
    if (!this.enabled) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      console.error('Haptic error:', error);
    }
  }

  /**
   * Selection feedback - for picking items
   */
  async selection() {
    if (!this.enabled) return;
    try {
      await Haptics.selectionAsync();
    } catch (error) {
      console.error('Haptic error:', error);
    }
  }

  /**
   * Enable/disable haptics
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}

export const hapticService = new HapticService();

// Initialize on import
hapticService.initialize();
