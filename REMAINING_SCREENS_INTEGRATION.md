# Remaining Screen Integrations - Quick Reference

## Phase 10 Screen Integration

**File:** `src/screens/Phase10Screen.tsx`

### Changes Needed:

1. **Add imports:**
```typescript
import {
  listenToPhase10GameState,
  drawPhase10Card,
  discardPhase10Card,
  layDownPhase,
  hitOnPhase,
} from '../utils/phase10FirebaseService';
import { initializeAuth, getCurrentUserId } from '../utils/authService';
```

2. **Update props interface:**
```typescript
playerId?: string;  // Make optional
```

3. **Add state:**
```typescript
const [currentUserId, setCurrentUserId] = useState<string>(initialPlayerId || '');
const [isFirebaseGame, setIsFirebaseGame] = useState<boolean>(false);
```

4. **Add auth & listener useEffects** (same as previous screens)

5. **Update game actions:**
- `handleDraw` → use `drawPhase10Card(gameId, currentUserId, fromDiscard)`
- `handleDiscard` → use `discardPhase10Card(gameId, currentUserId, card)`
- `handleLayDown` → use `layDownPhase(gameId, currentUserId, groups)`
- `handleHit` → use `hitOnPhase(gameId, currentUserId, targetPlayerId, groupIndex, cards)`

---

## Kings in Corners Screen Integration

**File:** `src/screens/KingsCornersScreen.tsx`

### Changes Needed:

1. **Add imports:**
```typescript
import {
  listenToKingsCornersGameState,
  playCardToPile,
  moveKingToCorner,
  mergePiles,
  drawCardAndEndTurn,
} from '../utils/kingsCornersFirebaseService';
import { initializeAuth, getCurrentUserId } from '../utils/authService';
```

2. **Update props interface:**
```typescript
playerId?: string;  // Make optional
```

3. **Add state:**
```typescript
const [currentUserId, setCurrentUserId] = useState<string>(initialPlayerId || '');
const [isFirebaseGame, setIsFirebaseGame] = useState<boolean>(false);
```

4. **Add auth & listener useEffects**

5. **Update game actions:**
- `handlePlayCard` → use `playCardToPile(gameId, currentUserId, card, pileType, pileIndex)`
- `handleMoveKing` → use `moveKingToCorner(gameId, currentUserId, sidePileIndex, cornerPileIndex)`
- `handleMergePiles` → use `mergePiles(gameId, currentUserId, fromType, fromIndex, toType, toIndex)`
- `handleEndTurn` → use `drawCardAndEndTurn(gameId, currentUserId)`

---

## Pattern Summary

Every screen integration follows this 5-step pattern:

1. **Imports** - Add Firebase service + auth imports
2. **Props** - Make playerId optional
3. **State** - Add currentUserId and isFirebaseGame
4. **Init** - Add auth init and Firebase listener useEffects
5. **Actions** - Wrap actions with `if (isFirebaseGame)` check

---

## Testing Checklist

After integrating each screen:

- [ ] Local game still works
- [ ] Firebase game receives state updates
- [ ] Turn management works correctly
- [ ] All actions call Firebase functions
- [ ] Error handling in place
- [ ] Player identification correct

---

**These final 2 screens can be integrated in ~30 minutes total following this pattern!**
