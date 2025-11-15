import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SavedGame {
  gameType: 'war' | 'ers' | 'uno' | 'phase10' | 'custom';
  gameState: any;
  playerCount: number;
  savedAt: number;
}

const SAVE_KEYS = {
  war: '@game_save_war',
  ers: '@game_save_ers',
  uno: '@game_save_uno',
  phase10: '@game_save_phase10',
  custom: '@game_save_custom',
};

/**
 * Save game state to AsyncStorage
 */
export const saveGame = async (
  gameType: 'war' | 'ers' | 'uno' | 'phase10' | 'custom',
  gameState: any,
  playerCount: number
): Promise<void> => {
  try {
    const savedGame: SavedGame = {
      gameType,
      gameState,
      playerCount,
      savedAt: Date.now(),
    };
    await AsyncStorage.setItem(SAVE_KEYS[gameType], JSON.stringify(savedGame));
  } catch (error) {
    console.error('Error saving game:', error);
  }
};

/**
 * Load saved game state from AsyncStorage
 */
export const loadGame = async (
  gameType: 'war' | 'ers' | 'uno' | 'phase10' | 'custom'
): Promise<SavedGame | null> => {
  try {
    const saved = await AsyncStorage.getItem(SAVE_KEYS[gameType]);
    if (saved) {
      return JSON.parse(saved) as SavedGame;
    }
    return null;
  } catch (error) {
    console.error('Error loading game:', error);
    return null;
  }
};

/**
 * Clear saved game state
 */
export const clearSavedGame = async (
  gameType: 'war' | 'ers' | 'uno' | 'phase10' | 'custom'
): Promise<void> => {
  try {
    await AsyncStorage.removeItem(SAVE_KEYS[gameType]);
  } catch (error) {
    console.error('Error clearing saved game:', error);
  }
};

/**
 * Check if a saved game exists
 */
export const hasSavedGame = async (
  gameType: 'war' | 'ers' | 'uno' | 'phase10' | 'custom'
): Promise<boolean> => {
  try {
    const saved = await AsyncStorage.getItem(SAVE_KEYS[gameType]);
    return saved !== null;
  } catch (error) {
    console.error('Error checking saved game:', error);
    return false;
  }
};
