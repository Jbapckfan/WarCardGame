import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Phase10GameState, Phase10Card, PHASES } from '../types/phase10';
import {
  createPhase10Deck,
  shufflePhase10Deck,
  dealPhase10Cards,
  drawCards,
  reshuffleDiscardPile,
  calculatePhase10Score,
  checkRoundWinner,
  getCurrentPhase,
} from '../utils/phase10Logic';

interface Phase10ScreenProps {
  gameId: string;
  playerId: string;
  onExit: () => void;
}

export const Phase10Screen: React.FC<Phase10ScreenProps> = ({ gameId, playerId, onExit }) => {
  const [gameState, setGameState] = useState<Phase10GameState | null>(null);
  const [selectedCards, setSelectedCards] = useState<Phase10Card[]>([]);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    // Initialize local game
    const deck = shufflePhase10Deck(createPhase10Deck());
    const { player1Hand, player2Hand, remaining } = dealPhase10Cards(deck);

    const firstCard = remaining[0];
    const drawPile = remaining.slice(1);

    const initialState: Phase10GameState = {
      id: gameId,
      player1: {
        id: playerId,
        name: 'You',
        hand: player1Hand,
        currentPhase: 1,
        completedPhase: false,
        laidDownCards: [],
        score: 0,
      },
      player2: {
        id: 'ai_player',
        name: 'AI',
        hand: player2Hand,
        currentPhase: 1,
        completedPhase: false,
        laidDownCards: [],
        score: 0,
      },
      currentTurn: playerId,
      gameStatus: 'playing',
      discardPile: [firstCard],
      drawPile,
      lastAction: 'Game started! Complete your phase and empty your hand.',
      lastActionTime: Date.now(),
      winner: null,
      roundNumber: 1,
    };

    setGameState(initialState);
  }, [gameId, playerId]);

  useEffect(() => {
    if (!gameState) return;

    // Check for round winner
    const winnerId = checkRoundWinner(gameState);
    if (winnerId && gameState.gameStatus === 'playing') {
      endRound(winnerId);
      return;
    }

    // AI turn
    if (gameState.currentTurn === 'ai_player' && gameState.gameStatus === 'playing') {
      setTimeout(() => playAITurn(), 1500);
    }
  }, [gameState?.currentTurn]);

  const playAITurn = () => {
    if (!gameState || !gameState.player2) return;

    // AI simply draws and discards randomly (simplified AI)
    const { drawnCards, remainingPile } = drawCards(gameState.drawPile, 1);

    if (drawnCards.length === 0) {
      // Reshuffle needed
      const reshuffled = reshuffleDiscardPile(gameState.discardPile, gameState.drawPile);
      const { drawnCards: newDrawn } = drawCards(reshuffled.newDrawPile, 1);

      const newHand = [...gameState.player2.hand, ...newDrawn];
      const cardToDiscard = newHand[Math.floor(Math.random() * newHand.length)];
      const finalHand = newHand.filter(c => c.id !== cardToDiscard.id);

      setGameState({
        ...gameState,
        player2: { ...gameState.player2, hand: finalHand },
        drawPile: reshuffled.newDrawPile.slice(1),
        discardPile: [...reshuffled.newDiscardPile, cardToDiscard],
        currentTurn: playerId,
        lastAction: `AI drew and discarded ${cardToDiscard.value}`,
        lastActionTime: Date.now(),
      });
      return;
    }

    const newHand = [...gameState.player2.hand, ...drawnCards];
    const cardToDiscard = newHand[Math.floor(Math.random() * newHand.length)];
    const finalHand = newHand.filter(c => c.id !== cardToDiscard.id);

    setGameState({
      ...gameState,
      player2: { ...gameState.player2, hand: finalHand },
      drawPile: remainingPile,
      discardPile: [...gameState.discardPile, cardToDiscard],
      currentTurn: playerId,
      lastAction: `AI drew and discarded ${cardToDiscard.value}`,
      lastActionTime: Date.now(),
    });
  };

  const handleDrawFromDeck = () => {
    if (!gameState || gameState.currentTurn !== playerId || hasDrawn) return;

    let { drawPile, discardPile } = gameState;

    if (drawPile.length === 0) {
      const reshuffled = reshuffleDiscardPile(discardPile, drawPile);
      drawPile = reshuffled.newDrawPile;
      discardPile = reshuffled.newDiscardPile;
    }

    const { drawnCards, remainingPile } = drawCards(drawPile, 1);

    if (drawnCards.length === 0) {
      Alert.alert('Error', 'No cards to draw!');
      return;
    }

    const newHand = [...gameState.player1.hand, ...drawnCards];

    setGameState({
      ...gameState,
      player1: { ...gameState.player1, hand: newHand },
      drawPile: remainingPile,
      discardPile,
      lastAction: 'Drew from deck',
      lastActionTime: Date.now(),
    });
    setHasDrawn(true);
  };

  const handleDrawFromDiscard = () => {
    if (!gameState || gameState.currentTurn !== playerId || hasDrawn) return;

    if (gameState.discardPile.length === 0) {
      Alert.alert('Error', 'No cards in discard pile!');
      return;
    }

    const topCard = gameState.discardPile[gameState.discardPile.length - 1];
    const newDiscardPile = gameState.discardPile.slice(0, -1);
    const newHand = [...gameState.player1.hand, topCard];

    setGameState({
      ...gameState,
      player1: { ...gameState.player1, hand: newHand },
      discardPile: newDiscardPile,
      lastAction: `Drew ${topCard.value} from discard`,
      lastActionTime: Date.now(),
    });
    setHasDrawn(true);
  };

  const handleCardSelect = (card: Phase10Card) => {
    if (!hasDrawn) {
      Alert.alert('Draw First', 'You must draw a card before discarding!');
      return;
    }

    // Discard the card and end turn
    const newHand = gameState!.player1.hand.filter(c => c.id !== card.id);
    const newDiscardPile = [...gameState!.discardPile, card];

    setGameState({
      ...gameState!,
      player1: { ...gameState!.player1, hand: newHand },
      discardPile: newDiscardPile,
      currentTurn: gameState!.player2!.id,
      lastAction: `Discarded ${card.value}`,
      lastActionTime: Date.now(),
    });
    setHasDrawn(false);
  };

  const endRound = (winnerId: string) => {
    if (!gameState) return;

    const loser = winnerId === gameState.player1.id ? gameState.player2! : gameState.player1;
    const winner = winnerId === gameState.player1.id ? gameState.player1 : gameState.player2!;

    const loserScore = calculatePhase10Score(loser.hand);
    const winnerName = winner.name;
    const loserName = loser.name;

    Alert.alert(
      'Round Over!',
      `${winnerName} went out!\n${loserName} scored ${loserScore} points.`,
      [
        {
          text: 'Next Round',
          onPress: () => startNextRound(winnerId, loserScore),
        },
      ]
    );
  };

  const startNextRound = (winnerId: string, loserScore: number) => {
    if (!gameState) return;

    // Update scores and phases
    const player1CompletedPhase = winnerId === gameState.player1.id;
    const player2CompletedPhase = winnerId === gameState.player2!.id;

    const newPlayer1 = {
      ...gameState.player1,
      currentPhase: player1CompletedPhase ? gameState.player1.currentPhase + 1 : gameState.player1.currentPhase,
      score: gameState.player1.score + (winnerId === gameState.player2!.id ? loserScore : 0),
      completedPhase: false,
      laidDownCards: [],
    };

    const newPlayer2 = {
      ...gameState.player2!,
      currentPhase: player2CompletedPhase ? gameState.player2!.currentPhase + 1 : gameState.player2!.currentPhase,
      score: gameState.player2!.score + (winnerId === gameState.player1.id ? loserScore : 0),
      completedPhase: false,
      laidDownCards: [],
    };

    // Check if someone completed Phase 10
    if (newPlayer1.currentPhase > 10) {
      Alert.alert('Game Over!', `${newPlayer1.name} completed all 10 phases and wins!`, [
        { text: 'OK', onPress: onExit },
      ]);
      return;
    }

    if (newPlayer2.currentPhase > 10) {
      Alert.alert('Game Over!', `${newPlayer2.name} completed all 10 phases and wins!`, [
        { text: 'OK', onPress: onExit },
      ]);
      return;
    }

    // Deal new hands
    const deck = shufflePhase10Deck(createPhase10Deck());
    const { player1Hand, player2Hand, remaining } = dealPhase10Cards(deck);

    const firstCard = remaining[0];
    const drawPile = remaining.slice(1);

    setGameState({
      ...gameState,
      player1: { ...newPlayer1, hand: player1Hand },
      player2: { ...newPlayer2, hand: player2Hand },
      drawPile,
      discardPile: [firstCard],
      currentTurn: playerId,
      roundNumber: gameState.roundNumber + 1,
      lastAction: `Round ${gameState.roundNumber + 1} started!`,
      lastActionTime: Date.now(),
    });
    setHasDrawn(false);
  };

  if (!gameState) {
    return (
      <View style={styles.container}>
        <Text style={styles.waitingText}>Loading...</Text>
      </View>
    );
  }

  const isMyTurn = gameState.currentTurn === playerId;
  const currentPlayer = gameState.player1;
  const opponent = gameState.player2!;
  const topCard = gameState.discardPile.length > 0 ? gameState.discardPile[gameState.discardPile.length - 1] : null;
  const currentPhase = getCurrentPhase(currentPlayer.currentPhase);
  const opponentPhase = getCurrentPhase(opponent.currentPhase);

  const getCardColor = (card: Phase10Card): string => {
    switch (card.color) {
      case 'red': return '#EF4444';
      case 'blue': return '#3B82F6';
      case 'green': return '#10B981';
      case 'yellow': return '#F59E0B';
      case 'wild': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  return (
    <LinearGradient colors={['#0F172A', '#1E293B', '#334155']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.exitButton} onPress={onExit}>
          <Text style={styles.exitButtonText}>Exit</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Phase 10</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Scores and Phases */}
      <View style={styles.scoresSection}>
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{currentPlayer.name}</Text>
          <Text style={styles.phaseText}>Phase {currentPlayer.currentPhase}</Text>
          <Text style={styles.scoreText}>Score: {currentPlayer.score}</Text>
        </View>
        <View style={styles.roundInfo}>
          <Text style={styles.roundText}>Round {gameState.roundNumber}</Text>
        </View>
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{opponent.name}</Text>
          <Text style={styles.phaseText}>Phase {opponent.currentPhase}</Text>
          <Text style={styles.scoreText}>Score: {opponent.score}</Text>
        </View>
      </View>

      {/* Current Phase Objective */}
      <View style={styles.phaseObjective}>
        <Text style={styles.objectiveTitle}>Your Phase:</Text>
        <Text style={styles.objectiveText}>{currentPhase.description}</Text>
      </View>

      {/* Center Play Area */}
      <View style={styles.centerArea}>
        {/* Draw Pile */}
        <TouchableOpacity
          style={[styles.cardPile, { backgroundColor: '#1F2937' }]}
          onPress={handleDrawFromDeck}
          disabled={!isMyTurn || hasDrawn || gameState.gameStatus !== 'playing'}
        >
          <Text style={styles.pileText}>DRAW</Text>
          <Text style={styles.pileCount}>{gameState.drawPile.length}</Text>
        </TouchableOpacity>

        {/* Discard Pile */}
        <TouchableOpacity
          style={[styles.cardPile, topCard ? { backgroundColor: getCardColor(topCard) } : { backgroundColor: '#374151' }]}
          onPress={handleDrawFromDiscard}
          disabled={!isMyTurn || hasDrawn || !topCard || gameState.gameStatus !== 'playing'}
        >
          {topCard ? (
            <>
              <Text style={styles.cardValue}>{topCard.value.toUpperCase()}</Text>
              <Text style={styles.cardColor}>{topCard.color}</Text>
            </>
          ) : (
            <Text style={styles.pileText}>DISCARD</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Game Status */}
      <View style={styles.statusSection}>
        <Text style={styles.statusText}>
          {isMyTurn ? (hasDrawn ? '🟢 Discard a card' : '🟢 Draw a card') : '🔴 Opponent\'s Turn'}
        </Text>
        <Text style={styles.actionText}>{gameState.lastAction}</Text>
      </View>

      {/* Player Hand */}
      <View style={styles.handSection}>
        <Text style={styles.handTitle}>Your Hand ({currentPlayer.hand.length})</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hand}>
          {currentPlayer.hand.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.handCard,
                { backgroundColor: getCardColor(card) },
                !hasDrawn && styles.unplayableCard,
              ]}
              onPress={() => handleCardSelect(card)}
              disabled={!isMyTurn || !hasDrawn || gameState.gameStatus !== 'playing'}
            >
              <Text style={styles.handCardText}>{card.value.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Phase Completion Info */}
      <View style={styles.infoSection}>
        <Text style={styles.infoText}>
          ℹ️ Phase 10 is simplified for mobile. Complete your phase, then empty your hand to win the round!
        </Text>
      </View>
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
  },
  exitButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 60,
  },
  scoresSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  playerInfo: {
    alignItems: 'center',
    flex: 1,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  phaseText: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 2,
    fontWeight: '600',
  },
  scoreText: {
    fontSize: 12,
    color: '#D1D5DB',
    marginTop: 2,
  },
  roundInfo: {
    alignItems: 'center',
  },
  roundText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  phaseObjective: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  objectiveTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  objectiveText: {
    fontSize: 16,
    color: '#C4B5FD',
    marginTop: 4,
  },
  centerArea: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingVertical: 20,
  },
  cardPile: {
    width: 100,
    height: 140,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  pileText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pileCount: {
    color: '#D1D5DB',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  cardValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  cardColor: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 4,
  },
  statusSection: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionText: {
    fontSize: 14,
    color: '#D1D5DB',
    marginTop: 4,
  },
  handSection: {
    flex: 1,
    paddingTop: 12,
  },
  handTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  hand: {
    paddingHorizontal: 16,
  },
  handCard: {
    width: 70,
    height: 100,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  unplayableCard: {
    opacity: 0.5,
  },
  handCardText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  waitingText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
});
