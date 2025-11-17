# Screen Integration Guide - Complete Examples

This guide provides complete integration patterns for all game screens with Firebase multiplayer support.

## 📋 Universal Integration Pattern

Every game screen follows this 4-step pattern:

### Step 1: Add Firebase Imports
### Step 2: Initialize Auth on Mount
### Step 3: Add Firebase Listener
### Step 4: Update All Game Actions

---

## 🎮 GAME-BY-GAME INTEGRATION EXAMPLES

---

## 1. ERS Screen Integration (~30 minutes)

**File:** `/src/screens/ERSScreen.tsx`

### Step 1: Add Imports (top of file)

```typescript
import {
  createERSGameRoom,
  joinERSGameRoom,
  listenToERSGameState,
  playERSCard,
  handleERSSlap,
  deleteERSGame,
} from '../utils/ersFirebaseService';
import { initializeAuth, getCurrentUserId, getPlayerName } from '../utils/authService';
```

### Step 2: Initialize Auth (in component)

```typescript
const ERSScreen = ({ route, navigation }) => {
  const { gameId } = route.params; // "local_123" or Firebase gameId
  const [playerId, setPlayerId] = useState<string>('');

  // Initialize auth on mount
  useEffect(() => {
    const init = async () => {
      await initializeAuth();
      const id = await getCurrentUserId();
      setPlayerId(id);
    };
    init();
  }, []);

  // ... rest of component
};
```

### Step 3: Add Firebase Listener

```typescript
useEffect(() => {
  // Only use Firebase for non-local games
  if (!gameId.startsWith('local_')) {
    const unsubscribe = listenToERSGameState(gameId, (state) => {
      if (state) {
        setGameState(state);
      }
    });
    return () => unsubscribe();
  }
}, [gameId]);
```

### Step 4: Update Game Actions

```typescript
const handlePlayCard = async () => {
  if (gameId.startsWith('local_')) {
    // Existing local game logic
    const newPlayerDeck = [...gameState.playerDeck];
    const newOpponentDeck = [...gameState.opponentDeck];
    // ... local logic
    setGameState(newState);
  } else {
    // Firebase multiplayer
    try {
      const player = gameState.players.find(p => p.id === playerId);
      if (!player) return;

      const card = player.deck[0];
      const newDeck = player.deck.slice(1);
      const newPile = [...gameState.pile, card];

      await playERSCard(gameId, playerId, card, newDeck, newPile);
      // State updates automatically via listener
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }
};

const handleSlap = async () => {
  if (gameId.startsWith('local_')) {
    // Local logic
  } else {
    try {
      const isPileValid = checkForValidSlap(gameState.pile);
      const player = gameState.players.find(p => p.id === playerId);

      await handleERSSlap(gameId, playerId, isPileValid, isPileValid ? gameState.pile : null);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }
};
```

### Step 5: Update UI for Multiplayer

```typescript
// Show which player's turn (disable actions when not your turn)
const isMyTurn = gameState.currentTurn === playerId;

// Show all players
const myPlayer = gameState.players?.find(p => p.id === playerId);
const otherPlayers = gameState.players?.filter(p => p.id !== playerId) || [];

return (
  <View>
    {/* My hand */}
    <Text>{myPlayer?.name}: {myPlayer?.deck.length} cards</Text>

    {/* Other players */}
    {otherPlayers.map((player, index) => (
      <Text key={player.id}>
        {player.name}: {player.deck.length} cards
      </Text>
    ))}

    {/* Play button (disabled if not your turn) */}
    <TouchableOpacity
      onPress={handlePlayCard}
      disabled={!isMyTurn}
      style={[styles.button, !isMyTurn && styles.buttonDisabled]}
    >
      <Text>Play Card</Text>
    </TouchableOpacity>

    {/* Slap button (always enabled) */}
    <TouchableOpacity onPress={handleSlap}>
      <Text>SLAP!</Text>
    </TouchableOpacity>
  </View>
);
```

---

## 2. Go Fish Screen Integration (~30 minutes)

**File:** `/src/screens/GoFishScreen.tsx`

### Step 1-3: Same pattern as ERS

```typescript
import {
  createGoFishGameRoom,
  joinGoFishGameRoom,
  listenToGoFishGameState,
  askForCards,
  deleteGoFishGame,
} from '../utils/gofishFirebaseService';
import { initializeAuth, getCurrentUserId } from '../utils/authService';

// Initialize auth + add listener (same as ERS)
```

### Step 4: Update Ask For Cards Action

