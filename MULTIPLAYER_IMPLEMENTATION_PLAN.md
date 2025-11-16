# Multiplayer Implementation Plan

## Overview

This document outlines the complete plan to add Firebase-based multiplayer to all card games (except Solitaire).

## ✅ Completed (Phase 1: Security Foundation)

### 1. Firebase Authentication
- ✅ Added Firebase Auth to config (`src/config/firebase.ts`)
- ✅ Created authentication service (`src/utils/authService.ts`)
- ✅ Implements anonymous authentication (seamless, no signup)
- ✅ Auto-generates player names (e.g., "SwiftFox42")
- ✅ Stores player info in AsyncStorage

### 2. Security Rules Documentation
- ✅ Created `FIREBASE_SECURITY_RULES.md` with complete setup guide
- ✅ Documented how to enable Anonymous Auth in Firebase Console
- ✅ Provided secure Realtime Database rules
- ✅ Explained free tier limits and performance optimization

### 3. ERS Multiplayer (Proof of Concept)
- ✅ Created `src/utils/ersFirebaseService.ts`
- ✅ Functions implemented:
  - `createERSGameRoom()` - Create 2-4 player game
  - `joinERSGameRoom()` - Join existing game
  - `listenToERSGameState()` - Real-time sync
  - `updateERSGameState()` - Push updates
  - `playERSCard()` - Play card with turn management
  - `handleERSSlap()` - Handle slapping mechanic
  - `getAvailableERSRooms()` - List joinable games
  - `deleteERSGame()` - Cleanup

## 📋 TODO (Remaining Implementation)

### Phase 2: Complete ERS Integration (1-2 hours)

**File: `/src/screens/ERSScreen.tsx`**

Current state: Local game only (pass-and-play)
Needed changes:

1. **Add Firebase integration**
   ```typescript
   import { createERSGameRoom, joinERSGameRoom, listenToERSGameState, ... } from '../utils/ersFirebaseService';
   import { initializeAuth, getCurrentUserId } from '../utils/authService';
   ```

2. **Initialize auth on component mount**
   ```typescript
   useEffect(() => {
     initializeAuth();
   }, []);
   ```

3. **Replace local game state with Firebase listener**
   ```typescript
   useEffect(() => {
     if (!gameId.startsWith('local_')) {
       const unsubscribe = listenToERSGameState(gameId, (state) => {
         setGameState(state);
       });
       return () => unsubscribe();
     }
   }, [gameId]);
   ```

4. **Update play card handler to use Firebase**
   ```typescript
   const handlePlayCard = async () => {
     if (gameId.startsWith('local_')) {
       // Local game logic
     } else {
       // Firebase game
       await playERSCard(gameId, playerId, card, newDeck, newPile);
     }
   };
   ```

5. **Update slap handler to use Firebase**
   ```typescript
   const handleSlap = async () => {
     if (gameId.startsWith('local_')) {
       // Local game logic
     } else {
       // Firebase game
       await handleERSSlap(gameId, playerId, successful, wonPile);
     }
   };
   ```

6. **Add push notifications** (already implemented in `notificationService.ts`)
   - Send notification on opponent's turn
   - Send notification on slappable card

---

### Phase 3: UNO Multiplayer (2-3 hours)

**Priority: High** - UNO is popular, 2-4 players

#### Current State
- File: `/src/screens/UNOScreen.tsx`
- Status: Local AI only
- Game type: Turn-based with special cards (Skip, Reverse, Draw 2, Wild)

#### Implementation Steps

1. **Create game state type** (`src/types/uno.ts`)
   ```typescript
   export interface UNOGameState {
     id: string;
     players: Player[]; // 2-4 players with hands
     currentPlayerIndex: number;
     direction: 1 | -1; // Clockwise or counter-clockwise
     drawPile: Card[];
     discardPile: Card[];
     currentColor: 'red' | 'blue' | 'green' | 'yellow';
     gameStatus: 'waiting' | 'playing' | 'finished';
     lastAction: string;
     winner: string | null;
     mustDraw: number; // For +2/+4 stacking
   }
   ```

