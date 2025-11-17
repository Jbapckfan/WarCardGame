export interface PlayerStats {
  playerId: string;
  playerName: string;

  // Lifetime stats
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  currentStreak: number;
  longestWinStreak: number;
  longestLoseStreak: number;

  // Per-game stats
  warStats: {
    gamesPlayed: number;
    wins: number;
    warsWon: number;
    largestPileWon: number;
    fastestWin: number; // in seconds
  };

  ersStats: {
    gamesPlayed: number;
    wins: number;
    slapsLanded: number;
    slapsAttempted: number;
    slapAccuracy: number;
    fastestSlap: number; // in milliseconds
    doublesSlapped: number;
    sandwichesSlapped: number;
    fastestWin: number;
  };

  goFishStats: {
    gamesPlayed: number;
    wins: number;
    booksCollected: number;
    successfulAsks: number;
    goFishCalls: number;
  };

  unoStats: {
    gamesPlayed: number;
    wins: number;
    draw4sPlayed: number;
    wildCardsPlayed: number;
    reversalsPlayed: number;
    fastestWin: number;
  };

  heartsStats: {
    gamesPlayed: number;
    wins: number;
    shootTheMoonCount: number;
    queensTaken: number;
    lowestScore: number;
  };

  phase10Stats: {
    gamesPlayed: number;
    wins: number;
    highestPhaseReached: number;
    perfectGames: number; // Completed all 10 phases
  };

  kingsStats: {
    gamesPlayed: number;
    wins: number;
    pilesCompleted: number;
    kingsMoved: number;
  };

  // Progression
  level: number;
  xp: number;
  xpToNextLevel: number;

  // Achievements
  achievementsUnlocked: string[];

  // Customization
  unlockedCardBacks: string[];
  unlockedThemes: string[];
  activeCardBack: string;
  activeTheme: string;

  // Daily challenges
  dailyChallengesCompleted: number;
  lastDailyChallengeDate: string;
  currentDailyStreak: number;

  // Social
  friends: string[];
  gamesWithFriends: number;

  // Timestamps
  createdAt: number;
  lastPlayedAt: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'war' | 'ers' | 'gofish' | 'uno' | 'hearts' | 'phase10' | 'kings' | 'general';
  requirement: {
    type: 'win_count' | 'streak' | 'stat_threshold' | 'special';
    value: number;
    statKey?: string;
  };
  reward: {
    xp: number;
    cardBack?: string;
    theme?: string;
  };
  unlockedAt?: number;
}

export interface DailyChallenge {
  id: string;
  date: string;
  gameType: 'war' | 'ers' | 'gofish' | 'uno' | 'hearts' | 'phase10' | 'kings';
  challenge: string;
  requirement: {
    type: string;
    value: number;
  };
  reward: {
    xp: number;
    coins?: number;
  };
  completed: boolean;
  progress: number;
}

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  rank: number;
  elo: number;
  wins: number;
  losses: number;
  winRate: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  avatar?: string;
}