```typescript
const handleAskForCards = async (targetPlayerId: string, rank: number) => {
  if (gameId.startsWith('local_')) {
    // Local logic
  } else {
    try {
      await askForCards(gameId, playerId, targetPlayerId, rank);
      // State updates via listener
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }
};
```

### Step 5: Update UI

```typescript
// Show all players with book counts
{gameState.players?.map((player) => (
  <View key={player.id}>
    <Text>{player.name}</Text>
    <Text>Cards: {player.deck.length}</Text>
    <Text>Books: {player.books.length}</Text>

    {/* Ask button (only if it's your turn and not you) */}
    {isMyTurn && player.id !== playerId && (
      <TouchableOpacity onPress={() => setAskingTarget(player.id)}>
        <Text>Ask {player.name}</Text>
      </TouchableOpacity>
    )}
  </View>
))}

{/* Rank selection modal */}
{askingTarget && (
  <Modal visible={true}>
    <Text>Ask for which rank?</Text>
    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map(rank => (
      <TouchableOpacity
        key={rank}
        onPress={() => {
          handleAskForCards(askingTarget, rank);
          setAskingTarget(null);
        }}
      >
        <Text>{rank}</Text>
      </TouchableOpacity>
    ))}
  </Modal>
)}
```

---

## 3. UNO Screen Integration (~1 hour)

**File:** `/src/screens/UNOScreen.tsx`

### Step 1-3: Same pattern

```typescript
import {
  createUNOGameRoom,
  joinUNOGameRoom,
  listenToUNOGameState,
  playUNOCard,
  drawUNOCard,
  callUNO,
  challengeUNO,
  deleteUNOGame,
} from '../utils/unoFirebaseService';
```

### Step 4: Update UNO Actions

```typescript
const [wildColorSelection, setWildColorSelection] = useState<boolean>(false);
const [selectedCard, setSelectedCard] = useState<UnoCard | null>(null);

const handlePlayCard = async (card: UnoCard) => {
  if (gameId.startsWith('local_')) {
    // Local logic
  } else {
    try {
      // If wild, show color picker
      if (card.value === 'wild' || card.value === 'wild4') {
        setSelectedCard(card);
        setWildColorSelection(true);
      } else {
        await playUNOCard(gameId, playerId, card);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }
};

const handleWildColorChoice = async (color: UnoColor) => {
  if (!selectedCard) return;

  try {
    await playUNOCard(gameId, playerId, selectedCard, color);
    setWildColorSelection(false);
    setSelectedCard(null);
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};

const handleDrawCard = async () => {
  if (gameId.startsWith('local_')) {
    // Local logic
  } else {
    try {
      await drawUNOCard(gameId, playerId);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }
};

const handleCallUNO = async () => {
  if (!gameId.startsWith('local_')) {
    await callUNO(gameId, playerId);
  }
};

const handleChallengeUNO = async (targetId: string) => {
  if (!gameId.startsWith('local_')) {
    await challengeUNO(gameId, playerId, targetId);
  }
};
```

### Step 5: Add Wild Color Selection Modal

```typescript
{/* Wild color selection modal */}
{wildColorSelection && (
  <Modal visible={true} transparent={true}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Choose a color</Text>

        {['red', 'blue', 'green', 'yellow'].map(color => (
          <TouchableOpacity
            key={color}
            style={[styles.colorButton, { backgroundColor: color }]}
            onPress={() => handleWildColorChoice(color as UnoColor)}
          >
            <Text style={styles.colorText}>{color.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            setWildColorSelection(false);
            setSelectedCard(null);
          }}
        >
          <Text>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
)}

{/* UNO button (call when you have 1 card) */}
{myPlayer && myPlayer.hand.length === 1 && !gameState.saidUno[playerId] && (
  <TouchableOpacity style={styles.unoButton} onPress={handleCallUNO}>
    <Text style={styles.unoButtonText}>UNO!</Text>
  </TouchableOpacity>
)}

{/* Challenge buttons (catch other players who forgot UNO) */}
{gameState.players?.map(player => {
  if (player.id === playerId) return null;
  if (player.hand.length !== 1) return null;
  if (gameState.saidUno[player.id]) return null;

  return (
    <TouchableOpacity
      key={player.id}
      style={styles.challengeButton}
      onPress={() => handleChallengeUNO(player.id)}
    >
      <Text>Challenge {player.name}!</Text>
    </TouchableOpacity>
  );
})}
```

---

## 4. Hearts Screen Integration (~1 hour)

**File:** `/src/screens/HeartsScreen.tsx`

### Step 1-3: Same pattern

