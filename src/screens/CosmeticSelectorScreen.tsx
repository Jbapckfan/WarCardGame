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
import { loadStats, saveStats } from '../utils/statsService';

interface CosmeticSelectorScreenProps {
  playerId: string;
  onBack: () => void;
}

const CARD_BACKS = [
  { id: 'default', name: 'Classic Blue', unlockLevel: 0, color: '#3B82F6' },
  { id: 'neon', name: 'Neon Glow', unlockLevel: 5, color: '#10B981' },
  { id: 'gold', name: 'Golden Royale', unlockLevel: 10, color: '#F59E0B' },
  { id: 'phoenix', name: 'Phoenix Fire', unlockLevel: 15, color: '#EF4444' },
  { id: 'cosmic', name: 'Cosmic Galaxy', unlockLevel: 20, color: '#8B5CF6' },
  { id: 'platinum', name: 'Platinum Elite', unlockLevel: 25, color: '#94A3B8' },
];

const THEMES = [
  { id: 'default', name: 'Classic', unlockLevel: 0 },
  { id: 'dark', name: 'Midnight Dark', unlockLevel: 3 },
  { id: 'ocean', name: 'Ocean Breeze', unlockLevel: 7 },
  { id: 'sunset', name: 'Sunset Glow', unlockLevel: 12 },
  { id: 'forest', name: 'Forest Green', unlockLevel: 18 },
];

export const CosmeticSelectorScreen: React.FC<CosmeticSelectorScreenProps> = ({
  playerId,
  onBack,
}) => {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [selectedTab, setSelectedTab] = useState<'cardBacks' | 'themes'>('cardBacks');

  useEffect(() => {
    loadPlayerStats();
  }, [playerId]);

  const loadPlayerStats = async () => {
    const playerStats = await loadStats(playerId);
    setStats(playerStats);
  };

  const handleSelectCardBack = async (cardBackId: string) => {
    if (!stats) return;

    const updatedStats = {
      ...stats,
      activeCardBack: cardBackId,
    };

    await saveStats(updatedStats);
    setStats(updatedStats);
  };

  const handleSelectTheme = async (themeId: string) => {
    if (!stats) return;

    const updatedStats = {
      ...stats,
      activeTheme: themeId,
    };

    await saveStats(updatedStats);
    setStats(updatedStats);
  };

  if (!stats) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  const isCardBackUnlocked = (cardBack: typeof CARD_BACKS[0]) => {
    return (
      stats.unlockedCardBacks.includes(cardBack.id) || stats.level >= cardBack.unlockLevel
    );
  };

  const isThemeUnlocked = (theme: typeof THEMES[0]) => {
    return stats.unlockedThemes.includes(theme.id) || stats.level >= theme.unlockLevel;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Customize</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'cardBacks' && styles.activeTab]}
          onPress={() => setSelectedTab('cardBacks')}
        >
          <Text style={[styles.tabText, selectedTab === 'cardBacks' && styles.activeTabText]}>
            Card Backs
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'themes' && styles.activeTab]}
          onPress={() => setSelectedTab('themes')}
        >
          <Text style={[styles.tabText, selectedTab === 'themes' && styles.activeTabText]}>
            Themes
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {selectedTab === 'cardBacks' ? (
          <View style={styles.grid}>
            {CARD_BACKS.map(cardBack => {
              const unlocked = isCardBackUnlocked(cardBack);
              const isActive = stats.activeCardBack === cardBack.id;

              return (
                <TouchableOpacity
                  key={cardBack.id}
                  style={[
                    styles.item,
                    isActive && styles.itemActive,
                    !unlocked && styles.itemLocked,
                  ]}
                  onPress={() => unlocked && handleSelectCardBack(cardBack.id)}
                  disabled={!unlocked}
                >
                  <View
                    style={[
                      styles.cardBackPreview,
                      { backgroundColor: cardBack.color },
                      !unlocked && styles.lockedPreview,
                    ]}
                  >
                    {!unlocked && <Text style={styles.lockIcon}>🔒</Text>}
                    {isActive && <Text style={styles.checkIcon}>✓</Text>}
                  </View>
                  <Text style={[styles.itemName, !unlocked && styles.lockedText]}>
                    {cardBack.name}
                  </Text>
                  {!unlocked && (
                    <Text style={styles.unlockText}>Level {cardBack.unlockLevel}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.grid}>
            {THEMES.map(theme => {
              const unlocked = isThemeUnlocked(theme);
              const isActive = stats.activeTheme === theme.id;

              return (
                <TouchableOpacity
                  key={theme.id}
                  style={[
                    styles.item,
                    isActive && styles.itemActive,
                    !unlocked && styles.itemLocked,
                  ]}
                  onPress={() => unlocked && handleSelectTheme(theme.id)}
                  disabled={!unlocked}
                >
                  <View style={[styles.themePreview, !unlocked && styles.lockedPreview]}>
                    {!unlocked && <Text style={styles.lockIcon}>🔒</Text>}
                    {isActive && <Text style={styles.checkIcon}>✓</Text>}
                    <Text style={styles.themeIcon}>🎨</Text>
                  </View>
                  <Text style={[styles.itemName, !unlocked && styles.lockedText]}>
                    {theme.name}
                  </Text>
                  {!unlocked && <Text style={styles.unlockText}>Level {theme.unlockLevel}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
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
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  item: {
    width: '47%',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  itemActive: {
    borderColor: '#10B981',
  },
  itemLocked: {
    opacity: 0.5,
  },
  cardBackPreview: {
    width: 80,
    height: 120,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  themePreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  lockedPreview: {
    backgroundColor: '#334155',
  },
  lockIcon: {
    fontSize: 32,
  },
  checkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    fontSize: 24,
    color: '#10B981',
  },
  themeIcon: {
    fontSize: 32,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 4,
  },
  lockedText: {
    color: '#64748B',
  },
  unlockText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
});