2. **Create Firebase service** (`src/utils/unoFirebaseService.ts`)
   - `createUNOGameRoom()`
   - `joinUNOGameRoom()`
   - `listenToUNOGameState()`
   - `playUNOCard(card, chosenColor?)`
   - `drawUNOCard()`
   - `callUNO()` // When down to 1 card
   - `challengeUNO()` // Challenge player who didn't call UNO

3. **Update UNOScreen.tsx**
   - Add multiplayer mode selection
   - Integrate Firebase listeners
   - Handle special card effects (Skip, Reverse, Wild)
   - Implement UNO calling mechanic
   - Add turn timer (30 seconds)

4. **Game-specific challenges**
   - Wild card color selection (need modal)
   - UNO calling detection
   - +2/+4 card stacking logic
   - Challenge mechanic for +4

**Estimated time: 2-3 hours**

---

### Phase 4: Phase 10 Multiplayer (2-3 hours)

**Priority: Medium** - Complex game, 2-4 players

#### Current State
- File: `/src/screens/Phase10Screen.tsx`
- Status: Local AI only
- Game type: Rummy-variant with 10 phases

#### Implementation Steps

1. **Create game state type** (`src/types/phase10.ts`)
   ```typescript
   export interface Phase10GameState {
     id: string;
     players: Player[]; // With hands + phases completed
     currentPlayerIndex: number;
     currentPhase: number; // 1-10
     drawPile: Card[];
     discardPile: Card[];
     tableLayouts: { [playerId: string]: Card[][] }; // Sets/runs on table
     gameStatus: 'waiting' | 'playing' | 'finished';
     lastAction: string;
     winner: string | null;
   }
   ```

2. **Create Firebase service** (`src/utils/phase10FirebaseService.ts`)
   - Similar structure to UNO
   - Add `layDownPhase()` - Player completes their phase
   - Add `hitOnPhase()` - Player adds to existing layout
   - Phase validation logic

3. **Update Phase10Screen.tsx**
   - Multiplayer integration
   - Phase completion modal
   - Laying down sets/runs UI
   - Hitting on other players' phases

4. **Game-specific challenges**
   - Phase requirements validation (complex!)
   - Laying down logic (2 sets of 3, run of 7, etc.)
   - Hitting on other players' phases
   - Skip card mechanic

**Estimated time: 2-3 hours**

---

### Phase 5: Go Fish Multiplayer (1 hour)

**Priority: High** - Simple game, great for testing

#### Current State
- File: `/src/screens/GoFishScreen.tsx`
- Status: Local AI only
- Game type: Turn-based asking for cards

#### Implementation Steps

1. **Create game state type** (`src/types/gofish.ts`)
   ```typescript
   export interface GoFishGameState {
     id: string;
     players: Player[]; // 2-4 players with hands
     currentPlayerIndex: number;
     drawPile: Card[];
     books: { [playerId: string]: number }; // Count of 4-of-a-kind
     gameStatus: 'waiting' | 'playing' | 'finished';
     lastAsk: {
       asker: string;
       askee: string;
       rank: Rank;
       success: boolean;
     } | null;
     winner: string | null;
   }
   ```

2. **Create Firebase service** (`src/utils/gofishFirebaseService.ts`)
   - `askForCard(targetPlayerId, rank)`
   - `giveCards(cards)`
   - `drawCard()`
   - `formBook(rank)`

3. **Update GoFishScreen.tsx**
   - Player selection modal (who to ask)
   - Rank selection modal (what to ask for)
   - Book formation animations
   - Firebase integration

**Estimated time: 1 hour**

---

### Phase 6: Hearts Multiplayer (1.5-2 hours)

**Priority: Medium** - 4 players only

#### Current State
- File: `/src/screens/HeartsScreen.tsx`
- Status: Local AI only
- Game type: Trick-taking, always 4 players

#### Implementation Steps

1. **Create game state type** (`src/types/hearts.ts`)
   ```typescript
   export interface HeartsGameState {
     id: string;
     players: [Player, Player, Player, Player]; // Exactly 4
     currentTrick: { playerId: string; card: Card }[];
     heartsBroken: boolean;
     scores: number[]; // Running totals
     roundNumber: number;
     trickWinner: string | null;
     gameStatus: 'waiting' | 'passing' | 'playing' | 'finished';
     passingCards: { [playerId: string]: Card[] }; // Cards being passed
     winner: string | null;
   }
   ```