```typescript
import {
  createHeartsGameRoom,
  joinHeartsGameRoom,
  listenToHeartsGameState,
  passHeartsCards,
  playHeartsCard,
  deleteHeartsGame,
} from '../utils/heartsFirebaseService';
```

### Step 4: Update Hearts Actions

```typescript
const [passingCards, setPassingCards] = useState<Card[]>([]);

const handleCardSelection = (card: Card) => {
  if (gameState.gameStatus === 'passing') {
    // Passing phase: select 3 cards
    if (passingCards.find(c => c.id === card.id)) {
      setPassingCards(passingCards.filter(c => c.id !== card.id));
    } else if (passingCards.length < 3) {
      setPassingCards([...passingCards, card]);
    }
  }
};

const handlePassCards = async () => {
  if (passingCards.length !== 3) {
    Alert.alert('Error', 'Must select exactly 3 cards');
    return;
  }

  if (!gameId.startsWith('local_')) {
    try {
      await passHeartsCards(gameId, playerId, passingCards as [Card, Card, Card]);
      setPassingCards([]);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }
};

const handlePlayCard = async (card: Card) => {
  if (gameId.startsWith('local_')) {
    // Local logic
  } else {
    try {
      await playHeartsCard(gameId, playerId, card);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }
};
```

### Step 5: Add Passing UI

```typescript
{/* Passing phase UI */}
{gameState.gameStatus === 'passing' && (
  <View style={styles.passingContainer}>
    <Text>Pass 3 cards {gameState.passingDirection}</Text>
    <Text>Selected: {passingCards.length}/3</Text>

    {/* Player's hand (tap to select) */}
    <View style={styles.hand}>
      {myPlayer?.hand.map(card => (
        <TouchableOpacity
          key={card.id}
          onPress={() => handleCardSelection(card)}
          style={[
            styles.card,
            passingCards.find(c => c.id === card.id) && styles.cardSelected
          ]}
        >
          <CardComponent card={card} />
        </TouchableOpacity>
      ))}
    </View>

    <TouchableOpacity
      style={styles.passButton}
      onPress={handlePassCards}
      disabled={passingCards.length !== 3}
    >
      <Text>Pass Cards</Text>
    </TouchableOpacity>
  </View>
)}

{/* Playing phase UI */}
{gameState.gameStatus === 'playing' && (
  <View>
    {/* Current trick */}
    <View style={styles.trick}>
      {gameState.currentTrick.cards.map(({ playerId, card }) => (
        <View key={card.id}>
          <Text>{gameState.players.find(p => p.id === playerId)?.name}</Text>
          <CardComponent card={card} />
        </View>
      ))}
    </View>

    {/* Player's hand (tap to play) */}
    <View style={styles.hand}>
      {myPlayer?.hand.map(card => (
        <TouchableOpacity
          key={card.id}
          onPress={() => handlePlayCard(card)}
          disabled={!isMyTurn}
        >
          <CardComponent card={card} />
        </TouchableOpacity>
      ))}
    </View>

    {/* Scores */}
    {gameState.players?.map(player => (
      <Text key={player.id}>
        {player.name}: {player.score} this round, {player.totalScore} total
      </Text>
    ))}
  </View>
)}
```

---

## 5. Phase 10 Screen Integration (~1 hour)

**File:** `/src/screens/Phase10Screen.tsx`

### Step 1-3: Same pattern

```typescript
import {
  createPhase10GameRoom,
  joinPhase10GameRoom,
  listenToPhase10GameState,
  drawPhase10Card,
  discardPhase10Card,
  layDownPhase,
  hitOnPhase,
  startNewPhase10Round,
  deletePhase10Game,
} from '../utils/phase10FirebaseService';
```

### Step 4: Update Phase 10 Actions

```typescript
const [layingDown, setLayingDown] = useState<boolean>(false);
const [selectedCards, setSelectedCards] = useState<Phase10Card[]>([]);
const [groups, setGroups] = useState<Phase10Card[][]>([[]]);

const handleDraw = async (fromDiscard: boolean) => {
  if (!gameId.startsWith('local_')) {
    try {
      await drawPhase10Card(gameId, playerId, fromDiscard);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }
};

const handleDiscard = async (card: Phase10Card) => {
  if (!gameId.startsWith('local_')) {
    try {
      await discardPhase10Card(gameId, playerId, card);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }
};

const handleLayDown = async () => {
  if (!gameId.startsWith('local_')) {
    try {
      await layDownPhase(gameId, playerId, groups);
      setLayingDown(false);
      setGroups([[]]);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }
};

const handleHit = async (targetPlayerId: string, groupIndex: number, cards: Phase10Card[]) => {
  if (!gameId.startsWith('local_')) {
    try {
      await hitOnPhase(gameId, playerId, targetPlayerId, groupIndex, cards);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }
};
```

