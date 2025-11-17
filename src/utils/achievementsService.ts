import { Achievement, PlayerStats } from '../types/stats';
import { saveStats } from './statsService';

export const ACHIEVEMENTS: Achievement[] = [
  // General Achievements
  {
    id: 'first_win',
    name: 'First Victory',
    description: 'Win your first game',
    icon: '🏆',
    category: 'general',
    requirement: { type: 'win_count', value: 1 },
    reward: { xp: 50 },
  },
  {
    id: 'win_10',
    name: 'Rising Star',
    description: 'Win 10 games',
    icon: '⭐',
    category: 'general',
    requirement: { type: 'win_count', value: 10 },
    reward: { xp: 100, cardBack: 'neon' },
  },
  {
    id: 'win_50',
    name: 'Champion',
    description: 'Win 50 games',
    icon: '👑',
    category: 'general',
    requirement: { type: 'win_count', value: 50 },
    reward: { xp: 500, cardBack: 'gold' },
  },
  {
    id: 'win_100',
    name: 'Legend',
    description: 'Win 100 games',
    icon: '💎',
    category: 'general',
    requirement: { type: 'win_count', value: 100 },
    reward: { xp: 1000, cardBack: 'diamond', theme: 'dark' },
  },
  {
    id: 'streak_3',
    name: 'Hot Streak',
    description: 'Win 3 games in a row',
    icon: '🔥',
    category: 'general',
    requirement: { type: 'streak', value: 3 },
    reward: { xp: 75 },
  },
  {
    id: 'streak_5',
    name: 'On Fire',
    description: 'Win 5 games in a row',
    icon: '🔥🔥',
    category: 'general',
    requirement: { type: 'streak', value: 5 },
    reward: { xp: 150, cardBack: 'flame' },
  },
  {
    id: 'streak_10',
    name: 'Unstoppable',
    description: 'Win 10 games in a row',
    icon: '🔥🔥🔥',
    category: 'general',
    requirement: { type: 'streak', value: 10 },
    reward: { xp: 500, cardBack: 'phoenix' },
  },

  // War Achievements
  {
    id: 'war_master',
    name: 'War Master',
    description: 'Win 20 War games',
    icon: '⚔️',
    category: 'war',
    requirement: { type: 'stat_threshold', value: 20, statKey: 'warStats.wins' },
    reward: { xp: 200, cardBack: 'military' },
  },
  {
    id: 'war_big_pile',
    name: 'Jackpot',
    description: 'Win a pile of 20+ cards in War',
    icon: '💰',
    category: 'war',
    requirement: { type: 'stat_threshold', value: 20, statKey: 'warStats.largestPileWon' },
    reward: { xp: 100 },
  },

  // ERS Achievements
  {
    id: 'ers_slap_master',
    name: 'Slap Master',
    description: 'Land 100 valid slaps',
    icon: '👋',
    category: 'ers',
    requirement: { type: 'stat_threshold', value: 100, statKey: 'ersStats.slapsLanded' },
    reward: { xp: 300, cardBack: 'lightning' },
  },
  {
    id: 'ers_perfect',
    name: 'Perfect Reflexes',
    description: 'Win an ERS game with 100% slap accuracy',
    icon: '🎯',
    category: 'ers',
    requirement: { type: 'special', value: 1 },
    reward: { xp: 200 },
  },
  {
    id: 'ers_speed_demon',
    name: 'Speed Demon',
    description: 'Slap in under 200ms',
    icon: '⚡',
    category: 'ers',
    requirement: { type: 'stat_threshold', value: 200, statKey: 'ersStats.fastestSlap' },
    reward: { xp: 150 },
  },

  // Go Fish Achievements
  {
    id: 'gofish_collector',
    name: 'Master Collector',
    description: 'Collect 50 books in Go Fish',
    icon: '📚',
    category: 'gofish',
    requirement: { type: 'stat_threshold', value: 50, statKey: 'goFishStats.booksCollected' },
    reward: { xp: 200 },
  },
  {
    id: 'gofish_lucky',
    name: 'Lucky Guesser',
    description: 'Successfully ask for cards 30 times',
    icon: '🍀',
    category: 'gofish',
    requirement: { type: 'stat_threshold', value: 30, statKey: 'goFishStats.successfulAsks' },
    reward: { xp: 150 },
  },

  // UNO Achievements
  {
    id: 'uno_wild',
    name: 'Wild Card',
    description: 'Play 50 wild cards',
    icon: '🃏',
    category: 'uno',
    requirement: { type: 'stat_threshold', value: 50, statKey: 'unoStats.wildCardsPlayed' },
    reward: { xp: 150 },
  },
  {
    id: 'uno_revenge',
    name: 'Revenge',
    description: 'Play 20 Wild Draw 4s',
    icon: '😈',
    category: 'uno',
    requirement: { type: 'stat_threshold', value: 20, statKey: 'unoStats.draw4sPlayed' },
    reward: { xp: 100, cardBack: 'rainbow' },
  },

  // Hearts Achievements
  {
    id: 'hearts_moon',
    name: 'Shoot the Moon',
    description: 'Shoot the moon in Hearts',
    icon: '🌙',
    category: 'hearts',
    requirement: { type: 'stat_threshold', value: 1, statKey: 'heartsStats.shootTheMoonCount' },
    reward: { xp: 250 },
  },
  {
    id: 'hearts_perfect',
    name: 'Clean Heart',
    description: 'Win a Hearts game with 0 points',
    icon: '💗',
    category: 'hearts',
    requirement: { type: 'stat_threshold', value: 0, statKey: 'heartsStats.lowestScore' },
    reward: { xp: 300, cardBack: 'heart' },
  },

  // Phase 10 Achievements
  {
    id: 'phase10_complete',
    name: 'Phase Master',
    description: 'Complete all 10 phases in one game',
    icon: '🎯',
    category: 'phase10',
    requirement: { type: 'stat_threshold', value: 1, statKey: 'phase10Stats.perfectGames' },
    reward: { xp: 500, cardBack: 'phases' },
  },
  {
    id: 'phase10_advanced',
    name: 'Advanced Player',
    description: 'Reach phase 7 or higher',
    icon: '📈',
    category: 'phase10',
    requirement: { type: 'stat_threshold', value: 7, statKey: 'phase10Stats.highestPhaseReached' },
    reward: { xp: 150 },
  },

  // Kings Achievements
  {
    id: 'kings_master',
    name: 'Kings Master',
    description: 'Move 25 kings to corners',
    icon: '👑',
    category: 'kings',
    requirement: { type: 'stat_threshold', value: 25, statKey: 'kingsStats.kingsMoved' },
    reward: { xp: 200, cardBack: 'royal' },
  },
];

