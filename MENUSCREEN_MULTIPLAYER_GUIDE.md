# MenuScreen Multiplayer Integration Guide

Complete guide for adding multiplayer game creation and joining to MenuScreen.

---

## 📋 COMPLETE MENUSCREEN INTEGRATION

**File:** `/src/screens/MenuScreen.tsx`

### Step 1: Add All Firebase Service Imports

```typescript
import { Alert, Clipboard } from 'react-native';

// Firebase services
import { createGameRoom, joinGameRoom } from '../utils/firebaseService'; // War
import { createERSGameRoom, joinERSGameRoom } from '../utils/ersFirebaseService';
import { createGoFishGameRoom, joinGoFishGameRoom } from '../utils/gofishFirebaseService';
import { createUNOGameRoom, joinUNOGameRoom } from '../utils/unoFirebaseService';
import { createHeartsGameRoom, joinHeartsGameRoom } from '../utils/heartsFirebaseService';
import { createPhase10GameRoom, joinPhase10GameRoom } from '../utils/phase10FirebaseService';
import { createKingsCornersGameRoom, joinKingsCornersGameRoom } from '../utils/kingsCornersFirebaseService';

// Auth service
import { initializeAuth, getCurrentUserId, getPlayerName } from '../utils/authService';
```

### Step 2: Initialize Auth on Mount

```typescript
const MenuScreen = ({ navigation }) => {
  const [userId, setUserId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');

  useEffect(() => {
    const init = async () => {
      await initializeAuth();
      const id = await getCurrentUserId();
      const name = await getPlayerName();
      setUserId(id);
      setPlayerName(name || `Player${Math.floor(Math.random() * 1000)}`);
    };
    init();
  }, []);

  // ... rest of component
};
```

### Step 3: Add Game Selection Handler

```typescript
const handleGamePress = (gameName: string) => {
  Alert.alert(
    `Play ${gameName}`,
    'Choose game mode',
    [
      {
        text: 'Local (vs AI)',
        onPress: () => startLocalGame(gameName)
      },
      {
        text: 'Create Online Game',
        onPress: () => handleCreateOnlineGame(gameName)
      },
      {
        text: 'Join Online Game',
        onPress: () => handleJoinOnlineGame(gameName)
      },
      {
        text: 'Cancel',
        style: 'cancel'
      }
    ]
  );
};
```

### Step 4: Local Game Handler (existing)

```typescript
const startLocalGame = (gameName: string) => {
  const gameId = `local_${Date.now()}`;

  switch (gameName) {
    case 'War':
      navigation.navigate('GameScreen', { gameId });
      break;
    case 'ERS':
      navigation.navigate('ERSScreen', { gameId });
      break;
    case 'Go Fish':
      navigation.navigate('GoFishScreen', { gameId });
      break;
    case 'UNO':
      navigation.navigate('UNOScreen', { gameId });
      break;
    case 'Hearts':
      navigation.navigate('HeartsScreen', { gameId });
      break;
    case 'Phase 10':
      navigation.navigate('Phase10Screen', { gameId });
      break;
    case 'Kings in Corners':
      navigation.navigate('KingsCornersScreen', { gameId });
      break;
    case 'Solitaire':
      navigation.navigate('SolitaireScreen', { gameId });
      break;
  }
};
```

### Step 5: Create Online Game Handler

```typescript
const handleCreateOnlineGame = (gameName: string) => {
  // Hearts is always 4 players
  if (gameName === 'Hearts') {
    createRoomForGame(gameName, 4, userId, playerName);
    return;
  }

  // Solitaire is single player only
  if (gameName === 'Solitaire') {
    Alert.alert('Info', 'Solitaire is single player only');
    return;
  }

  // Other games: let user choose 2, 3, or 4 players
  Alert.alert(
    'How many players?',
    'Choose the maximum number of players for this game',
    [
      {
        text: '2 Players',
        onPress: () => createRoomForGame(gameName, 2, userId, playerName)
      },
      {
        text: '3 Players',
        onPress: () => createRoomForGame(gameName, 3, userId, playerName)
      },
      {
        text: '4 Players',
        onPress: () => createRoomForGame(gameName, 4, userId, playerName)
      },
      {
        text: 'Cancel',
        style: 'cancel'
      }
    ]
  );
};
```

### Step 6: Create Room Function

