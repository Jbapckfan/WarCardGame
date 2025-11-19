import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  PLAYER_NAME: '@player_name',
  PLAYER_ID: '@player_id',
  GAME_SESSION: '@game_session',
  PLAYER_STATS: '@player_stats',
  SETTINGS: '@settings',
  LAST_SESSION: '@last_session',
};

export interface GameSession {
  gameId: string;
  playerId: string;
  gameType: 'war' | 'ers';
  timestamp: number;
}

export interface LastSession extends GameSession {
  playerName?: string;
}

export interface PlayerStats {
  totalGames: number;
  wins: number;
  losses: number;
  warGames: number;
  ersGames: number;
  level: number;
  xp: number;
}

export const savePlayerName = async (name: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.PLAYER_NAME, name);
  } catch (error) {
    console.error('Error saving player name:', error);
  }
};

export const getPlayerName = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(KEYS.PLAYER_NAME);
  } catch (error) {
    console.error('Error getting player name:', error);
    return null;
  }
};

export const saveGameSession = async (session: GameSession): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.GAME_SESSION, JSON.stringify(session));
  } catch (error) {
    console.error('Error saving game session:', error);
  }
};

export const getGameSession = async (): Promise<GameSession | null> => {
  try {
    const session = await AsyncStorage.getItem(KEYS.GAME_SESSION);
    return session ? JSON.parse(session) : null;
  } catch (error) {
    console.error('Error getting game session:', error);
    return null;
  }
};

export const clearGameSession = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(KEYS.GAME_SESSION);
  } catch (error) {
    console.error('Error clearing game session:', error);
  }
};

export const saveLastSession = async (session: LastSession): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.LAST_SESSION, JSON.stringify(session));
  } catch (error) {
    console.warn('Unable to persist last session', error);
  }
};

export const getLastSession = async (): Promise<LastSession | null> => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.LAST_SESSION);
    return raw ? (JSON.parse(raw) as LastSession) : null;
  } catch (error) {
    console.warn('Unable to load last session', error);
    return null;
  }
};

export const clearLastSession = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(KEYS.LAST_SESSION);
  } catch (error) {
    console.warn('Unable to clear last session', error);
  }
};

export const savePlayerStats = async (stats: PlayerStats): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.PLAYER_STATS, JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving player stats:', error);
  }
};

export const getPlayerStats = async (): Promise<PlayerStats> => {
  try {
    const stats = await AsyncStorage.getItem(KEYS.PLAYER_STATS);
    if (stats) {
      return JSON.parse(stats);
    }
  } catch (error) {
    console.error('Error getting player stats:', error);
  }

  // Return default stats
  return {
    totalGames: 0,
    wins: 0,
    losses: 0,
    warGames: 0,
    ersGames: 0,
    level: 1,
    xp: 0,
  };
};

export const updatePlayerStats = async (
  gameType: 'war' | 'ers',
  won: boolean
): Promise<PlayerStats> => {
  const stats = await getPlayerStats();

  stats.totalGames += 1;
  if (won) {
    stats.wins += 1;
    stats.xp += 100; // Base XP for win
  } else {
    stats.losses += 1;
    stats.xp += 25; // Consolation XP
  }

  if (gameType === 'war') {
    stats.warGames += 1;
  } else {
    stats.ersGames += 1;
  }

  // Level up calculation (100 XP per level)
  const newLevel = Math.floor(stats.xp / 100) + 1;
  if (newLevel > stats.level) {
    stats.level = newLevel;
  }

  await savePlayerStats(stats);
  return stats;
};