### Step 5: Add Laying Down UI

```typescript
{/* Current phase requirement */}
<Text>
  {myPlayer?.name} - Phase {myPlayer?.currentPhase}:
  {PHASES[myPlayer?.currentPhase - 1]?.description}
</Text>

{/* Lay down button */}
{isMyTurn && !myPlayer?.completedPhase && (
  <TouchableOpacity onPress={() => setLayingDown(true)}>
    <Text>Lay Down Phase</Text>
  </TouchableOpacity>
)}

{/* Laying down modal */}
{layingDown && (
  <Modal visible={true}>
    <Text>Arrange cards for Phase {myPlayer?.currentPhase}</Text>

    {/* Group builder */}
    {groups.map((group, groupIndex) => (
      <View key={groupIndex}>
        <Text>Group {groupIndex + 1}</Text>
        {group.map(card => (
          <CardComponent key={card.id} card={card} />
        ))}
      </View>
    ))}

    {/* Available cards */}
    {myPlayer?.hand
      .filter(card => !groups.flat().find(c => c.id === card.id))
      .map(card => (
        <TouchableOpacity
          key={card.id}
          onPress={() => {
            const newGroups = [...groups];
            newGroups[currentGroup].push(card);
            setGroups(newGroups);
          }}
        >
          <CardComponent card={card} />
        </TouchableOpacity>
      ))
    }

    <TouchableOpacity onPress={handleLayDown}>
      <Text>Confirm</Text>
    </TouchableOpacity>

    <TouchableOpacity onPress={() => setLayingDown(false)}>
      <Text>Cancel</Text>
    </TouchableOpacity>
  </Modal>
)}

{/* Other players' laid down phases (can hit on them) */}
{gameState.players?.map(player => {
  if (!player.completedPhase) return null;

  return (
    <View key={player.id}>
      <Text>{player.name} - Phase {player.currentPhase}</Text>
      {player.laidDownCards.map((group, groupIndex) => (
        <View key={groupIndex}>
          {group.map(card => (
            <CardComponent key={card.id} card={card} />
          ))}

          {/* Hit button (if you've laid down) */}
          {myPlayer?.completedPhase && (
            <TouchableOpacity
              onPress={() => {
                // Show card selection modal
                // Then call handleHit
              }}
            >
              <Text>Hit</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
})}
```

---

## 6. Kings in Corners Screen Integration (~1 hour)

**File:** `/src/screens/KingsCornersScreen.tsx`

### Step 1-3: Same pattern

```typescript
import {
  createKingsCornersGameRoom,
  joinKingsCornersGameRoom,
  listenToKingsCornersGameState,
  playCardToPile,
  moveKingToCorner,
  mergePiles,
  drawCardAndEndTurn,
  deleteKingsCornersGame,
} from '../utils/kingsCornersFirebaseService';
```

### Step 4: Update Kings in Corners Actions

```typescript
const [selectedCard, setSelectedCard] = useState<KingsCard | null>(null);
const [selectedPile, setSelectedPile] = useState<{ type: 'corner' | 'side', index: number } | null>(null);

const handlePlayCard = async (
  card: KingsCard,
  pileType: 'corner' | 'side',
  pileIndex: 0 | 1 | 2 | 3
) => {
  if (!gameId.startsWith('local_')) {
    try {
      await playCardToPile(gameId, playerId, card, pileType, pileIndex);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }
};

const handleMoveKing = async (sidePileIndex: number, cornerPileIndex: number) => {
  if (!gameId.startsWith('local_')) {
    try {
      await moveKingToCorner(gameId, playerId, sidePileIndex as any, cornerPileIndex as any);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }
};

const handleMergePiles = async (
  fromType: 'corner' | 'side',
  fromIndex: number,
  toType: 'corner' | 'side',
  toIndex: number
) => {
  if (!gameId.startsWith('local_')) {
    try {
      await mergePiles(gameId, playerId, fromType, fromIndex as any, toType, toIndex as any);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }
};

const handleEndTurn = async () => {
  if (!gameId.startsWith('local_')) {
    await drawCardAndEndTurn(gameId, playerId);
  }
};
```

### Step 5: Add Board UI

