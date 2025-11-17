import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Progressive Tutorial System
 * Tracks user progress and unlocks tutorial sections gradually
 */

export interface TutorialProgress {
  completedActions: string[];
  unlockedSections: string[];
  hintsShown: string[];
}

const TUTORIAL_PROGRESS_KEY = 'progressive_tutorial_progress';

// Tutorial sections that unlock based on user actions
export const TUTORIAL_SECTIONS = {
  BASIC_GAMEPLAY: 'basic_gameplay',
  SLAPPING_RULES: 'slapping_rules',
  FACE_CARDS: 'face_cards',
  ADVANCED_STRATEGIES: 'advanced_strategies',
  MULTIPLAYER: 'multiplayer',
  STATS_AND_ACHIEVEMENTS: 'stats_and_achievements',
} as const;

// User actions that trigger tutorial unlocks
export const TUTORIAL_ACTIONS = {
  FIRST_GAME_PLAYED: 'first_game_played',
  FIRST_SLAP: 'first_slap',
  FIRST_SUCCESSFUL_SLAP: 'first_successful_slap',
  FIRST_WAR: 'first_war',
  FIRST_WIN: 'first_win',
  FIRST_MULTIPLAYER_GAME: 'first_multiplayer_game',
  VIEWED_STATS: 'viewed_stats',
  FIRST_ACHIEVEMENT: 'first_achievement',
  PLAYED_10_GAMES: 'played_10_games',
} as const;

// Mapping of actions to tutorial sections
const ACTION_TO_SECTION_MAP: Record<string, string[]> = {
  [TUTORIAL_ACTIONS.FIRST_GAME_PLAYED]: [TUTORIAL_SECTIONS.BASIC_GAMEPLAY],
  [TUTORIAL_ACTIONS.FIRST_SLAP]: [TUTORIAL_SECTIONS.SLAPPING_RULES],
  [TUTORIAL_ACTIONS.FIRST_WAR]: [TUTORIAL_SECTIONS.FACE_CARDS],
  [TUTORIAL_ACTIONS.PLAYED_10_GAMES]: [TUTORIAL_SECTIONS.ADVANCED_STRATEGIES],
  [TUTORIAL_ACTIONS.FIRST_MULTIPLAYER_GAME]: [TUTORIAL_SECTIONS.MULTIPLAYER],
  [TUTORIAL_ACTIONS.VIEWED_STATS]: [TUTORIAL_SECTIONS.STATS_AND_ACHIEVEMENTS],
};

/**
 * Load tutorial progress from storage
 */
export const loadTutorialProgress = async (): Promise<TutorialProgress> => {
  try {
    const stored = await AsyncStorage.getItem(TUTORIAL_PROGRESS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading tutorial progress:', error);
  }

  return {
    completedActions: [],
    unlockedSections: [TUTORIAL_SECTIONS.BASIC_GAMEPLAY], // Basic always unlocked
    hintsShown: [],
  };
};

/**
 * Save tutorial progress to storage
 */
export const saveTutorialProgress = async (progress: TutorialProgress): Promise<void> => {
  try {
    await AsyncStorage.setItem(TUTORIAL_PROGRESS_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Error saving tutorial progress:', error);
  }
};

/**
 * Record a user action and unlock relevant tutorial sections
 */
export const recordTutorialAction = async (action: string): Promise<string[]> => {
  const progress = await loadTutorialProgress();

  // Check if action already completed
  if (progress.completedActions.includes(action)) {
    return [];
  }

  // Add action to completed
  progress.completedActions.push(action);

  // Unlock relevant sections
  const sectionsToUnlock = ACTION_TO_SECTION_MAP[action] || [];
  const newlyUnlocked: string[] = [];

  for (const section of sectionsToUnlock) {
    if (!progress.unlockedSections.includes(section)) {
      progress.unlockedSections.push(section);
      newlyUnlocked.push(section);
    }
  }

  await saveTutorialProgress(progress);

  return newlyUnlocked;
};

/**
 * Check if a tutorial section is unlocked
 */
export const isSectionUnlocked = async (section: string): Promise<boolean> => {
  const progress = await loadTutorialProgress();
  return progress.unlockedSections.includes(section);
};

/**
 * Check if a hint has been shown
 */
export const isHintShown = async (hintId: string): Promise<boolean> => {
  const progress = await loadTutorialProgress();
  return progress.hintsShown.includes(hintId);
};

/**
 * Mark a hint as shown
 */
export const markHintShown = async (hintId: string): Promise<void> => {
  const progress = await loadTutorialProgress();

  if (!progress.hintsShown.includes(hintId)) {
    progress.hintsShown.push(hintId);
    await saveTutorialProgress(progress);
  }
};

/**
 * Get tutorial completion percentage
 */
export const getTutorialCompletionPercentage = async (): Promise<number> => {
  const progress = await loadTutorialProgress();
  const totalSections = Object.keys(TUTORIAL_SECTIONS).length;
  const unlockedCount = progress.unlockedSections.length;

  return Math.round((unlockedCount / totalSections) * 100);
};

/**
 * Reset tutorial progress (for testing or settings)
 */
export const resetTutorialProgress = async (): Promise<void> => {
  await AsyncStorage.removeItem(TUTORIAL_PROGRESS_KEY);
};

/**
 * Get a friendly message for newly unlocked sections
 */
export const getUnlockMessage = (section: string): string => {
  const messages: Record<string, string> = {
    [TUTORIAL_SECTIONS.BASIC_GAMEPLAY]: 'You unlocked: Basic Gameplay tutorial!',
    [TUTORIAL_SECTIONS.SLAPPING_RULES]: 'You unlocked: Slapping Rules tutorial!',
    [TUTORIAL_SECTIONS.FACE_CARDS]: 'You unlocked: Face Cards & Wars tutorial!',
    [TUTORIAL_SECTIONS.ADVANCED_STRATEGIES]: 'You unlocked: Advanced Strategies tutorial!',
    [TUTORIAL_SECTIONS.MULTIPLAYER]: 'You unlocked: Multiplayer Guide!',
    [TUTORIAL_SECTIONS.STATS_AND_ACHIEVEMENTS]: 'You unlocked: Stats & Achievements Guide!',
  };

  return messages[section] || 'New tutorial section unlocked!';
};
