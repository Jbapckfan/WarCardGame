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
import { KingsGameState, KingsCard } from '../types/kingsCorners';
import {
  dealKingsGame,
  canPlaceCard,
  canMovePile,
  checkWinner,
} from '../utils/kingsCornersLogic';
import { saveGame } from '../utils/gameSaveService';
import { CardComponent } from '../components/CardComponent';
import { Card } from '../types/game';

interface KingsCornersScreenProps {
  gameId: string;
  playerId: string;
  playerCount?: number;
  resumeState?: KingsGameState;
  onExit: () => void;
}

export const KingsCornersScreen: React.FC<KingsCornersScreenProps> = ({
  gameId,
  playerId,
  playerCount = 2,
  resumeState,
  onExit,
}) => {
  const [gameState, setGameState] = useState<KingsGameState | null>(resumeState || null);
  const [selectedCard, setSelectedCard] = useState<KingsCard | null>(null);
  const [selectedPile, setSelectedPile] = useState<string | null>(null);

  const handleExitWithSave = async () => {
    if (gameState && gameState.gameStatus === 'playing') {
      await saveGame('kings', gameState, playerCount);
    }
    onExit();
  };

  useEffect(() => {
    // Skip initialization if we're resuming from saved state
    if (resumeState) return;

    // Initialize new game
    const initialState = dealKingsGame(gameId, playerCount);
    setGameState(initialState);
  }, []);

  if (!gameState) {
    return (
      <View style={styles.container}>
        <Text style={styles.waitingText}>Initializing game...</Text>
      </View>
    );
  }

  // Convert KingsCard to Card for CardComponent
  const convertToCard = (kingsCard: KingsCard): Card => ({
    id: kingsCard.id,
    suit: kingsCard.suit,
    rank: kingsCard.value === 'A' ? 14 : kingsCard.value === 'K' ? 13 : kingsCard.value === 'Q' ? 12 : kingsCard.value === 'J' ? 11 : parseInt(kingsCard.value),
  });

  const handleCardClick = (card: KingsCard) => {
    if (selectedCard?.id === card.id) {
      setSelectedCard(null);
    } else {
      setSelectedCard(card);
      setSelectedPile(null);
    }
  };

  const handlePileClick = (pileName: string) => {
    const pile = gameState[pileName as keyof KingsGameState] as KingsCard[];

    // If we have a selected card from hand, try to place it
    if (selectedCard && gameState.currentPlayerHand.find(c => c.id === selectedCard.id)) {
      if (canPlaceCard(selectedCard, pile, pileName)) {
        placedCardOnPile(selectedCard, pileName);
      } else {
        Alert.alert('Invalid Move', 'Cannot place that card on this pile');
      }
      return;
    }

    // If clicking a pile to select it for moving
    if (pile.length > 0) {
      if (selectedPile === pileName) {
        setSelectedPile(null);
      } else {
        setSelectedPile(pileName);
      }
    }
  };

  const placedCardOnPile = (card: KingsCard, pileName: string) => {
    const newHand = gameState.currentPlayerHand.filter(c => c.id !== card.id);
    const pile = gameState[pileName as keyof KingsGameState] as KingsCard[];

    const newState: KingsGameState = {
      ...gameState,
      currentPlayerHand: newHand,
      [pileName]: [...pile, card],
      lastAction: `Played ${card.value}${card.suit[0].toUpperCase()} on ${pileName}`,
      lastActionTime: Date.now(),
      moveCount: gameState.moveCount + 1,
    };

    setGameState(newState);
    setSelectedCard(null);

    // Check for winner
    if (newHand.length === 0) {
      const winnerId = checkWinner(newState);
      if (winnerId !== null) {
        newState.gameStatus = 'finished';
        newState.winner = winnerId;
        setGameState(newState);
        Alert.alert('Game Over!', `Player ${winnerId + 1} wins!`, [
          { text: 'OK', onPress: handleExitWithSave },
        ]);
      }
    }
  };

  const handleDrawCard = () => {
    if (gameState.drawPile.length === 0) {
      Alert.alert('No Cards', 'The draw pile is empty');
      return;
    }

    const drawnCard = gameState.drawPile[0];
    const newState: KingsGameState = {
      ...gameState,
      drawPile: gameState.drawPile.slice(1),
      currentPlayerHand: [...gameState.currentPlayerHand, drawnCard],
      lastAction: 'Drew a card',
      lastActionTime: Date.now(),
    };

    setGameState(newState);
  };

  const handleEndTurn = () => {
    const nextTurn = (gameState.currentTurn + 1) % gameState.playerCount;
    const newState: KingsGameState = {
      ...gameState,
      currentTurn: nextTurn,
      lastAction: `Player ${nextTurn + 1}'s turn`,
      lastActionTime: Date.now(),
    };

    setGameState(newState);
    setSelectedCard(null);
    setSelectedPile(null);
  };

  const renderPile = (pileName: string, cards: KingsCard[], label: string, isCorner: boolean = false) => {
    const topCard = cards.length > 0 ? cards[cards.length - 1] : null;
    const isSelected = selectedPile === pileName;

    return (
      <TouchableOpacity
        key={pileName}
        style={[
          styles.pileContainer,
          isCorner && styles.cornerPile,
          isSelected && styles.pileSelected,
        ]}
        onPress={() => handlePileClick(pileName)}
      >
        <Text style={styles.pileLabel}>{label}</Text>
        {topCard ? (
          <CardComponent card={convertToCard(topCard)} scale={0.6} />
        ) : (
          <View style={[styles.emptyPile, isCorner && styles.emptyCornerPile]}>
            <Text style={styles.emptyPileText}>
              {isCorner ? 'K only' : 'Empty'}
            </Text>
          </View>
        )}
        <Text style={styles.pileCount}>{cards.length}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={['#134E4A', '#065F46', '#047857']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.exitButton} onPress={handleExitWithSave}>
          <Text style={styles.exitButtonText}>Exit</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Kings in the Corners</Text>
          <Text style={styles.subtitle}>Player {gameState.currentTurn + 1}'s Turn</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Game Board */}
      <View style={styles.board}>
        {/* Top Row */}
        <View style={styles.row}>
          {renderPile('cornerNW', gameState.cornerNW, 'NW', true)}
          {renderPile('sideN', gameState.sideN, 'N')}
          {renderPile('cornerNE', gameState.cornerNE, 'NE', true)}
        </View>

        {/* Middle Row */}
        <View style={styles.row}>
          {renderPile('sideW', gameState.sideW, 'W')}

          {/* Draw Pile */}
          <View style={styles.centerArea}>
            <TouchableOpacity
              style={styles.drawPile}
              onPress={handleDrawCard}
              disabled={gameState.drawPile.length === 0}
            >
              <Text style={styles.drawPileText}>Draw</Text>
              <Text style={styles.drawPileCount}>{gameState.drawPile.length}</Text>
            </TouchableOpacity>
          </View>

          {renderPile('sideE', gameState.sideE, 'E')}
        </View>

        {/* Bottom Row */}
        <View style={styles.row}>
          {renderPile('cornerSW', gameState.cornerSW, 'SW', true)}
          {renderPile('sideS', gameState.sideS, 'S')}
          {renderPile('cornerSE', gameState.cornerSE, 'SE', true)}
        </View>
      </View>

      {/* Player Hand */}
      <View style={styles.handSection}>
        <Text style={styles.handTitle}>Your Hand ({gameState.currentPlayerHand.length} cards)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.hand}>
            {gameState.currentPlayerHand.map((card) => (
              <TouchableOpacity
                key={card.id}
                onPress={() => handleCardClick(card)}
                style={[
                  styles.handCardContainer,
                  selectedCard?.id === card.id && styles.handCardSelected,
                ]}
              >
                <CardComponent card={convertToCard(card)} scale={0.7} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.endTurnButton}
          onPress={handleEndTurn}
        >
          <Text style={styles.endTurnButtonText}>End Turn</Text>
        </TouchableOpacity>
      </View>

      {/* Game Info */}
      <View style={styles.infoBar}>
        <Text style={styles.infoText}>{gameState.lastAction}</Text>
        <Text style={styles.infoText}>Moves: {gameState.moveCount}</Text>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#D1FAE5',
    marginTop: 4,
  },
  placeholder: {
    width: 70,
  },
  board: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 8,
  },
  pileContainer: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 90,
  },
  cornerPile: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
  },
  pileSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.4)',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  pileLabel: {
    fontSize: 12,
    color: '#D1FAE5',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  pileCount: {
    fontSize: 11,
    color: '#A7F3D0',
    marginTop: 4,
  },
  emptyPile: {
    width: 60,
    height: 85,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#6EE7B7',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCornerPile: {
    borderColor: '#FCD34D',
  },
  emptyPileText: {
    fontSize: 11,
    color: '#A7F3D0',
  },
  centerArea: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawPile: {
    width: 80,
    height: 100,
    backgroundColor: '#065F46',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawPileText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  drawPileCount: {
    fontSize: 14,
    color: '#D1FAE5',
    marginTop: 4,
  },
  handSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingVertical: 12,
    paddingHorizontal: 8,
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
    padding: 2,
  },
  handCardSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.4)',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 12,
    gap: 12,
  },
  endTurnButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    minWidth: 150,
  },
  endTurnButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  infoText: {
    fontSize: 12,
    color: '#D1FAE5',
  },
  waitingText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 100,
  },
});