```typescript
const createRoomForGame = async (
  gameName: string,
  maxPlayers: number,
  userId: string,
  playerName: string
) => {
  try {
    let roomId: string;

    switch (gameName) {
      case 'War':
        roomId = await createGameRoom(userId, playerName, maxPlayers);
        break;
      case 'ERS':
        roomId = await createERSGameRoom(userId, playerName, maxPlayers);
        break;
      case 'Go Fish':
        roomId = await createGoFishGameRoom(userId, playerName, maxPlayers);
        break;
      case 'UNO':
        roomId = await createUNOGameRoom(userId, playerName, maxPlayers);
        break;
      case 'Hearts':
        roomId = await createHeartsGameRoom(userId, playerName);
        break;
      case 'Phase 10':
        roomId = await createPhase10GameRoom(userId, playerName, maxPlayers);
        break;
      case 'Kings in Corners':
        roomId = await createKingsCornersGameRoom(userId, playerName, maxPlayers);
        break;
      default:
        Alert.alert('Error', 'Game not supported yet');
        return;
    }

    // Show room code and options
    Alert.alert(
      'Game Created!',
      `Room Code: ${roomId}\n\nMax Players: ${maxPlayers}\n\nShare this code with friends to join!`,
      [
        {
          text: 'Copy Code',
          onPress: () => {
            Clipboard.setString(roomId);
            Alert.alert('Copied!', 'Room code copied to clipboard');
          }
        },
        {
          text: 'Start Playing',
          onPress: () => navigateToGame(gameName, roomId, userId)
        }
      ]
    );
  } catch (error) {
    Alert.alert('Error', `Failed to create game: ${error.message}`);
  }
};
```

### Step 7: Join Online Game Handler

```typescript
const handleJoinOnlineGame = (gameName: string) => {
  // Solitaire is single player only
  if (gameName === 'Solitaire') {
    Alert.alert('Info', 'Solitaire is single player only');
    return;
  }

  // Show input for room code
  Alert.prompt(
    `Join ${gameName} Game`,
    'Enter the room code',
    async (roomCode) => {
      if (!roomCode || roomCode.trim() === '') {
        return;
      }

      try {
        const success = await joinRoomForGame(gameName, roomCode.trim(), userId, playerName);

        if (success) {
          navigateToGame(gameName, roomCode.trim(), userId);
        } else {
          Alert.alert(
            'Cannot Join',
            'This room is full, already started, or does not exist.'
          );
        }
      } catch (error) {
        Alert.alert('Error', `Failed to join game: ${error.message}`);
      }
    },
    'plain-text'
  );
};
```

### Step 8: Join Room Function

```typescript
const joinRoomForGame = async (
  gameName: string,
  roomId: string,
  userId: string,
  playerName: string
): Promise<boolean> => {
  switch (gameName) {
    case 'War':
      return await joinGameRoom(roomId, userId, playerName);
    case 'ERS':
      return await joinERSGameRoom(roomId, userId, playerName);
    case 'Go Fish':
      return await joinGoFishGameRoom(roomId, userId, playerName);
    case 'UNO':
      return await joinUNOGameRoom(roomId, userId, playerName);
    case 'Hearts':
      return await joinHeartsGameRoom(roomId, userId, playerName);
    case 'Phase 10':
      return await joinPhase10GameRoom(roomId, userId, playerName);
    case 'Kings in Corners':
      return await joinKingsCornersGameRoom(roomId, userId, playerName);
    default:
      return false;
  }
};
```

### Step 9: Navigation Helper

```typescript
const navigateToGame = (gameName: string, gameId: string, userId: string) => {
  switch (gameName) {
    case 'War':
      navigation.navigate('GameScreen', { gameId, playerId: userId });
      break;
    case 'ERS':
      navigation.navigate('ERSScreen', { gameId, playerId: userId });
      break;
    case 'Go Fish':
      navigation.navigate('GoFishScreen', { gameId, playerId: userId });
      break;
    case 'UNO':
      navigation.navigate('UNOScreen', { gameId, playerId: userId });
      break;
    case 'Hearts':
      navigation.navigate('HeartsScreen', { gameId, playerId: userId });
      break;
    case 'Phase 10':
      navigation.navigate('Phase10Screen', { gameId, playerId: userId });
      break;
    case 'Kings in Corners':
      navigation.navigate('KingsCornersScreen', { gameId, playerId: userId });
      break;
  }
};
```

