import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CardComponent } from '../components/CardComponent';
import { RoomShareModal } from '../components/RoomShareModal';
import { CardPlayAnimation } from '../components/CardPlayAnimation';
import { GameState } from '../types/game';
import { listenToGameState, updateGameState } from '../utils/firebaseService';
import { playRound, resolveWar } from '../utils/gameLogic';
import { sendPushNotification, sendRichGameNotification } from '../utils/notificationService';
import { hapticService } from '../utils/hapticService';

interface GameScreenProps {
  gameId: string;
  playerId: string;
  onExit: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({ gameId, playerId, onExit }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isPlayingCard, setIsPlayingCard] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [animatingCard, setAnimatingCard] = useState<any>(null);
  const [lastPlayedCards, setLastPlayedCards] = useState<{
    player1Card: any;
    player2Card: any;
  } | null>(null);
  const [previousPlayedCards, setPreviousPlayedCards] = useState<{
    player1Card: any;
    player2Card: any;
    winner: string | null;
  } | null>(null);
  const [warFaceDownCards, setWarFaceDownCards] = useState<number>(0);
  const [lastWarCards, setLastWarCards] = useState<{
    faceDownCount: number;
    player1BattleCard: any;
    player2BattleCard: any;
    player1InitialCard: any;
    player2InitialCard: any;
    winner: string | null;
  } | null>(null);

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  // Refs for cleanup
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(clearTimeout);
      timeoutRefs.current = [];
    };
  }, []);

  useEffect(() => {
    // Check if this is a local game
    if (gameId.startsWith('local_')) {
      // Initialize local single-player game
      import('../utils/cardUtils').then(({ createDeck, shuffleDeck, splitDeck }) => {
        const deck = shuffleDeck(createDeck());
        const [player1Deck, player2Deck] = splitDeck(deck);
        
        const localGame: GameState = {
          id: gameId,
          player1: {
            id: playerId,
            name: 'You',
            deck: player1Deck,
          },
          player2: {
            id: 'ai_player',
            name: 'AI Opponent',
            deck: player2Deck,
          },
          currentTurn: playerId,
          gameStatus: 'playing',
          sixSevenRuleEnabled: true,
          warState: null,
          lastAction: 'Game started',
          lastActionTime: Date.now(),
          winner: null,
        };
        
        setGameState(localGame);
      });
      return;
    }

    const unsubscribe = listenToGameState(gameId, (state) => {
      setGameState(state);
    });

    return () => unsubscribe();
  }, [gameId]);

  if (!gameState || !gameState.player2) {
    // Only show share button for non-local games
    const isLocalGame = gameId.startsWith('local_');

    return (
      <View style={styles.container}>
        <Text style={styles.waitingText}>Waiting for opponent...</Text>
        <Text style={styles.roomCode}>Room Code: {gameId}</Text>

        {!isLocalGame && (
          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => setShowShareModal(true)}
          >
            <Text style={styles.shareButtonText}>📤 Share Room</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.exitButton} onPress={onExit}>
          <Text style={styles.buttonText}>Exit</Text>
        </TouchableOpacity>

        <RoomShareModal
          visible={showShareModal}
          roomCode={gameId}
          gameType="WAR"
          onClose={() => setShowShareModal(false)}
        />
      </View>
    );
  }

  const isPlayer1 = gameState.player1.id === playerId;
  const currentPlayer = isPlayer1 ? gameState.player1 : gameState.player2;
  const opponent = isPlayer1 ? gameState.player2 : gameState.player1;
  const isMyTurn = gameState.currentTurn === playerId;

  // Helper to update game state (Firebase or local)
  const updateGame = async (updates: Partial<GameState>) => {
    if (gameId.startsWith('local_')) {
      // Local mode - update state directly with proper nested updates
      setGameState((prev) => {
        if (!prev) return prev;
        
        const newState = { ...prev };
        
        // Handle dot notation for nested properties
        Object.keys(updates).forEach(key => {
          if (key.includes('.')) {
            const [parent, child] = key.split('.');
            if (parent === 'player1' && child === 'deck') {
              newState.player1 = { ...newState.player1, deck: updates[key] as any };
            } else if (parent === 'player2' && child === 'deck') {
              newState.player2 = { ...newState.player2!, deck: updates[key] as any };
            }
          } else {
            (newState as any)[key] = (updates as any)[key];
          }
        });
        
        return newState;
      });
    } else {
      // Firebase mode
      await updateGameState(gameId, updates);
    }
  };

  const handlePlayCard = async () => {
    // For local AI games, allow playing anytime (AI responds instantly)
    const isLocalGame = gameId.startsWith('local_');
    if (!isLocalGame && (!isMyTurn || isPlayingCard || gameState.gameStatus !== 'playing')) return;
    if (isLocalGame && (isPlayingCard || gameState.gameStatus !== 'playing')) return;

    setIsPlayingCard(true);
    await hapticService.medium();

    try {
      const player1 = gameState.player1;
      const player2 = gameState.player2!;

      if (gameState.warState) {
        // Get the battle cards from the war state
        const p1BattleCard = player1.deck[0];
        const p2BattleCard = player2.deck[0];

        // Resolve war
        const warResult = resolveWar(
          player1,
          player2,
          gameState.warState.cardsPlayed,
          gameState.warState.player1Cards.length === 1 ? 'six-seven' : 'regular'
        );

        // Update the war cards with the battle cards and winner
        if (lastWarCards) {
          setLastWarCards({
            ...lastWarCards,
            player1BattleCard: p1BattleCard,
            player2BattleCard: p2BattleCard,
            winner: warResult.winner,
          });
        }

        // Show the battle cards during war resolution
        setLastPlayedCards({
          player1Card: p1BattleCard,
          player2Card: p2BattleCard,
        });

        // Clear face-down cards and prepare for next round
        setWarFaceDownCards(0);

        const updates: Partial<GameState> = {
          'player1.deck': warResult.player1NewDeck,
          'player2.deck': warResult.player2NewDeck,
          warState: null,
          lastAction: warResult.winner
            ? `${warResult.winner === player1.id ? player1.name : player2.name} won the war!`
            : 'Another war!',
          lastActionTime: Date.now(),
        };

        if (warResult.player1NewDeck.length === 0 || warResult.player2NewDeck.length === 0) {
          updates.gameStatus = 'finished';
          updates.winner = warResult.winner;
        }

        await updateGame(updates);

        // Auto-clear war result after showing
        const timeoutId = setTimeout(() => {
          if (lastPlayedCards) {
            setPreviousPlayedCards({
              ...lastPlayedCards,
              winner: warResult.winner,
            });
            setLastPlayedCards(null);
          }
        }, 1000); // 1 second to see the war result
        timeoutRefs.current.push(timeoutId);

        // Send rich notification
        if (opponent.pushToken) {
          await sendRichGameNotification(opponent.pushToken, {
            opponentName: currentPlayer.name,
            yourCards: opponent.deck.length,
            opponentCards: warResult.player1NewDeck.length,
            lastAction: updates.lastAction as string,
            isYourTurn: true,
          });
        }
      } else {
        // Play regular round
        const result = playRound(player1, player2, gameState.sixSevenRuleEnabled);

        const p1Card = player1.deck[0];
        const p2Card = player2.deck[0];
        
        console.log('Card played - P1:', p1Card.rank, p1Card.suit, 'P2:', p2Card.rank, p2Card.suit, 'isWar:', result.isWar);

        // Move current cards to previous before showing new ones
        if (lastPlayedCards) {
          setPreviousPlayedCards({
            ...lastPlayedCards,
            winner: null, // No winner in tied rounds that lead to war
          });
        }

        setLastPlayedCards({
          player1Card: p1Card,
          player2Card: p2Card,
        });

        if (result.isWar) {
          const faceDownCount = result.warType === 'six-seven' ? 1 : 3;
          setWarFaceDownCards(faceDownCount);

          // Store the initial war cards for later display
          setLastWarCards({
            faceDownCount,
            player1InitialCard: p1Card,
            player2InitialCard: p2Card,
            player1BattleCard: null,
            player2BattleCard: null,
            winner: null,
          });

          const updates: Partial<GameState> = {
            'player1.deck': result.player1NewDeck,
            'player2.deck': result.player2NewDeck,
            warState: {
              cardsPlayed: result.cardsWon,
              player1Cards: [player1.deck[0]],
              player2Cards: [player2.deck[0]],
            },
            lastAction: result.warType === 'six-seven'
              ? '6-7 Rule triggered! WAR with 1 card!'
              : 'Same rank! WAR with 3 cards!',
            lastActionTime: Date.now(),
          };

          await updateGame(updates);

          // Send rich notification
          if (opponent.pushToken) {
            await sendRichGameNotification(opponent.pushToken, {
              opponentName: currentPlayer.name,
              yourCards: opponent.deck.length,
              opponentCards: result.player1NewDeck.length,
              lastAction: updates.lastAction as string,
              isYourTurn: true,
            });
          }
        } else {
          // First update: show the result but keep cards visible
          const immediateUpdates: Partial<GameState> = {
            'player1.deck': result.player1NewDeck,
            'player2.deck': result.player2NewDeck,
            lastAction: `${result.winner === player1.id ? player1.name : player2.name} won the round`,
            lastActionTime: Date.now(),
          };

          if (result.player1NewDeck.length === 0 || result.player2NewDeck.length === 0) {
            immediateUpdates.gameStatus = 'finished';
            immediateUpdates.winner = result.winner;
          }

          await updateGame(immediateUpdates);

          // Auto-clear cards after showing result
          const timeoutId = setTimeout(() => {
            setPreviousPlayedCards({
              player1Card: p1Card,
              player2Card: p2Card,
              winner: result.winner,
            });
            setLastPlayedCards(null);
          }, 1000); // 1 second to see the result
          timeoutRefs.current.push(timeoutId);

          // Send rich notification
          if (opponent.pushToken) {
            await sendRichGameNotification(opponent.pushToken, {
              opponentName: currentPlayer.name,
              yourCards: opponent.deck.length,
              opponentCards: result.player1NewDeck.length,
              lastAction: `${currentPlayer.name} played their card`,
              isYourTurn: true,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error playing card:', error);
      Alert.alert('Error', 'Failed to play card');
    } finally {
      setIsPlayingCard(false);
    }
  };

  if (gameState.gameStatus === 'finished') {
    const didIWin = gameState.winner === playerId;
    return (
      <View style={styles.container}>
        <Text style={styles.gameOverText}>
          {didIWin ? '⚔️ WAR CHAMPION! ⚔️' : '😔 Defeated in Battle 😔'}
        </Text>
        <Text style={styles.victoryMessage}>
          {didIWin
            ? 'You conquered all 52 cards and won the war!'
            : 'The opponent claimed victory this time!'
          }
        </Text>
        <Text style={styles.statsText}>
          Final Score: {currentPlayer.deck.length} - {opponent.deck.length}
        </Text>
        <TouchableOpacity style={styles.button} onPress={onExit}>
          <Text style={styles.buttonText}>Back to Menu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#0A0F1E', '#1E293B', '#0F172A']}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
        <View style={styles.header}>
        <Text style={styles.title}>WAR</Text>
        {gameState.sixSevenRuleEnabled && (
          <Text style={styles.ruleTag}>6-7 Rule: ON</Text>
        )}
      </View>

      {/* Opponent Info */}
      <View style={styles.playerSection}>
        <Text style={styles.playerName}>{opponent.name}</Text>
        <Text style={styles.deckCount}>Cards: {opponent.deck.length}</Text>
      </View>

      {/* Main Game Area - Large */}
      <View style={styles.mainGameArea}>
        {/* Battle Area */}
        <TouchableOpacity 
          style={styles.battleArea}
          onPress={handlePlayCard}
          disabled={isPlayingCard}
          activeOpacity={0.8}
        >
          {gameState.warState && (
            <>
              <View style={styles.warBanner}>
                <Text style={styles.warText}>WAR!</Text>
                <Text style={styles.warSubtext}>
                  {gameState.warState.player1Cards.length === 1 ? '1 card' : '3 cards'} face down
                </Text>
              </View>
              
              {warFaceDownCards > 0 && (
                <View style={styles.faceDownCardsContainer}>
                  {Array.from({ length: warFaceDownCards }).map((_, i) => (
                    <View key={i} style={styles.faceDownCardPair}>
                      <CardComponent card={{ rank: 1, suit: 'spades' }} faceDown scale={0.5} />
                      <CardComponent card={{ rank: 1, suit: 'spades' }} faceDown scale={0.5} />
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {lastPlayedCards && (
            <View style={styles.playedCards}>
              <CardComponent card={lastPlayedCards.player2Card} animated scale={0.9} />
              <CardComponent card={lastPlayedCards.player1Card} animated scale={0.9} />
            </View>
          )}

          <Text style={styles.lastAction}>{gameState.lastAction}</Text>
        </TouchableOpacity>

      </View>

      {/* Last Hand - Small Persistent Area */}
      {(previousPlayedCards || lastWarCards) && (
        <View style={styles.lastHandSection}>
          <Text style={styles.lastHandTitle}>
            {lastWarCards && lastWarCards.player1BattleCard ? 'Last WAR' : 'Last Hand'}
          </Text>
          {lastWarCards && lastWarCards.player1BattleCard ? (
            <View style={styles.warHistoryContainer}>
              <Text style={styles.warStageLabel}>Initial Cards (tied)</Text>
              <View style={styles.warHistoryRow}>
                <View style={styles.opponentCardOffset}>
                  <CardComponent card={lastWarCards.player2InitialCard} scale={0.45} />
                </View>
                <View style={styles.playerCardOffset}>
                  <CardComponent card={lastWarCards.player1InitialCard} scale={0.45} />
                </View>
              </View>

              {/* Face-down cards visual */}
              <View style={styles.faceDownSection}>
                <View style={styles.faceDownCardsRow}>
                  {Array.from({ length: lastWarCards.faceDownCount }).map((_, i) => (
                    <View key={i} style={styles.faceDownCardStack}>
                      <CardComponent card={{ rank: 1, suit: 'spades' }} faceDown scale={0.3} />
                      <CardComponent card={{ rank: 1, suit: 'spades' }} faceDown scale={0.3} />
                    </View>
                  ))}
                </View>
              </View>

              <Text style={styles.warStageLabel}>Battle Cards</Text>
              <View style={styles.warHistoryRow}>
                <View style={styles.cardWithIndicator}>
                  <View style={styles.opponentCardOffset}>
                    <CardComponent card={lastWarCards.player2BattleCard} scale={0.45} />
                  </View>
                  {lastWarCards.winner === gameState.player2?.id && (
                    <Text style={styles.winnerIndicator}>⭐</Text>
                  )}
                </View>
                <View style={styles.cardWithIndicator}>
                  <View style={styles.playerCardOffset}>
                    <CardComponent card={lastWarCards.player1BattleCard} scale={0.45} />
                  </View>
                  {lastWarCards.winner === gameState.player1.id && (
                    <Text style={styles.winnerIndicator}>⭐</Text>
                  )}
                </View>
              </View>
            </View>
          ) : previousPlayedCards ? (
            <View style={styles.lastHandCards}>
              <View style={styles.cardWithIndicator}>
                <View style={styles.opponentCardOffset}>
                  <CardComponent card={previousPlayedCards.player2Card} scale={0.6} />
                </View>
                {previousPlayedCards.winner === gameState.player2?.id && (
                  <Text style={styles.winnerIndicator}>⭐</Text>
                )}
              </View>
              <View style={styles.cardWithIndicator}>
                <View style={styles.playerCardOffset}>
                  <CardComponent card={previousPlayedCards.player1Card} scale={0.6} />
                </View>
                {previousPlayedCards.winner === gameState.player1.id && (
                  <Text style={styles.winnerIndicator}>⭐</Text>
                )}
              </View>
            </View>
          ) : null}
        </View>
      )}

      {/* Current Player Info */}
      <View style={styles.playerSection}>
        <Text style={styles.playerName}>{currentPlayer.name} (You)</Text>
        <Text style={styles.deckCount}>Cards: {currentPlayer.deck.length}</Text>
      </View>

      {/* Play Button */}
      <TouchableOpacity
        style={[
          styles.playButton,
          isPlayingCard && styles.playButtonDisabled,
        ]}
        onPress={handlePlayCard}
        disabled={isPlayingCard}
      >
        <Text style={styles.playButtonText}>
          {isPlayingCard
            ? 'Playing...'
            : gameState.warState
              ? 'Battle!'
              : 'Play Card'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.exitButton} onPress={onExit}>
        <Text style={styles.buttonText}>Exit Game</Text>
      </TouchableOpacity>

      {/* Card Play Animation */}
      <CardPlayAnimation
        card={animatingCard}
        fromX={screenWidth / 2}
        fromY={screenHeight * 0.8}
        toX={screenWidth / 2}
        toY={screenHeight * 0.4}
        onComplete={() => setAnimatingCard(null)}
      />
    </View>
    </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0F1E',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: 8,
    justifyContent: 'space-between',
  },
  mainGameArea: {
    flex: 0.7,
  },
  header: {
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FBBF24',
    textShadowColor: 'rgba(251, 191, 36, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    letterSpacing: 1,
  },
  ruleTag: {
    fontSize: 11,
    color: '#10B981',
    backgroundColor: '#064E3B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
  },
  playerSection: {
    alignItems: 'center',
    marginVertical: 2,
  },
  playerName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '800',
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  deckCount: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 2,
  },
  battleArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 16,
    padding: 8,
    borderWidth: 2,
    borderColor: 'rgba(100, 116, 139, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  lastHandSection: {
    flex: 0.3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 12,
    padding: 8,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  lastHandTitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
    fontWeight: '600',
  },
  lastHandCards: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  opponentCardOffset: {
    marginTop: -15,
  },
  playerCardOffset: {
    marginTop: 15,
  },
  warBanner: {
    backgroundColor: '#DC2626',
    padding: 8,
    borderRadius: 12,
    marginBottom: 6,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FCA5A5',
  },
  warText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 2,
  },
  warSubtext: {
    fontSize: 10,
    color: '#FEE2E2',
    textAlign: 'center',
    marginTop: 1,
  },
  faceDownCardsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  faceDownCardPair: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  playedCards: {
    flexDirection: 'column',
    gap: 10,
    marginVertical: 4,
    alignItems: 'center',
  },
  lastAction: {
    fontSize: 11,
    color: '#E2E8F0',
    textAlign: 'center',
    marginTop: 4,
  },
  playButton: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginVertical: 6,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  playButtonDisabled: {
    backgroundColor: '#475569',
    shadowOpacity: 0,
  },
  playButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 4,
  },
  shareButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginVertical: 16,
  },
  shareButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  exitButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 2,
  },
  buttonText: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  waitingText: {
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  roomCode: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 40,
  },
  gameOverText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  victoryMessage: {
    fontSize: 18,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  statsText: {
    fontSize: 20,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 40,
  },
  warHistoryContainer: {
    width: '100%',
    gap: 6,
    paddingVertical: 4,
  },
  warHistoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  warStageLabel: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
  faceDownSection: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  faceDownCardsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  faceDownCardStack: {
    flexDirection: 'row',
    marginLeft: -25,
  },
  cardWithIndicator: {
    alignItems: 'center',
    position: 'relative',
  },
  winnerIndicator: {
    fontSize: 24,
    marginTop: -8,
  },
});
