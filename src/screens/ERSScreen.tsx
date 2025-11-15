import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated as RNAnimated,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { CardComponent } from '../components/CardComponent';
import { ERSGameState } from '../types/ers';
import { Card } from '../types/game';
import {
  checkValidSlap,
  shouldStartFaceCardChallenge,
  formatSlapRules,
  isFaceCard,
} from '../utils/ersLogic';

interface ERSScreenProps {
  gameId: string;
  playerId: string;
  onExit: () => void;
}

export const ERSScreen: React.FC<ERSScreenProps> = ({ gameId, playerId, onExit }) => {
  const [gameState, setGameState] = useState<ERSGameState | null>(null);
  const [canPlay, setCanPlay] = useState(false);
  const [slapFeedback, setSlapFeedback] = useState<string>('');
  const [lastCardPlayedTime, setLastCardPlayedTime] = useState<number | null>(null);
  const [fastestSlap, setFastestSlap] = useState<number | null>(null);
  const [lastSlapTime, setLastSlapTime] = useState<number | null>(null);

  const pileScale = useSharedValue(1);
  const slapScale = useSharedValue(0);
  const successAnim = useRef(new RNAnimated.Value(0)).current;
  const failAnim = useRef(new RNAnimated.Value(0)).current;

  const pileAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pileScale.value }],
    };
  });

  const slapAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: slapScale.value }],
      opacity: slapScale.value,
    };
  });

  // Mock game state for demonstration
  useEffect(() => {
    // Import card utilities
    import('../utils/cardUtils').then(({ createDeck, shuffleDeck, splitDeck }) => {
      const deck = shuffleDeck(createDeck());
      const [player1Deck, player2Deck] = splitDeck(deck);

      const mockState: ERSGameState = {
        id: gameId,
        player1: {
          id: playerId,
          name: 'You',
          deck: player1Deck,
        },
        player2: {
          id: 'opponent',
          name: 'AI',
          deck: player2Deck,
        },
        pile: [],
        currentTurn: playerId,
        gameStatus: 'playing',
        lastAction: 'Game started',
        lastActionTime: Date.now(),
        winner: null,
        faceCardChallenge: null,
        canSlap: false,
        lastSlap: null,
      };
      setGameState(mockState);
    });
  }, []);

  // AI opponent plays automatically
  useEffect(() => {
    if (!gameState || gameState.gameStatus !== 'playing') return;

    const isAITurn = gameState.currentTurn === 'opponent';
    if (!isAITurn) return;

    // AI plays after a delay to allow player time to slap
    const aiTimeout = setTimeout(() => {
      const aiPlayer = gameState.player2;
      if (!aiPlayer || aiPlayer.deck.length === 0) return;

      const card = aiPlayer.deck[0];
      const newPile = [...gameState.pile, card];
      const newDeck = aiPlayer.deck.slice(1);

      // Animate pile
      pileScale.value = withSequence(
        withSpring(1.2),
        withSpring(1)
      );

      // Check for face card challenge
      const faceCardValue = shouldStartFaceCardChallenge(card);

      // Determine next turn based on face card challenge
      let nextTurn = playerId; // Default to player's turn
      let newFaceCardChallenge = null;

      if (faceCardValue > 0) {
        // AI just played a face card during a challenge - this starts a new challenge
        newFaceCardChallenge = {
          active: true,
          cardsToPlay: faceCardValue,
          remainingCards: faceCardValue,
          challenger: 'opponent',
        };
        nextTurn = playerId;
      } else if (gameState.faceCardChallenge) {
        // AI is responding to a face card challenge with a non-face card
        const remainingCards = gameState.faceCardChallenge.remainingCards - 1;
        if (remainingCards > 0) {
          // Challenge continues, AI must play more cards
          newFaceCardChallenge = {
            ...gameState.faceCardChallenge,
            remainingCards,
          };
          nextTurn = 'opponent'; // AI plays again
        } else {
          // Challenge complete, will be handled below
          newFaceCardChallenge = {
            ...gameState.faceCardChallenge,
            remainingCards: 0,
          };
          nextTurn = playerId;
        }
      } else {
        // Normal turn, no face card challenge
        nextTurn = playerId;
      }

      const now = Date.now();
      const updatedState: ERSGameState = {
        ...gameState,
        pile: newPile,
        player2: {
          ...aiPlayer,
          deck: newDeck,
        },
        currentTurn: nextTurn,
        lastAction: `AI played ${card.rank}`,
        lastActionTime: now,
        faceCardChallenge: newFaceCardChallenge,
        canSlap: checkValidSlap(newPile).valid,
      };

      setGameState(updatedState);
      setLastCardPlayedTime(now);

      // Check if face card challenge ends - give player time to slap before awarding pile
      if (
        updatedState.faceCardChallenge &&
        updatedState.faceCardChallenge.remainingCards === 0 &&
        !isFaceCard(card.rank)
      ) {
        // Delay pile awarding to give player chance to slap
        setTimeout(() => {
          setGameState((currentState) => {
            if (!currentState) return currentState;
            
            // Challenger wins the pile
            const challengerIsAI = currentState.faceCardChallenge?.challenger === 'opponent';
            const challenger = challengerIsAI ? currentState.player2! : currentState.player1;

            const newState = { ...currentState };
            if (challengerIsAI) {
              newState.player2 = {
                ...challenger,
                deck: [...challenger.deck, ...currentState.pile],
              };
            } else {
              newState.player1 = {
                ...challenger,
                deck: [...challenger.deck, ...currentState.pile],
              };
            }
            newState.pile = [];
            newState.faceCardChallenge = null;
            newState.lastAction = `${challenger.name} won the pile!`;
            
            return newState;
          });
        }, 1000); // 1 second delay to allow slapping
      }
    }, 800); // 800ms delay between AI cards to allow slapping

    return () => clearTimeout(aiTimeout);
  }, [gameState?.currentTurn, gameState?.gameStatus, gameState?.faceCardChallenge?.remainingCards]);

  if (!gameState || !gameState.player2) {
    return (
      <View style={styles.container}>
        <Text style={styles.waitingText}>Waiting for opponent...</Text>
        <TouchableOpacity style={styles.exitButton} onPress={onExit}>
          <Text style={styles.buttonText}>Exit</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isPlayer1 = gameState.player1.id === playerId;
  const currentPlayer = isPlayer1 ? gameState.player1 : gameState.player2;
  const opponent = isPlayer1 ? gameState.player2 : gameState.player1;
  const isMyTurn = gameState.currentTurn === playerId;

  const handlePlayCard = () => {
    if (!isMyTurn || currentPlayer.deck.length === 0) return;

    const card = currentPlayer.deck[0];
    const newPile = [...gameState.pile, card];
    const newDeck = currentPlayer.deck.slice(1);

    // Animate pile
    pileScale.value = withSequence(
      withSpring(1.2),
      withSpring(1)
    );

    // Check for face card challenge
    const faceCardValue = shouldStartFaceCardChallenge(card);

    // Determine next turn based on face card challenge
    let nextTurn = opponent.id; // Default to opponent's turn
    let newFaceCardChallenge = null;

    if (faceCardValue > 0) {
      // Player just played a face card, opponent must respond
      newFaceCardChallenge = {
        active: true,
        cardsToPlay: faceCardValue,
        remainingCards: faceCardValue,
        challenger: playerId,
      };
      nextTurn = opponent.id;
    } else if (gameState.faceCardChallenge) {
      // Player is responding to a face card challenge
      const remainingCards = gameState.faceCardChallenge.remainingCards - 1;
      if (remainingCards > 0) {
        // Challenge continues, player plays again
        newFaceCardChallenge = {
          ...gameState.faceCardChallenge,
          remainingCards,
        };
        nextTurn = playerId;
      } else {
        // Challenge complete, will be handled below
        newFaceCardChallenge = {
          ...gameState.faceCardChallenge,
          remainingCards: 0,
        };
        nextTurn = opponent.id;
      }
    }

    const now = Date.now();
    const updatedState: ERSGameState = {
      ...gameState,
      pile: newPile,
      [isPlayer1 ? 'player1' : 'player2']: {
        ...currentPlayer,
        deck: newDeck,
      },
      currentTurn: nextTurn,
      lastAction: `${currentPlayer.name} played ${card.rank}`,
      lastActionTime: now,
      faceCardChallenge: newFaceCardChallenge,
      canSlap: checkValidSlap(newPile).valid,
    };

    setGameState(updatedState);
    setLastCardPlayedTime(now);

    // Check if face card challenge ends - give time to slap before awarding pile
    if (
      updatedState.faceCardChallenge &&
      updatedState.faceCardChallenge.remainingCards === 0 &&
      !isFaceCard(card.rank)
    ) {
      // Delay pile awarding to give player chance to slap
      setTimeout(() => {
        setGameState((currentState) => {
          if (!currentState) return currentState;
          
          // Challenger wins the pile
          const challengerIsPlayer1 = currentState.faceCardChallenge?.challenger === gameState.player1.id;
          const challenger = challengerIsPlayer1 ? currentState.player1 : currentState.player2!;

          const newState = { ...currentState };
          newState[challengerIsPlayer1 ? 'player1' : 'player2'] = {
            ...challenger,
            deck: [...challenger.deck, ...currentState.pile],
          };
          newState.pile = [];
          newState.faceCardChallenge = null;
          newState.lastAction = `${challenger.name} won the pile!`;
          
          return newState;
        });
      }, 1000); // 1 second delay to allow slapping
    }
  };

  const handleSlap = () => {
    const now = Date.now();
    const slapCheck = checkValidSlap(gameState.pile);

    // Calculate reaction time
    let reactionTime: number | null = null;
    let reactionTimeMs: number | null = null;
    if (lastCardPlayedTime) {
      reactionTimeMs = now - lastCardPlayedTime;
      reactionTime = reactionTimeMs / 1000; // Convert to seconds
    }

    if (slapCheck.valid) {
      // Successful slap!
      slapScale.value = withSequence(
        withTiming(1.5, { duration: 100 }),
        withTiming(0, { duration: 300 })
      );

      RNAnimated.sequence([
        RNAnimated.timing(successAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        RNAnimated.timing(successAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Update fastest slap if this is faster
      let feedbackText = `✅ ${formatSlapRules(slapCheck.rules)}!`;
      if (reactionTime !== null) {
        setLastSlapTime(reactionTimeMs!);

        if (fastestSlap === null || reactionTimeMs! < fastestSlap) {
          setFastestSlap(reactionTimeMs!);
          feedbackText += ` ⚡ NEW RECORD: ${reactionTime.toFixed(3)}s`;
        } else {
          feedbackText += ` ⏱️ ${reactionTime.toFixed(3)}s`;
        }
      }

      setSlapFeedback(feedbackText);
      setTimeout(() => setSlapFeedback(''), 2000);

      // Give player the pile
      const updatedState: ERSGameState = {
        ...gameState,
        [isPlayer1 ? 'player1' : 'player2']: {
          ...currentPlayer,
          deck: [...currentPlayer.deck, ...gameState.pile],
        },
        pile: [],
        lastAction: `${currentPlayer.name} slapped! ${formatSlapRules(slapCheck.rules)}`,
        lastActionTime: Date.now(),
        canSlap: false,
        faceCardChallenge: null,
      };

      setGameState(updatedState);
    } else {
      // Bad slap - penalty
      slapScale.value = withSequence(
        withTiming(1.2, { duration: 100 }),
        withTiming(0, { duration: 300 })
      );

      RNAnimated.sequence([
        RNAnimated.timing(failAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        RNAnimated.timing(failAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      setSlapFeedback('❌ Bad slap! Penalty!');
      setTimeout(() => setSlapFeedback(''), 2000);

      if (currentPlayer.deck.length > 0) {
        const penaltyCard = currentPlayer.deck[0];
        const updatedState: ERSGameState = {
          ...gameState,
          [isPlayer1 ? 'player1' : 'player2']: {
            ...currentPlayer,
            deck: currentPlayer.deck.slice(1),
          },
          pile: [...gameState.pile, penaltyCard],
          lastAction: `${currentPlayer.name} bad slap! Penalty card`,
          lastActionTime: Date.now(),
        };

        setGameState(updatedState);
      }
    }
  };

  const topCard = gameState.pile[gameState.pile.length - 1];

  return (
    <View style={styles.container}>
      {/* Success/Fail Overlays */}
      <RNAnimated.View
        style={[
          styles.feedbackOverlay,
          styles.successOverlay,
          {
            opacity: successAnim,
            transform: [
              {
                scale: successAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.2],
                }),
              },
            ],
          },
        ]}
        pointerEvents="none"
      >
        <Text style={styles.feedbackEmoji}>🎉</Text>
      </RNAnimated.View>

      <RNAnimated.View
        style={[
          styles.feedbackOverlay,
          styles.failOverlay,
          {
            opacity: failAnim,
            transform: [
              {
                scale: failAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.2],
                }),
              },
            ],
          },
        ]}
        pointerEvents="none"
      >
        <Text style={styles.feedbackEmoji}>💥</Text>
      </RNAnimated.View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>EGYPTIAN RAT SCREW</Text>
        <Text style={styles.subtitle}>Slap fast, win cards!</Text>
      </View>

      {/* Opponent Info */}
      <View style={styles.playerSection}>
        <Text style={styles.playerName}>{opponent.name}</Text>
        <Text style={styles.deckCount}>Cards: {opponent.deck.length}</Text>
      </View>

      {/* Pile */}
      <View style={styles.pileSection}>
        {gameState.faceCardChallenge && (
          <View style={styles.challengeBanner}>
            <Text style={styles.challengeText}>
              ⚡ Face Card Challenge! ⚡
            </Text>
            <Text style={styles.challengeSubtext}>
              {gameState.faceCardChallenge.remainingCards} cards to play
            </Text>
          </View>
        )}

        <View style={styles.stackContainer}>
          <Animated.View style={[styles.pileContainer, pileAnimatedStyle]}>
            {gameState.pile.length > 0 ? (
              <>
                {/* Show up to last 5 cards in a diagonal stack */}
                {gameState.pile.slice(-5).map((card, index, arr) => {
                  const isTopCard = index === arr.length - 1;
                  const verticalOffset = index * 30; // Increased vertical offset
                  const horizontalOffset = index * 20; // Increased horizontal offset
                  const opacity = 0.8 + (index / arr.length) * 0.2; // Gradual opacity increase
                  return (
                    <View
                      key={`${card.id}-${index}`}
                      style={[
                        styles.stackedCard,
                        {
                          top: verticalOffset,
                          left: horizontalOffset,
                          zIndex: index,
                          opacity: isTopCard ? 1 : opacity,
                        },
                      ]}
                    >
                      <CardComponent
                        card={card}
                        animated={isTopCard}
                        scale={isTopCard ? 1.2 : 1.0}
                      />
                    </View>
                  );
                })}
              </>
            ) : (
              <View style={styles.emptyPile}>
                <Text style={styles.emptyPileText}>Empty Pile</Text>
              </View>
            )}
          </Animated.View>
          <Text style={styles.pileCount}>Pile: {gameState.pile.length} cards</Text>
        </View>

        {/* Slap Hand Animation */}
        <Animated.View style={[styles.slapHand, slapAnimatedStyle]} pointerEvents="none">
          <Text style={styles.slapHandEmoji}>👋</Text>
        </Animated.View>

        {slapFeedback && (
          <View style={styles.feedbackBanner}>
            <Text style={styles.feedbackText}>{slapFeedback}</Text>
          </View>
        )}
      </View>

      {/* Current Player Info */}
      <View style={styles.playerSection}>
        <Text style={styles.playerName}>{currentPlayer.name} (You)</Text>
        <Text style={styles.deckCount}>Cards: {currentPlayer.deck.length}</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.playButton, !isMyTurn && styles.buttonDisabled]}
          onPress={handlePlayCard}
          disabled={!isMyTurn}
        >
          <Text style={styles.playButtonText}>
            {isMyTurn ? '🎴 PLAY CARD' : "Opponent's Turn"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.slapButton}
          onPress={handleSlap}
        >
          <Text style={styles.slapButtonText}>👋 SLAP!</Text>
        </TouchableOpacity>
      </View>

      {/* Rules & Stats Info */}
      <View style={styles.rulesSection}>
        <View style={styles.rulesRow}>
          <View style={styles.rulesColumn}>
            <Text style={styles.rulesTitle}>Slap on:</Text>
            <Text style={styles.rulesText}>Doubles only!</Text>
          </View>
          {fastestSlap !== null && (
            <View style={styles.statsColumn}>
              <Text style={styles.statsTitle}>⚡ Fastest:</Text>
              <Text style={styles.statsValue}>{(fastestSlap / 1000).toFixed(3)}s</Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.exitButton} onPress={onExit}>
        <Text style={styles.buttonText}>Exit Game</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 20,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#A855F7',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  playerSection: {
    alignItems: 'center',
    marginVertical: 10,
  },
  playerName: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  deckCount: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  pileSection: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 250,
    position: 'relative',
  },
  challengeBanner: {
    backgroundColor: '#DC2626',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  challengeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  challengeSubtext: {
    fontSize: 14,
    color: '#FEE2E2',
    textAlign: 'center',
    marginTop: 4,
  },
  stackContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  pileContainer: {
    alignItems: 'center',
    position: 'relative',
    width: 150,
    height: 200,
  },
  stackedCard: {
    position: 'absolute',
  },
  emptyPile: {
    width: 100,
    height: 150,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#475569',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPileText: {
    fontSize: 16,
    color: '#64748B',
  },
  pileCount: {
    fontSize: 16,
    color: '#E2E8F0',
    marginTop: 12,
  },
  slapHand: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
  },
  slapHandEmoji: {
    fontSize: 120,
  },
  feedbackBanner: {
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  feedbackText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  feedbackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  successOverlay: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
  },
  failOverlay: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
  },
  feedbackEmoji: {
    fontSize: 120,
  },
  actionButtons: {
    gap: 12,
  },
  playButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  slapButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 20,
    borderRadius: 12,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: '#475569',
    shadowOpacity: 0,
  },
  playButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  slapButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  rulesSection: {
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  rulesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  rulesColumn: {
    flex: 1,
  },
  statsColumn: {
    alignItems: 'flex-end',
    paddingLeft: 12,
  },
  rulesTitle: {
    fontSize: 14,
    color: '#A855F7',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  rulesText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  statsTitle: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statsValue: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: 'bold',
  },
  exitButton: {
    backgroundColor: '#475569',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  buttonText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  waitingText: {
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 100,
  },
});
