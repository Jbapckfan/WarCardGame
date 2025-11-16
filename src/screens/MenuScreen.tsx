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
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { GameRoom } from '../types/game';
import { getAvailableRooms, createGameRoom, joinGameRoom } from '../utils/firebaseService';
import { registerForPushNotificationsAsync } from '../utils/notificationService';
import { database } from '../config/firebase';
import { hasSavedGame, loadGame, clearSavedGame, SavedGame } from '../utils/gameSaveService';

interface MenuScreenProps {
  onStartGame: (gameId: string, playerId: string, gameType: 'war' | 'ers' | 'uno' | 'phase10' | 'kings' | 'gofish' | 'solitaire' | 'hearts', playerCount?: number, resumeState?: any) => void;
  onOpenCustomCreator: () => void;
  onOpenSettings: () => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({ onStartGame, onOpenCustomCreator, onOpenSettings }) => {
  const { theme } = useTheme();
  const [playerName, setPlayerName] = useState('');
  const [playerId] = useState(`player_${Date.now()}`);
  const [pushToken, setPushToken] = useState<string>();
  const [showWarMenu, setShowWarMenu] = useState(false);
  const [showERSMenu, setShowERSMenu] = useState(false);
  const [showUnoMenu, setShowUnoMenu] = useState(false);
  const [showPhase10Menu, setShowPhase10Menu] = useState(false);
  const [showKingsMenu, setShowKingsMenu] = useState(false);
  const [showGoFishMenu, setShowGoFishMenu] = useState(false);
  const [showSolitaireMenu, setShowSolitaireMenu] = useState(false);
  const [showHeartsMenu, setShowHeartsMenu] = useState(false);
  const [showJoinMenu, setShowJoinMenu] = useState(false);
  const [sixSevenRule, setSixSevenRule] = useState(true);
  const [availableRooms, setAvailableRooms] = useState<GameRoom[]>([]);
  const [roomCode, setRoomCode] = useState('');
  const [gameType, setGameType] = useState<'war' | 'ers' | 'uno' | 'phase10' | 'kings' | 'gofish' | 'solitaire' | 'hearts'>('war');
  const [playerCount, setPlayerCount] = useState(2);
  const [savedGame, setSavedGame] = useState<SavedGame | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [pendingGameType, setPendingGameType] = useState<'war' | 'ers' | 'uno' | 'phase10' | 'kings' | 'gofish' | 'solitaire' | 'hearts' | null>(null);

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

  const checkForSavedGame = async (type: 'war' | 'ers' | 'uno' | 'phase10') => {
    const saved = await loadGame(type);
    if (saved) {
      setSavedGame(saved);
      setPendingGameType(type);
      setPlayerCount(saved.playerCount || 2);
      setShowSaveModal(true);
    } else {
      // No saved game, show new game options
      setPendingGameType(type);
      setPlayerCount(2);
      setShowSaveModal(true);
    }
  };

  const handleResumeGame = () => {
    if (savedGame && pendingGameType) {
      const gameId = `local_${Date.now()}`;
      onStartGame(gameId, playerId, pendingGameType, savedGame.playerCount, savedGame.gameState);
      setShowSaveModal(false);
      setSavedGame(null);
      setPendingGameType(null);
    }
  };

  const handleNewGame = () => {
    if (pendingGameType) {
      // Clear saved game if it exists
      if (savedGame) {
        clearSavedGame(pendingGameType);
      }
      const gameId = `local_${Date.now()}`;
      onStartGame(gameId, playerId, pendingGameType, playerCount);
      setShowSaveModal(false);
      setSavedGame(null);
      setPendingGameType(null);
    }
  };

  const handleCreateGame = async (type: 'war' | 'ers' | 'uno' | 'phase10') => {
    // For local games, check for saved game and show player options
    if (!database) {
      await checkForSavedGame(type);
      return;
    }

    // For remote games, require a name
    if (!playerName.trim()) {
      Alert.alert('Error', 'Please enter your name for online play');
      return;
    }

    try {
      const gameId = await createGameRoom(playerId, playerName, sixSevenRule, pushToken);
      onStartGame(gameId, playerId, type, 2); // Remote games always 2 players for now
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

  const openJoinMenu = async (type: 'war' | 'ers' | 'uno' | 'phase10') => {
    setGameType(type);
    await loadAvailableRooms();
    setShowJoinMenu(true);
  };

  return (
    <LinearGradient colors={theme.colors.backgroundGradient} style={styles.container}>
      {/* Settings Button */}
      <TouchableOpacity style={styles.settingsButton} onPress={onOpenSettings}>
        <Text style={[styles.settingsText, { color: theme.colors.primary }]}>⚙️</Text>
      </TouchableOpacity>

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
                backgroundColor: theme.colors.cardPile,
              },
            ]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View style={titleAnimatedStyle}>
          <Text style={[styles.title, { color: theme.colors.primary }]}>🎴 CARD WARS 🎴</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Premium Card Gaming</Text>
        </Animated.View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            Your Name <Text style={[styles.optional, { color: theme.colors.textSecondary }]}>(for online play)</Text>
          </Text>
          <TextInput
            style={[styles.input, {
              backgroundColor: theme.colors.cardPile,
              borderColor: theme.colors.primary,
              color: theme.colors.text
            }]}
            placeholder="Optional - only needed for online games"
            placeholderTextColor={theme.colors.textSecondary}
            value={playerName}
            onChangeText={setPlayerName}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.gameButton, styles.customButton]}
            onPress={onOpenCustomCreator}
          >
            <Text style={styles.gameButtonTitle}>🎲 CUSTOM GAMES</Text>
            <Text style={styles.gameButtonSubtitle}>Create your own rules!</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gameButton, styles.unoButton]}
            onPress={() => setShowUnoMenu(true)}
          >
            <Text style={styles.gameButtonTitle}>🎯 UNO</Text>
            <Text style={styles.gameButtonSubtitle}>Match colors & numbers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gameButton, styles.phase10Button]}
            onPress={() => setShowPhase10Menu(true)}
          >
            <Text style={styles.gameButtonTitle}>🎲 PHASE 10</Text>
            <Text style={styles.gameButtonSubtitle}>Complete all 10 phases</Text>
          </TouchableOpacity>

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
            style={[styles.gameButton, styles.kingsButton]}
            onPress={() => {
              const checkAndStart = async () => {
                const saved = await loadGame('kings');
                if (saved) {
                  setSavedGame(saved);
                  setPendingGameType('kings' as any);
                  setPlayerCount(saved.playerCount || 2);
                  setShowSaveModal(true);
                } else {
                  setShowKingsMenu(true);
                }
              };
              checkAndStart();
            }}
          >
            <Text style={styles.gameButtonTitle}>👑 KINGS IN THE CORNERS</Text>
            <Text style={styles.gameButtonSubtitle}>Strategic solitaire game</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gameButton, styles.goFishButton]}
            onPress={() => setShowGoFishMenu(true)}
          >
            <Text style={styles.gameButtonTitle}>🐟 GO FISH</Text>
            <Text style={styles.gameButtonSubtitle}>Perfect for kids!</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gameButton, styles.solitaireButton]}
            onPress={() => {
              const gameId = `local_${Date.now()}`;
              onStartGame(gameId, playerId, 'solitaire', 1);
            }}
          >
            <Text style={styles.gameButtonTitle}>♠️ SOLITAIRE</Text>
            <Text style={styles.gameButtonSubtitle}>Classic Klondike</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gameButton, styles.heartsButton]}
            onPress={() => {
              const gameId = `local_${Date.now()}`;
              onStartGame(gameId, playerId, 'hearts', 4);
            }}
          >
            <Text style={styles.gameButtonTitle}>♥️ HEARTS</Text>
            <Text style={styles.gameButtonSubtitle}>4-player trick-taking</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* WAR Menu Modal */}
      <Modal visible={showWarMenu} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {
            backgroundColor: theme.colors.cardPile,
            borderColor: theme.colors.primary
          }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.primary }]}>WAR Game</Text>

            <TouchableOpacity
              style={[styles.toggleContainer, { backgroundColor: theme.colors.background }]}
              onPress={() => setSixSevenRule(!sixSevenRule)}
            >
              <View style={[styles.toggle, sixSevenRule && { backgroundColor: theme.colors.success }]}>
                <View style={[styles.toggleButton, sixSevenRule && styles.toggleButtonActive]} />
              </View>
              <View style={styles.toggleLabel}>
                <Text style={[styles.toggleText, { color: theme.colors.text }]}>6-7 Rule</Text>
                <Text style={[styles.toggleSubtext, { color: theme.colors.textSecondary }]}>War with only 1 card face down</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.colors.success }]}
              onPress={() => {
                setShowWarMenu(false);
                handleCreateGame('war');
              }}
            >
              <Text style={styles.modalButtonText}>Create Game</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.secondaryButton, { backgroundColor: theme.colors.secondary }]}
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
              <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ERS Menu Modal */}
      <Modal visible={showERSMenu} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {
            backgroundColor: theme.colors.cardPile,
            borderColor: theme.colors.primary
          }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.primary }]}>Egyptian Rat Screw</Text>
            <Text style={[styles.modalDescription, { color: theme.colors.textSecondary }]}>
              Slap on doubles, sandwiches, and face cards!
            </Text>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.colors.success }]}
              onPress={() => {
                setShowERSMenu(false);
                handleCreateGame('ers');
              }}
            >
              <Text style={styles.modalButtonText}>Create Game</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.secondaryButton, { backgroundColor: theme.colors.secondary }]}
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
              <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* UNO Menu Modal */}
      <Modal visible={showUnoMenu} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {
            backgroundColor: theme.colors.cardPile,
            borderColor: theme.colors.primary
          }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.primary }]}>UNO</Text>
            <Text style={[styles.modalDescription, { color: theme.colors.textSecondary }]}>
              Match colors or numbers. First to empty their hand wins!
            </Text>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.colors.success }]}
              onPress={() => {
                setShowUnoMenu(false);
                handleCreateGame('uno');
              }}
            >
              <Text style={styles.modalButtonText}>Play vs AI</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowUnoMenu(false)}
            >
              <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Phase 10 Menu Modal */}
      <Modal visible={showPhase10Menu} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {
            backgroundColor: theme.colors.cardPile,
            borderColor: theme.colors.primary
          }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.primary }]}>Phase 10</Text>
            <Text style={[styles.modalDescription, { color: theme.colors.textSecondary }]}>
              Complete all 10 phases. Sets, runs, and color sets!
            </Text>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.colors.success }]}
              onPress={() => {
                setShowPhase10Menu(false);
                handleCreateGame('phase10');
              }}
            >
              <Text style={styles.modalButtonText}>Play vs AI</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowPhase10Menu(false)}
            >
              <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Kings in the Corners Menu Modal */}
      <Modal visible={showKingsMenu} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {
            backgroundColor: theme.colors.cardPile,
            borderColor: theme.colors.primary
          }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.primary }]}>Kings in the Corners</Text>
            <Text style={[styles.modalDescription, { color: theme.colors.textSecondary }]}>
              Strategic card game - place cards in descending order with alternating colors
            </Text>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.colors.success }]}
              onPress={() => {
                setShowKingsMenu(false);
                const gameId = `local_${Date.now()}`;
                onStartGame(gameId, playerId, 'kings', 2);
              }}
            >
              <Text style={styles.modalButtonText}>Start Game</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowKingsMenu(false)}
            >
              <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Go Fish Menu Modal */}
      <Modal visible={showGoFishMenu} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {
            backgroundColor: theme.colors.cardPile,
            borderColor: theme.colors.primary
          }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.primary }]}>Go Fish</Text>
            <Text style={[styles.modalDescription, { color: theme.colors.textSecondary }]}>
              Ask for cards and collect books! Perfect for 2-6 players.
            </Text>

            <View style={styles.playerCountSection}>
              <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Number of Players:</Text>
              <View style={styles.playerCountButtons}>
                {[2, 3, 4].map((count) => (
                  <TouchableOpacity
                    key={count}
                    style={[
                      styles.playerCountButton,
                      { borderColor: theme.colors.primary },
                      playerCount === count && { backgroundColor: theme.colors.primary }
                    ]}
                    onPress={() => setPlayerCount(count)}
                  >
                    <Text style={[
                      styles.playerCountButtonText,
                      { color: playerCount === count ? '#FFFFFF' : theme.colors.text }
                    ]}>{count}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.colors.success }]}
              onPress={() => {
                setShowGoFishMenu(false);
                const gameId = `local_${Date.now()}`;
                onStartGame(gameId, playerId, 'gofish', playerCount);
              }}
            >
              <Text style={styles.modalButtonText}>Start Game</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowGoFishMenu(false)}
            >
              <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Join Game Modal */}
      <Modal visible={showJoinMenu} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {
            backgroundColor: theme.colors.cardPile,
            borderColor: theme.colors.primary
          }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.primary }]}>Join Game</Text>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Room Code</Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.primary,
                  color: theme.colors.text
                }]}
                placeholder="Enter room code"
                placeholderTextColor={theme.colors.textSecondary}
                value={roomCode}
                onChangeText={setRoomCode}
              />
              <TouchableOpacity
                style={[styles.smallButton, { backgroundColor: theme.colors.secondary }]}
                onPress={() => handleJoinGame(roomCode)}
              >
                <Text style={styles.modalButtonText}>Join with Code</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalTitle, { color: theme.colors.primary }]}>Available Rooms</Text>
            <ScrollView style={styles.roomsList}>
              {availableRooms.length === 0 ? (
                <Text style={[styles.noRoomsText, { color: theme.colors.textSecondary }]}>No available rooms</Text>
              ) : (
                availableRooms.map((room) => (
                  <TouchableOpacity
                    key={room.id}
                    style={[styles.roomItem, { backgroundColor: theme.colors.background }]}
                    onPress={() => {
                      setShowJoinMenu(false);
                      handleJoinGame(room.id);
                    }}
                  >
                    <Text style={[styles.roomText, { color: theme.colors.text }]}>Room: {room.id.slice(0, 8)}...</Text>
                    {room.sixSevenRuleEnabled && (
                      <Text style={[styles.roomTag, {
                        color: theme.colors.success,
                        backgroundColor: 'rgba(16, 185, 129, 0.2)'
                      }]}>6-7 Rule</Text>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowJoinMenu(false)}
            >
              <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Save/Resume & Player Count Modal */}
      <Modal visible={showSaveModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {
            backgroundColor: theme.colors.cardPile,
            borderColor: theme.colors.primary
          }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.primary }]}>
              {pendingGameType?.toUpperCase()}
            </Text>

            {savedGame && (
              <View style={[styles.savedGameBanner, { backgroundColor: theme.colors.success + '20', borderColor: theme.colors.success }]}>
                <Text style={[styles.savedGameText, { color: theme.colors.success }]}>
                  💾 Saved game found! ({savedGame.playerCount} players)
                </Text>
                <Text style={[styles.savedGameDate, { color: theme.colors.textSecondary }]}>
                  {new Date(savedGame.savedAt).toLocaleDateString()} {new Date(savedGame.savedAt).toLocaleTimeString()}
                </Text>
              </View>
            )}

            <View style={styles.playerCountSection}>
              <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Number of Players:</Text>
              <View style={styles.playerCountButtons}>
                {[2, 3, 4].map((count) => (
                  <TouchableOpacity
                    key={count}
                    style={[
                      styles.playerCountButton,
                      { borderColor: theme.colors.primary },
                      playerCount === count && { backgroundColor: theme.colors.primary }
                    ]}
                    onPress={() => setPlayerCount(count)}
                    disabled={!!savedGame} // Can't change player count for saved games
                  >
                    <Text style={[
                      styles.playerCountButtonText,
                      { color: playerCount === count ? '#FFFFFF' : theme.colors.text },
                      savedGame && { opacity: 0.5 }
                    ]}>{count}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {savedGame && (
                <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>
                  Player count locked for saved games
                </Text>
              )}
            </View>

            {savedGame && (
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.success }]}
                onPress={handleResumeGame}
              >
                <Text style={styles.modalButtonText}>▶️ Resume Game</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.colors.secondary }]}
              onPress={handleNewGame}
            >
              <Text style={styles.modalButtonText}>🆕 New Game</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowSaveModal(false);
                setSavedGame(null);
                setPendingGameType(null);
              }}
            >
              <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  settingsButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 100,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsText: {
    fontSize: 28,
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
  customButton: {
    backgroundColor: '#10B981',
  },
  unoButton: {
    backgroundColor: '#3B82F6',
  },
  phase10Button: {
    backgroundColor: '#8B5CF6',
  },
  warButton: {
    backgroundColor: '#DC2626',
  },
  ersButton: {
    backgroundColor: '#7C3AED',
  },
  kingsButton: {
    backgroundColor: '#047857',
  },
  goFishButton: {
    backgroundColor: '#0C4A6E',
  },
  solitaireButton: {
    backgroundColor: '#064E3B',
  },
  heartsButton: {
    backgroundColor: '#991B1B',
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
  savedGameBanner: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  savedGameText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  savedGameDate: {
    fontSize: 12,
  },
  playerCountSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  playerCountButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  playerCountButton: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerCountButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  helperText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
