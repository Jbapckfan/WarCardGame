import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { PlayerStats } from '../types/stats';
import { loadStats } from '../utils/statsService';
import { StatsSkeleton } from '../components/LoadingStates';

interface StatsScreenProps {
  playerId: string;
  onBack: () => void;
}

export const StatsScreen: React.FC<StatsScreenProps> = ({ playerId, onBack }) => {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'games'>('overview');

  useEffect(() => {
    loadPlayerStats();
  }, [playerId]);

  const loadPlayerStats = async () => {
    const playerStats = await loadStats(playerId);
    setStats(playerStats);
  };

  if (!stats) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Statistics</Text>
          <View style={styles.placeholder} />
        </View>
        <StatsSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Statistics</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Level and XP Bar */}
      <View style={styles.levelContainer}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelNumber}>{stats.level}</Text>
        </View>
        <View style={styles.levelInfo}>
          <Text style={styles.playerName}>{stats.playerName}</Text>
          <View style={styles.xpBar}>
            <View
              style={[
                styles.xpFill,
                { width: `${(stats.xp / stats.xpToNextLevel) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.xpText}>
            {stats.xp} / {stats.xpToNextLevel} XP
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'overview' && styles.activeTab]}
          onPress={() => setSelectedTab('overview')}
        >
          <Text style={[styles.tabText, selectedTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'games' && styles.activeTab]}
          onPress={() => setSelectedTab('games')}
        >
          <Text style={[styles.tabText, selectedTab === 'games' && styles.activeTabText]}>
            Per Game
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {selectedTab === 'overview' ? (
          <View style={styles.content}>
            {/* Overall Stats */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Lifetime Stats</Text>

              <View style={styles.statsGrid}>
                <StatCard label="Total Games" value={stats.totalGames.toString()} />
                <StatCard label="Wins" value={stats.wins.toString()} color="#10B981" />
                <StatCard label="Losses" value={stats.losses.toString()} color="#EF4444" />
                <StatCard
                  label="Win Rate"
                  value={`${stats.winRate.toFixed(1)}%`}
                  color="#F59E0B"
                />
              </View>
            </View>

            {/* Streaks */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Streaks</Text>

              <View style={styles.statsGrid}>
                <StatCard
                  label="Current Streak"
                  value={stats.currentStreak >= 0 ? `+${stats.currentStreak}` : stats.currentStreak.toString()}
                  color={stats.currentStreak >= 0 ? '#10B981' : '#EF4444'}
                />
                <StatCard
                  label="Longest Win Streak"
                  value={stats.longestWinStreak.toString()}
                  color="#10B981"
                />
              </View>
            </View>

            {/* Achievements */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Achievements</Text>
              <View style={styles.achievementCount}>
                <Text style={styles.achievementText}>
                  {stats.achievementsUnlocked.length} Unlocked
                </Text>
              </View>
            </View>

            {/* Customization */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Collection</Text>
              <View style={styles.statsGrid}>
                <StatCard
                  label="Card Backs"
                  value={stats.unlockedCardBacks.length.toString()}
                />
                <StatCard label="Themes" value={stats.unlockedThemes.length.toString()} />
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.content}>
            {/* War Stats */}
            <GameStatsSection
              title="⚔️ War"
              stats={[
                { label: 'Games', value: stats.warStats.gamesPlayed },
                { label: 'Wins', value: stats.warStats.wins },
                { label: 'Wars Won', value: stats.warStats.warsWon },
                { label: 'Largest Pile', value: stats.warStats.largestPileWon },
              ]}
            />

            {/* ERS Stats */}
            <GameStatsSection
              title="👋 Egyptian Rat Screw"
              stats={[
                { label: 'Games', value: stats.ersStats.gamesPlayed },
                { label: 'Wins', value: stats.ersStats.wins },
                { label: 'Slaps Landed', value: stats.ersStats.slapsLanded },
                {
                  label: 'Slap Accuracy',
                  value: `${stats.ersStats.slapAccuracy.toFixed(1)}%`,
                },
                {
                  label: 'Fastest Slap',
                  value:
                    stats.ersStats.fastestSlap === Infinity
                      ? 'N/A'
                      : `${stats.ersStats.fastestSlap}ms`,
                },
              ]}
            />

            {/* Go Fish Stats */}
            <GameStatsSection
              title="🐟 Go Fish"
              stats={[
                { label: 'Games', value: stats.goFishStats.gamesPlayed },
                { label: 'Wins', value: stats.goFishStats.wins },
                { label: 'Books Collected', value: stats.goFishStats.booksCollected },
                { label: 'Successful Asks', value: stats.goFishStats.successfulAsks },
              ]}
            />

            {/* UNO Stats */}
            <GameStatsSection
              title="🎴 UNO"
              stats={[
                { label: 'Games', value: stats.unoStats.gamesPlayed },
                { label: 'Wins', value: stats.unoStats.wins },
                { label: 'Wild +4s Played', value: stats.unoStats.draw4sPlayed },
                { label: 'Reversals', value: stats.unoStats.reversalsPlayed },
              ]}
            />

            {/* Hearts Stats */}
            <GameStatsSection
              title="♥ Hearts"
              stats={[
                { label: 'Games', value: stats.heartsStats.gamesPlayed },
                { label: 'Wins', value: stats.heartsStats.wins },
                { label: 'Shoot the Moon', value: stats.heartsStats.shootTheMoonCount },
                { label: 'Queens Taken', value: stats.heartsStats.queensTaken },
              ]}
            />

            {/* Phase 10 Stats */}
            <GameStatsSection
              title="🎯 Phase 10"
              stats={[
                { label: 'Games', value: stats.phase10Stats.gamesPlayed },
                { label: 'Wins', value: stats.phase10Stats.wins },
                { label: 'Highest Phase', value: stats.phase10Stats.highestPhaseReached },
                { label: 'Perfect Games', value: stats.phase10Stats.perfectGames },
              ]}
            />

            {/* Kings Stats */}
            <GameStatsSection
              title="👑 Kings in Corners"
              stats={[
                { label: 'Games', value: stats.kingsStats.gamesPlayed },
                { label: 'Wins', value: stats.kingsStats.wins },
                { label: 'Piles Completed', value: stats.kingsStats.pilesCompleted },
                { label: 'Kings Moved', value: stats.kingsStats.kingsMoved },
              ]}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const StatCard: React.FC<{ label: string; value: string; color?: string }> = ({
  label,
  value,
  color = '#60A5FA',
}) => (
  <View style={styles.statCard}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const GameStatsSection: React.FC<{
  title: string;
  stats: { label: string; value: string | number }[];
}> = ({ title, stats }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.gameStats}>
      {stats.map((stat, index) => (
        <View key={index} style={styles.gameStatRow}>
          <Text style={styles.gameStatLabel}>{stat.label}</Text>
          <Text style={styles.gameStatValue}>{stat.value}</Text>
        </View>
      ))}
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
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    margin: 16,
  },
  levelBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  levelNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  levelInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  xpBar: {
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  xpText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#F59E0B',
  },
  tabText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#F59E0B',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  achievementCount: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  achievementText: {
    fontSize: 16,
    color: '#F59E0B',
    fontWeight: '600',
  },
  gameStats: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
  },
  gameStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  gameStatLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  gameStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
});
