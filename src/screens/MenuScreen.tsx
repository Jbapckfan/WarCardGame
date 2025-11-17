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
import { hapticService } from '../utils/hapticService';

interface MenuScreenProps {
  onStartGame: (gameId: string, playerId: string, gameType: 'war' | 'ers' | 'phase10' | 'kings' | 'gofish' | 'uno' | 'hearts') => void;
  onViewStats: () => void;
  onViewAchievements: () => void;
  onViewDailyChallenges: () => void;
  onViewTutorial: () => void;
  onViewSettings: () => void;
  onViewCosmetics: () => void;
  onViewGameRules: (gameType: 'war' | 'ers' | 'phase10' | 'kings' | 'gofish' | 'uno' | 'hearts') => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({ onStartGame, onViewStats, onViewAchievements, onViewDailyChallenges, onViewTutorial, onViewSettings, onViewCosmetics, onViewGameRules }) => {
  const [playerName, setPlayerName] = useState('');
  const [playerId] = useState(`player_${Date.now()}`);
  const [pushToken, setPushToken] = useState<string>();
  const [showWarMenu, setShowWarMenu] = useState(false);
  const [showERSMenu, setShowERSMenu] = useState(false);
  const [showPhase10Menu, setShowPhase10Menu] = useState(false);
  const [showKingsMenu, setShowKingsMenu] = useState(false);
  const [showGoFishMenu, setShowGoFishMenu] = useState(false);
  const [showUnoMenu, setShowUnoMenu] = useState(false);
  const [showHeartsMenu, setShowHeartsMenu] = useState(false);
  const [showJoinMenu, setShowJoinMenu] = useState(false);
  const [sixSevenRule, setSixSevenRule] = useState(true);
  const [availableRooms, setAvailableRooms] = useState<GameRoom[]>([]);
  const [roomCode, setRoomCode] = useState('');
  const [gameType, setGameType] = useState<'war' | 'ers' | 'phase10' | 'kings' | 'gofish' | 'uno' | 'hearts'>('war');

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

  const handleQuickPlay = async () => {
    await hapticService.medium();
    // Quick play starts a random game against AI
    const games: ('war' | 'ers' | 'phase10' | 'kings' | 'gofish' | 'uno' | 'hearts')[] = [
      'war',
      'ers',
      'gofish',
    ];
    const randomGame = games[Math.floor(Math.random() * games.length)];
    const gameId = `local_quickplay_${Date.now()}`;
    onStartGame(gameId, playerId, randomGame);
  };

  const handleCreateGame = async (type: 'war' | 'ers' | 'phase10' | 'kings' | 'gofish' | 'uno' | 'hearts') => {
    await hapticService.light();

    // Check if Firebase is available
    if (!database) {
      // Start local game without Firebase - no name required
      const gameId = `local_${Date.now()}`;
      onStartGame(gameId, playerId, type);
      return;
    }

    // For remote games, require a name
    if (!playerName.trim()) {
      await hapticService.warning();
      Alert.alert('Error', 'Please enter your name for online play');
      return;
    }

    try {
      const gameId = await createGameRoom(playerId, playerName, sixSevenRule, pushToken);
      await hapticService.success();
      onStartGame(gameId, playerId, type);
    } catch (error) {
      await hapticService.error();
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

  const openJoinMenu = async (type: 'war' | 'ers' | 'phase10' | 'kings' | 'gofish' | 'uno' | 'hearts') => {
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

        {/* Stats and Achievements Buttons */}
        <View style={styles.utilityButtons}>
          <TouchableOpacity
            style={styles.utilityButton}
            onPress={onViewStats}
          >
            <Text style={styles.utilityButtonIcon}>📊</Text>
            <Text style={styles.utilityButtonText}>Stats</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.utilityButton}
            onPress={onViewAchievements}
          >
            <Text style={styles.utilityButtonIcon}>🏆</Text>
            <Text style={styles.utilityButtonText}>Achievements</Text>
          </TouchableOpacity>
        </View>

        {/* Settings and Cosmetics Buttons */}
        <View style={styles.utilityButtons}>
          <TouchableOpacity
            style={styles.utilityButton}
            onPress={onViewSettings}
          >
            <Text style={styles.utilityButtonIcon}>⚙️</Text>
            <Text style={styles.utilityButtonText}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.utilityButton}
            onPress={onViewCosmetics}
          >
            <Text style={styles.utilityButtonIcon}>🎨</Text>
            <Text style={styles.utilityButtonText}>Customize</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.dailyChallengesButton}
          onPress={onViewDailyChallenges}
        >
          <Text style={styles.dailyChallengesIcon}>⭐</Text>
          <View style={styles.dailyChallengesContent}>
            <Text style={styles.dailyChallengesTitle}>Daily Challenges</Text>
            <Text style={styles.dailyChallengesSubtitle}>Complete challenges for bonus XP</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tutorialButton}
          onPress={onViewTutorial}
        >
          <Text style={styles.tutorialIcon}>🎓</Text>
          <View style={styles.tutorialContent}>
            <Text style={styles.tutorialTitle}>ERS Tutorial</Text>
            <Text style={styles.tutorialSubtitle}>Learn the rules & practice slapping</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickPlayButton}
          onPress={handleQuickPlay}
        >
          <Text style={styles.quickPlayIcon}>⚡</Text>
          <View style={styles.quickPlayContent}>
            <Text style={styles.quickPlayTitle}>Quick Play</Text>
            <Text style={styles.quickPlaySubtitle}>Instant match against AI</Text>
          </View>
        </TouchableOpacity>

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

          <TouchableOpacity
            style={[styles.gameButton, styles.phase10Button]}
            onPress={() => setShowPhase10Menu(true)}
          >
            <Text style={styles.gameButtonTitle}>🎯 PHASE 10</Text>
            <Text style={styles.gameButtonSubtitle}>Complete all 10 phases</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gameButton, styles.kingsButton]}
            onPress={() => setShowKingsMenu(true)}
          >
            <Text style={styles.gameButtonTitle}>👑 KINGS IN THE CORNERS</Text>
            <Text style={styles.gameButtonSubtitle}>Strategy and skill</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gameButton, styles.goFishButton]}
            onPress={() => setShowGoFishMenu(true)}
          >
            <Text style={styles.gameButtonTitle}>🐟 GO FISH</Text>
            <Text style={styles.gameButtonSubtitle}>Collect matching sets</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gameButton, styles.unoButton]}
            onPress={() => setShowUnoMenu(true)}
          >
            <Text style={styles.gameButtonTitle}>🎴 UNO</Text>
            <Text style={styles.gameButtonSubtitle}>Say UNO to win!</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gameButton, styles.heartsButton]}
            onPress={() => setShowHeartsMenu(true)}
          >
            <Text style={styles.gameButtonTitle}>♥ HEARTS</Text>
            <Text style={styles.gameButtonSubtitle}>Avoid hearts & queen of spades</Text>
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
              style={styles.rulesButton}
              onPress={() => {
                setShowWarMenu(false);
                onViewGameRules('war');
              }}
            >
              <Text style={styles.rulesButtonText}>📖 View Rules</Text>
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
              style={styles.rulesButton}
              onPress={() => {
                setShowERSMenu(false);
                onViewGameRules('ers');
              }}
            >
              <Text style={styles.rulesButtonText}>📖 View Rules</Text>
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

      {/* Phase 10 Menu Modal */}
      <Modal visible={showPhase10Menu} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Phase 10</Text>
            <Text style={styles.modalDescription}>
              Complete all 10 phases to win!
            </Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowPhase10Menu(false);
                handleCreateGame('phase10');
              }}
            >
              <Text style={styles.modalButtonText}>Create Game</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.secondaryButton]}
              onPress={() => {
                setShowPhase10Menu(false);
                openJoinMenu('phase10');
              }}
            >
              <Text style={styles.modalButtonText}>Join Game</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.rulesButton}
              onPress={() => {
                setShowPhase10Menu(false);
                onViewGameRules('phase10');
              }}
            >
              <Text style={styles.rulesButtonText}>📖 View Rules</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowPhase10Menu(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Kings in Corners Menu Modal */}
      <Modal visible={showKingsMenu} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Kings in the Corners</Text>
            <Text style={styles.modalDescription}>
              Play cards in descending order with alternating colors!
            </Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowKingsMenu(false);
                handleCreateGame('kings');
              }}
            >
              <Text style={styles.modalButtonText}>Create Game</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.secondaryButton]}
              onPress={() => {
                setShowKingsMenu(false);
                openJoinMenu('kings');
              }}
            >
              <Text style={styles.modalButtonText}>Join Game</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.rulesButton}
              onPress={() => {
                setShowKingsMenu(false);
                onViewGameRules('kings');
              }}
            >
              <Text style={styles.rulesButtonText}>📖 View Rules</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowKingsMenu(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Go Fish Menu Modal */}
      <Modal visible={showGoFishMenu} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Go Fish</Text>
            <Text style={styles.modalDescription}>
              Ask for cards to make sets of 4!
            </Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowGoFishMenu(false);
                handleCreateGame('gofish');
              }}
            >
              <Text style={styles.modalButtonText}>Create Game</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.secondaryButton]}
              onPress={() => {
                setShowGoFishMenu(false);
                openJoinMenu('gofish');
              }}
            >
              <Text style={styles.modalButtonText}>Join Game</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.rulesButton}
              onPress={() => {
                setShowGoFishMenu(false);
                onViewGameRules('gofish');
              }}
            >
              <Text style={styles.rulesButtonText}>📖 View Rules</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowGoFishMenu(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* UNO Menu Modal */}
      <Modal visible={showUnoMenu} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>UNO</Text>
            <Text style={styles.modalDescription}>
              Match colors or numbers - first to empty your hand wins!
            </Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowUnoMenu(false);
                handleCreateGame('uno');
              }}
            >
              <Text style={styles.modalButtonText}>Create Game</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.secondaryButton]}
              onPress={() => {
                setShowUnoMenu(false);
                openJoinMenu('uno');
              }}
            >
              <Text style={styles.modalButtonText}>Join Game</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.rulesButton}
              onPress={() => {
                setShowUnoMenu(false);
                onViewGameRules('uno');
              }}
            >
              <Text style={styles.rulesButtonText}>📖 View Rules</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowUnoMenu(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Hearts Menu Modal */}
      <Modal visible={showHeartsMenu} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Hearts</Text>
            <Text style={styles.modalDescription}>
              Avoid taking hearts and the Queen of Spades!
            </Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowHeartsMenu(false);
                handleCreateGame('hearts');
              }}
            >
              <Text style={styles.modalButtonText}>Create Game</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.secondaryButton]}
              onPress={() => {
                setShowHeartsMenu(false);
                openJoinMenu('hearts');
              }}
            >
              <Text style={styles.modalButtonText}>Join Game</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.rulesButton}
              onPress={() => {
                setShowHeartsMenu(false);
                onViewGameRules('hearts');
              }}
            >
              <Text style={styles.rulesButtonText}>📖 View Rules</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowHeartsMenu(false)}
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
  phase10Button: {
    backgroundColor: '#059669',
  },
  kingsButton: {
    backgroundColor: '#D97706',
  },
  goFishButton: {
    backgroundColor: '#0EA5E9',
  },
  unoButton: {
    backgroundColor: '#EF4444',
  },
  heartsButton: {
    backgroundColor: '#BE123C',
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
  rulesButton: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
    padding: 12,
    marginBottom: 12,
  },
  rulesButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#60A5FA',
    textAlign: 'center',
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
  utilityButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  utilityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 16,
  },
  utilityButtonIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  utilityButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  dailyChallengesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    borderWidth: 2,
    borderColor: '#FBBF24',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  dailyChallengesIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  dailyChallengesContent: {
    flex: 1,
  },
  dailyChallengesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  dailyChallengesSubtitle: {
    fontSize: 12,
    color: '#FEF3C7',
  },
  tutorialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    borderWidth: 2,
    borderColor: '#A78BFA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  tutorialIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  tutorialContent: {
    flex: 1,
  },
  tutorialTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  tutorialSubtitle: {
    fontSize: 12,
    color: '#E9D5FF',
  },
  quickPlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderWidth: 3,
    borderColor: '#FCA5A5',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  quickPlayIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  quickPlayContent: {
    flex: 1,
  },
  quickPlayTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  quickPlaySubtitle: {
    fontSize: 14,
    color: '#FEE2E2',
    fontWeight: '600',
  },
});
