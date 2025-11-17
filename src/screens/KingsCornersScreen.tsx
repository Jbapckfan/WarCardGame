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
import { KingsGameState, KingsPlayer, Pile, PilePosition } from '../types/kings';
import { Card } from '../types/game';
import { canPlayCard, isKing, canMergePiles, getCornerPositions, getSidePositions } from '../utils/kingsLogic';
import { createDeck, shuffleDeck } from '../utils/cardUtils';
import { database } from '../config/firebase';
import { ref, onValue, off, update } from 'firebase/database';

interface KingsCornersScreenProps {
  gameId: string;
  playerId: string;
  onExit: () => void;
}

export const KingsCornersScreen: React.FC<KingsCornersScreenProps> = ({ gameId, playerId, onExit }) => {
  const [gameState, setGameState] = useState<KingsGameState | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [selectedSourcePile, setSelectedSourcePile] = useState<PilePosition | null>(null);

  // Firebase listener for real-time game state
  useEffect(() => {
    // Check if this is a local game
    if (gameId.startsWith('local_')) {
      initializeLocalGame();
      return;
    }

    // Firebase multiplayer game
    if (!database) {
      Alert.alert('Error', 'Firebase not initialized');
      return;
    }

    const gameRef = ref(database, `kingsGames/${gameId}`);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        setGameState(snapshot.val());
      }
    });

    return () => off(gameRef);
  }, [gameId]);

  const initializeLocalGame = () => {
    const deck = shuffleDeck(createDeck());

    // Deal 7 cards to each player
    const player1Hand = deck.splice(0, 7);
    const player2Hand = deck.splice(0, 7);

    // Initialize foundation piles (one card on each side pile)
    const northPile = deck.splice(0, 1);
    const southPile = deck.splice(0, 1);
    const eastPile = deck.splice(0, 1);
    const westPile = deck.splice(0, 1);

    const localGame: KingsGameState = {
      id: gameId,
      players: [
        {
          id: playerId,
          name: 'You',
          deck: [],
          hand: player1Hand,
        },
        {
          id: 'ai_player',
          name: 'AI',
          deck: [],
          hand: player2Hand,
        },
      ],
      currentPlayerIndex: 0,
      deck,
      piles: {
        north: { cards: northPile, position: 'north', isCorner: false },
        south: { cards: southPile, position: 'south', isCorner: false },
        east: { cards: eastPile, position: 'east', isCorner: false },
        west: { cards: westPile, position: 'west', isCorner: false },
        nw: { cards: [], position: 'nw', isCorner: true },
        ne: { cards: [], position: 'ne', isCorner: true },
        sw: { cards: [], position: 'sw', isCorner: true },
        se: { cards: [], position: 'se', isCorner: true },
      },
      gameStatus: 'playing',
      lastAction: 'Game started',
      lastActionTime: Date.now(),
      winner: null,
    };

    setGameState(localGame);
  };

  // Firebase: Play a card to a pile
  const handlePlayCardToPile = async (pilePosition: PilePosition) => {
    if (!gameState || !selectedCard) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== playerId) {
      Alert.alert('Not your turn!');
      return;
    }

    const pile = gameState.piles[pilePosition];

    if (!canPlayCard(selectedCard, pile)) {
      Alert.alert('Invalid move', 'Cannot play that card on this pile');
      return;
    }

    // Update pile and player's hand
    const newPiles = {
      ...gameState.piles,
      [pilePosition]: {
        ...pile,
        cards: [...pile.cards, selectedCard],
      },
    };

    const newHand = currentPlayer.hand.filter(c => c.id !== selectedCard.id);

    const updates: Partial<KingsGameState> = {
      piles: newPiles,
      players: gameState.players.map((p, idx) =>
        idx === gameState.currentPlayerIndex ? { ...p, hand: newHand } : p
      ),
      lastAction: `${currentPlayer.name} played ${selectedCard.rank} to ${pilePosition}`,
      lastActionTime: Date.now(),
    };

    setSelectedCard(null);

    if (gameId.startsWith('local_')) {
      setGameState({ ...gameState, ...updates });
    } else {
      await updateGameState(updates);
    }
  };

  // Firebase: Move a King to a corner
  const handleMoveKingToCorner = async (card: Card) => {
    if (!gameState || !isKing(card)) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== playerId) return;

    // Find an empty corner
    const cornerPositions = getCornerPositions();
    const emptyCorner = cornerPositions.find(pos => gameState.piles[pos].cards.length === 0);

    if (!emptyCorner) {
      Alert.alert('No empty corners available');
      return;
    }

    const newPiles = {
      ...gameState.piles,
      [emptyCorner]: {
        ...gameState.piles[emptyCorner],
        cards: [card],
      },
    };

    const newHand = currentPlayer.hand.filter(c => c.id !== card.id);

    const updates: Partial<KingsGameState> = {
      piles: newPiles,
      players: gameState.players.map((p, idx) =>
        idx === gameState.currentPlayerIndex ? { ...p, hand: newHand } : p
      ),
      lastAction: `${currentPlayer.name} moved King to ${emptyCorner} corner`,
      lastActionTime: Date.now(),
    };

    if (gameId.startsWith('local_')) {
      setGameState({ ...gameState, ...updates });
    } else {
      await updateGameState(updates);
    }
  };

  // Firebase: Merge two piles
  const handleMergePiles = async (targetPosition: PilePosition) => {
    if (!gameState || !selectedSourcePile) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== playerId) return;

    const sourcePile = gameState.piles[selectedSourcePile];
    const targetPile = gameState.piles[targetPosition];

    if (!canMergePiles(sourcePile, targetPile)) {
      Alert.alert('Invalid merge', 'Cannot merge these piles');
      return;
    }

    const newPiles = {
      ...gameState.piles,
      [targetPosition]: {
        ...targetPile,
        cards: [...targetPile.cards, ...sourcePile.cards],
      },
      [selectedSourcePile]: {
        ...sourcePile,
        cards: [],
      },
    };

    const updates: Partial<KingsGameState> = {
      piles: newPiles,
      lastAction: `${currentPlayer.name} merged ${selectedSourcePile} into ${targetPosition}`,
      lastActionTime: Date.now(),
    };

    setSelectedSourcePile(null);

    if (gameId.startsWith('local_')) {
      setGameState({ ...gameState, ...updates });
    } else {
      await updateGameState(updates);
    }
  };

  // Firebase: Draw card and end turn
  const handleDrawCardAndEndTurn = async () => {
    if (!gameState) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== playerId) return;

    if (gameState.deck.length === 0) {
      Alert.alert('Deck is empty');
      return;
    }

    const newDeck = [...gameState.deck];
    const drawnCard = newDeck.pop()!;
    const newHand = [...currentPlayer.hand, drawnCard];

    // Check if player won
    const playerWon = newHand.length === 0;

    const nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;

    const updates: Partial<KingsGameState> = {
      deck: newDeck,
      players: gameState.players.map((p, idx) =>
        idx === gameState.currentPlayerIndex ? { ...p, hand: newHand } : p
      ),
      currentPlayerIndex: playerWon ? gameState.currentPlayerIndex : nextPlayerIndex,
      lastAction: `${currentPlayer.name} drew a card`,
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

  const updateGameState = async (updates: Partial<KingsGameState>) => {
    if (!database) return;
    const gameRef = ref(database, `kingsGames/${gameId}`);
    await update(gameRef, updates);
  };

  const handleCardClick = (card: Card) => {
    if (isKing(card)) {
      handleMoveKingToCorner(card);
    } else {
      setSelectedCard(selectedCard?.id === card.id ? null : card);
    }
  };

  const renderPile = (position: PilePosition, pile: Pile) => {
    const topCard = pile.cards.length > 0 ? pile.cards[pile.cards.length - 1] : null;

    return (
      <TouchableOpacity
        key={position}
        style={[
          styles.pile,
          pile.isCorner && styles.cornerPile,
          selectedSourcePile === position && styles.selectedPile,
        ]}
        onPress={() => {
          if (selectedCard) {
            handlePlayCardToPile(position);
          } else if (selectedSourcePile) {
            handleMergePiles(position);
          } else if (pile.cards.length > 0) {
            setSelectedSourcePile(position);
          }
        }}
      >
        <Text style={styles.pileLabel}>{position.toUpperCase()}</Text>
        {topCard ? (
          <CardComponent card={topCard} scale={0.4} />
        ) : (
          <View style={styles.emptyPile}>
            <Text style={styles.emptyText}>
              {pile.isCorner ? 'K' : 'Empty'}
            </Text>
          </View>
        )}
        {pile.cards.length > 1 && (
          <Text style={styles.cardCount}>{pile.cards.length}</Text>
        )}
      </TouchableOpacity>
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Kings in the Corners</Text>
        <TouchableOpacity style={styles.exitButton} onPress={onExit}>
          <Text style={styles.exitText}>Exit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.turnInfo}>
        <Text style={styles.turnText}>
          {isMyTurn ? "Your Turn" : `${currentPlayer.name}'s Turn`}
        </Text>
        <Text style={styles.deckText}>Deck: {gameState.deck.length}</Text>
      </View>

      <View style={styles.board}>
        <View style={styles.topRow}>
          {renderPile('nw', gameState.piles.nw)}
          {renderPile('north', gameState.piles.north)}
          {renderPile('ne', gameState.piles.ne)}
        </View>

        <View style={styles.middleRow}>
          {renderPile('west', gameState.piles.west)}
          <TouchableOpacity
            style={styles.drawPile}
            onPress={handleDrawCardAndEndTurn}
            disabled={!isMyTurn}
          >
            <Text style={styles.drawText}>Draw & End Turn</Text>
          </TouchableOpacity>
          {renderPile('east', gameState.piles.east)}
        </View>

        <View style={styles.bottomRow}>
          {renderPile('sw', gameState.piles.sw)}
          {renderPile('south', gameState.piles.south)}
          {renderPile('se', gameState.piles.se)}
        </View>
      </View>

      <View style={styles.handContainer}>
        <Text style={styles.handLabel}>Your Hand ({myPlayer.hand.length} cards)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.hand}>
            {myPlayer.hand.map((card) => (
              <TouchableOpacity
                key={card.id}
                onPress={() => handleCardClick(card)}
                style={[
                  styles.cardWrapper,
                  selectedCard?.id === card.id && styles.selectedCardWrapper,
                ]}
              >
                <CardComponent card={card} scale={0.6} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {selectedCard && (
        <Text style={styles.instruction}>Tap a pile to play {selectedCard.rank}</Text>
      )}

      {selectedSourcePile && (
        <Text style={styles.instruction}>Tap a pile to merge {selectedSourcePile}</Text>
      )}

      <Text style={styles.lastAction}>{gameState.lastAction}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2C5F2D',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
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
  turnInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    color: '#FFD700',
    fontSize: 16,
  },
  board: {
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  middleRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  pile: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 80,
  },
  cornerPile: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  selectedPile: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  pileLabel: {
    color: 'white',
    fontSize: 12,
    marginBottom: 4,
  },
  emptyPile: {
    width: 60,
    height: 84,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 20,
    fontWeight: 'bold',
  },
  cardCount: {
    color: '#FFD700',
    fontSize: 12,
    marginTop: 4,
  },
  drawPile: {
    backgroundColor: '#228B22',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  drawText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
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
  selectedCardWrapper: {
    transform: [{ translateY: -10 }],
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 8,
  },
  instruction: {
    color: '#90EE90',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
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
});
