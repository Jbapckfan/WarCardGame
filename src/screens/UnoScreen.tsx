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
import { UnoGameState, UnoPlayer, UnoCard, UnoColor } from '../types/uno';
import { createUnoDeck, shuffleUnoDeck, canPlayCard, getCardColor, isActionCard } from '../utils/unoLogic';
import { database } from '../config/firebase';
import { ref, onValue, off, update } from 'firebase/database';

interface UnoScreenProps {
  gameId: string;
  playerId: string;
  onExit: () => void;
}

const UnoCardComponent: React.FC<{ card: UnoCard; scale?: number }> = ({ card, scale = 1 }) => {
  const backgroundColor = getCardColor(card);

  return (
    <View style={[styles.unoCard, { backgroundColor, transform: [{ scale }] }]}>
      <Text style={styles.unoCardText}>{card.value.toUpperCase()}</Text>
    </View>
  );
};

export const UnoScreen: React.FC<UnoScreenProps> = ({ gameId, playerId, onExit }) => {
  const [gameState, setGameState] = useState<UnoGameState | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedCard, setSelectedCard] = useState<UnoCard | null>(null);

  useEffect(() => {
    if (gameId.startsWith('local_')) {
      initializeLocalGame();
      return;
    }

    if (!database) {
      Alert.alert('Error', 'Firebase not initialized');
      return;
    }

    const gameRef = ref(database, `unoGames/${gameId}`);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        setGameState(snapshot.val());
      }
    });

    return () => off(gameRef);
  }, [gameId]);

  const initializeLocalGame = () => {
    const deck = shuffleUnoDeck(createUnoDeck());
    const cardsPerPlayer = 7;

    const player1Hand = deck.splice(0, cardsPerPlayer);
    const player2Hand = deck.splice(0, cardsPerPlayer);

    // Start discard pile with non-action card
    let startCard = deck.pop()!;
    while (isActionCard(startCard)) {
      deck.unshift(startCard);
      startCard = deck.pop()!;
    }

    const localGame: UnoGameState = {
      id: gameId,
      players: [
        {
          id: playerId,
          name: 'You',
          deck: [],
          hand: player1Hand,
          calledUno: false,
        },
        {
          id: 'ai_player',
          name: 'AI',
          deck: [],
          hand: player2Hand,
          calledUno: false,
        },
      ],
      currentPlayerIndex: 0,
      direction: 1,
      deck,
      discardPile: [startCard],
      currentColor: startCard.color as UnoColor,
      gameStatus: 'playing',
      lastAction: 'Game started',
      lastActionTime: Date.now(),
      winner: null,
      mustDraw: true,
      drawCount: 0,
    };

    setGameState(localGame);
  };

  const handleDrawCard = async () => {
    if (!gameState) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== playerId) {
      Alert.alert('Not your turn!');
      return;
    }

    if (!gameState.mustDraw) {
      Alert.alert('You must play a card or pass');
      return;
    }

    const drawCount = Math.max(1, gameState.drawCount);
    let newDeck = [...gameState.deck];
    let newHand = [...currentPlayer.hand];

    // Draw required number of cards
    for (let i = 0; i < drawCount; i++) {
      if (newDeck.length === 0) {
        // Reshuffle discard pile into deck
        const lastCard = gameState.discardPile[gameState.discardPile.length - 1];
        newDeck = shuffleUnoDeck(gameState.discardPile.slice(0, -1));
      }
      if (newDeck.length > 0) {
        newHand.push(newDeck.pop()!);
      }
    }

    const updates: Partial<UnoGameState> = {
      deck: newDeck,
      players: gameState.players.map((p, idx) =>
        idx === gameState.currentPlayerIndex ? { ...p, hand: newHand } : p
      ),
      mustDraw: false,
      drawCount: 0,
      lastAction: `${currentPlayer.name} drew ${drawCount} card(s)`,
      lastActionTime: Date.now(),
    };

    if (gameId.startsWith('local_')) {
      setGameState({ ...gameState, ...updates });
    } else {
      await updateGameState(updates);
    }
  };

  const handlePlayCard = async (card: UnoCard, chosenColor?: UnoColor) => {
    if (!gameState) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== playerId) return;

    if (gameState.mustDraw && gameState.drawCount === 0) {
      Alert.alert('You must draw a card first');
      return;
    }

    const topCard = gameState.discardPile[gameState.discardPile.length - 1];
    if (!canPlayCard(card, topCard, gameState.currentColor)) {
      Alert.alert('Invalid card', 'Cannot play that card');
      return;
    }

    // Handle wild cards
    if (card.color === 'wild' && !chosenColor) {
      setSelectedCard(card);
      setShowColorPicker(true);
      return;
    }

    const newHand = currentPlayer.hand.filter(c => c.id !== card.id);
    const newDiscardPile = [...gameState.discardPile, card];

    let nextPlayerIndex = gameState.currentPlayerIndex;
    let newDirection = gameState.direction;
    let newDrawCount = 0;
    let actionMessage = `${currentPlayer.name} played ${card.value}`;

    // Handle action cards
    if (card.value === 'skip') {
      nextPlayerIndex = (gameState.currentPlayerIndex + gameState.direction + gameState.players.length) % gameState.players.length;
      actionMessage += ' - Next player skipped!';
    } else if (card.value === 'reverse') {
      newDirection = gameState.direction === 1 ? -1 : 1;
      actionMessage += ' - Direction reversed!';
    } else if (card.value === 'draw2') {
      newDrawCount = 2;
      actionMessage += ' - Next player draws 2!';
    } else if (card.value === 'wild_draw4') {
      newDrawCount = 4;
      actionMessage += ' - Next player draws 4!';
    }

    nextPlayerIndex = (nextPlayerIndex + newDirection + gameState.players.length) % gameState.players.length;

    const playerWon = newHand.length === 0;

    const updates: Partial<UnoGameState> = {
      discardPile: newDiscardPile,
      currentColor: chosenColor || (card.color as UnoColor),
      players: gameState.players.map((p, idx) =>
        idx === gameState.currentPlayerIndex ? { ...p, hand: newHand, calledUno: false } : p
      ),
      currentPlayerIndex: playerWon ? gameState.currentPlayerIndex : nextPlayerIndex,
      direction: newDirection,
      mustDraw: true,
      drawCount: newDrawCount,
      lastAction: actionMessage,
      lastActionTime: Date.now(),
      gameStatus: playerWon ? 'finished' : 'playing',
      winner: playerWon ? currentPlayer.id : null,
    };

    setSelectedCard(null);
    setShowColorPicker(false);

    if (gameId.startsWith('local_')) {
      setGameState({ ...gameState, ...updates });
    } else {
      await updateGameState(updates);
    }
  };

  const handlePass = async () => {
    if (!gameState) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== playerId) return;

    if (gameState.mustDraw) {
      Alert.alert('You must draw first');
      return;
    }

    const nextPlayerIndex = (gameState.currentPlayerIndex + gameState.direction + gameState.players.length) % gameState.players.length;

    const updates: Partial<UnoGameState> = {
      currentPlayerIndex: nextPlayerIndex,
      mustDraw: true,
      lastAction: `${currentPlayer.name} passed`,
      lastActionTime: Date.now(),
    };

    if (gameId.startsWith('local_')) {
      setGameState({ ...gameState, ...updates });
    } else {
      await updateGameState(updates);
    }
  };

  const updateGameState = async (updates: Partial<UnoGameState>) => {
    if (!database) return;
    const gameRef = ref(database, `unoGames/${gameId}`);
    await update(gameRef, updates);
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

  const topCard = gameState.discardPile[gameState.discardPile.length - 1];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>UNO!</Text>
        <TouchableOpacity style={styles.exitButton} onPress={onExit}>
          <Text style={styles.exitText}>Exit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.turnInfo}>
        <Text style={styles.turnText}>
          {isMyTurn ? 'Your Turn' : `${currentPlayer.name}'s Turn`}
        </Text>
        <Text style={styles.directionText}>
          Direction: {gameState.direction === 1 ? '↻' : '↺'}
        </Text>
      </View>

      <View style={styles.playersInfo}>
        {gameState.players.map((player) => (
          <View key={player.id} style={styles.playerRow}>
            <Text style={styles.playerName}>{player.name}</Text>
            <Text style={styles.playerCards}>{player.hand.length} cards</Text>
          </View>
        ))}
      </View>

      <View style={styles.pileContainer}>
        <View style={styles.pile}>
          <Text style={styles.pileLabel}>Deck ({gameState.deck.length})</Text>
          <TouchableOpacity
            onPress={handleDrawCard}
            disabled={!isMyTurn || !gameState.mustDraw}
          >
            <View style={[styles.unoCard, { backgroundColor: '#1F2937' }]}>
              <Text style={styles.unoCardText}>UNO</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.pile}>
          <Text style={styles.pileLabel}>
            Current Color: {gameState.currentColor.toUpperCase()}
          </Text>
          <UnoCardComponent card={topCard} />
        </View>
      </View>

      <View style={styles.handContainer}>
        <Text style={styles.handLabel}>Your Hand ({myPlayer.hand.length} cards)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.hand}>
            {myPlayer.hand.map((card) => (
              <TouchableOpacity
                key={card.id}
                onPress={() => handlePlayCard(card)}
                disabled={!isMyTurn || gameState.mustDraw}
              >
                <UnoCardComponent card={card} scale={0.8} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {isMyTurn && !gameState.mustDraw && (
        <TouchableOpacity style={styles.passButton} onPress={handlePass}>
          <Text style={styles.passButtonText}>Pass</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.lastAction}>{gameState.lastAction}</Text>

      {/* Color Picker Modal */}
      <Modal visible={showColorPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose a color</Text>
            <View style={styles.colorGrid}>
              {(['red', 'blue', 'green', 'yellow'] as UnoColor[]).map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[styles.colorButton, { backgroundColor: getCardColor({ id: '', color, value: '1' }) }]}
                  onPress={() => selectedCard && handlePlayCard(selectedCard, color)}
                >
                  <Text style={styles.colorButtonText}>{color.toUpperCase()}</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#EF4444',
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
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  turnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  directionText: {
    color: '#EF4444',
    fontSize: 20,
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
    color: '#EF4444',
    fontSize: 14,
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
    fontSize: 12,
    marginBottom: 8,
  },
  unoCard: {
    width: 80,
    height: 120,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'white',
  },
  unoCardText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
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
  passButton: {
    backgroundColor: '#6B7280',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  passButtonText: {
    color: 'white',
    fontSize: 16,
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
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  colorButton: {
    width: '45%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  colorButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
