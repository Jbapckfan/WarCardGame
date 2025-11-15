import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GameTemplate, CustomGameState } from '../types/customGame';
import { UnoCard, UnoColor } from '../types/uno';
import {
  initializeCustomGame,
  canPlayCardCustom,
  makeAIMove,
  checkCustomGameWinner,
  getCardDisplay,
  reshuffleIfNeeded,
} from '../utils/customGameLogic';

interface CustomGameScreenProps {
  gameId: string;
  playerId: string;
  template: GameTemplate;
  onExit: () => void;
}

export const CustomGameScreen: React.FC<CustomGameScreenProps> = ({
  gameId,
  playerId,
  template,
  onExit,
}) => {
  const [gameState, setGameState] = useState<CustomGameState | null>(null);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    // Initialize game with template
    const initialState = initializeCustomGame(template, gameId, playerId, 'You');
    setGameState(initialState);
  }, [gameId, playerId, template]);

  useEffect(() => {
    if (!gameState) return;

    // Check for winner
    const winnerId = checkCustomGameWinner(gameState);
    if (winnerId && gameState.gameStatus === 'playing') {
      const winnerName =
        winnerId === gameState.player1.id ? gameState.player1.name : gameState.player2!.name;
      setGameState({ ...gameState, winner: winnerId, gameStatus: 'finished' });
      Alert.alert('Game Over!', `${winnerName} wins!`, [{ text: 'OK', onPress: onExit }]);
    }

    // AI turn
    if (gameState.currentTurn === 'ai_player' && gameState.gameStatus === 'playing') {
      setTimeout(() => playAITurn(), 1000);
    }
  }, [gameState?.currentTurn]);

  const playAITurn = () => {
    if (!gameState || !gameState.player2) return;

    const aiMove = makeAIMove(gameState);

    if (aiMove.action === 'play' && aiMove.card) {
      // AI plays a card
      const newHand = gameState.player2.hand.filter((c) => c.id !== aiMove.card.id);
      const newDiscardPile = [...gameState.discardPile, aiMove.card];

      setGameState({
        ...gameState,
        player2: { ...gameState.player2, hand: newHand },
        discardPile: newDiscardPile,
        currentTurn: playerId,
        currentColor: aiMove.chosenColor || gameState.currentColor,
        lastAction: `AI played ${getCardDisplay(aiMove.card)}`,
        lastActionTime: Date.now(),
      });
    } else {
      // AI draws a card
      const reshuffled = reshuffleIfNeeded(
        gameState.drawPile,
        gameState.discardPile,
        template.drawCount
      );

      const cardsToDraw = reshuffled.drawPile.slice(0, template.drawCount);
      const newDrawPile = reshuffled.drawPile.slice(template.drawCount);
      const newHand = [...gameState.player2.hand, ...cardsToDraw];

      setGameState({
        ...gameState,
        player2: { ...gameState.player2, hand: newHand },
        drawPile: newDrawPile,
        discardPile: reshuffled.discardPile,
        currentTurn: playerId,
        lastAction: `AI drew ${template.drawCount} card${template.drawCount > 1 ? 's' : ''}`,
        lastActionTime: Date.now(),
      });
    }
  };

  const handleCardSelect = (card: any) => {
    if (!gameState || gameState.currentTurn !== playerId) return;

    const topCard = gameState.discardPile[gameState.discardPile.length - 1];

    if (!canPlayCardCustom(card, topCard, template.matchRule, gameState.currentColor)) {
      Alert.alert('Invalid Play', 'This card cannot be played!');
      return;
    }

    // Check if need to choose color (wild cards)
    if (template.deckType === 'uno' && (card.value === 'wild' || card.value === 'wild4')) {
      setSelectedCard(card);
      setShowColorPicker(true);
      return;
    }

    playCard(card);
  };

  const playCard = (card: any, chosenColor?: UnoColor) => {
    if (!gameState) return;

    const newHand = gameState.player1.hand.filter((c: any) => c.id !== card.id);
    const newDiscardPile = [...gameState.discardPile, card];

    setGameState({
      ...gameState,
      player1: { ...gameState.player1, hand: newHand },
      discardPile: newDiscardPile,
      currentTurn: gameState.player2!.id,
      currentColor: chosenColor || (template.deckType === 'uno' ? (card as UnoCard).color : undefined),
      lastAction: `You played ${getCardDisplay(card)}`,
      lastActionTime: Date.now(),
    });

    setShowColorPicker(false);
    setSelectedCard(null);
  };

  const handleDrawCard = () => {
    if (!gameState || gameState.currentTurn !== playerId) return;

    const reshuffled = reshuffleIfNeeded(
      gameState.drawPile,
      gameState.discardPile,
      template.drawCount
    );

    const cardsToDraw = reshuffled.drawPile.slice(0, template.drawCount);
    const newDrawPile = reshuffled.drawPile.slice(template.drawCount);
    const newHand = [...gameState.player1.hand, ...cardsToDraw];

    setGameState({
      ...gameState,
      player1: { ...gameState.player1, hand: newHand },
      drawPile: newDrawPile,
      discardPile: reshuffled.discardPile,
      currentTurn: template.mustDraw ? gameState.player2!.id : playerId, // Stay turn if can play after draw
      lastAction: `You drew ${template.drawCount} card${template.drawCount > 1 ? 's' : ''}`,
      lastActionTime: Date.now(),
    });
  };

  if (!gameState) {
    return (
      <View style={styles.container}>
        <Text style={styles.waitingText}>Loading {template.name}...</Text>
      </View>
    );
  }

  const isMyTurn = gameState.currentTurn === playerId;
  const topCard = gameState.discardPile[gameState.discardPile.length - 1];

  const getCardColor = (card: any): string => {
    if ('color' in card) {
      // Uno card
      switch (card.color) {
        case 'red':
          return '#EF4444';
        case 'blue':
          return '#3B82F6';
        case 'green':
          return '#10B981';
        case 'yellow':
          return '#F59E0B';
        case 'wild':
          return '#8B5CF6';
        default:
          return '#6B7280';
      }
    } else {
      // Standard card
      return card.suit === '♥' || card.suit === '♦' ? '#EF4444' : '#1F2937';
    }
  };

  return (
    <LinearGradient colors={['#0F172A', '#1E293B', '#334155']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.exitButton} onPress={onExit}>
          <Text style={styles.exitButtonText}>Exit</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.emoji}>{template.emoji}</Text>
          <Text style={styles.title}>{template.name}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Opponent Info */}
      <View style={styles.playerSection}>
        <Text style={styles.playerName}>{gameState.player2?.name}</Text>
        <Text style={styles.cardCount}>{gameState.player2?.hand.length} cards</Text>
      </View>

      {/* Center Play Area */}
      <View style={styles.centerArea}>
        {/* Draw Pile */}
        <TouchableOpacity
          style={[styles.cardPile, { backgroundColor: '#1F2937' }]}
          onPress={handleDrawCard}
          disabled={!isMyTurn}
        >
          <Text style={styles.pileText}>DRAW</Text>
          <Text style={styles.pileCount}>{gameState.drawPile.length}</Text>
        </TouchableOpacity>

        {/* Discard Pile */}
        <View style={[styles.cardPile, { backgroundColor: getCardColor(topCard) }]}>
          <Text style={styles.cardValue}>
            {template.deckType === 'uno'
              ? (topCard as UnoCard).value.toUpperCase()
              : `${topCard.rank}${topCard.suit}`}
          </Text>
          {gameState.currentColor && (
            <Text style={styles.currentColorText}>Color: {gameState.currentColor}</Text>
          )}
        </View>
      </View>

      {/* Game Status */}
      <View style={styles.statusSection}>
        <Text style={styles.statusText}>
          {isMyTurn ? '🟢 Your Turn' : "🔴 Opponent's Turn"}
        </Text>
        <Text style={styles.actionText}>{gameState.lastAction}</Text>
      </View>

      {/* Rules Display */}
      <View style={styles.rulesBox}>
        <Text style={styles.rulesTitle}>Rules:</Text>
        {template.rules.slice(0, 2).map((rule, idx) => (
          <Text key={idx} style={styles.ruleText}>
            • {rule}
          </Text>
        ))}
      </View>

      {/* Player Hand */}
      <View style={styles.handSection}>
        <Text style={styles.handTitle}>Your Hand ({gameState.player1.hand.length})</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hand}>
          {gameState.player1.hand.map((card: any) => {
            const isPlayable = canPlayCardCustom(
              card,
              topCard,
              template.matchRule,
              gameState.currentColor
            );
            return (
              <TouchableOpacity
                key={card.id}
                style={[
                  styles.handCard,
                  { backgroundColor: getCardColor(card) },
                  !isPlayable && styles.unplayableCard,
                ]}
                onPress={() => handleCardSelect(card)}
                disabled={!isMyTurn}
              >
                <Text style={styles.handCardText}>
                  {template.deckType === 'uno'
                    ? (card as UnoCard).value.toUpperCase()
                    : `${card.rank}${card.suit}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Color Picker Modal */}
      <Modal visible={showColorPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.colorPickerModal}>
            <Text style={styles.colorPickerTitle}>Choose a Color</Text>
            <View style={styles.colorOptions}>
              {(['red', 'blue', 'green', 'yellow'] as UnoColor[]).map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    {
                      backgroundColor:
                        color === 'red'
                          ? '#EF4444'
                          : color === 'blue'
                          ? '#3B82F6'
                          : color === 'green'
                          ? '#10B981'
                          : '#F59E0B',
                    },
                  ]}
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emoji: {
    fontSize: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 60,
  },
  playerSection: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  playerName: {
    fontSize: 16,
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
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
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
  rulesBox: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  rulesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#A78BFA',
    marginBottom: 4,
  },
  ruleText: {
    fontSize: 12,
    color: '#C4B5FD',
    marginTop: 2,
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
    width: 80,
    height: 110,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  unplayableCard: {
    opacity: 0.4,
  },
  handCardText: {
    color: '#FFFFFF',
    fontSize: 14,
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
