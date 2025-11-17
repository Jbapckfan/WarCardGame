import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GoFishGameState } from '../types/goFish';
import {
  dealGoFishGame,
  askForCards,
  checkGoFishWinner,
  getRankDisplayName,
} from '../utils/goFishLogic';
import { saveGame } from '../utils/gameSaveService';
import { CardComponent } from '../components/CardComponent';
import { triggerHaptic } from '../utils/hapticManager';
import { ConfettiCelebration } from '../components/ConfettiCelebration';
import {
  listenToGoFishGameState,
  askForCards as askForCardsFirebase,
} from '../utils/gofishFirebaseService';
import { initializeAuth, getCurrentUserId } from '../utils/authService';

interface GoFishScreenProps {
  gameId: string;
  playerId?: string;
  playerCount?: number;
  resumeState?: GoFishGameState;
  onExit: () => void;
}

export const GoFishScreen: React.FC<GoFishScreenProps> = ({
  gameId,
  playerId: initialPlayerId,
  playerCount = 2,
  resumeState,
  onExit,
}) => {
  const [gameState, setGameState] = useState<GoFishGameState | null>(resumeState || null);
  const [currentUserId, setCurrentUserId] = useState<string>(initialPlayerId || '');
  const [isFirebaseGame, setIsFirebaseGame] = useState<boolean>(false);
  const [selectedRank, setSelectedRank] = useState<number | null>(null);
  const [showPlayerSelect, setShowPlayerSelect] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Initialize auth and determine if Firebase game
  useEffect(() => {
    const init = async () => {
      await initializeAuth();
      const userId = await getCurrentUserId();
      setCurrentUserId(userId);
      setIsFirebaseGame(!gameId.startsWith('local_'));
    };
    init();
  }, [gameId]);

  // Listen to Firebase game state
  useEffect(() => {
    if (!isFirebaseGame || !gameId) return;

    const unsubscribe = listenToGoFishGameState(gameId, (state) => {
      if (state) {
        setGameState(state);
      }
    });

    return () => unsubscribe();
  }, [gameId, isFirebaseGame]);

  const handleExitWithSave = async () => {
    await triggerHaptic.buttonTap();
    if (gameState && gameState.gameStatus === 'playing') {
      await saveGame('custom', gameState, playerCount);
    }
    onExit();
  };

  // Initialize local games only
  useEffect(() => {
    // Skip if Firebase game, resuming from saved state, or not initialized yet
    if (isFirebaseGame || resumeState || !currentUserId) return;

    // Initialize new game
    const playerNames = Array.from({ length: playerCount }, (_, i) => `Player ${i + 1}`);
    const initialState = dealGoFishGame(gameId, playerCount, playerNames);
    setGameState(initialState);
  }, [currentUserId, isFirebaseGame]);

  if (!gameState) {
    return (
      <View style={styles.container}>
        <Text style={styles.waitingText}>Initializing game...</Text>
      </View>
    );
  }

  const currentPlayer = gameState.players[gameState.currentTurn];
  const myPlayerIndex = gameState.players.findIndex(p => p.id === currentUserId);
  const myPlayer = gameState.players[myPlayerIndex];
  const isMyTurn = myPlayerIndex === gameState.currentTurn;

  // Get unique ranks in my hand (for Firebase) or current player hand (for local)
  const handToShow = isFirebaseGame ? (myPlayer?.deck || []) : currentPlayer.deck;
  const availableRanks = Array.from(
    new Set(handToShow.map(card => card.rank))
  ).sort((a, b) => a - b);

  const handleAskForCards = async (targetPlayerIndex: number) => {
    if (!selectedRank) {
      await triggerHaptic.error();
      Alert.alert('Select a Rank', 'Please select a rank to ask for first');
      return;
    }

    await triggerHaptic.cardPlay();

    // Firebase multiplayer
    if (isFirebaseGame) {
      try {
        const targetPlayerId = gameState.players[targetPlayerIndex].id;
        await askForCardsFirebase(gameId, currentUserId, targetPlayerId, selectedRank);
        // State updates via listener
        setSelectedRank(null);
        setShowPlayerSelect(false);
        return;
      } catch (error: any) {
        await triggerHaptic.error();
        Alert.alert('Error', error.message || 'Failed to ask for cards');
        return;
      }
    }

    // Local game logic
    const { newState, result } = askForCards(
      gameState,
      gameState.currentTurn,
      targetPlayerIndex,
      selectedRank
    );

    setGameState(newState);
    setSelectedRank(null);
    setShowPlayerSelect(false);

    // Show result feedback
    if (result.success) {
      if (result.formedBook) {
        await triggerHaptic.success();
      }
      const message = result.formedBook
        ? `Got ${result.cardsReceived.length} card(s)! Formed a book of ${getRankDisplayName(result.bookRank!)}s! 🎉`
        : `Got ${result.cardsReceived.length} card(s)!`;
      Alert.alert('Success!', message);
    } else {
      Alert.alert('Go Fish!', 'No cards received. Drew from deck.');
    }

    // Check for winner
    const winnerId = checkGoFishWinner(newState);
    if (winnerId !== null) {
      await triggerHaptic.win();
      setShowConfetti(true);
      newState.gameStatus = 'finished';
      newState.winner = winnerId;
      setGameState(newState);
      Alert.alert(
        'Game Over!',
        `${newState.players[winnerId].name} wins with ${newState.players[winnerId].books.length} books!`,
        [{ text: 'OK', onPress: handleExitWithSave }]
      );
    }
  };

  const handleRankSelect = async (rank: number) => {
    await triggerHaptic.buttonTap();
    setSelectedRank(rank);
    setShowPlayerSelect(true);
  };

  return (
    <LinearGradient colors={['#0C4A6E', '#075985', '#0369A1']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.exitButton} onPress={handleExitWithSave}>
          <Text style={styles.exitButtonText}>Exit</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Go Fish</Text>
          <Text style={styles.subtitle}>{currentPlayer.name}'s Turn</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Players Info */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playersSection}>
        {gameState.players.map((player, index) => (
          <View
            key={player.id}
            style={[
              styles.playerCard,
              index === gameState.currentTurn && styles.playerCardActive,
            ]}
          >
            <Text style={styles.playerCardName}>{player.name}</Text>
            <Text style={styles.playerCardInfo}>{player.deck.length} cards</Text>
            <Text style={styles.playerCardBooks}>📚 {player.books.length} books</Text>
            {player.books.length > 0 && (
              <Text style={styles.playerCardBookList}>
                {player.books.map(rank => getRankDisplayName(parseInt(rank))).join(', ')}
              </Text>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Current Player's Hand */}
      <View style={styles.handSection}>
        <Text style={styles.handTitle}>Your Hand ({handToShow.length} cards)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.hand}>
            {handToShow.map((card) => (
              <View key={card.id} style={styles.handCardContainer}>
                <CardComponent card={card} scale={0.7} />
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Ask for Cards Section */}
      {isMyTurn && (
        <View style={styles.askSection}>
          <Text style={styles.askTitle}>Ask for which rank?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.rankButtons}>
              {availableRanks.map((rank) => (
                <TouchableOpacity
                  key={rank}
                  style={[
                    styles.rankButton,
                    selectedRank === rank && styles.rankButtonSelected,
                  ]}
                  onPress={() => handleRankSelect(rank)}
                >
                  <Text
                    style={[
                      styles.rankButtonText,
                      selectedRank === rank && styles.rankButtonTextSelected,
                    ]}
                  >
                    {getRankDisplayName(rank)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Game Info */}
      <View style={styles.infoBar}>
        <Text style={styles.infoText}>{gameState.lastAction}</Text>
        <Text style={styles.infoText}>Deck: {gameState.drawPile.length} cards</Text>
      </View>

      {/* Player Selection Modal */}
      <Modal visible={showPlayerSelect} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Ask who for {selectedRank ? getRankDisplayName(selectedRank) : ''}s?
            </Text>

            {gameState.players.map((player, index) => {
              if (index === gameState.currentTurn) return null; // Can't ask yourself

              return (
                <TouchableOpacity
                  key={player.id}
                  style={styles.playerSelectButton}
                  onPress={() => handleAskForCards(index)}
                >
                  <Text style={styles.playerSelectButtonText}>
                    {player.name} ({player.deck.length} cards)
                  </Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowPlayerSelect(false);
                setSelectedRank(null);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Confetti Celebration */}
      <ConfettiCelebration show={showConfetti} />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
  },
  exitButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#BAE6FD',
    marginTop: 4,
  },
  placeholder: {
    width: 70,
  },
  playersSection: {
    maxHeight: 140,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  playerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 140,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  playerCardActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
  },
  playerCardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  playerCardInfo: {
    fontSize: 13,
    color: '#BAE6FD',
  },
  playerCardBooks: {
    fontSize: 13,
    color: '#FDE047',
    marginTop: 4,
    fontWeight: 'bold',
  },
  playerCardBookList: {
    fontSize: 11,
    color: '#BAE6FD',
    marginTop: 2,
  },
  handSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  handTitle: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  hand: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 8,
  },
  handCardContainer: {
    borderRadius: 6,
  },
  askSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  askTitle: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  rankButtons: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 8,
  },
  rankButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  rankButtonSelected: {
    backgroundColor: '#38BDF8',
    borderColor: '#FFFFFF',
  },
  rankButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  rankButtonTextSelected: {
    color: '#FFFFFF',
  },
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  infoText: {
    fontSize: 12,
    color: '#BAE6FD',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  playerSelectButton: {
    backgroundColor: '#38BDF8',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  playerSelectButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#6B7280',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  waitingText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 100,
  },
});