2. **Create Firebase service** (`src/utils/heartsFirebaseService.ts`)
   - `passCards(cards)` - Pass 3 cards each round
   - `playCard(card)`
   - `resolveTrick()` - Determine trick winner
   - Handle shooting the moon

3. **Update HeartsScreen.tsx**
   - 4-player only enforcement
   - Card passing phase
   - Trick-taking logic
   - Scoring UI

**Estimated time: 1.5-2 hours**

---

### Phase 7: Kings in Corners Multiplayer (1.5 hours)

**Priority: Low** - Less popular

#### Current State
- File: `/src/screens/KingsCornersScreen.tsx`
- Status: Local AI only
- Game type: Solitaire-like multiplayer, 2-4 players

#### Implementation Steps

1. **Create game state type** (`src/types/kingscorners.ts`)
   ```typescript
   export interface KingsCornersGameState {
     id: string;
     players: Player[];
     currentPlayerIndex: number;
     cornerPiles: [Card[], Card[], Card[], Card[]]; // 4 corners
     sidePiles: [Card[], Card[], Card[], Card[]]; // 4 sides
     drawPile: Card[];
     gameStatus: 'waiting' | 'playing' | 'finished';
     winner: string | null;
   }
   ```

2. **Create Firebase service** (`src/utils/kingscornersFirebaseService.ts`)
   - `playCardToPile(card, pileIndex, pileType: 'corner' | 'side')`
   - `moveKingToCorner(fromIndex)`
   - `mergePiles(fromIndex, toIndex)`
   - `drawCard()`

3. **Update KingsCornersScreen.tsx**
   - Multiplayer integration
   - Pile merging UI
   - King movement

**Estimated time: 1.5 hours**

---

## Implementation Checklist for Each Game

For each game, follow these steps:

### 1. Type Definitions (15-30 min)
- [ ] Create game state interface in `/src/types/{game}.ts`
- [ ] Define room interface
- [ ] Add game-specific types (enums, unions, etc.)

### 2. Firebase Service (30-60 min)
- [ ] Create `/src/utils/{game}FirebaseService.ts`
- [ ] Implement `createGameRoom()`
- [ ] Implement `joinGameRoom()`
- [ ] Implement `listenToGameState()`
- [ ] Implement `updateGameState()`
- [ ] Implement game-specific actions
- [ ] Implement `getAvailableRooms()`
- [ ] Implement `deleteGame()`

### 3. Screen Updates (30-90 min)
- [ ] Import auth and Firebase services
- [ ] Add auth initialization
- [ ] Add Firebase state listener
- [ ] Update all game actions to use Firebase
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add disconnect handling

### 4. Menu Integration (15 min)
- [ ] Update MenuScreen to show Create/Join options
- [ ] Add room code sharing
- [ ] Add join by code UI

### 5. Testing (15-30 min per game)
- [ ] Test create game
- [ ] Test join game
- [ ] Test gameplay
- [ ] Test disconnection
- [ ] Test game completion

---

## Code Patterns & Reusable Components

### Generic Firebase Functions

Create `/src/utils/genericMultiplayerService.ts` with shared logic:

```typescript
export const createGenericGameRoom = async (
  gameType: string,
  playerId: string,
  playerName: string,
  maxPlayers: number,
  initialState: any
): Promise<string> => {
  // Shared room creation logic
};

export const joinGenericGameRoom = async (
  gameType: string,
  roomId: string,
  playerId: string,
  playerName: string
): Promise<boolean> => {
  // Shared join logic
};
```

### Reusable UI Components

1. **RoomCodeDisplay** - Shows shareable room code
2. **PlayerList** - Shows all players in game
3. **WaitingRoom** - Lobby while waiting for players
4. **TurnIndicator** - Shows whose turn it is
5. **ConnectionStatus** - Shows online/offline status

---

## Testing Strategy

### Unit Tests
- [ ] Test game logic functions (in `{game}Logic.ts` files)
- [ ] Test Firebase service functions (mock Firebase)

