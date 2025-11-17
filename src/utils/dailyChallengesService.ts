import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyChallenge, PlayerStats } from '../types/stats';
import { loadStats, saveStats } from './statsService';

const CHALLENGES_STORAGE_KEY = 'daily_challenges';

/**
 * Generate daily challenges for a specific date
 */
export const generateDailyChallenges = (date: string): DailyChallenge[] => {
  const seed = date.split('-').reduce((acc, val) => acc + parseInt(val), 0);
  const random = () => ((seed * 9301 + 49297) % 233280) / 233280;

  const challenges: DailyChallenge[] = [
    {
      id: `${date}_win_3`,
      date,
      gameType: getRandomGameType(random()),
      challenge: 'Win 3 games',
      requirement: { type: 'wins', value: 3 },
      reward: { xp: 100, coins: 50 },
      completed: false,
      progress: 0,
    },
    {
      id: `${date}_play_5`,
      date,
      gameType: 'war',
      challenge: 'Play 5 War games',
      requirement: { type: 'games_played', value: 5 },
      reward: { xp: 50 },
      completed: false,
      progress: 0,
    },
    {
      id: `${date}_slap_20`,
      date,
      gameType: 'ers',
      challenge: 'Land 20 valid slaps in ERS',
      requirement: { type: 'slaps', value: 20 },
      reward: { xp: 75, coins: 25 },
      completed: false,
      progress: 0,
    },
  ];

  return challenges;
};

/**
 * Get random game type
 */
const getRandomGameType = (seed: number): 'war' | 'ers' | 'gofish' | 'uno' | 'hearts' | 'phase10' | 'kings' => {
  const types: ('war' | 'ers' | 'gofish' | 'uno' | 'hearts' | 'phase10' | 'kings')[] = [
    'war', 'ers', 'gofish', 'uno', 'hearts', 'phase10', 'kings'
  ];
  return types[Math.floor(seed * types.length)];
};

/**
 * Load today's challenges
 */
export const loadTodaysChallenges = async (): Promise<DailyChallenge[]> => {
  const today = new Date().toISOString().split('T')[0];

  try {
    const stored = await AsyncStorage.getItem(`${CHALLENGES_STORAGE_KEY}_${today}`);

    if (stored) {
      return JSON.parse(stored);
    }

    // Generate new challenges for today
    const challenges = generateDailyChallenges(today);
    await AsyncStorage.setItem(`${CHALLENGES_STORAGE_KEY}_${today}`, JSON.stringify(challenges));
    return challenges;
  } catch (error) {
    console.error('Error loading daily challenges:', error);
    return generateDailyChallenges(today);
  }
};

/**
 * Update challenge progress
 */
export const updateChallengeProgress = async (
  challengeId: string,
  progress: number
): Promise<DailyChallenge[]> => {
  const challenges = await loadTodaysChallenges();

  const updatedChallenges = challenges.map(challenge => {
    if (challenge.id === challengeId) {
      const newProgress = progress;
      const isCompleted = newProgress >= challenge.requirement.value;

      return {
        ...challenge,
        progress: newProgress,
        completed: isCompleted,
      };
    }
    return challenge;
  });

  const today = new Date().toISOString().split('T')[0];
  await AsyncStorage.setItem(`${CHALLENGES_STORAGE_KEY}_${today}`, JSON.stringify(updatedChallenges));

  return updatedChallenges;
};

/**
 * Check and update challenges after a game
 */
export const checkChallengesAfterGame = async (
  playerId: string,
  gameType: 'war' | 'ers' | 'gofish' | 'uno' | 'hearts' | 'phase10' | 'kings',
  won: boolean,
  gameData: any
): Promise<{ completedChallenges: DailyChallenge[]; updatedChallenges: DailyChallenge[] }> => {
  const challenges = await loadTodaysChallenges();
  const stats = await loadStats(playerId);
  const completedChallenges: DailyChallenge[] = [];

  let updatedChallenges = challenges;

  for (const challenge of challenges) {
    if (challenge.completed) continue;

    let newProgress = challenge.progress;

    // Check win challenge
    if (challenge.requirement.type === 'wins' && won) {
      if (challenge.gameType === gameType || challenge.challenge.includes('Win') && !challenge.challenge.includes(gameType)) {
        newProgress = challenge.progress + 1;
      }
    }

    // Check games played challenge
    if (challenge.requirement.type === 'games_played' && challenge.gameType === gameType) {
      newProgress = challenge.progress + 1;
    }

    // Check slaps challenge (ERS specific)
    if (challenge.requirement.type === 'slaps' && gameType === 'ers' && gameData.slapsLanded) {
      newProgress = challenge.progress + gameData.slapsLanded;
    }

    // Update progress
    if (newProgress > challenge.progress) {
      updatedChallenges = await updateChallengeProgress(challenge.id, newProgress);

      if (newProgress >= challenge.requirement.value) {
        completedChallenges.push(challenge);

        // Award rewards
        if (stats) {
          stats.xp += challenge.reward.xp;
          stats.dailyChallengesCompleted++;

          // Check for level up
          while (stats.xp >= stats.xpToNextLevel) {
            stats.xp -= stats.xpToNextLevel;
            stats.level++;
            stats.xpToNextLevel = Math.floor(stats.xpToNextLevel * 1.5);
          }

          await saveStats(stats);
        }
      }
    }
  }

  // Update daily streak
  if (stats && completedChallenges.length > 0) {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (stats.lastDailyChallengeDate === yesterday) {
      stats.currentDailyStreak++;
    } else if (stats.lastDailyChallengeDate !== today) {
      stats.currentDailyStreak = 1;
    }

    stats.lastDailyChallengeDate = today;
    await saveStats(stats);
  }

  return { completedChallenges, updatedChallenges };
};

/**
 * Get challenge completion percentage for today
 */
export const getTodayCompletionPercentage = async (): Promise<number> => {
  const challenges = await loadTodaysChallenges();
  const completed = challenges.filter(c => c.completed).length;
  return (completed / challenges.length) * 100;
};
