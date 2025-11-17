import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CardComponent } from '../components/CardComponent';
import { SlapFeedbackAnimation } from '../components/SlapFeedbackAnimation';
import { Card } from '../types/game';
import { TutorialStep, TutorialProgress, TUTORIAL_STEPS, TUTORIAL_REWARD } from '../types/tutorial';
import { checkValidSlap } from '../utils/ersLogic';

const TUTORIAL_STORAGE_KEY = 'tutorial_progress';
const { width } = Dimensions.get('window');

interface TutorialScreenProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const TutorialScreen: React.FC<TutorialScreenProps> = ({ onComplete, onSkip }) => {
  const [progress, setProgress] = useState<TutorialProgress>({
    currentStep: 0,
    completedSteps: [],
    practiceSlaps: {
      doubles: 0,
      sandwiches: 0,
      tens: 0,
    },
    rewardClaimed: false,
  });

  const [practicePile, setPracticePile] = useState<Card[]>([]);
  const [slapFeedback, setSlapFeedback] = useState<{
    active: boolean;
    success: boolean;
    message: string;
  }>({ active: false, success: false, message: '' });

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const stored = await AsyncStorage.getItem(TUTORIAL_STORAGE_KEY);
      if (stored) {
        setProgress(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading tutorial progress:', error);
    }
  };

