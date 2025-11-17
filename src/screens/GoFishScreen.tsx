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
import { CardComponent } from '../components/CardComponent';
import { GoFishGameState, GoFishPlayer } from '../types/gofish';
import { Card, Rank } from '../types/game';
import { hasRank, getCardsOfRank, checkForBooks, calculateWinner, isGameOver } from '../utils/goFishLogic';
import { createDeck, shuffleDeck } from '../utils/cardUtils';
import { database } from '../config/firebase';
import { ref, onValue, off, update } from 'firebase/database';

interface GoFishScreenProps {
  gameId: string;
  playerId: string;
  onExit: () => void;
}

export const GoFishScreen: React.FC<GoFishScreenProps> = ({ gameId, playerId, onExit }) => {
  const [gameState, setGameState] = useState<GoFishGameState | null>(null);
  const [selectedRank, setSelectedRank] = useState<number | null>(null);
  const [showPlayerSelect, setShowPlayerSelect] = useState(false);

  useEffect(() => {
    if (gameId.startsWith('local_')) {
      initializeLocalGame();
      return;
    }

    if (!database) {
      Alert.alert('Error', 'Firebase not initialized');
      return;
    }

    const gameRef = ref(database, `goFishGames/${gameId}`);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        setGameState(snapshot.val());
      }
    });

    return () => off(gameRef);
  }, [gameId]);

  const initializeLocalGame = () => {
    const deck = shuffleDeck(createDeck());
    const cardsPerPlayer = 7;

    const player1Hand = deck.splice(0, cardsPerPlayer);
    const player2Hand = deck.splice(0, cardsPerPlayer);

    const localGame: GoFishGameState = {
      id: gameId,
      players: [
        {
          id: playerId,
          name: 'You',
          deck: [],
          hand: player1Hand,
          books: [],
        },
        {
          id: 'ai_player',
          name: 'AI',
          deck: [],
          hand: player2Hand,
          books: [],
        },
      ],
      currentPlayerIndex: 0,
      deck,
      gameStatus: 'playing',
      lastAction: 'Game started',
      lastActionTime: Date.now(),
      winner: null,
      lastAskedRank: null,
      lastAskedPlayerId: null,
    };

    setGameState(localGame);
  };

  const handleAskForCards = async (targetPlayerId: string) => {
    if (!gameState || !selectedRank) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== playerId) {
      Alert.alert('Not your turn!');
      return;
    }

    if (!hasRank(currentPlayer.hand, selectedRank)) {
      Alert.alert('Invalid move', 'You must have at least one card of the rank you ask for!');
      return;
    }

    const targetPlayer = gameState.players.find(p => p.id === targetPlayerId)!;
    const cardsToGive = getCardsOfRank(targetPlayer.hand, selectedRank);

    let newCurrentPlayerHand = [...currentPlayer.hand];
    let newTargetPlayerHand = [...targetPlayer.hand];
    let newDeck = [...gameState.deck];
    let nextPlayerIndex = gameState.currentPlayerIndex;
    let actionMessage = '';

    if (cardsToGive.length > 0) {
      // Target has cards - give them to current player
      newCurrentPlayerHand = [...newCurrentPlayerHand, ...cardsToGive];
      newTargetPlayerHand = newTargetPlayerHand.filter(c => c.rank !== selectedRank);
      actionMessage = `${currentPlayer.name} got ${cardsToGive.length} card(s) from ${targetPlayer.name}`;
    } else {
      // Go Fish!
      if (newDeck.length > 0) {
        const drawnCard = newDeck.pop()!;
        newCurrentPlayerHand.push(drawnCard);
        actionMessage = `Go Fish! ${currentPlayer.name} drew a card`;
        nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
      } else {
        actionMessage = `Go Fish! No cards in deck`;
        nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
      }
    }

    // Check for books
    const currentPlayerBooks = checkForBooks(newCurrentPlayerHand);
    const targetPlayerBooks = checkForBooks(newTargetPlayerHand);

    const updatedPlayers = gameState.players.map((p, idx) => {
      if (p.id === currentPlayer.id) {
        return {
          ...p,
          hand: currentPlayerBooks.remainingHand,
          books: [...p.books, ...currentPlayerBooks.books],
        };
      } else if (p.id === targetPlayer.id) {
        return {
          ...p,
          hand: targetPlayerBooks.remainingHand,
          books: [...p.books, ...targetPlayerBooks.books],
        };
      }
      return p;
    });

    const gameOver = isGameOver(updatedPlayers, newDeck.length);
    const winnerId = gameOver ? calculateWinner(updatedPlayers) : null;

    const updates: Partial<GoFishGameState> = {
      players: updatedPlayers,
      deck: newDeck,
      currentPlayerIndex: nextPlayerIndex,
      lastAction: actionMessage,
      lastActionTime: Date.now(),
      lastAskedRank: selectedRank,
      lastAskedPlayerId: targetPlayerId,
      gameStatus: gameOver ? 'finished' : 'playing',
      winner: winnerId,
    };

    setSelectedRank(null);
    setShowPlayerSelect(false);

    if (gameId.startsWith('local_')) {
      setGameState({ ...gameState, ...updates });
    } else {
      await updateGameState(updates);
    }
  };

  const updateGameState = async (updates: Partial<GoFishGameState>) => {
    if (!database) return;
    const gameRef = ref(database, `goFishGames/${gameId}`);
    await update(gameRef, updates);
  };

  const handleCardClick = (card: Card) => {
    if (!gameState) return;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== playerId) return;

    setSelectedRank(card.rank);
  };

  const getRankName = (rank: number): string => {
    if (rank === 14) return 'Ace';
    if (rank === 13) return 'King';
    if (rank === 12) return 'Queen';
    if (rank === 11) return 'Jack';
    return rank.toString();
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

  const otherPlayers = gameState.players.filter(p => p.id !== playerId);

  // Show victory screen when game is finished
  if (gameState.gameStatus === 'finished') {
    const didIWin = gameState.winner === playerId;
    const winner = gameState.players.find(p => p.id === gameState.winner);
    return (
      <View style={styles.container}>
        <Text style={styles.gameOverText}>
          {didIWin ? '🐟 MASTER ANGLER! 🐟' : '😔 The Fish Got Away 😔'}
        </Text>
        <Text style={styles.victoryMessage}>
          {didIWin
            ? `You collected the most books and won the game!`
            : `${winner?.name} collected the most books and won!`
          }
        </Text>
        <Text style={styles.scoreText}>
          Final Books: {myPlayer.books.length}
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
        <Text style={styles.title}>Go Fish</Text>
        <TouchableOpacity style={styles.exitButton} onPress={onExit}>
          <Text style={styles.exitText}>Exit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.turnInfo}>
        <Text style={styles.turnText}>
          {isMyTurn ? '🎣 Your Turn' : `${currentPlayer.name}'s Turn`}
        </Text>
        <Text style={styles.deckText}>Deck: {gameState.deck.length}</Text>
      </View>

      <View style={styles.booksContainer}>
        <Text style={styles.booksLabel}>Books</Text>
        <View style={styles.booksRow}>
          {gameState.players.map((player) => (
            <View key={player.id} style={styles.playerBooks}>
              <Text style={styles.playerBooksText}>
                {player.name}: {player.books.length}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.opponentsContainer}>
        {otherPlayers.map((player) => (
          <View key={player.id} style={styles.opponentRow}>
            <Text style={styles.opponentName}>{player.name}</Text>
            <Text style={styles.opponentCards}>{player.hand.length} cards</Text>
          </View>
        ))}
      </View>

      <View style={styles.handContainer}>
        <Text style={styles.handLabel}>Your Hand ({myPlayer.hand.length} cards)</Text>
        <View style={styles.hand}>
          {myPlayer.hand.map((card, index) => {
            // Scale cards based on hand size
            const cardScale = myPlayer.hand.length > 13 ? 0.4 : myPlayer.hand.length > 9 ? 0.5 : 0.6;
            return (
              <TouchableOpacity
                key={card.id}
                onPress={() => handleCardClick(card)}
                style={[
                  styles.cardWrapper,
                  selectedRank === card.rank && styles.selectedCard,
                  { zIndex: index },
                ]}
              >
                <CardComponent card={card} scale={cardScale} />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {isMyTurn && selectedRank && (
        <TouchableOpacity
          style={styles.askButton}
          onPress={() => setShowPlayerSelect(true)}
        >
          <Text style={styles.askButtonText}>
            Ask for {getRankName(selectedRank)}s
          </Text>
        </TouchableOpacity>
      )}

      <Text style={styles.lastAction}>{gameState.lastAction}</Text>

      {/* Player Selection Modal */}
      <Modal visible={showPlayerSelect} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ask which player?</Text>
            {otherPlayers.map((player) => (
              <TouchableOpacity
                key={player.id}
                style={styles.modalButton}
                onPress={() => handleAskForCards(player.id)}
              >
                <Text style={styles.modalButtonText}>{player.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowPlayerSelect(false)}
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
    backgroundColor: '#1E3A5F',
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
    color: '#60A5FA',
  },
  exitButton: {
    backgroundColor: '#DC143C',
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
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  turnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deckText: {
    color: '#60A5FA',
    fontSize: 16,
  },
  booksContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  booksLabel: {
    color: '#60A5FA',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  booksRow: {
    flexDirection: 'row',
    gap: 12,
  },
  playerBooks: {
    flex: 1,
  },
  playerBooksText: {
    color: 'white',
    fontSize: 14,
  },
  opponentsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  opponentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  opponentName: {
    color: 'white',
    fontSize: 14,
  },
  opponentCards: {
    color: '#60A5FA',
    fontSize: 14,
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
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 2,
    marginLeft: -20,
  },
  cardWrapper: {
    marginLeft: 20,
    marginVertical: 4,
  },
  selectedCard: {
    transform: [{ translateY: -10 }],
    borderWidth: 2,
    borderColor: '#60A5FA',
    borderRadius: 8,
  },
  askButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  askButtonText: {
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#60A5FA',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  modalButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
  gameOverText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#60A5FA',
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
    color: '#60A5FA',
    textAlign: 'center',
    marginBottom: 40,
  },
  exitButtonLarge: {
    backgroundColor: '#3B82F6',
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