### Step 10: Update Game Buttons

```typescript
return (
  <View style={styles.container}>
    <Text style={styles.title}>CARD WARS</Text>

    {/* Player info */}
    <View style={styles.playerInfo}>
      <Text style={styles.playerName}>{playerName}</Text>
      <TouchableOpacity onPress={() => {
        // Allow player to change name
        Alert.prompt(
          'Change Name',
          'Enter your display name',
          async (newName) => {
            if (newName && newName.trim()) {
              await AsyncStorage.setItem('playerName', newName.trim());
              setPlayerName(newName.trim());
            }
          },
          'plain-text',
          playerName
        );
      }}>
        <Text style={styles.editName}>Edit</Text>
      </TouchableOpacity>
    </View>

    {/* Game buttons */}
    <TouchableOpacity
      style={styles.gameButton}
      onPress={() => handleGamePress('War')}
    >
      <Text style={styles.gameButtonText}>War</Text>
      <Text style={styles.gameButtonSubtext}>2-4 Players • Online</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.gameButton}
      onPress={() => handleGamePress('ERS')}
    >
      <Text style={styles.gameButtonText}>Egyptian Rat Screw</Text>
      <Text style={styles.gameButtonSubtext}>2-4 Players • Online</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.gameButton}
      onPress={() => handleGamePress('Go Fish')}
    >
      <Text style={styles.gameButtonText}>Go Fish</Text>
      <Text style={styles.gameButtonSubtext}>2-4 Players • Online</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.gameButton}
      onPress={() => handleGamePress('UNO')}
    >
      <Text style={styles.gameButtonText}>UNO</Text>
      <Text style={styles.gameButtonSubtext}>2-4 Players • Online</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.gameButton}
      onPress={() => handleGamePress('Hearts')}
    >
      <Text style={styles.gameButtonText}>Hearts</Text>
      <Text style={styles.gameButtonSubtext}>4 Players Only • Online</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.gameButton}
      onPress={() => handleGamePress('Phase 10')}
    >
      <Text style={styles.gameButtonText}>Phase 10</Text>
      <Text style={styles.gameButtonSubtext}>2-4 Players • Online</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.gameButton}
      onPress={() => handleGamePress('Kings in Corners')}
    >
      <Text style={styles.gameButtonText}>Kings in Corners</Text>
      <Text style={styles.gameButtonSubtext}>2-4 Players • Online</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.gameButton}
      onPress={() => handleGamePress('Solitaire')}
    >
      <Text style={styles.gameButtonText}>Solitaire</Text>
      <Text style={styles.gameButtonSubtext}>Single Player Only</Text>
    </TouchableOpacity>

    {/* Settings */}
    <TouchableOpacity
      style={styles.settingsButton}
      onPress={() => navigation.navigate('Settings')}
    >
      <Text style={styles.settingsButtonText}>Settings</Text>
    </TouchableOpacity>
  </View>
);
```

### Step 11: Add Styles

```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    textAlign: 'center',
    marginVertical: 24,
    color: '#1f2937',
  },
  playerInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    padding: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
  },
  playerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginRight: 8,
  },
  editName: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  gameButton: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  gameButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  gameButtonSubtext: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  settingsButton: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
  },
  settingsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
});
```

---

## 🎨 OPTIONAL: Add Room Browser

For a more advanced feature, add a room browser to see available games:

### Add Room Browser Button

```typescript
<TouchableOpacity
  style={styles.browseButton}
  onPress={() => navigation.navigate('RoomBrowser')}
>
  <Text style={styles.browseButtonText}>Browse Available Games</Text>
</TouchableOpacity>
```

### Create RoomBrowserScreen.tsx

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';

// Import all getAvailableRooms functions
import { getAvailableRooms } from '../utils/firebaseService'; // War
import { getAvailableERSRooms } from '../utils/ersFirebaseService';
import { getAvailableGoFishRooms } from '../utils/gofishFirebaseService';
import { getAvailableUNORooms } from '../utils/unoFirebaseService';
import { getAvailableHeartsRooms } from '../utils/heartsFirebaseService';
import { getAvailablePhase10Rooms } from '../utils/phase10FirebaseService';
import { getAvailableKingsCornersRooms } from '../utils/kingsCornersFirebaseService';