```typescript
<View style={styles.board}>
  {/* Corner piles (4 corners) */}
  <View style={styles.corners}>
    {gameState.cornerPiles.map((pile, index) => (
      <TouchableOpacity
        key={index}
        style={styles.cornerPile}
        onPress={() => {
          if (selectedCard) {
            handlePlayCard(selectedCard, 'corner', index as any);
            setSelectedCard(null);
          } else if (selectedPile) {
            // Merge pile
          }
        }}
      >
        <Text>Corner {index + 1}</Text>
        {pile.length > 0 ? (
          <CardComponent card={pile[pile.length - 1]} />
        ) : (
          <Text>Empty (Kings only)</Text>
        )}
        <Text>{pile.length} cards</Text>
      </TouchableOpacity>
    ))}
  </View>

  {/* Side piles (4 sides) */}
  <View style={styles.sides}>
    {gameState.sidePiles.map((pile, index) => (
      <TouchableOpacity
        key={index}
        style={styles.sidePile}
        onPress={() => {
          if (selectedCard) {
            handlePlayCard(selectedCard, 'side', index as any);
            setSelectedCard(null);
          }
        }}
      >
        <Text>{['North', 'East', 'South', 'West'][index]}</Text>
        {pile.length > 0 ? (
          <CardComponent card={pile[pile.length - 1]} />
        ) : (
          <Text>Empty</Text>
        )}
      </TouchableOpacity>
    ))}
  </View>

  {/* Player's hand */}
  <View style={styles.hand}>
    {myPlayer?.deck.map(card => (
      <TouchableOpacity
        key={card.id}
        onPress={() => setSelectedCard(card)}
        style={[styles.card, selectedCard?.id === card.id && styles.cardSelected]}
      >
        <CardComponent card={card} />
      </TouchableOpacity>
    ))}
  </View>

  {/* End turn button */}
  {isMyTurn && (
    <TouchableOpacity style={styles.endTurnButton} onPress={handleEndTurn}>
      <Text>Draw Card & End Turn</Text>
    </TouchableOpacity>
  )}
</View>
```

---

## 🎨 STYLING RECOMMENDATIONS

Add these common styles to all multiplayer game screens:

```typescript
const styles = StyleSheet.create({
  // Disabled state
  buttonDisabled: {
    opacity: 0.5,
    backgroundColor: '#cccccc',
  },

  // Turn indicator
  turnIndicator: {
    padding: 12,
    backgroundColor: '#4ade80',
    borderRadius: 8,
    marginBottom: 16,
  },
  notYourTurn: {
    backgroundColor: '#fbbf24',
  },

  // Player list
  playerList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  playerCard: {
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    minWidth: 80,
  },
  currentPlayer: {
    backgroundColor: '#dbeafe',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },

  // Modal overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    minWidth: 300,
  },

  // Card selection
  cardSelected: {
    borderWidth: 3,
    borderColor: '#3b82f6',
    transform: [{ translateY: -10 }],
  },
});
```

---

## ✅ INTEGRATION CHECKLIST

For each game screen:

- [ ] Add Firebase service imports
- [ ] Add auth service imports
- [ ] Initialize auth on mount
- [ ] Get playerId from auth
- [ ] Add Firebase listener (if not local game)
- [ ] Wrap all actions with local vs Firebase check
- [ ] Add isMyTurn check for action buttons
- [ ] Disable buttons when not player's turn
- [ ] Show all players with status
- [ ] Highlight current player
- [ ] Test create game flow
- [ ] Test join game flow
- [ ] Test full gameplay with 2+ players
- [ ] Add proper error handling
- [ ] Add loading states

---

## 🚀 TESTING MULTIPLAYER

### Local Testing (2 devices/emulators):

1. **Device 1**: Create game → Get room code
2. **Device 2**: Join game → Enter room code
3. **Both**: Verify game starts when all players join
4. **Device 1**: Make a move
5. **Device 2**: Verify state updates in real-time
6. **Device 2**: Make a move
7. **Device 1**: Verify state updates
8. **Both**: Play until game ends
9. **Both**: Verify winner detection

### Common Issues:

- **"Player not found"**: Auth not initialized, check `useEffect` order
- **"Not your turn"**: Check `currentTurn === playerId` logic
- **State not updating**: Verify listener is attached and not removed
- **Cards duplicating**: Check that actions use Firebase OR local, not both
- **Infinite loops**: Make sure `useEffect` has correct dependencies

---

## 📚 REFERENCE

- **Best integration example**: `/src/screens/GameScreen.tsx` (War - fully working)
- **Best Firebase service**: `/src/utils/unoFirebaseService.ts` (most complex)
- **Simplest Firebase service**: `/src/utils/gofishFirebaseService.ts` (good template)
- **Auth service**: `/src/utils/authService.ts`
- **Type definitions**: `/src/types/*.ts`

---

**Estimated total integration time: ~5-6 hours for all 6 screens**
