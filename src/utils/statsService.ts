import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlayerStats } from '../types/stats';
import { database } from '../config/firebase';
import { ref, set, get, update } from 'firebase/database';

const STATS_STORAGE_KEY = 'player_stats';

/**
 * Initialize default stats for new player
 */
export const createDefaultStats = (playerId: string, playerName: string): PlayerStats => {
  return {
    playerId,
    playerName,
    totalGames: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    currentStreak: 0,
    longestWinStreak: 0,
    longestLoseStreak: 0,
    warStats: {
      gamesPlayed: 0,
      wins: 0,
      warsWon: 0,
      largestPileWon: 0,
      fastestWin: Infinity,
    },
    ersStats: {
      gamesPlayed: 0,
      wins: 0,
      slapsLanded: 0,
      slapsAttempted: 0,
      slapAccuracy: 0,
      fastestSlap: Infinity,
      doublesSlapped: 0,
      sandwichesSlapped: 0,
      fastestWin: Infinity,
    },
    goFishStats: {
      gamesPlayed: 0,
      wins: 0,
      booksCollected: 0,
      successfulAsks: 0,
      goFishCalls: 0,
    },
    unoStats: {
      gamesPlayed: 0,
      wins: 0,
      draw4sPlayed: 0,
      wildCardsPlayed: 0,
      reversalsPlayed: 0,
      fastestWin: Infinity,
    },
    heartsStats: {
      gamesPlayed: 0,
      wins: 0,
      shootTheMoonCount: 0,
      queensTaken: 0,
      lowestScore: Infinity,
    },
    phase10Stats: {
      gamesPlayed: 0,
      wins: 0,
      highestPhaseReached: 0,
      perfectGames: 0,
    },
    kingsStats: {
      gamesPlayed: 0,
      wins: 0,
      pilesCompleted: 0,
      kingsMoved: 0,
    },
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    achievementsUnlocked: [],
    unlockedCardBacks: ['default'],
    unlockedThemes: ['default'],
    activeCardBack: 'default',
    activeTheme: 'default',
    dailyChallengesCompleted: 0,
    lastDailyChallengeDate: '',
    currentDailyStreak: 0,
    friends: [],
    gamesWithFriends: 0,
    createdAt: Date.now(),
    lastPlayedAt: Date.now(),
  };
};

/**
 * Load stats from local storage
 */
export const loadStats = async (playerId: string): Promise<PlayerStats | null> => {
  try {
    // Try local storage first
    const stored = await AsyncStorage.getItem(`${STATS_STORAGE_KEY}_${playerId}`);
    if (stored) {
      return JSON.parse(stored);
    }

    // Try Firebase if available
    if (database) {
      const statsRef = ref(database, `playerStats/${playerId}`);
      const snapshot = await get(statsRef);
      if (snapshot.exists()) {
        const stats = snapshot.val();
        // Cache locally
        await AsyncStorage.setItem(`${STATS_STORAGE_KEY}_${playerId}`, JSON.stringify(stats));
        return stats;
      }
    }

    return null;
  } catch (error) {
    console.error('Error loading stats:', error);
    return null;
  }
};

/**
 * Save stats to local storage and Firebase
 */
export const saveStats = async (stats: PlayerStats): Promise<void> => {
  try {
    const statsJson = JSON.stringify(stats);

    // Save locally
    await AsyncStorage.setItem(`${STATS_STORAGE_KEY}_${stats.playerId}`, statsJson);

    // Save to Firebase if available
    if (database) {
      const statsRef = ref(database, `playerStats/${stats.playerId}`);
      await set(statsRef, stats);
    }
  } catch (error) {
    console.error('Error saving stats:', error);
  }
};

/**
 * Record game result and update stats
 */
