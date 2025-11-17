import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { CardComponent } from '../components/CardComponent';
import { HeartsGameState, HeartsPlayer } from '../types/hearts';
import { Card } from '../types/game';
import {
  canPlayCard,
  determineTrickWinner,
  calculateRoundScores,
  getPassDirection,
  has2OfClubs,
} from '../utils/heartsLogic';
import { createDeck, shuffleDeck } from '../utils/cardUtils';
import { database } from '../config/firebase';
import { ref, onValue, off, update } from 'firebase/database';

interface HeartsScreenProps {
  gameId: string;
  playerId: string;
  onExit: () => void;
}

export const HeartsScreen: React.FC<HeartsScreenProps> = ({ gameId, playerId, onExit }) => {
  const [gameState, setGameState] = useState<HeartsGameState | null>(null);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);

  useEffect(() => {
    if (gameId.startsWith('local_')) {
      initializeLocalGame();
      return;
    }

    if (!database) {
      Alert.alert('Error', 'Firebase not initialized');
      return;
    }

    const gameRef = ref(database, `heartsGames/${gameId}`);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        setGameState(snapshot.val());
      }
    });

    return () => off(gameRef);
  }, [gameId]);

  const initializeLocalGame = () => {
    const deck = shuffleDeck(createDeck());

    // Deal all 52 cards to 4 players (13 each)
    const players: HeartsPlayer[] = [
      {
        id: playerId,
        name: 'You',
        deck: [],
        hand: deck.slice(0, 13),
        tricksTaken: [],
        score: 0,
        passedCards: [],
      },
      {
        id: 'ai_player_1',
        name: 'AI 1',
        deck: [],
        hand: deck.slice(13, 26),
        tricksTaken: [],
        score: 0,
        passedCards: [],
      },
      {
        id: 'ai_player_2',
        name: 'AI 2',
        deck: [],
        hand: deck.slice(26, 39),
        tricksTaken: [],
        score: 0,
        passedCards: [],
      },
      {
        id: 'ai_player_3',
        name: 'AI 3',
        deck: [],
        hand: deck.slice(39, 52),
        tricksTaken: [],
        score: 0,
        passedCards: [],
      },
    ];

    // Find who has 2 of clubs
    const startingPlayerIndex = players.findIndex(p => has2OfClubs(p.hand));

    const localGame: HeartsGameState = {
      id: gameId,
      players,
      currentPlayerIndex: startingPlayerIndex,
      currentTrick: [],
      currentTrickPlayerIds: [],
      leadingSuit: null,
      roundNumber: 1,
      passDirection: 'left',
      gameStatus: 'playing',
      lastAction: 'Game started - pass 3 cards',
      lastActionTime: Date.now(),
      winner: null,
      heartsBroken: false,
      playPhase: 'passing',
    };

    setGameState(localGame);
  };

  const handlePassCards = async () => {
    if (!gameState || gameState.playPhase !== 'passing') return;

    const myPlayer = gameState.players.find(p => p.id === playerId);
    if (!myPlayer) return;

    if (selectedCards.length !== 3) {
      Alert.alert('Select exactly 3 cards to pass');
      return;
    }

    // In a real implementation, you'd wait for all players to pass
    // For now, we'll just remove the cards and start playing
    const newHand = myPlayer.hand.filter(c => !selectedCards.some(sc => sc.id === c.id));

    const updates: Partial<HeartsGameState> = {
      players: gameState.players.map(p =>
        p.id === playerId ? { ...p, hand: newHand, passedCards: selectedCards } : p
      ),
      playPhase: 'playing',
      lastAction: 'Cards passed - game starting',
      lastActionTime: Date.now(),
    };

    setSelectedCards([]);

    if (gameId.startsWith('local_')) {
      setGameState({ ...gameState, ...updates });
    } else {
      await updateGameState(updates);
    }
  };

  const handlePlayCard = async (card: Card) => {
    if (!gameState || gameState.playPhase !== 'playing') return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== playerId) {
      Alert.alert('Not your turn!');
      return;
    }

    if (!canPlayCard(card, currentPlayer.hand, gameState.leadingSuit, gameState.heartsBroken)) {
      Alert.alert('Invalid card', 'Cannot play that card');
      return;
    }

    const newHand = currentPlayer.hand.filter(c => c.id !== card.id);
    const newTrick = [...gameState.currentTrick, card];
    const newTrickPlayerIds = [...gameState.currentTrickPlayerIds, currentPlayer.id];
    const newLeadingSuit = gameState.leadingSuit || card.suit;
    const newHeartsBroken = gameState.heartsBroken || card.suit === 'hearts';

    let updates: Partial<HeartsGameState>;

    // Check if trick is complete (4 cards)
    if (newTrick.length === 4) {
      const winnerId = determineTrickWinner(newTrick, newTrickPlayerIds, newLeadingSuit);
      const winnerIndex = gameState.players.findIndex(p => p.id === winnerId);
      const winnerPlayer = gameState.players[winnerIndex];

      const updatedPlayers = gameState.players.map((p, idx) => {
        if (idx === gameState.currentPlayerIndex) {
          return { ...p, hand: newHand };
        } else if (p.id === winnerId) {
          return { ...p, tricksTaken: [...p.tricksTaken, newTrick] };
        }
        return p;
      });

      // Check if round is over (all cards played)
      const roundOver = updatedPlayers.every(p => p.hand.length === 0);

      if (roundOver) {
        const scoredPlayers = calculateRoundScores(updatedPlayers);
        const gameOver = scoredPlayers.some(p => p.score >= 100);

        updates = {
          players: scoredPlayers.map(p => ({ ...p, hand: [], tricksTaken: [] })),
          currentTrick: [],
          currentTrickPlayerIds: [],
          leadingSuit: null,
          heartsBroken: false,
          gameStatus: gameOver ? 'finished' : 'playing',
          winner: gameOver ? scoredPlayers.reduce((min, p) => p.score < min.score ? p : min).id : null,
          lastAction: `Round ${gameState.roundNumber} complete`,
          lastActionTime: Date.now(),
        };
      } else {
        updates = {
          players: updatedPlayers,
          currentPlayerIndex: winnerIndex,
          currentTrick: [],
          currentTrickPlayerIds: [],
          leadingSuit: null,
          heartsBroken: newHeartsBroken,
          lastAction: `${winnerPlayer.name} won the trick`,
          lastActionTime: Date.now(),
        };
      }
    } else {
      const nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;

      updates = {
        players: gameState.players.map((p, idx) =>
          idx === gameState.currentPlayerIndex ? { ...p, hand: newHand } : p
        ),
        currentPlayerIndex: nextPlayerIndex,
        currentTrick: newTrick,
        currentTrickPlayerIds: newTrickPlayerIds,
        leadingSuit: newLeadingSuit,
        heartsBroken: newHeartsBroken,
        lastAction: `${currentPlayer.name} played ${card.rank} of ${card.suit}`,
        lastActionTime: Date.now(),
      };
    }

    if (gameId.startsWith('local_')) {
      setGameState({ ...gameState, ...updates });
    } else {
      await updateGameState(updates);
    }
  };

  const updateGameState = async (updates: Partial<HeartsGameState>) => {
    if (!database) return;
    const gameRef = ref(database, `heartsGames/${gameId}`);
    await update(gameRef, updates);
  };

  const toggleCardSelection = (card: Card) => {
    setSelectedCards(prev =>
      prev.some(c => c.id === card.id)
        ? prev.filter(c => c.id !== card.id)
        : [...prev, card]
    );
  };

  if (!gameState) {
    return (
      <View style={styles.container}>
        <Text style={styles.waitingText}>Loading game...</Text>
      </View>
    );
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const myPlayer = gameState.players.find(p => p.id === playerId);
  const isMyTurn = currentPlayer.id === playerId;

  if (!myPlayer) {
    return (
      <View style={styles.container}>
        <Text style={styles.waitingText}>Player not found</Text>
      </View>
    );
  }

  const isPassing = gameState.playPhase === 'passing' && gameState.passDirection !== 'none';

  // Show victory screen when game is finished
  if (gameState.gameStatus === 'finished') {
    const didIWin = gameState.winner === playerId;
    const winner = gameState.players.find(p => p.id === gameState.winner);
    return (
      <View style={styles.container}>
        <Text style={styles.gameOverText}>
          {didIWin ? '♥️ HEARTS MASTER! ♥️' : '😔 Nice Try! 😔'}
        </Text>
        <Text style={styles.victoryMessage}>
          {didIWin
            ? 'You had the lowest score and won the game!'
            : `${winner?.name} had the lowest score and won!`
          }
        </Text>
        <Text style={styles.scoreText}>
          Your Final Score: {myPlayer.score} points
        </Text>
        <TouchableOpacity style={styles.exitButtonLarge} onPress={onExit}>
          <Text style={styles.exitTextLarge}>Back to Menu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hearts ♥</Text>
        <TouchableOpacity style={styles.exitButton} onPress={onExit}>
          <Text style={styles.exitText}>Exit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.turnInfo}>
        {isPassing ? (
          <Text style={styles.turnText}>Pass 3 cards {gameState.passDirection}</Text>
        ) : (
          <Text style={styles.turnText}>
            {isMyTurn ? 'Your Turn' : `${currentPlayer.name}'s Turn`}
          </Text>
        )}
        <Text style={styles.heartsText}>
          Hearts: {gameState.heartsBroken ? 'Broken ❤️' : 'Not Broken'}
        </Text>
      </View>

      <View style={styles.scoresContainer}>
        <Text style={styles.scoresLabel}>Scores</Text>
        <View style={styles.scoresRow}>
          {gameState.players.map((player) => (
            <View key={player.id} style={styles.playerScore}>
              <Text style={styles.playerScoreName}>{player.name}</Text>
              <Text style={styles.playerScoreValue}>{player.score}</Text>
            </View>
          ))}
        </View>
      </View>

      {gameState.currentTrick.length > 0 && (
        <View style={styles.trickContainer}>
          <Text style={styles.trickLabel}>Current Trick</Text>
          <View style={styles.trickCards}>
            {gameState.currentTrick.map((card, idx) => (
              <View key={card.id} style={styles.trickCard}>
                <Text style={styles.trickPlayerName}>
                  {gameState.players.find(p => p.id === gameState.currentTrickPlayerIds[idx])?.name}
                </Text>
                <CardComponent card={card} scale={0.5} />
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.handContainer}>
        <Text style={styles.handLabel}>Your Hand ({myPlayer.hand.length} cards)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.hand}>
            {myPlayer.hand.map((card) => (
              <TouchableOpacity
                key={card.id}
                onPress={() => {
                  if (isPassing) {
                    toggleCardSelection(card);
                  } else if (isMyTurn) {
                    handlePlayCard(card);
                  }
                }}
                style={[
                  styles.cardWrapper,
                  selectedCards.some(c => c.id === card.id) && styles.selectedCard,
                ]}
              >
                <CardComponent card={card} scale={0.6} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {isPassing && (
        <TouchableOpacity
          style={styles.passButton}
          onPress={handlePassCards}
          disabled={selectedCards.length !== 3}
        >
          <Text style={styles.passButtonText}>
            Pass Cards ({selectedCards.length}/3)
          </Text>
        </TouchableOpacity>
      )}

      <Text style={styles.lastAction}>{gameState.lastAction}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4A0E0E',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  exitButton: {
    backgroundColor: '#7F1D1D',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exitText: {
    color: 'white',
    fontWeight: 'bold',
  },
  turnInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  turnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  heartsText: {
    color: '#EF4444',
    fontSize: 14,
  },
  scoresContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  scoresLabel: {
    color: '#DC2626',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  scoresRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  playerScore: {
    alignItems: 'center',
  },
  playerScoreName: {
    color: 'white',
    fontSize: 12,
  },
  playerScoreValue: {
    color: '#EF4444',
    fontSize: 18,
    fontWeight: 'bold',
  },
  trickContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  trickLabel: {
    color: '#DC2626',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  trickCards: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  trickCard: {
    alignItems: 'center',
  },
  trickPlayerName: {
    color: 'white',
    fontSize: 10,
    marginBottom: 4,
  },
  handContainer: {
    marginBottom: 16,
  },
  handLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  hand: {
    flexDirection: 'row',
    gap: 8,
  },
  cardWrapper: {
    marginHorizontal: 4,
  },
  selectedCard: {
    transform: [{ translateY: -10 }],
    borderWidth: 2,
    borderColor: '#DC2626',
    borderRadius: 8,
  },
  passButton: {
    backgroundColor: '#DC2626',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  passButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  lastAction: {
    color: '#B0B0B0',
    fontSize: 12,
    textAlign: 'center',
  },
  waitingText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
  gameOverText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#DC2626',
    textAlign: 'center',
    marginTop: 100,
    marginBottom: 20,
  },
  victoryMessage: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  scoreText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 40,
  },
  exitButtonLarge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignSelf: 'center',
  },
  exitTextLarge: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
