import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { DailyChallenge } from '../types/stats';
import { loadTodaysChallenges } from '../utils/dailyChallengesService';
import { ChallengesSkeleton } from '../components/LoadingStates';

interface DailyChallengesScreenProps {
  onBack: () => void;
}

export const DailyChallengesScreen: React.FC<DailyChallengesScreenProps> = ({ onBack }) => {
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    setLoading(true);
    const todaysChallenges = await loadTodaysChallenges();
    setChallenges(todaysChallenges);
    setLoading(false);
  };

  const completedCount = challenges.filter(c => c.completed).length;
  const totalXP = challenges.reduce((sum, c) => sum + c.reward.xp, 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Daily Challenges</Text>
          <View style={styles.placeholder} />
        </View>
        <ChallengesSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Daily Challenges</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Today's Progress</Text>
        <Text style={styles.summaryProgress}>
          {completedCount} / {challenges.length} Completed
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(completedCount / challenges.length) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.summaryReward}>Total XP Available: {totalXP}</Text>
      </View>

      {/* Challenges List */}
      <ScrollView style={styles.scrollView}>
        <View style={styles.challengesList}>
          {challenges.map(challenge => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const ChallengeCard: React.FC<{ challenge: DailyChallenge }> = ({ challenge }) => {
  const progress = (challenge.progress / challenge.requirement.value) * 100;

  return (
    <View style={[styles.challengeCard, challenge.completed && styles.challengeCardCompleted]}>
      <View style={styles.challengeHeader}>
        <Text style={styles.challengeGame}>{getGameEmoji(challenge.gameType)} {challenge.gameType.toUpperCase()}</Text>
        {challenge.completed && <Text style={styles.completedBadge}>✓ COMPLETE</Text>}
      </View>

      <Text style={styles.challengeTitle}>{challenge.challenge}</Text>

      <View style={styles.challengeProgress}>
        <View style={styles.progressBarSmall}>
          <View style={[styles.progressFillSmall, { width: `${Math.min(100, progress)}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {challenge.progress} / {challenge.requirement.value}
        </Text>
      </View>

      <View style={styles.rewardContainer}>
        <Text style={styles.rewardText}>+{challenge.reward.xp} XP</Text>
        {challenge.reward.coins && (
          <Text style={styles.rewardText}>• {challenge.reward.coins} Coins</Text>
        )}
      </View>
    </View>
  );
};

const getGameEmoji = (gameType: string): string => {
  const emojis: Record<string, string> = {
    war: '⚔️',
    ers: '👋',
    gofish: '🐟',
    uno: '🎴',
    hearts: '♥',
    phase10: '🎯',
    kings: '👑',
  };
  return emojis[gameType] || '🎮';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: '#60A5FA',
    fontSize: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  placeholder: {
    width: 50,
  },
  summaryCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#334155',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  summaryProgress: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginBottom: 12,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#334155',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  summaryReward: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  challengesList: {
    padding: 16,
    gap: 12,
  },
  challengeCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#334155',
  },
  challengeCardCompleted: {
    borderColor: '#10B981',
    backgroundColor: '#064E3B',
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  challengeGame: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  completedBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#10B981',
    backgroundColor: '#022C22',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
  },
  challengeProgress: {
    marginBottom: 12,
  },
  progressBarSmall: {
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFillSmall: {
    height: '100%',
    backgroundColor: '#60A5FA',
  },
  progressText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  rewardContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  rewardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
});