export const recordGameResult = async (
  playerId: string,
  gameType: 'war' | 'ers' | 'gofish' | 'uno' | 'hearts' | 'phase10' | 'kings',
  won: boolean,
  gameData: any
): Promise<PlayerStats> => {
  let stats = await loadStats(playerId);

  if (!stats) {
    stats = createDefaultStats(playerId, gameData.playerName || 'Player');
  }

  // Update general stats
  stats.totalGames++;
  stats.lastPlayedAt = Date.now();

  if (won) {
    stats.wins++;
    stats.currentStreak = stats.currentStreak >= 0 ? stats.currentStreak + 1 : 1;
    stats.longestWinStreak = Math.max(stats.longestWinStreak, stats.currentStreak);
  } else {
    stats.losses++;
    stats.currentStreak = stats.currentStreak <= 0 ? stats.currentStreak - 1 : -1;
    stats.longestLoseStreak = Math.max(stats.longestLoseStreak, Math.abs(stats.currentStreak));
  }

  stats.winRate = (stats.wins / stats.totalGames) * 100;

  // Update game-specific stats
  switch (gameType) {
    case 'war':
      stats.warStats.gamesPlayed++;
      if (won) stats.warStats.wins++;
      if (gameData.warsWon) stats.warStats.warsWon += gameData.warsWon;
      if (gameData.largestPile) {
        stats.warStats.largestPileWon = Math.max(stats.warStats.largestPileWon, gameData.largestPile);
      }
      if (gameData.gameDuration) {
        stats.warStats.fastestWin = Math.min(stats.warStats.fastestWin, gameData.gameDuration);
      }
      break;

    case 'ers':
      stats.ersStats.gamesPlayed++;
      if (won) stats.ersStats.wins++;
      if (gameData.slapsLanded) stats.ersStats.slapsLanded += gameData.slapsLanded;
      if (gameData.slapsAttempted) stats.ersStats.slapsAttempted += gameData.slapsAttempted;
      if (stats.ersStats.slapsAttempted > 0) {
        stats.ersStats.slapAccuracy = (stats.ersStats.slapsLanded / stats.ersStats.slapsAttempted) * 100;
      }
      if (gameData.fastestSlap) {
        stats.ersStats.fastestSlap = Math.min(stats.ersStats.fastestSlap, gameData.fastestSlap);
      }
      if (gameData.doublesSlapped) stats.ersStats.doublesSlapped += gameData.doublesSlapped;
      if (gameData.sandwichesSlapped) stats.ersStats.sandwichesSlapped += gameData.sandwichesSlapped;
      if (gameData.gameDuration && won) {
        stats.ersStats.fastestWin = Math.min(stats.ersStats.fastestWin, gameData.gameDuration);
      }
      break;

    case 'gofish':
      stats.goFishStats.gamesPlayed++;
      if (won) stats.goFishStats.wins++;
      if (gameData.booksCollected) stats.goFishStats.booksCollected += gameData.booksCollected;
      if (gameData.successfulAsks) stats.goFishStats.successfulAsks += gameData.successfulAsks;
      if (gameData.goFishCalls) stats.goFishStats.goFishCalls += gameData.goFishCalls;
      break;

    case 'uno':
      stats.unoStats.gamesPlayed++;
      if (won) stats.unoStats.wins++;
      if (gameData.draw4sPlayed) stats.unoStats.draw4sPlayed += gameData.draw4sPlayed;
      if (gameData.wildCardsPlayed) stats.unoStats.wildCardsPlayed += gameData.wildCardsPlayed;
      if (gameData.reversalsPlayed) stats.unoStats.reversalsPlayed += gameData.reversalsPlayed;
      if (gameData.gameDuration && won) {
        stats.unoStats.fastestWin = Math.min(stats.unoStats.fastestWin, gameData.gameDuration);
      }
      break;

    case 'hearts':
      stats.heartsStats.gamesPlayed++;
      if (won) stats.heartsStats.wins++;
      if (gameData.shootTheMoon) stats.heartsStats.shootTheMoonCount++;
      if (gameData.queensTaken) stats.heartsStats.queensTaken += gameData.queensTaken;
      if (gameData.finalScore) {
        stats.heartsStats.lowestScore = Math.min(stats.heartsStats.lowestScore, gameData.finalScore);
      }
      break;

    case 'phase10':
      stats.phase10Stats.gamesPlayed++;
      if (won) stats.phase10Stats.wins++;
      if (gameData.phaseReached) {
        stats.phase10Stats.highestPhaseReached = Math.max(stats.phase10Stats.highestPhaseReached, gameData.phaseReached);
      }
      if (gameData.completedAllPhases) stats.phase10Stats.perfectGames++;
      break;

    case 'kings':
      stats.kingsStats.gamesPlayed++;
      if (won) stats.kingsStats.wins++;
      if (gameData.pilesCompleted) stats.kingsStats.pilesCompleted += gameData.pilesCompleted;
      if (gameData.kingsMoved) stats.kingsStats.kingsMoved += gameData.kingsMoved;
      break;
  }

  // Award XP
  const xpGained = won ? 50 : 20;
  stats.xp += xpGained;

  // Check for level up
  while (stats.xp >= stats.xpToNextLevel) {
    stats.xp -= stats.xpToNextLevel;
    stats.level++;
    stats.xpToNextLevel = Math.floor(stats.xpToNextLevel * 1.5);
  }

  await saveStats(stats);
  return stats;
};

/**
 * Calculate XP needed for a level
 */
export const getXPForLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level - 1));
};