  const saveProgress = async (newProgress: TutorialProgress) => {
    try {
      await AsyncStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(newProgress));
      setProgress(newProgress);
    } catch (error) {
      console.error('Error saving tutorial progress:', error);
    }
  };

  const currentStep = TUTORIAL_STEPS[progress.currentStep];
  const isLastStep = progress.currentStep === TUTORIAL_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
      return;
    }

    const newProgress = {
      ...progress,
      currentStep: progress.currentStep + 1,
      completedSteps: [...progress.completedSteps, currentStep.id],
    };
    saveProgress(newProgress);
    setPracticePile([]);
  };

  const handleComplete = async () => {
    const newProgress = {
      ...progress,
      completedAt: Date.now(),
      rewardClaimed: true,
    };
    await saveProgress(newProgress);

    // Award tutorial completion rewards
    // This would integrate with the stats/achievements system
    onComplete();
  };

  const generatePracticeCard = (rule: 'doubles' | 'sandwiches' | 'tens') => {
    const suits: ('hearts' | 'diamonds' | 'clubs' | 'spades')[] = [
      'hearts',
      'diamonds',
      'clubs',
      'spades',
    ];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10'];

    const randomSuit = () => suits[Math.floor(Math.random() * suits.length)];
    const randomRank = () => ranks[Math.floor(Math.random() * ranks.length)];

    let newCards: Card[] = [];

    if (Math.random() > 0.3) {
      // 70% chance to show the correct pattern
      if (rule === 'doubles') {
        const rank = randomRank();
        newCards = [
          { rank, suit: randomSuit() },
          { rank, suit: randomSuit() },
        ];
      } else if (rule === 'sandwiches') {
        const rank = randomRank();
        newCards = [
          { rank, suit: randomSuit() },
          { rank: randomRank(), suit: randomSuit() },
          { rank, suit: randomSuit() },
        ];
      } else if (rule === 'tens') {
        const num1 = Math.floor(Math.random() * 9) + 1;
        const num2 = 10 - num1;
        newCards = [
          { rank: num1.toString(), suit: randomSuit() },
          { rank: num2.toString(), suit: randomSuit() },
        ];
      }
    } else {
      // 30% chance to show incorrect pattern (test understanding)
      const count = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < count; i++) {
        newCards.push({ rank: randomRank(), suit: randomSuit() });
      }
    }

    setPracticePile([...practicePile, ...newCards]);
  };

  const handlePracticeSlap = () => {
    const slapCheck = checkValidSlap(practicePile);

    if (slapCheck.valid && currentStep.rule) {
      // Check if it matches the current rule being practiced
      const isCorrectRule = slapCheck.rules.some((r) => {
        if (currentStep.rule === 'doubles') return r === 'Doubles';
        if (currentStep.rule === 'sandwiches') return r === 'Sandwich';
        if (currentStep.rule === 'tens') return r === 'Adds to 10';
        return false;
      });

      if (isCorrectRule) {
        // Correct slap!
        setSlapFeedback({
          active: true,
          success: true,
          message: `Great! ${slapCheck.rules.join(', ')}`,
        });

        const newProgress = {
          ...progress,
          practiceSlaps: {
            ...progress.practiceSlaps,
            [currentStep.rule]: progress.practiceSlaps[currentStep.rule] + 1,
          },
        };
        saveProgress(newProgress);

        // Clear pile
        setTimeout(() => {
          setPracticePile([]);
          setSlapFeedback({ active: false, success: false, message: '' });
        }, 1500);
      } else {
        // Wrong rule
        setSlapFeedback({
          active: true,
          success: false,
          message: 'Wrong rule! Try again.',
        });
        setTimeout(() => {
          setSlapFeedback({ active: false, success: false, message: '' });
        }, 1500);
      }
    } else {
      // Bad slap
      setSlapFeedback({
        active: true,
        success: false,
        message: 'No valid slap!',
      });
      setTimeout(() => {
        setSlapFeedback({ active: false, success: false, message: '' });
      }, 1500);
    }
  };

  const renderWelcome = () => (
    <View style={styles.contentContainer}>
      <Text style={styles.emoji}>👋</Text>
      <Text style={styles.stepTitle}>{currentStep.title}</Text>
      <Text style={styles.stepDescription}>{currentStep.description}</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
          <Text style={styles.primaryButtonText}>Let's Begin!</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={onSkip}>
          <Text style={styles.secondaryButtonText}>Skip Tutorial</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderInteractive = () => (
    <View style={styles.contentContainer}>
      <Text style={styles.emoji}>📚</Text>
      <Text style={styles.stepTitle}>{currentStep.title}</Text>
      <Text style={styles.stepDescription}>{currentStep.description}</Text>

      {/* Visual example */}
      <View style={styles.exampleContainer}>
        <Text style={styles.exampleLabel}>Example:</Text>
        <View style={styles.exampleCards}>
          {getExampleCards(currentStep.rule!).map((card, index) => (
            <View key={index} style={styles.exampleCard}>
              <CardComponent card={card} faceUp={true} size="small" />
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
        <Text style={styles.primaryButtonText}>Got it! Next →</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPractice = () => {
    const currentSlaps = currentStep.rule
      ? progress.practiceSlaps[currentStep.rule]
      : 0;
    const targetSlaps = currentStep.targetSlaps || 3;
    const canProceed = currentSlaps >= targetSlaps;

    return (
      <View style={styles.contentContainer}>
        <Text style={styles.emoji}>🎯</Text>
        <Text style={styles.stepTitle}>{currentStep.title}</Text>
        <Text style={styles.stepDescription}>{currentStep.description}</Text>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Progress: {currentSlaps} / {targetSlaps}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(currentSlaps / targetSlaps) * 100}%` },
              ]}
            />
          </View>
        </View>

        {/* Practice Pile */}
        <View style={styles.pileContainer}>
          {practicePile.length > 0 ? (
            <CardComponent
              card={practicePile[practicePile.length - 1]}
              faceUp={true}
              size="medium"
            />
          ) : (
            <View style={styles.emptyPile}>
              <Text style={styles.emptyPileText}>Tap Deal to start</Text>
            </View>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.practiceButtons}>
          <TouchableOpacity
            style={styles.dealButton}
            onPress={() => generatePracticeCard(currentStep.rule!)}
          >
            <Text style={styles.dealButtonText}>Deal Card</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.slapButton}
            onPress={handlePracticeSlap}
          >
            <Text style={styles.slapButtonText}>👋 SLAP!</Text>
          </TouchableOpacity>
        </View>

        {canProceed && (
          <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
            <Text style={styles.primaryButtonText}>Continue →</Text>
          </TouchableOpacity>
        )}

        <SlapFeedbackAnimation
          active={slapFeedback.active}
          success={slapFeedback.success}
          message={slapFeedback.message}
          x={width / 2}
          y={300}
        />
      </View>
    );
  };

  const renderCompletion = () => (
    <View style={styles.contentContainer}>
      <Text style={styles.emoji}>🎉</Text>
      <Text style={styles.stepTitle}>{currentStep.title}</Text>
      <Text style={styles.stepDescription}>{currentStep.description}</Text>

      <View style={styles.rewardContainer}>
        <Text style={styles.rewardTitle}>Rewards Earned:</Text>
        <Text style={styles.rewardItem}>+{TUTORIAL_REWARD.xp} XP</Text>
        <Text style={styles.rewardItem}>
          🎴 {TUTORIAL_REWARD.cardBack} Card Back Unlocked
        </Text>
        <Text style={styles.rewardItem}>🏆 Tutorial Master Achievement</Text>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleComplete}>
        <Text style={styles.primaryButtonText}>Start Playing!</Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    switch (currentStep.type) {
      case 'WELCOME':
        return renderWelcome();
      case 'INTERACTIVE':
        return renderInteractive();
      case 'PRACTICE':
        return renderPractice();
      case 'COMPLETION':
        return renderCompletion();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ERS Tutorial</Text>
        <Text style={styles.headerProgress}>
          Step {progress.currentStep + 1} of {TUTORIAL_STEPS.length}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

const getExampleCards = (
  rule: 'doubles' | 'sandwiches' | 'tens' | 'face_cards'
): Card[] => {
  switch (rule) {
    case 'doubles':
      return [
        { rank: '7', suit: 'hearts' },
        { rank: '7', suit: 'diamonds' },
      ];
    case 'sandwiches':
      return [
        { rank: '5', suit: 'clubs' },
        { rank: 'King', suit: 'hearts' },
        { rank: '5', suit: 'spades' },
      ];
    case 'tens':
      return [
        { rank: '7', suit: 'diamonds' },
        { rank: '3', suit: 'clubs' },
      ];
    case 'face_cards':
      return [
        { rank: 'Jack', suit: 'hearts' },
        { rank: '5', suit: 'diamonds' },
        { rank: '9', suit: 'clubs' },
      ];
    default:
      return [];
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginBottom: 4,
  },
  headerProgress: {
    fontSize: 14,
    color: '#94A3B8',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  contentContainer: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
  },
  stepDescription: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  exampleContainer: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
  },
  exampleLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginBottom: 12,
  },
  exampleCards: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  exampleCard: {
    transform: [{ scale: 0.8 }],
  },
  progressContainer: {
    width: '100%',
    marginBottom: 24,
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#1E293B',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  pileContainer: {
    width: 120,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyPile: {
    width: 100,
    height: 140,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#334155',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPileText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  practiceButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  dealButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    minHeight: 64,
    justifyContent: 'center',
  },
  dealButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  slapButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 12,
    minHeight: 64,
    justifyContent: 'center',
  },
  slapButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    marginTop: 16,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  secondaryButton: {
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
  },
  rewardContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    width: '100%',
  },
  rewardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginBottom: 12,
    textAlign: 'center',
  },
  rewardItem: {
    fontSize: 16,
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
});