const RoomBrowserScreen = ({ navigation }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllRooms();
  }, []);

  const loadAllRooms = async () => {
    setLoading(true);
    try {
      const [war, ers, goFish, uno, hearts, phase10, kings] = await Promise.all([
        getAvailableRooms(),
        getAvailableERSRooms(),
        getAvailableGoFishRooms(),
        getAvailableUNORooms(),
        getAvailableHeartsRooms(),
        getAvailablePhase10Rooms(),
        getAvailableKingsCornersRooms(),
      ]);

      const allRooms = [
        ...war.map(r => ({ ...r, game: 'War' })),
        ...ers.map(r => ({ ...r, game: 'ERS' })),
        ...goFish.map(r => ({ ...r, game: 'Go Fish' })),
        ...uno.map(r => ({ ...r, game: 'UNO' })),
        ...hearts.map(r => ({ ...r, game: 'Hearts' })),
        ...phase10.map(r => ({ ...r, game: 'Phase 10' })),
        ...kings.map(r => ({ ...r, game: 'Kings in Corners' })),
      ];

      setRooms(allRooms.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error('Failed to load rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (room) => {
    // Join the room and navigate to game
    // ... implementation
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text>Loading available games...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Available Games</Text>

      {rooms.length === 0 ? (
        <Text style={styles.emptyText}>No games available. Create one!</Text>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.roomCard}
              onPress={() => handleJoinRoom(item)}
            >
              <Text style={styles.roomGame}>{item.game}</Text>
              <Text style={styles.roomInfo}>
                Players: {item.playerCount}/{item.maxPlayers}
              </Text>
              <Text style={styles.roomCode}>Code: {item.id}</Text>
            </TouchableOpacity>
          )}
          refreshing={loading}
          onRefresh={loadAllRooms}
        />
      )}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Back to Menu</Text>
      </TouchableOpacity>
    </View>
  );
};
```

---

## ✅ INTEGRATION CHECKLIST

- [ ] Add all Firebase service imports
- [ ] Add auth service imports
- [ ] Initialize auth on mount
- [ ] Store userId and playerName in state
- [ ] Update game buttons to use `handleGamePress`
- [ ] Implement `handleCreateOnlineGame` with player count selection
- [ ] Implement `createRoomForGame` for all 7 games
- [ ] Implement `handleJoinOnlineGame` with room code input
- [ ] Implement `joinRoomForGame` for all 7 games
- [ ] Implement `navigateToGame` helper
- [ ] Add player name display and edit button
- [ ] Add subtext to buttons (player count + online/offline)
- [ ] Test create flow for each game
- [ ] Test join flow for each game
- [ ] Test room code copying
- [ ] Optional: Add room browser screen

---

## 🚀 TESTING FLOW

### Create Game Flow:
1. Tap game button (e.g., "UNO")
2. Select "Create Online Game"
3. Choose player count (2, 3, or 4)
4. See "Game Created!" alert with room code
5. Tap "Copy Code" → verify code copied to clipboard
6. Tap "Start Playing" → navigate to game screen

### Join Game Flow:
1. Get room code from friend
2. Tap same game button (e.g., "UNO")
3. Select "Join Online Game"
4. Enter room code
5. Verify navigation to game screen
6. Verify game starts when all players joined

### Local Game Flow (unchanged):
1. Tap game button
2. Select "Local (vs AI)"
3. Navigate to game screen
4. Play against AI

---

## 🎯 USER EXPERIENCE IMPROVEMENTS

### Show Waiting Status:

After creating a game, show a waiting screen:

```typescript
const [waitingForPlayers, setWaitingForPlayers] = useState(false);

// After creating room
setWaitingForPlayers(true);
navigation.navigate('WaitingRoom', {
  gameId: roomId,
  gameName: gameName,
  maxPlayers: maxPlayers,
});
```

### Add Push Notifications:

When a player joins, notify the creator:

```typescript
// In Firebase service, after player joins:
if (gameState.player1.pushToken) {
  sendPushNotification(
    gameState.player1.pushToken,
    'Player Joined!',
    `${playerName} joined your ${gameName} game`
  );
}
```

---

## 📚 REFERENCE

- **Working example**: War multiplayer is fully integrated
- **Firebase services**: All 7 services in `/src/utils/`
- **Auth service**: `/src/utils/authService.ts`
- **Type definitions**: `/src/types/*.ts`

---

**Estimated implementation time: ~1-2 hours**
