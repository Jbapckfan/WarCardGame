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
import { SolitaireGameState } from '../types/solitaire';
import {
  dealSolitaireGame,
  moveCards,
  drawFromStock,
  checkSolitaireWin,
  calculateScore,
  getAutoMoveToFoundation,
} from '../utils/solitaireLogic';
import { saveGame } from '../utils/gameSaveService';
import { CardComponent } from '../components/CardComponent';
import { Card } from '../types/game';
import { triggerHaptic } from '../utils/hapticManager';
import { ConfettiCelebration } from '../components/ConfettiCelebration';

interface SolitaireScreenProps {
  gameId: string;
  playerId: string;
  resumeState?: SolitaireGameState;
  onExit: () => void;
}

export const SolitaireScreen: React.FC<SolitaireScreenProps> = ({
  gameId,
  playerId,
  resumeState,
  onExit,
}) => {
  const [gameState, setGameState] = useState<SolitaireGameState | null>(resumeState || null);
  const [selectedCard, setSelectedCard] = useState<{
    card: Card;
    from: 'tableau' | 'waste' | 'foundation';
    index: number;
    cardIndex?: number;
  } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleExitWithSave = async () => {
    await triggerHaptic.buttonTap();
    if (gameState && gameState.gameStatus === 'playing') {
      await saveGame('custom', gameState, 1);
    }
    onExit();
  };

  useEffect(() => {
    if (resumeState) return;

    const initialState = dealSolitaireGame(gameId, 1); // Draw 1 card at a time (easier for mobile)
    setGameState(initialState);
  }, []);

  if (!gameState) {
    return (
      <View style={styles.container}>
        <Text style={styles.waitingText}>Initializing game...</Text>
      </View>
    );
  }

  const handleCardClick = async (
    card: Card,
    from: 'tableau' | 'waste' | 'foundation',
    index: number,
    cardIndex?: number
  ) => {
    if (selectedCard) {
      // Try to move selected card to clicked location
      const fromType = selectedCard.from;
      const fromIndex = selectedCard.index;
      const fromCardIndex = selectedCard.cardIndex;

      let newState: SolitaireGameState | null = null;

      if (from === 'tableau') {
        newState = moveCards(gameState, fromType, fromIndex, 'tableau', index, fromCardIndex);
      } else if (from === 'foundation') {
        newState = moveCards(gameState, fromType, fromIndex, 'foundation', index, fromCardIndex);
      }

      if (newState) {
        await triggerHaptic.cardPlay();
        setGameState(newState);
        setSelectedCard(null);

        // Check for win
        if (checkSolitaireWin(newState)) {
          await triggerHaptic.win();
          setShowConfetti(true);
          newState.gameStatus = 'won';
          newState.endTime = Date.now();
          const finalScore = calculateScore(newState);
          newState.score = finalScore;
          setGameState(newState);

          Alert.alert(
            '🎉 You Won!',
            `Congratulations!\nScore: ${finalScore}\nMoves: ${newState.moves}`,
            [{ text: 'OK', onPress: handleExitWithSave }]
          );
        }
      } else {
        // Invalid move, deselect
        await triggerHaptic.error();
        setSelectedCard(null);
      }
    } else {
      // Select card
      await triggerHaptic.buttonTap();
      setSelectedCard({ card, from, index, cardIndex });
    }
  };

  const handleDraw = async () => {
    await triggerHaptic.buttonTap();
    const newState = drawFromStock(gameState);
    setGameState(newState);
    setSelectedCard(null);
  };

  const handleAutoMove = async () => {
    const newState = getAutoMoveToFoundation(gameState);
    if (newState) {
      await triggerHaptic.cardPlay();
      setGameState(newState);

      // Check for win
      if (checkSolitaireWin(newState)) {
        await triggerHaptic.win();
        setShowConfetti(true);
        newState.gameStatus = 'won';
        newState.endTime = Date.now();
        const finalScore = calculateScore(newState);
        newState.score = finalScore;
        setGameState(newState);

        Alert.alert(
          '🎉 You Won!',
          `Congratulations!\nScore: ${finalScore}\nMoves: ${newState.moves}`,
          [{ text: 'OK', onPress: handleExitWithSave }]
        );
      }
    } else {
      await triggerHaptic.error();
      Alert.alert('No Moves', 'No cards can be moved to foundation automatically');
    }
  };

  const handleNewGame = async () => {
    await triggerHaptic.buttonTap();
    const newState = dealSolitaireGame(gameId, 1);
    setGameState(newState);
    setSelectedCard(null);
  };

  const foundationSuits = ['hearts', 'diamonds', 'clubs', 'spades'] as const;

  return (
    <LinearGradient colors={['#064E3B', '#065F46', '#047857']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.exitButton} onPress={handleExitWithSave}>
          <Text style={styles.exitButtonText}>Exit</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Solitaire</Text>
          <Text style={styles.subtitle}>Moves: {gameState.moves} | Score: {gameState.score}</Text>
        </View>
        <TouchableOpacity style={styles.newGameButton} onPress={handleNewGame}>
          <Text style={styles.newGameButtonText}>New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContent}>
        {/* Top Row: Stock, Waste, and Foundations */}
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.stockPile} onPress={handleDraw}>
            {gameState.stock.length > 0 ? (
              <View style={styles.cardBack}>
                <Text style={styles.stockCount}>{gameState.stock.length}</Text>
              </View>
            ) : (
              <View style={styles.emptyPile}>
                <Text style={styles.emptyText}>↻</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.wastePile}>
            {gameState.waste.length > 0 && (
              <TouchableOpacity
                onPress={() =>
                  handleCardClick(
                    gameState.waste[gameState.waste.length - 1],
                    'waste',
                    0
                  )
                }
              >
                <View
                  style={[
                    styles.cardWrapper,
                    selectedCard?.from === 'waste' && styles.selectedCard,
                  ]}
                >
                  <CardComponent
                    card={gameState.waste[gameState.waste.length - 1]}
                    scale={0.5}
                  />
                </View>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.foundations}>
            {foundationSuits.map((suit, index) => {
              const pile = gameState.foundations[suit];
              const topCard = pile.length > 0 ? pile[pile.length - 1] : null;

              return (
                <TouchableOpacity
                  key={suit}
                  style={styles.foundationPile}
                  onPress={() => {
                    if (topCard) {
                      handleCardClick(topCard, 'foundation', index);
                    } else if (selectedCard) {
                      // Try to place selected card on empty foundation
                      const newState = moveCards(
                        gameState,
                        selectedCard.from,
                        selectedCard.index,
                        'foundation',
                        index,
                        selectedCard.cardIndex
                      );
                      if (newState) {
                        setGameState(newState);
                        setSelectedCard(null);
                      }
                    }
                  }}
                >
                  {topCard ? (
                    <View
                      style={[
                        styles.cardWrapper,
                        selectedCard?.from === 'foundation' &&
                          selectedCard?.index === index &&
                          styles.selectedCard,
                      ]}
                    >
                      <CardComponent card={topCard} scale={0.5} />
                    </View>
                  ) : (
                    <View style={[styles.emptyPile, styles.foundationEmpty]}>
                      <Text style={styles.suitIcon}>
                        {suit === 'hearts' ? '♥️' : suit === 'diamonds' ? '♦️' : suit === 'clubs' ? '♣️' : '♠️'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Tableau Piles */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tableau}>
            {gameState.tableau.map((pile, pileIndex) => (
              <View key={pileIndex} style={styles.tableauPile}>
                {pile.length === 0 ? (
                  <TouchableOpacity
                    style={styles.emptyTableauPile}
                    onPress={() => {
                      if (selectedCard) {
                        const newState = moveCards(
                          gameState,
                          selectedCard.from,
                          selectedCard.index,
                          'tableau',
                          pileIndex,
                          selectedCard.cardIndex
                        );
                        if (newState) {
                          setGameState(newState);
                          setSelectedCard(null);
                        }
                      }
                    }}
                  >
                    <Text style={styles.emptyText}>K</Text>
                  </TouchableOpacity>
                ) : (
                  pile.map((card, cardIndex) => (
                    <TouchableOpacity
                      key={card.id}
                      style={[
                        styles.tableauCard,
                        { top: cardIndex * 25 },
                        selectedCard?.from === 'tableau' &&
                          selectedCard?.index === pileIndex &&
                          selectedCard?.cardIndex === cardIndex &&
                          styles.selectedCard,
                      ]}
                      onPress={() => handleCardClick(card, 'tableau', pileIndex, cardIndex)}
                    >
                      <CardComponent card={card} scale={0.5} />
                    </TouchableOpacity>
                  ))
                )}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Auto-Move Button */}
        <TouchableOpacity style={styles.autoMoveButton} onPress={handleAutoMove}>
          <Text style={styles.autoMoveButtonText}>⚡ Auto-Move to Foundation</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Confetti Celebration */}
      <ConfettiCelebration show={showConfetti} />
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
    fontSize: 12,
    color: '#D1FAE5',
    marginTop: 4,
  },
  newGameButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newGameButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 8,
  },
  stockPile: {
    width: 50,
    height: 70,
  },
  cardBack: {
    width: 50,
    height: 70,
    backgroundColor: '#1E3A8A',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockCount: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  wastePile: {
    width: 50,
    height: 70,
    marginLeft: 8,
  },
  foundations: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 'auto',
  },
  foundationPile: {
    width: 50,
    height: 70,
  },
  foundationEmpty: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  suitIcon: {
    fontSize: 24,
  },
  emptyPile: {
    width: 50,
    height: 70,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#6EE7B7',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    color: '#6EE7B7',
    fontWeight: 'bold',
  },
  tableau: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
    paddingBottom: 20,
  },
  tableauPile: {
    width: 60,
    minHeight: 300,
    position: 'relative',
  },
  emptyTableauPile: {
    width: 60,
    height: 85,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#6EE7B7',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableauCard: {
    position: 'absolute',
    width: 60,
  },
  cardWrapper: {
    borderRadius: 6,
  },
  selectedCard: {
    borderWidth: 3,
    borderColor: '#FCD34D',
    borderRadius: 6,
  },
  autoMoveButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  autoMoveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  waitingText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 100,
  },
});