/**
 * Check if player has unlocked any new achievements
 */
export const checkAchievements = async (
  stats: PlayerStats
): Promise<{ newAchievements: Achievement[]; updatedStats: PlayerStats }> => {
  const newAchievements: Achievement[] = [];

  for (const achievement of ACHIEVEMENTS) {
    // Skip if already unlocked
    if (stats.achievementsUnlocked.includes(achievement.id)) {
      continue;
    }

    let unlocked = false;

    switch (achievement.requirement.type) {
      case 'win_count':
        unlocked = stats.wins >= achievement.requirement.value;
        break;

      case 'streak':
        unlocked = stats.currentStreak >= achievement.requirement.value;
        break;

      case 'stat_threshold':
        if (achievement.requirement.statKey) {
          const value = getNestedValue(stats, achievement.requirement.statKey);
          if (typeof value === 'number') {
            // For stats like fastestSlap where lower is better
            if (achievement.requirement.statKey.includes('fastest') ||
                achievement.requirement.statKey.includes('lowest')) {
              unlocked = value <= achievement.requirement.value && value !== Infinity;
            } else {
              unlocked = value >= achievement.requirement.value;
            }
          }
        }
        break;

      case 'special':
        // Special achievements require manual checking
        // Handled in game-specific logic
        break;
    }

    if (unlocked) {
      newAchievements.push(achievement);
      stats.achievementsUnlocked.push(achievement.id);
      stats.xp += achievement.reward.xp;

      // Unlock rewards
      if (achievement.reward.cardBack && !stats.unlockedCardBacks.includes(achievement.reward.cardBack)) {
        stats.unlockedCardBacks.push(achievement.reward.cardBack);
      }
      if (achievement.reward.theme && !stats.unlockedThemes.includes(achievement.reward.theme)) {
        stats.unlockedThemes.push(achievement.reward.theme);
      }
    }
  }

  // Check for level ups
  while (stats.xp >= stats.xpToNextLevel) {
    stats.xp -= stats.xpToNextLevel;
    stats.level++;
    stats.xpToNextLevel = Math.floor(stats.xpToNextLevel * 1.5);
  }

  if (newAchievements.length > 0) {
    await saveStats(stats);
  }

  return { newAchievements, updatedStats: stats };
};

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Get progress towards an achievement
 */
export const getAchievementProgress = (achievement: Achievement, stats: PlayerStats): number => {
  switch (achievement.requirement.type) {
    case 'win_count':
      return (stats.wins / achievement.requirement.value) * 100;

    case 'streak':
      return (Math.max(0, stats.currentStreak) / achievement.requirement.value) * 100;

    case 'stat_threshold':
      if (achievement.requirement.statKey) {
        const value = getNestedValue(stats, achievement.requirement.statKey);
        if (typeof value === 'number') {
          return Math.min(100, (value / achievement.requirement.value) * 100);
        }
      }
      return 0;

    default:
      return 0;
  }
};
