import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { UnoGameState, UnoCard, UnoColor } from '../types/uno';
import {
  createUnoDeck,
  shuffleUnoDeck,
  dealUnoCards,
  canPlayCard,
  applyCardEffect,
  drawCards,
  reshuffleDiscardPile,
  checkWinner,
} from '../utils/unoLogic';
import { saveGame } from '../utils/gameSaveService';

interface UnoScreenProps {
  gameId: string;
  playerId: string;
  playerCount?: number;
  resumeState?: UnoGameState;
  onExit: () => void;
}

export const UnoScreen: React.FC<UnoScreenProps> = ({ gameId, playerId, playerCount = 2, resumeState, onExit }) => {
  const [gameState, setGameState] = useState<UnoGameState | null>(resumeState || null);
  const [selectedCard, setSelectedCard] = useState<UnoCard | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showUnoButton, setShowUnoButton] = useState(false);

  const handleExitWithSave = async () => {
    if (gameState && gameState.gameStatus === 'playing') {
      await saveGame('uno', gameState, playerCount);
    }
    onExit();
  };

  useEffect(() => {
    // Skip initialization if we're resuming from saved state
    if (resumeState) return;

    // Initialize local game
    const deck = shuffleUnoDeck(createUnoDeck());
    const { player1Hand, player2Hand, remaining } = dealUnoCards(deck);

    // Get first card for discard pile (not action card)
    let discardIndex = 0;
    while (
      remaining[discardIndex].value === 'wild' ||
      remaining[discardIndex].value === 'wild4' ||
      remaining[discardIndex].value === 'draw2' ||
      remaining[discardIndex].value === 'skip'
    ) {
      discardIndex++;
    }

    const firstCard = remaining[discardIndex];
    const drawPile = remaining.filter((_, i) => i !== discardIndex);

    const initialState: UnoGameState = {
      id: gameId,
      player1: {
        id: playerId,
        name: 'You',
        hand: player1Hand,
      },
      player2: {
        id: 'ai_player',
        name: 'AI',
        hand: player2Hand,
      },
      currentTurn: playerId,
      gameStatus: 'playing',
      direction: 1,
      discardPile: [firstCard],
      drawPile,
      currentColor: firstCard.color,
      lastAction: 'Game started!',
      lastActionTime: Date.now(),
      winner: null,
      mustDraw: 0,
      saidUno: {},
    };

    setGameState(initialState);
  }, [gameId, playerId]);

  useEffect(() => {
    if (!gameState) return;

    // Check if player has 1 card and should show UNO button
    const player = gameState.player1.id === playerId ? gameState.player1 : gameState.player2!;
    setShowUnoButton(player.hand.length === 1 && !gameState.saidUno[playerId]);

    // Check for winner
    const winnerId = checkWinner(gameState);
    if (winnerId && gameState.gameStatus === 'playing') {
      const winnerName = winnerId === gameState.player1.id ? gameState.player1.name : gameState.player2!.name;
      setGameState({ ...gameState, winner: winnerId, gameStatus: 'finished' });
      Alert.alert('Game Over!', `${winnerName} wins!`, [{ text: 'OK', onPress: handleExitWithSave }]);
    }

    // AI turn
    if (gameState.currentTurn === 'ai_player' && gameState.gameStatus === 'playing') {
      setTimeout(() => playAITurn(), 1000);
    }
  }, [gameState]);

  const playAITurn = () => {
    if (!gameState || !gameState.player2) return;

    const topCard = gameState.discardPile[gameState.discardPile.length - 1];
    const aiHand = gameState.player2.hand;

    // Handle must draw
    if (gameState.mustDraw > 0) {
      handleDrawCards('ai_player', gameState.mustDraw);
      return;
    }

    // Find playable cards
    const playableCards = aiHand.filter(card =>
      canPlayCard(card, topCard, gameState.currentColor)
    );

    if (playableCards.length > 0) {
      // Play first playable card
      const cardToPlay = playableCards[0];
      const newHand = aiHand.filter(c => c.id !== cardToPlay.id);

      // Choose color for wild cards
      let chosenColor: UnoColor | undefined;
      if (cardToPlay.value === 'wild' || cardToPlay.value === 'wild4') {
        // Pick most common color in hand
        const colorCounts = { red: 0, blue: 0, green: 0, yellow: 0, wild: 0 };
        newHand.forEach(c => colorCounts[c.color]++);
        chosenColor = (Object.keys(colorCounts) as UnoColor[])
          .filter(c => c !== 'wild')
          .sort((a, b) => colorCounts[b] - colorCounts[a])[0];
      }

      const updates = applyCardEffect(gameState, cardToPlay, chosenColor);

      setGameState({
        ...gameState,
        ...updates,
        player2: { ...gameState.player2, hand: newHand },
      });
    } else {
      // Draw a card
      handleDrawCards('ai_player', 1);
    }
  };

  const handleCardSelect = (card: UnoCard) => {
    if (!gameState || gameState.currentTurn !== playerId || gameState.gameStatus !== 'playing') {
      return;
    }

    if (gameState.mustDraw > 0) {
      Alert.alert('Draw Cards', `You must draw ${gameState.mustDraw} cards first!`);
      return;
    }

    const topCard = gameState.discardPile[gameState.discardPile.length - 1];

    if (!canPlayCard(card, topCard, gameState.currentColor)) {
      Alert.alert('Invalid Play', 'This card cannot be played!');
      return;
    }

    // If wild card, show color picker
    if (card.value === 'wild' || card.value === 'wild4') {
      setSelectedCard(card);
      setShowColorPicker(true);
      return;
    }

    playCard(card);
  };

  const playCard = (card: UnoCard, chosenColor?: UnoColor) => {
    if (!gameState) return;

    const isPlayer1 = gameState.player1.id === playerId;
    const player = isPlayer1 ? gameState.player1 : gameState.player2!;
    const newHand = player.hand.filter(c => c.id !== card.id);

    const updates = applyCardEffect(gameState, card, chosenColor);

    const newState = {
      ...gameState,
      ...updates,
      [isPlayer1 ? 'player1' : 'player2']: { ...player, hand: newHand },
    };

    setGameState(newState);
    setShowColorPicker(false);
    setSelectedCard(null);
  };

  const handleDrawCards = (targetPlayerId: string, count: number) => {
    if (!gameState) return;

    let { drawPile, discardPile } = gameState;

    // Reshuffle if needed
    if (drawPile.length < count) {
      const reshuffled = reshuffleDiscardPile(discardPile, drawPile);
      drawPile = reshuffled.newDrawPile;
      discardPile = reshuffled.newDiscardPile;
    }

    const { drawnCards, remainingPile } = drawCards(drawPile, count);

    const isPlayer1 = gameState.player1.id === targetPlayerId;
    const player = isPlayer1 ? gameState.player1 : gameState.player2!;
    const newHand = [...player.hand, ...drawnCards];

    // Switch turn after drawing
    const nextTurn = gameState.currentTurn === gameState.player1.id
      ? gameState.player2!.id
      : gameState.player1.id;

    setGameState({
      ...gameState,
      [isPlayer1 ? 'player1' : 'player2']: { ...player, hand: newHand },
      drawPile: remainingPile,
      discardPile,
      mustDraw: 0,
      currentTurn: nextTurn,
      lastAction: `Drew ${count} card${count > 1 ? 's' : ''}`,
      lastActionTime: Date.now(),
    });
  };

  const handleDrawCard = () => {
    if (!gameState || gameState.currentTurn !== playerId) return;

    if (gameState.mustDraw > 0) {
      handleDrawCards(playerId, gameState.mustDraw);
    } else {
      handleDrawCards(playerId, 1);
    }
  };

  const handleUnoCall = () => {
    if (!gameState) return;

    setGameState({
      ...gameState,
      saidUno: { ...gameState.saidUno, [playerId]: true },
    });
    setShowUnoButton(false);
  };

  if (!gameState) {
    return (
      <View style={styles.container}>
        <Text style={styles.waitingText}>Loading...</Text>
      </View>
    );
  }

  const isMyTurn = gameState.currentTurn === playerId;
  const currentPlayer = gameState.player1.id === playerId ? gameState.player1 : gameState.player2!;
  const opponent = gameState.player1.id === playerId ? gameState.player2! : gameState.player1;
  const topCard = gameState.discardPile[gameState.discardPile.length - 1];

  const getCardColor = (color: UnoColor): string => {
    switch (color) {
      case 'red': return '#EF4444';
      case 'blue': return '#3B82F6';
      case 'green': return '#10B981';
      case 'yellow': return '#F59E0B';
      case 'wild': return '#6B7280';
      default: return '#6B7280';
    }
  };

  return (
    <LinearGradient colors={['#1E3A8A', '#3730A3', '#581C87']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.exitButton} onPress={handleExitWithSave}>
          <Text style={styles.exitButtonText}>Exit</Text>
        </TouchableOpacity>
        <Text style={styles.title}>UNO</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Opponent Info */}
      <View style={styles.opponentSection}>
        <Text style={styles.opponentName}>{opponent.name}</Text>
        <Text style={styles.cardCount}>{opponent.hand.length} cards</Text>
      </View>

      {/* Center Play Area */}
      <View style={styles.centerArea}>
        {/* Draw Pile */}
        <TouchableOpacity
          style={[styles.cardPile, { backgroundColor: '#1F2937' }]}
          onPress={handleDrawCard}
          disabled={!isMyTurn || gameState.gameStatus !== 'playing'}
        >
          <Text style={styles.pileText}>DRAW</Text>
          <Text style={styles.pileCount}>{gameState.drawPile.length}</Text>
        </TouchableOpacity>

        {/* Discard Pile */}
        <View style={[styles.cardPile, { backgroundColor: getCardColor(topCard.color) }]}>
          <Text style={styles.cardValue}>{topCard.value.toUpperCase()}</Text>
          {topCard.value === 'wild' || topCard.value === 'wild4' ? (
            <Text style={styles.currentColorText}>Color: {gameState.currentColor}</Text>
          ) : null}
        </View>
      </View>

      {/* Game Status */}
      <View style={styles.statusSection}>
        <Text style={styles.statusText}>
          {isMyTurn ? '🟢 Your Turn' : '🔴 Opponent\'s Turn'}
        </Text>
        <Text style={styles.actionText}>{gameState.lastAction}</Text>
        {gameState.mustDraw > 0 && isMyTurn && (
          <Text style={styles.warningText}>⚠️ Must draw {gameState.mustDraw} cards!</Text>
        )}
      </View>

      {/* UNO Button */}
      {showUnoButton && (
        <TouchableOpacity style={styles.unoButton} onPress={handleUnoCall}>
          <Text style={styles.unoButtonText}>Call UNO! 🎯</Text>
        </TouchableOpacity>
      )}

      {/* Player Hand */}
      <View style={styles.handSection}>
        <Text style={styles.handTitle}>Your Hand ({currentPlayer.hand.length})</Text>
        <View style={styles.hand}>
          {currentPlayer.hand.map((card) => {
            const isPlayable = canPlayCard(card, topCard, gameState.currentColor);
            return (
              <TouchableOpacity
                key={card.id}
                style={[
                  styles.handCard,
                  { backgroundColor: getCardColor(card.color) },
                  !isPlayable && styles.unplayableCard,
                ]}
                onPress={() => handleCardSelect(card)}
                disabled={!isMyTurn || gameState.gameStatus !== 'playing'}
              >
                <Text style={styles.handCardText}>{card.value.toUpperCase()}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Color Picker Modal */}
      <Modal visible={showColorPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.colorPickerModal}>
            <Text style={styles.colorPickerTitle}>Choose a Color</Text>
            <View style={styles.colorOptions}>
              {(['red', 'blue', 'green', 'yellow'] as UnoColor[]).map(color => (
                <TouchableOpacity
                  key={color}
                  style={[styles.colorOption, { backgroundColor: getCardColor(color) }]}
                  onPress={() => selectedCard && playCard(selectedCard, color)}
                >
                  <Text style={styles.colorOptionText}>{color.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowColorPicker(false);
                setSelectedCard(null);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
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
  opponentSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  opponentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardCount: {
    fontSize: 14,
    color: '#D1D5DB',
    marginTop: 4,
  },
  centerArea: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingVertical: 24,
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  currentColorText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 8,
  },
  statusSection: {
    alignItems: 'center',
    paddingVertical: 12,
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
  warningText: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: 'bold',
    marginTop: 4,
  },
  unoButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    alignSelf: 'center',
    marginVertical: 8,
  },
  unoButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  handSection: {
    flex: 1,
    paddingTop: 16,
  },
  handTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  hand: {
    paddingHorizontal: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  handCard: {
    width: 60,
    height: 85,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  unplayableCard: {
    opacity: 0.4,
  },
  handCardText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorPickerModal: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 24,
    width: '80%',
  },
  colorPickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  colorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  colorOption: {
    width: 100,
    height: 80,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  colorOptionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  waitingText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
});
