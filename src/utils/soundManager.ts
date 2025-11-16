import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOUND_ENABLED_KEY = '@sound_enabled';

/**
 * Sound Manager for Card Games
 * Handles all sound effects with toggle support
 */
class SoundManager {
  private sounds: { [key: string]: Audio.Sound | null } = {};
  private soundEnabled: boolean = true;
  private isInitialized: boolean = false;

  /**
   * Initialize sound system
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Set audio mode
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: false,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Load sound enabled preference
      const enabled = await AsyncStorage.getItem(SOUND_ENABLED_KEY);
      this.soundEnabled = enabled === null ? true : enabled === 'true';

      // Pre-load sounds (placeholder URIs - can be replaced with actual sound files)
      await this.loadSounds();

      this.isInitialized = true;
    } catch (error) {
      console.error('Sound initialization error:', error);
    }
  }

  /**
   * Load all sound effects
   */
  private async loadSounds() {
    // Note: Sound files should be placed in assets/sounds/ directory
    // For now, sounds will be null and system will work without audio
    // To add sounds: Place .wav or .mp3 files in assets/sounds/ and uncomment below

    /*
    const soundFiles = {
      cardFlip: require('../../assets/sounds/card-flip.wav'),
      cardPlace: require('../../assets/sounds/card-place.wav'),
      buttonTap: require('../../assets/sounds/button-tap.wav'),
      win: require('../../assets/sounds/win.wav'),
      lose: require('../../assets/sounds/lose.wav'),
      slap: require('../../assets/sounds/slap.wav'),
      match: require('../../assets/sounds/match.wav'),
      shuffle: require('../../assets/sounds/shuffle.wav'),
      draw: require('../../assets/sounds/draw.wav'),
      error: require('../../assets/sounds/error.wav'),
    };

    // Load each sound
    for (const [key, uri] of Object.entries(soundFiles)) {
      try {
        const { sound } = await Audio.Sound.createAsync(uri, { shouldPlay: false });
        this.sounds[key] = sound;
      } catch (error) {
        console.warn(`Failed to load sound: ${key}`, error);
        this.sounds[key] = null;
      }
    }
    */

    // Placeholder: Initialize sound keys to null (ready for actual sound files)
    const soundKeys = ['cardFlip', 'cardPlace', 'buttonTap', 'win', 'lose', 'slap', 'match', 'shuffle', 'draw', 'error'];
    soundKeys.forEach(key => {
      this.sounds[key] = null;
    });
  }

  /**
   * Play a sound effect
   */
  async play(soundName: string, volume: number = 1.0) {
    if (!this.soundEnabled || !this.sounds[soundName]) return;

    try {
      const sound = this.sounds[soundName];
      if (sound) {
        await sound.setPositionAsync(0); // Reset to start
        await sound.setVolumeAsync(volume);
        await sound.playAsync();
      }
    } catch (error) {
      console.warn(`Error playing sound: ${soundName}`, error);
    }
  }

  /**
   * Toggle sound on/off
   */
  async toggleSound(): Promise<boolean> {
    this.soundEnabled = !this.soundEnabled;
    await AsyncStorage.setItem(SOUND_ENABLED_KEY, this.soundEnabled.toString());
    return this.soundEnabled;
  }

  /**
   * Set sound enabled state
   */
  async setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    await AsyncStorage.setItem(SOUND_ENABLED_KEY, enabled.toString());
  }

  /**
   * Get current sound enabled state
   */
  isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  /**
   * Cleanup all sounds
   */
  async cleanup() {
    for (const sound of Object.values(this.sounds)) {
      if (sound) {
        try {
          await sound.unloadAsync();
        } catch (error) {
          console.warn('Error unloading sound:', error);
        }
      }
    }
    this.sounds = {};
    this.isInitialized = false;
  }
}

// Singleton instance
export const soundManager = new SoundManager();

/**
 * Sound effect helper functions
 */
export const playSoundEffect = {
  cardFlip: () => soundManager.play('cardFlip', 0.5),
  cardPlace: () => soundManager.play('cardPlace', 0.6),
  buttonTap: () => soundManager.play('buttonTap', 0.4),
  win: () => soundManager.play('win', 0.8),
  lose: () => soundManager.play('lose', 0.6),
  slap: () => soundManager.play('slap', 0.7),
  match: () => soundManager.play('match', 0.6),
  shuffle: () => soundManager.play('shuffle', 0.5),
  draw: () => soundManager.play('draw', 0.5),
  error: () => soundManager.play('error', 0.5),
};