### Integration Tests
- [ ] Test full game flow for each game
- [ ] Test 2-player, 3-player, 4-player scenarios
- [ ] Test disconnection/reconnection

### Manual Testing Checklist
For each game:
- [ ] Create game on Device A
- [ ] Join game on Device B
- [ ] Play complete game
- [ ] Test forfeit
- [ ] Test app backgrounding
- [ ] Test network interruption

---

## Performance Considerations

### Firebase Optimization
1. **Minimize writes** - Batch updates when possible
2. **Use transactions** for critical state (like slapping in ERS)
3. **Implement debouncing** for rapid actions
4. **Add indexes** in Firebase Console for queries

### App Performance
1. **Memoize components** - Use React.memo for cards
2. **Virtualize lists** - For long card lists
3. **Lazy load games** - Don't import all games upfront
4. **Optimize animations** - Use `useNativeDriver` where possible

---

## Security Considerations

### Firebase Rules (Already Implemented)
- ✅ Players can only read their own games
- ✅ Players can only write to games they're in
- ✅ Room browsing is authenticated

### Client-Side Validation
- [ ] Validate all moves before Firebase write
- [ ] Check turn order before allowing actions
- [ ] Validate card plays against game rules

### Future: Server-Side Validation (Optional)
- Consider Cloud Functions for critical validation
- Requires Firebase Blaze plan ($0.40/million invocations)
- Only needed if cheating becomes an issue

---

## Rollout Plan

### Phase 1: Core Infrastructure ✅
- Firebase Auth
- Security Rules
- Generic services

### Phase 2: Proof of Concept (Current)
- Complete ERS multiplayer
- Test with real users
- Gather feedback

### Phase 3: Popular Games
1. UNO (most requested)
2. Go Fish (simplest)
3. Hearts (4-player test)

### Phase 4: Remaining Games
4. Phase 10
5. Kings in Corners

### Phase 5: Polish
- Add matchmaking
- Add friend system
- Add game history
- Add statistics/leaderboards

---

## Estimated Total Time

| Phase | Task | Time |
|-------|------|------|
| ✅ 1 | Security setup | 1 hour |
| ✅ 1 | ERS service | 1 hour |
| 2 | ERS screen integration | 1 hour |
| 3 | UNO | 2.5 hours |
| 4 | Phase 10 | 2.5 hours |
| 5 | Go Fish | 1 hour |
| 6 | Hearts | 2 hours |
| 7 | Kings in Corners | 1.5 hours |
| - | Testing & polish | 2 hours |
| **TOTAL** | | **~14-15 hours** |

---

## Next Steps

1. **User must complete** (5 minutes):
   - Follow instructions in `FIREBASE_SECURITY_RULES.md`
   - Enable Anonymous Auth in Firebase Console
   - Add Security Rules in Firebase Console

2. **Development priority**:
   - Finish ERS screen integration (1 hour)
   - Test ERS multiplayer end-to-end
   - Implement UNO (most requested)
   - Implement Go Fish (simplest)
   - Implement remaining games

3. **Future enhancements**:
   - Add in-game chat
   - Add emotes/reactions
   - Add tournament mode
   - Add AI difficulty levels for local games
   - Migrate to Firestore (better scaling)

---

## Questions to Consider

1. **Matchmaking**: Random matching or invite-only?
   - Current: Invite-only (share room code)
   - Future: Add "Quick Play" button for random matching

2. **Abandonment**: What happens if player leaves?
   - Current: Game becomes unplayable
   - Future: Add AI replacement or forfeit logic

3. **Time limits**: Should there be turn timers?
   - Recommendation: Yes, 30-60 seconds per turn
   - Prevents stalling

4. **Reconnection**: What if player disconnects?
   - Firebase handles this automatically
   - State persists, player can rejoin

5. **Game history**: Save completed games?
   - Not implemented yet
   - Could add to Firebase for stats

---

## Resources

- [Firebase Realtime Database Docs](https://firebase.google.com/docs/database)
- [Firebase Auth Docs](https://firebase.google.com/docs/auth)
- [React Native Firebase](https://rnfirebase.io/)
- [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)
