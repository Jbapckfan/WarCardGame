import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSpring,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { GameRoom } from '../types/game';
import { getAvailableRooms, createGameRoom, joinGameRoom } from '../utils/firebaseService';
import { registerForPushNotificationsAsync } from '../utils/notificationService';
import { database } from '../config/firebase';

interface MenuScreenProps {
  onStartGame: (gameId: string, playerId: string, gameType: 'war' | 'ers') => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({ onStartGame }) => {
  const [playerName, setPlayerName] = useState('');
  const [playerId] = useState(`player_${Date.now()}`);
  const [pushToken, setPushToken] = useState<string>();
  const [showWarMenu, setShowWarMenu] = useState(false);
  const [showERSMenu, setShowERSMenu] = useState(false);
  const [showJoinMenu, setShowJoinMenu] = useState(false);
  const [sixSevenRule, setSixSevenRule] = useState(true);
  const [availableRooms, setAvailableRooms] = useState<GameRoom[]>([]);
  const [roomCode, setRoomCode] = useState('');
  const [gameType, setGameType] = useState<'war' | 'ers'>('war');

  const titleScale = useSharedValue(1);
  const titleRotate = useSharedValue(0);

  useEffect(() => {
    // Animate title
    titleScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Get push token
    registerForPushNotificationsAsync().then(token => {
      if (token) setPushToken(token);
    });
  }, []);

  const titleAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: titleScale.value }],
    };
  });

  const handleCreateGame = async (type: 'war' | 'ers') => {
    // Check if Firebase is available
    if (!database) {
      // Start local game without Firebase - no name required
      const gameId = `local_${Date.now()}`;
      onStartGame(gameId, playerId, type);
      return;
    }

    // For remote games, require a name
    if (!playerName.trim()) {
      Alert.alert('Error', 'Please enter your name for online play');
      return;
    }

    try {
      const gameId = await createGameRoom(playerId, playerName, sixSevenRule, pushToken);
      onStartGame(gameId, playerId, type);
    } catch (error) {
      Alert.alert('Error', 'Failed to create game');
    }
  };

  const handleJoinGame = async (roomId: string) => {
    if (!playerName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    try {
      const success = await joinGameRoom(roomId, playerId, playerName, pushToken);
      if (success) {
        onStartGame(roomId, playerId, gameType);
      } else {
        Alert.alert('Error', 'Failed to join game. Room may be full.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to join game');
    }
  };

  const loadAvailableRooms = async () => {
    try {
      const rooms = await getAvailableRooms();
      setAvailableRooms(rooms);
    } catch (error) {
      Alert.alert('Error', 'Failed to load rooms');
    }
  };

  const openJoinMenu = async (type: 'war' | 'ers') => {
    setGameType(type);
    await loadAvailableRooms();
    setShowJoinMenu(true);
  };

  return (
    <View style={styles.container}>
      {/* Animated Background */}
      <View style={styles.backgroundPattern}>
        {[...Array(20)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.backgroundCard,
              {
                left: `${(i % 5) * 20}%`,
                top: `${Math.floor(i / 5) * 25}%`,
                opacity: 0.05,
              },
            ]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View style={titleAnimatedStyle}>
          <Text style={styles.title}>🎴 CARD WARS 🎴</Text>
          <Text style={styles.subtitle}>Premium Card Gaming</Text>
        </Animated.View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Your Name <Text style={styles.optional}>(for online play)</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Optional - only needed for online games"
            placeholderTextColor="#64748B"
            value={playerName}
            onChangeText={setPlayerName}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.gameButton, styles.warButton]}
            onPress={() => setShowWarMenu(true)}
          >
            <Text style={styles.gameButtonTitle}>⚔️ WAR</Text>
            <Text style={styles.gameButtonSubtitle}>Classic battle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gameButton, styles.ersButton]}
            onPress={() => setShowERSMenu(true)}
          >
            <Text style={styles.gameButtonTitle}>👋 EGYPTIAN RAT SCREW</Text>
            <Text style={styles.gameButtonSubtitle}>Fast reflexes required</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* WAR Menu Modal */}
      <Modal visible={showWarMenu} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>WAR Game</Text>

            <TouchableOpacity
              style={styles.toggleContainer}
              onPress={() => setSixSevenRule(!sixSevenRule)}
            >
              <View style={[styles.toggle, sixSevenRule && styles.toggleActive]}>
                <View style={[styles.toggleButton, sixSevenRule && styles.toggleButtonActive]} />
              </View>
              <View style={styles.toggleLabel}>
                <Text style={styles.toggleText}>6-7 Rule</Text>
                <Text style={styles.toggleSubtext}>War with only 1 card face down</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowWarMenu(false);
                handleCreateGame('war');
              }}
            >
              <Text style={styles.modalButtonText}>Create Game</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.secondaryButton]}
              onPress={() => {
                setShowWarMenu(false);
                openJoinMenu('war');
              }}
            >
              <Text style={styles.modalButtonText}>Join Game</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowWarMenu(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ERS Menu Modal */}
      <Modal visible={showERSMenu} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Egyptian Rat Screw</Text>
            <Text style={styles.modalDescription}>
              Slap on doubles, sandwiches, and face cards!
            </Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowERSMenu(false);
                handleCreateGame('ers');
              }}
            >
              <Text style={styles.modalButtonText}>Create Game</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.secondaryButton]}
              onPress={() => {
                setShowERSMenu(false);
                openJoinMenu('ers');
              }}
            >
              <Text style={styles.modalButtonText}>Join Game</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowERSMenu(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Join Game Modal */}
      <Modal visible={showJoinMenu} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Join Game</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Room Code</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter room code"
                placeholderTextColor="#64748B"
                value={roomCode}
                onChangeText={setRoomCode}
              />
              <TouchableOpacity
                style={styles.smallButton}
                onPress={() => handleJoinGame(roomCode)}
              >
                <Text style={styles.modalButtonText}>Join with Code</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalTitle}>Available Rooms</Text>
            <ScrollView style={styles.roomsList}>
              {availableRooms.length === 0 ? (
                <Text style={styles.noRoomsText}>No available rooms</Text>
              ) : (
                availableRooms.map((room) => (
                  <TouchableOpacity
                    key={room.id}
                    style={styles.roomItem}
                    onPress={() => {
                      setShowJoinMenu(false);
                      handleJoinGame(room.id);
                    }}
                  >
                    <Text style={styles.roomText}>Room: {room.id.slice(0, 8)}...</Text>
                    {room.sixSevenRuleEnabled && (
                      <Text style={styles.roomTag}>6-7 Rule</Text>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowJoinMenu(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  backgroundPattern: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  backgroundCard: {
    position: 'absolute',
    width: 50,
    height: 70,
    borderRadius: 5,
    backgroundColor: '#1E293B',
    transform: [{ rotate: '15deg' }],
  },
  content: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#F59E0B',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 40,
    fontStyle: 'italic',
  },
  inputContainer: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    color: '#E2E8F0',
    marginBottom: 8,
    fontWeight: '600',
  },
  optional: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '400',
  },
  input: {
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#FFFFFF',
  },
  buttonContainer: {
    gap: 16,
  },
  gameButton: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  warButton: {
    backgroundColor: '#DC2626',
  },
  ersButton: {
    backgroundColor: '#7C3AED',
  },
  gameButtonTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  gameButtonSubtitle: {
    fontSize: 14,
    color: '#E2E8F0',
    opacity: 0.8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: '#334155',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F59E0B',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalDescription: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  toggle: {
    width: 60,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#475569',
    justifyContent: 'center',
    padding: 4,
    marginRight: 16,
  },
  toggleActive: {
    backgroundColor: '#10B981',
  },
  toggleButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  toggleButtonActive: {
    transform: [{ translateX: 28 }],
  },
  toggleLabel: {
    flex: 1,
  },
  toggleText: {
    fontSize: 16,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  toggleSubtext: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  modalButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: '#3B82F6',
  },
  modalButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  smallButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  cancelButton: {
    padding: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
  },
  roomsList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  roomItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  roomText: {
    fontSize: 16,
    color: '#E2E8F0',
  },
  roomTag: {
    fontSize: 12,
    color: '#10B981',
    backgroundColor: '#064E3B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  noRoomsText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    padding: 24,
  },
});
