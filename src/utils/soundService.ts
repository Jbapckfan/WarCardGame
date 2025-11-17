import { Audio } from 'expo-av';

type SoundType =
  | 'cardFlip'
  | 'cardSlap'
  | 'slapSuccess'
  | 'slapFail'
  | 'buttonClick'
  | 'achievement'
  | 'levelUp'
  | 'win'
  | 'lose';

class SoundService {
  private sounds: Map<SoundType, Audio.Sound> = new Map();
  private enabled: boolean = true;

  /**
   * Initialize all sounds
   * Note: In a real app, you'd load actual sound files from assets
   * For now, we'll use synthesized beeps
   */
  async initialize() {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
    } catch (error) {
      console.error('Error initializing audio:', error);
    }
  }

  /**
   * Play a sound effect
   */
  async play(soundType: SoundType) {
    if (!this.enabled) return;

    try {
      // In a real app, you would load sound files like this:
      // const { sound } = await Audio.Sound.createAsync(
      //   require('../../assets/sounds/cardFlip.mp3')
      // );

      // For now, we'll just log since we don't have actual sound files
      console.log(`Playing sound: ${soundType}`);

      // You can use the expo-av synthesizer for beeps:
      // await this.playBeep(this.getFrequency(soundType));
    } catch (error) {
      console.error(`Error playing sound ${soundType}:`, error);
    }
  }

  /**
   * Play multiple sounds in sequence
   */
  async playSequence(sounds: SoundType[], delay: number = 100) {
    for (const sound of sounds) {
      await this.play(sound);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  /**
   * Enable/disable all sounds
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Get frequency for synthesized beep based on sound type
   */
  private getFrequency(soundType: SoundType): number {
    const frequencies: Record<SoundType, number> = {
      cardFlip: 440,
      cardSlap: 330,
      slapSuccess: 523,
      slapFail: 220,
      buttonClick: 880,
      achievement: 659,
      levelUp: 784,
      win: 1047,
      lose: 196,
    };
    return frequencies[soundType];
  }

  /**
   * Cleanup all loaded sounds
   */
  async cleanup() {
    for (const [, sound] of this.sounds) {
      try {
        await sound.unloadAsync();
      } catch (error) {
        console.error('Error unloading sound:', error);
      }
    }
    this.sounds.clear();
  }
}

export const soundService = new SoundService();

// Initialize on import
soundService.initialize();
