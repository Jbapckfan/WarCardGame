import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HeartsGameState } from '../types/hearts';
import {
  dealHeartsGame,
  playCard,
  startNewRound,
  canPlayCard,
} from '../utils/heartsLogic';
import { saveGame } from '../utils/gameSaveService';
import { CardComponent } from '../components/CardComponent';
import { Card } from '../types/game';

interface HeartsScreenProps {
  gameId: string;
  playerId: string;
  resumeState?: HeartsGameState;
  onExit: () => void;
}

export const HeartsScreen: React.FC<HeartsScreenProps> = ({
  gameId,
  playerId,
  resumeState,
  onExit,
}) => {
  const [gameState, setGameState] = useState<HeartsGameState | null>(resumeState || null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const handleExitWithSave = async () => {
    if (gameState && gameState.gameStatus === 'playing') {
      await saveGame('custom', gameState, 4);
    }
    onExit();
  };

  useEffect(() => {
    if (resumeState) return;

    const playerNames = ['You', 'Player 2', 'Player 3', 'Player 4'];
    const initialState = dealHeartsGame(gameId, playerNames);
    setGameState(initialState);
  }, []);

  if (!gameState) {
    return (
      <View style={styles.container}>
        <Text style={styles.waitingText}>Initializing game...</Text>
      </View>
    );
  }

  const currentPlayer = gameState.players[gameState.currentTurn];
  const humanPlayer = gameState.players[0]; // Player 1 is human
  const isMyTurn = gameState.currentTurn === 0;

  const handleCardClick = (card: Card) => {
    if (!isMyTurn) return;

    const validation = canPlayCard(gameState, humanPlayer, card);
    if (!validation.valid) {
      Alert.alert('Invalid Move', validation.reason);
      return;
    }

    const newState = playCard(gameState, 0, card);
    if (newState) {
      setGameState(newState);
      setSelectedCard(null);

      // Check game state
      if (newState.gameStatus === 'roundEnd') {
        Alert.alert(
          'Round Complete!',
          gameState.players.map((p, i) => `${p.name}: ${p.score} pts (Total: ${p.totalScore})`).join('\n'),
          [
            {
              text: 'Next Round',
              onPress: () => setGameState(startNewRound(newState)),
            },
          ]
        );
      } else if (newState.gameStatus === 'gameEnd') {
        const winner = newState.players[newState.winner!];
        Alert.alert(
          'Game Over!',
          `${winner.name} wins with ${winner.totalScore} points!`,
          [{ text: 'OK', onPress: handleExitWithSave }]
        );
      }
    }
  };

  return (
    <LinearGradient colors={['#7C2D12', '#991B1B', '#B91C1C']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.exitButton} onPress={handleExitWithSave}>
          <Text style={styles.exitButtonText}>Exit</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Hearts</Text>
          <Text style={styles.subtitle}>Round {gameState.roundNumber}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Players Info */}
      <View style={styles.playersSection}>
        {gameState.players.map((player, index) => (
          <View
            key={player.id}
            style={[
              styles.playerCard,
              index === gameState.currentTurn && styles.playerCardActive,
            ]}
          >
            <Text style={styles.playerCardName}>{player.name}</Text>
            <Text style={styles.playerCardInfo}>{player.hand.length} cards</Text>
            <Text style={styles.playerCardScore}>Score: {player.totalScore}</Text>
          </View>
        ))}
      </View>

      {/* Current Trick */}
      <View style={styles.trickSection}>
        <Text style={styles.trickTitle}>Current Trick {gameState.heartsBroken && '💔'}</Text>
        <View style={styles.trick}>
          {gameState.currentTrick.cards.map((play, index) => (
            <View key={index} style={styles.trickCard}>
              <Text style={styles.trickPlayerName}>
                {gameState.players.find(p => p.id === play.playerId)?.name}
              </Text>
              <CardComponent card={play.card} scale={0.6} />
            </View>
          ))}
        </View>
      </View>

      {/* Your Hand */}
      <View style={styles.handSection}>
        <Text style={styles.handTitle}>
          Your Hand ({humanPlayer.hand.length} cards) {isMyTurn ? '- Your Turn' : ''}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.hand}>
            {humanPlayer.hand.map((card) => {
              const validation = canPlayCard(gameState, humanPlayer, card);
              return (
                <TouchableOpacity
                  key={card.id}
                  onPress={() => handleCardClick(card)}
                  disabled={!isMyTurn}
                  style={[
                    styles.handCardContainer,
                    !validation.valid && isMyTurn && styles.invalidCard,
                  ]}
                >
                  <CardComponent card={card} scale={0.7} />
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Info */}
      <View style={styles.infoBar}>
        <Text style={styles.infoText}>{gameState.lastAction}</Text>
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
    color: '#FCA5A5',
    marginTop: 4,
  },
  placeholder: {
    width: 70,
  },
  playersSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  playerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 10,
    minWidth: 100,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  playerCardActive: {
    borderColor: '#FCA5A5',
    backgroundColor: 'rgba(252, 165, 165, 0.2)',
  },
  playerCardName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  playerCardInfo: {
    fontSize: 12,
    color: '#FCA5A5',
    marginTop: 2,
  },
  playerCardScore: {
    fontSize: 12,
    color: '#FEF08A',
    marginTop: 2,
    fontWeight: 'bold',
  },
  trickSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  trickTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  trick: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  trickCard: {
    alignItems: 'center',
  },
  trickPlayerName: {
    fontSize: 11,
    color: '#FCA5A5',
    marginBottom: 4,
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
  invalidCard: {
    opacity: 0.4,
  },
  infoBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  infoText: {
    fontSize: 12,
    color: '#FCA5A5',
    textAlign: 'center',
  },
  waitingText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 100,
  },
});
