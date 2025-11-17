import { recordGameResult } from './statsService';
import { checkAchievements } from './achievementsService';
import { checkChallengesAfterGame } from './dailyChallengesService';
import { Achievement, PlayerStats } from '../types/stats';

export interface GameResult {
  playerId: string;
  playerName: string;
  gameType: 'war' | 'ers' | 'gofish' | 'uno' | 'hearts' | 'phase10' | 'kings';
  won: boolean;
  gameData: any;
}

export interface GameCompletionResult {
  leveledUp: boolean;
  newLevel?: number;
  newAchievements: Achievement[];
  xpGained: number;
  updatedStats: PlayerStats;
}

/**
 * Handle all post-game processing:
 * - Record stats
 * - Check achievements
 * - Check daily challenges
 * - Calculate rewards
 */
export const handleGameCompletion = async (
  result: GameResult
): Promise<GameCompletionResult> => {
  const { playerId, playerName, gameType, won, gameData } = result;

  // Get old level before recording
  const oldStats = await recordGameResult(playerId, gameType, won, {
    ...gameData,
    playerName,
  });
  const oldLevel = oldStats.level - (oldStats.xp >= oldStats.xpToNextLevel ? 1 : 0);

  // Record stats and get updated stats
  const updatedStats = await recordGameResult(playerId, gameType, won, {
    ...gameData,
    playerName,
  });

  // Check for achievements
  const { newAchievements } = await checkAchievements(updatedStats);

  // Check daily challenges
  await checkChallengesAfterGame(playerId, gameType, won, gameData);

  // Determine if leveled up
  const leveledUp = updatedStats.level > oldLevel;
  const xpGained = won ? 50 : 20; // Base XP

  return {
    leveledUp,
    newLevel: leveledUp ? updatedStats.level : undefined,
    newAchievements,
    xpGained,
    updatedStats,
  };
};
