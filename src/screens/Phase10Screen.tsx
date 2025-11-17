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
import { Phase10GameState, Phase10Player, PHASE_DESCRIPTIONS, PHASE_REQUIREMENTS } from '../types/phase10';
import { Card } from '../types/game';
import { validatePhase, calculateScore } from '../utils/phase10Logic';
import { createDeck, shuffleDeck } from '../utils/cardUtils';
import { database } from '../config/firebase';
import { ref, onValue, off, update, get } from 'firebase/database';

interface Phase10ScreenProps {
  gameId: string;
  playerId: string;
  onExit: () => void;
}

export const Phase10Screen: React.FC<Phase10ScreenProps> = ({ gameId, playerId, onExit }) => {
  const [gameState, setGameState] = useState<Phase10GameState | null>(null);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [isLayingDown, setIsLayingDown] = useState(false);

  // Firebase listener for real-time game state
  useEffect(() => {
    // Check if this is a local game
    if (gameId.startsWith('local_')) {
      // Initialize local game
      initializeLocalGame();
      return;
    }

    // Firebase multiplayer game
    if (!database) {
      Alert.alert('Error', 'Firebase not initialized');
      return;
    }

    const gameRef = ref(database, `phase10Games/${gameId}`);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        setGameState(snapshot.val());
      }
    });

    return () => off(gameRef);
  }, [gameId]);

  const initializeLocalGame = () => {
    const deck = shuffleDeck(createDeck());

    // Deal 10 cards to each player
    const player1Hand = deck.splice(0, 10);
    const player2Hand = deck.splice(0, 10);

    // Start discard pile
    const discardPile = [deck.pop()!];

    const localGame: Phase10GameState = {
      id: gameId,
      players: [
        {
          id: playerId,
          name: 'You',
          deck: [],
          hand: player1Hand,
          currentPhase: 1,
          hasLaidDownPhase: false,
          score: 0,
        },
        {
          id: 'ai_player',
          name: 'AI',
          deck: [],
          hand: player2Hand,
          currentPhase: 1,
          hasLaidDownPhase: false,
          score: 0,
        },
      ],
      currentPlayerIndex: 0,
      deck,
      discardPile,
      gameStatus: 'playing',
      lastAction: 'Game started',
      lastActionTime: Date.now(),
      winner: null,
      mustDraw: true,
      laidDownPhases: {},
    };

    setGameState(localGame);
  };

  // Firebase: Handle drawing from deck
  const handleDrawFromDeck = async () => {
    if (!gameState || gameState.gameStatus !== 'playing') return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== playerId) {
      Alert.alert('Not your turn!');
      return;
    }

    if (!gameState.mustDraw) {
      Alert.alert('You must discard a card first');
      return;
    }

    if (gameState.deck.length === 0) {
      Alert.alert('Deck is empty');
      return;
    }

    const newDeck = [...gameState.deck];
    const drawnCard = newDeck.pop()!;
    const newHand = [...currentPlayer.hand, drawnCard];

    const updates: Partial<Phase10GameState> = {
      deck: newDeck,
      players: gameState.players.map((p, idx) =>
        idx === gameState.currentPlayerIndex ? { ...p, hand: newHand } : p
      ),
      mustDraw: false,
      lastAction: `${currentPlayer.name} drew from deck`,
      lastActionTime: Date.now(),
    };

    if (gameId.startsWith('local_')) {
      setGameState({ ...gameState, ...updates });
    } else {
      await updateGameState(updates);
    }
  };

  // Firebase: Handle drawing from discard pile
  const handleDrawFromDiscard = async () => {
    if (!gameState || gameState.gameStatus !== 'playing') return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== playerId) {
      Alert.alert('Not your turn!');
      return;
    }

    if (!gameState.mustDraw) {
      Alert.alert('You must discard a card first');
      return;
    }

    if (gameState.discardPile.length === 0) {
      Alert.alert('Discard pile is empty');
      return;
    }

    const newDiscardPile = [...gameState.discardPile];
    const drawnCard = newDiscardPile.pop()!;
    const newHand = [...currentPlayer.hand, drawnCard];

    const updates: Partial<Phase10GameState> = {
      discardPile: newDiscardPile,
      players: gameState.players.map((p, idx) =>
        idx === gameState.currentPlayerIndex ? { ...p, hand: newHand } : p
      ),
      mustDraw: false,
      lastAction: `${currentPlayer.name} drew from discard`,
      lastActionTime: Date.now(),
    };

    if (gameId.startsWith('local_')) {
      setGameState({ ...gameState, ...updates });
    } else {
      await updateGameState(updates);
    }
  };

  // Firebase: Handle discarding a card
  const handleCardClick = async (card: Card) => {
    if (!gameState || gameState.gameStatus !== 'playing') return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== playerId) return;

    if (gameState.mustDraw) {
      // Select cards for laying down phase
      toggleCardSelection(card);
      return;
    }

    // Discard the card
    const newHand = currentPlayer.hand.filter(c => c.id !== card.id);
    const newDiscardPile = [...gameState.discardPile, card];

    // Check if player won
    const playerWon = newHand.length === 0 && currentPlayer.hasLaidDownPhase;

    const nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;

    const updates: Partial<Phase10GameState> = {
      discardPile: newDiscardPile,
      players: gameState.players.map((p, idx) =>
        idx === gameState.currentPlayerIndex ? { ...p, hand: newHand } : p
      ),
      currentPlayerIndex: playerWon ? gameState.currentPlayerIndex : nextPlayerIndex,
      mustDraw: true,
      lastAction: `${currentPlayer.name} discarded ${card.rank}`,
      lastActionTime: Date.now(),
      gameStatus: playerWon ? 'finished' : 'playing',
      winner: playerWon ? currentPlayer.id : null,
    };

    if (gameId.startsWith('local_')) {
      setGameState({ ...gameState, ...updates });
    } else {
      await updateGameState(updates);
    }
  };

  // Firebase: Lay down phase
  const handleLayDownPhase = async () => {
    if (!gameState) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== playerId) return;

    if (currentPlayer.hasLaidDownPhase) {
      Alert.alert('You have already laid down your phase');
      return;
    }

    // This is a simplified version - in a real game, you'd need UI to specify sets vs runs
    const sets: Card[][] = [selectedCards];
    const runs: Card[][] = [];

    const isValid = validatePhase(currentPlayer.currentPhase, sets, runs);

    if (!isValid) {
      Alert.alert('Invalid phase', 'The selected cards do not match the current phase requirements');
      return;
    }

    const newHand = currentPlayer.hand.filter(c => !selectedCards.some(sc => sc.id === c.id));

    const updates: Partial<Phase10GameState> = {
      players: gameState.players.map((p, idx) =>
        idx === gameState.currentPlayerIndex
          ? { ...p, hand: newHand, hasLaidDownPhase: true }
          : p
      ),
      laidDownPhases: {
        ...gameState.laidDownPhases,
        [currentPlayer.id]: { sets, runs },
      },
      lastAction: `${currentPlayer.name} laid down phase ${currentPlayer.currentPhase}`,
      lastActionTime: Date.now(),
    };

    setSelectedCards([]);
    setIsLayingDown(false);

    if (gameId.startsWith('local_')) {
      setGameState({ ...gameState, ...updates });
    } else {
      await updateGameState(updates);
    }
  };

  const updateGameState = async (updates: Partial<Phase10GameState>) => {
    if (!database) return;
    const gameRef = ref(database, `phase10Games/${gameId}`);
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

  const phaseRequirement = PHASE_REQUIREMENTS[myPlayer.currentPhase];
  const phaseDescription = PHASE_DESCRIPTIONS[phaseRequirement];

  // Show victory screen when game is finished
  if (gameState.gameStatus === 'finished') {
    const didIWin = gameState.winner === playerId;
    const winner = gameState.players.find(p => p.id === gameState.winner);
    return (
      <View style={styles.container}>
        <Text style={styles.gameOverText}>
          {didIWin ? '🎯 PHASE 10 CHAMPION! 🎯' : '😔 So Close! 😔'}
        </Text>
        <Text style={styles.victoryMessage}>
          {didIWin
            ? 'You completed all 10 phases! Outstanding!'
            : `${winner?.name} completed all phases first!`
          }
        </Text>
        <Text style={styles.scoreText}>
          Your Phase: {myPlayer.currentPhase}/10
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
        <Text style={styles.title}>Phase 10</Text>
        <TouchableOpacity style={styles.exitButton} onPress={onExit}>
          <Text style={styles.exitText}>Exit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.phaseInfo}>
        <Text style={styles.phaseText}>
          Current Phase {myPlayer.currentPhase}: {phaseDescription}
        </Text>
        <Text style={styles.turnText}>
          {isMyTurn ? "Your Turn" : `${currentPlayer.name}'s Turn`}
        </Text>
      </View>

      <View style={styles.pileContainer}>
        <TouchableOpacity
          style={styles.pile}
          onPress={handleDrawFromDeck}
          disabled={!isMyTurn || !gameState.mustDraw}
        >
          <Text style={styles.pileLabel}>Deck ({gameState.deck.length})</Text>
          {gameState.deck.length > 0 && (
            <CardComponent card={gameState.deck[gameState.deck.length - 1]} scale={0.5} faceDown />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.pile}
          onPress={handleDrawFromDiscard}
          disabled={!isMyTurn || !gameState.mustDraw}
        >
          <Text style={styles.pileLabel}>Discard</Text>
          {gameState.discardPile.length > 0 && (
            <CardComponent card={gameState.discardPile[gameState.discardPile.length - 1]} scale={0.5} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.handContainer}>
        <Text style={styles.handLabel}>Your Hand ({myPlayer.hand.length} cards)</Text>
        <View style={styles.hand}>
          {myPlayer.hand.map((card, index) => {
            // Scale cards based on hand size for Phase 10 (can have many cards)
            const cardScale = myPlayer.hand.length > 15 ? 0.35 : myPlayer.hand.length > 12 ? 0.45 : myPlayer.hand.length > 8 ? 0.5 : 0.6;
            return (
              <TouchableOpacity
                key={card.id}
                onPress={() => handleCardClick(card)}
                style={[
                  styles.cardWrapper,
                  selectedCards.some(c => c.id === card.id) && styles.selectedCard,
                  { zIndex: index },
                ]}
              >
                <CardComponent card={card} scale={cardScale} />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {!myPlayer.hasLaidDownPhase && selectedCards.length > 0 && (
        <TouchableOpacity style={styles.layDownButton} onPress={handleLayDownPhase}>
          <Text style={styles.layDownText}>Lay Down Phase ({selectedCards.length} cards)</Text>
        </TouchableOpacity>
      )}

      <View style={styles.playersInfo}>
        {gameState.players.map((player, idx) => (
          <View key={player.id} style={styles.playerRow}>
            <Text style={styles.playerName}>
              {player.name} - Phase {player.currentPhase}
            </Text>
            <Text style={styles.playerCards}>{player.hand.length} cards</Text>
            {player.hasLaidDownPhase && <Text style={styles.laidDown}>✓ Laid Down</Text>}
          </View>
        ))}
      </View>

      <Text style={styles.lastAction}>{gameState.lastAction}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a472a',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
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
  phaseInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  phaseText: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  turnText: {
    fontSize: 14,
    color: 'white',
  },
  pileContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  pile: {
    alignItems: 'center',
  },
  pileLabel: {
    color: 'white',
    fontSize: 14,
    marginBottom: 8,
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
    marginLeft: -15,
  },
  cardWrapper: {
    marginLeft: 15,
    marginVertical: 3,
  },
  selectedCard: {
    transform: [{ translateY: -10 }],
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 8,
  },
  layDownButton: {
    backgroundColor: '#228B22',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  layDownText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  playersInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  playerName: {
    color: 'white',
    fontSize: 14,
  },
  playerCards: {
    color: '#FFD700',
    fontSize: 14,
  },
  laidDown: {
    color: '#90EE90',
    fontSize: 14,
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
    color: '#FFD700',
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
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 40,
  },
  exitButtonLarge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignSelf: 'center',
  },
  exitTextLarge: {
    color: '#1F2937',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
