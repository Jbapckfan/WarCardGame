# Game Integration Guide

## Stats & Achievements Integration Pattern

### For Each Game Screen (War, ERS, Phase10, etc.)

#### 1. Add imports at the top:
```typescript
import { handleGameCompletion } from '../utils/gameCompletionHandler';
import { AchievementNotification } from '../components/AchievementNotification';
import { LevelUpNotification } from '../components/LevelUpNotification';
import { soundService } from '../utils/soundService';
```

#### 2. Add state for notifications:
```typescript
const [showAchievement, setShowAchievement] = useState(false);
const [newAchievement, setNewAchievement] = useState<any>(null);
const [showLevelUp, setShowLevelUp] = useState(false);
const [newLevel, setNewLevel] = useState(0);
const [gameStartTime] = useState(Date.now());
```

#### 3. When game ends (find where gameStatus = 'finished'):
```typescript
// When game ends:
if (result.player1NewDeck.length === 0 || result.player2NewDeck.length === 0) {
  immediateUpdates.gameStatus = 'finished';
  immediateUpdates.winner = result.winner;

  // Record stats and check achievements
  const won = result.winner === playerId;
  const gameDuration = Date.now() - gameStartTime;

  const gameData = {
    gameDuration,
    warsWon: 0, // Track during game
    largestPile: 0, // Track during game
  };

  const completion = await handleGameCompletion({
    playerId,
    playerName: currentPlayer.name,
    gameType: 'war',
    won,
    gameData,
  });

  // Play sound
  await soundService.play(won ? 'win' : 'lose');

  // Show level up if applicable
  if (completion.leveledUp) {
    setNewLevel(completion.newLevel!);
    setShowLevelUp(true);
    await soundService.play('levelUp');
  }

  // Show achievements
  if (completion.newAchievements.length > 0) {
    for (const achievement of completion.newAchievements) {
      setNewAchievement(achievement);
      setShowAchievement(true);
      await soundService.play('achievement');
      await new Promise(resolve => setTimeout(resolve, 3500));
    }
  }
}
```

#### 4. Add notification components to render:
```typescript
return (
  <View>
    {/* Game UI */}

    <AchievementNotification
      visible={showAchievement}
      achievement={newAchievement}
      onClose={() => setShowAchievement(false)}
    />

    <LevelUpNotification
      visible={showLevelUp}
      newLevel={newLevel}
      onClose={() => setShowLevelUp(false)}
    />
  </View>
);
```

## Game-Specific Data to Track

### War
```typescript
const gameData = {
  gameDuration: Date.now() - gameStartTime,
  warsWon: warsWonCount, // Increment when player wins a war
  largestPile: largestPileWon, // Track max pile size won
};
```

### ERS
```typescript
const gameData = {
  gameDuration: Date.now() - gameStartTime,
  slapsLanded: slapsLandedCount,
  slapsAttempted: slapsAttemptedCount,
  fastestSlap: fastestSlapTime,
  doublesSlapped: doublesCount,
  sandwichesSlapped: sandwichesCount,
};
```

### Go Fish
```typescript
const gameData = {
  booksCollected: booksCollectedCount,
  successfulAsks: successfulAsksCount,
  goFishCalls: goFishCallsCount,
};
```

### UNO
```typescript
const gameData = {
  gameDuration: Date.now() - gameStartTime,
  draw4sPlayed: draw4sPlayedCount,
  wildCardsPlayed: wildCardsPlayedCount,
  reversalsPlayed: reversalsPlayedCount,
};
```

### Hearts
```typescript
const gameData = {
  shootTheMoon: shootTheMoonFlag,
  queensTaken: queensTakenCount,
  finalScore: finalScoreValue,
};
```

### Phase 10
```typescript
const gameData = {
  phaseReached: currentPhase,
  completedAllPhases: currentPhase === 10,
};
```

### Kings in Corners
```typescript
const gameData = {
  pilesCompleted: pilesCompletedCount,
  kingsMoved: kingsMovedCount,
};
```

## Sound Effects to Add

```typescript
// During gameplay:
await soundService.play('cardFlip');  // When card is played
await soundService.play('buttonClick'); // Button presses
await soundService.play('cardSlap'); // Slap attempt
await soundService.play('slapSuccess'); // Valid slap
await soundService.play('slapFail'); // Invalid slap

// On game end:
await soundService.play(won ? 'win' : 'lose');

// On special events:
await soundService.play('achievement'); // Achievement unlocked
await soundService.play('levelUp'); // Level up
```

## First-Time User Experience

Add to App.tsx:
```typescript
const [showFirstTimeModal, setShowFirstTimeModal] = useState(false);

useEffect(() => {
  checkFirstTimeUser();
}, []);

const checkFirstTimeUser = async () => {
  const hasSeenTutorial = await AsyncStorage.getItem('tutorial_seen');
  if (!hasSeenTutorial) {
    setShowFirstTimeModal(true);
  }
};

const handleStartTutorial = async () => {
  await AsyncStorage.setItem('tutorial_seen', 'true');
  setShowFirstTimeModal(false);
  handleViewTutorial();
};

const handleSkipTutorial = async () => {
  await AsyncStorage.setItem('tutorial_seen', 'true');
  setShowFirstTimeModal(false);
};

// In render:
<FirstTimeUserModal
  visible={showFirstTimeModal}
  onStartTutorial={handleStartTutorial}
  onSkip={handleSkipTutorial}
/>
```

## Loading States Pattern

```typescript
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  loadGameData();
}, []);

const loadGameData = async () => {
  try {
    setIsLoading(true);
    setError(null);
    // Load data...
    setIsLoading(false);
  } catch (err) {
    setError('Failed to load game. Please try again.');
    setIsLoading(false);
  }
};

// In render:
if (isLoading) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#F59E0B" />
      <Text style={styles.loadingText}>Loading game...</Text>
    </View>
  );
}

if (error) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity onPress={loadGameData}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}
```
