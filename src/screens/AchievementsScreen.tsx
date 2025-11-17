import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Achievement, PlayerStats } from '../types/stats';
import { ACHIEVEMENTS, checkAchievements, getAchievementProgress } from '../utils/achievementsService';
import { loadStats } from '../utils/statsService';

interface AchievementsScreenProps {
  playerId: string;
  onBack: () => void;
}

export const AchievementsScreen: React.FC<AchievementsScreenProps> = ({ playerId, onBack }) => {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadPlayerStats();
  }, [playerId]);

  const loadPlayerStats = async () => {
    const playerStats = await loadStats(playerId);
    if (playerStats) {
      // Check for any new achievements
      const { updatedStats } = await checkAchievements(playerStats);
      setStats(updatedStats);
    }
  };

  if (!stats) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading achievements...</Text>
      </SafeAreaView>
    );
  }

  const categories = ['all', 'general', 'war', 'ers', 'gofish', 'uno', 'hearts', 'phase10', 'kings'];
  const filteredAchievements = selectedCategory === 'all'
    ? ACHIEVEMENTS
    : ACHIEVEMENTS.filter(a => a.category === selectedCategory);

  const unlockedCount = ACHIEVEMENTS.filter(a => stats.achievementsUnlocked.includes(a.id)).length;
  const totalCount = ACHIEVEMENTS.length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Achievements</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress Summary */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {unlockedCount} / {totalCount} Unlocked
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(unlockedCount / totalCount) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.progressPercentage}>
          {((unlockedCount / totalCount) * 100).toFixed(0)}% Complete
        </Text>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        {categories.map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === category && styles.categoryChipTextActive,
              ]}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Achievements List */}
      <ScrollView style={styles.scrollView}>
        <View style={styles.achievementsList}>
          {filteredAchievements.map(achievement => {
            const isUnlocked = stats.achievementsUnlocked.includes(achievement.id);
            const progress = getAchievementProgress(achievement, stats);

            return (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                isUnlocked={isUnlocked}
                progress={progress}
              />
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const AchievementCard: React.FC<{
  achievement: Achievement;
  isUnlocked: boolean;
  progress: number;
}> = ({ achievement, isUnlocked, progress }) => (
  <View style={[styles.achievementCard, !isUnlocked && styles.achievementCardLocked]}>
    <View style={styles.achievementIcon}>
      <Text style={styles.achievementIconText}>{achievement.icon}</Text>
      {isUnlocked && <View style={styles.unlockedBadge} />}
    </View>
    <View style={styles.achievementInfo}>
      <Text style={[styles.achievementName, !isUnlocked && styles.achievementTextLocked]}>
        {achievement.name}
      </Text>
      <Text style={[styles.achievementDescription, !isUnlocked && styles.achievementTextLocked]}>
        {achievement.description}
      </Text>
      <View style={styles.achievementReward}>
        <Text style={styles.rewardText}>+{achievement.reward.xp} XP</Text>
        {achievement.reward.cardBack && (
          <Text style={styles.rewardText}>• {achievement.reward.cardBack} card back</Text>
        )}
        {achievement.reward.theme && (
          <Text style={styles.rewardText}>• {achievement.reward.theme} theme</Text>
        )}
      </View>
      {!isUnlocked && progress > 0 && (
        <View style={styles.progressBarSmall}>
          <View style={[styles.progressFillSmall, { width: `${Math.min(100, progress)}%` }]} />
        </View>
      )}
      {!isUnlocked && progress > 0 && (
        <Text style={styles.progressTextSmall}>{Math.min(100, progress).toFixed(0)}%</Text>
      )}
    </View>
  </View>
);

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
  progressContainer: {
    padding: 16,
    backgroundColor: '#1E293B',
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 12,
    backgroundColor: '#334155',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
  },
  progressPercentage: {
    fontSize: 14,
    color: '#94A3B8',
  },
  categoryScroll: {
    maxHeight: 50,
  },
  categoryContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#F59E0B',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: 'white',
  },
  scrollView: {
    flex: 1,
    marginTop: 16,
  },
  achievementsList: {
    padding: 16,
    gap: 12,
  },
  achievementCard: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  achievementCardLocked: {
    borderColor: '#334155',
    opacity: 0.6,
  },
  achievementIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  achievementIconText: {
    fontSize: 32,
  },
  unlockedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#1E293B',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
  },
  achievementTextLocked: {
    color: '#64748B',
  },
  achievementReward: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rewardText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
  },
  progressBarSmall: {
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFillSmall: {
    height: '100%',
    backgroundColor: '#60A5FA',
  },
  progressTextSmall: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
});
