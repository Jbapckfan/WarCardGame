import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

/**
 * Shimmer effect for skeleton loading
 */
const ShimmerBox: React.FC<{ width: number | string; height: number; style?: any }> = ({
  width,
  height,
  style,
}) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.3, { duration: 800 })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.shimmer,
        { width, height },
        animatedStyle,
        style,
      ]}
    />
  );
};

/**
 * Skeleton for stats screen
 */
export const StatsSkeleton: React.FC = () => (
  <View style={styles.container}>
    {/* Level badge */}
    <View style={styles.levelSection}>
      <ShimmerBox width={60} height={60} style={styles.levelBadge} />
      <View style={{ flex: 1, marginLeft: 16 }}>
        <ShimmerBox width="60%" height={20} style={{ marginBottom: 8 }} />
        <ShimmerBox width="100%" height={12} style={{ marginBottom: 4 }} />
        <ShimmerBox width="40%" height={12} />
      </View>
    </View>

    {/* Stats cards */}
    <View style={styles.grid}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.statCard}>
          <ShimmerBox width={60} height={32} style={{ marginBottom: 8 }} />
          <ShimmerBox width={80} height={14} />
        </View>
      ))}
    </View>

    {/* Sections */}
    {[1, 2, 3].map((i) => (
      <View key={i} style={styles.section}>
        <ShimmerBox width={120} height={18} style={{ marginBottom: 12 }} />
        <View style={styles.sectionContent}>
          <ShimmerBox width="100%" height={80} />
        </View>
      </View>
    ))}
  </View>
);

/**
 * Skeleton for achievements screen
 */
export const AchievementsSkeleton: React.FC = () => (
  <View style={styles.container}>
    <View style={styles.achievementHeader}>
      <ShimmerBox width={150} height={24} style={{ marginBottom: 8 }} />
      <ShimmerBox width="100%" height={12} style={{ marginBottom: 8 }} />
      <ShimmerBox width="60%" height={14} />
    </View>

    {[1, 2, 3, 4, 5].map((i) => (
      <View key={i} style={styles.achievementCard}>
        <ShimmerBox width={60} height={60} style={{ borderRadius: 30, marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <ShimmerBox width="80%" height={16} style={{ marginBottom: 8 }} />
          <ShimmerBox width="100%" height={14} style={{ marginBottom: 8 }} />
          <ShimmerBox width="50%" height={12} />
        </View>
      </View>
    ))}
  </View>
);

/**
 * Skeleton for daily challenges
 */
export const ChallengesSkeleton: React.FC = () => (
  <View style={styles.container}>
    <View style={styles.challengeHeader}>
      <ShimmerBox width={180} height={24} style={{ marginBottom: 8 }} />
      <ShimmerBox width="100%" height={12} style={{ marginBottom: 8 }} />
      <ShimmerBox width="40%" height={14} />
    </View>

    {[1, 2, 3].map((i) => (
      <View key={i} style={styles.challengeCard}>
        <View style={styles.challengeTop}>
          <ShimmerBox width={100} height={16} />
        </View>
        <ShimmerBox width="90%" height={18} style={{ marginTop: 12, marginBottom: 12 }} />
        <ShimmerBox width="100%" height={8} style={{ marginBottom: 8 }} />
        <ShimmerBox width="60%" height={14} />
      </View>
    ))}
  </View>
);

/**
 * Full-screen loading indicator
 */
export const FullScreenLoading: React.FC<{ message?: string }> = ({
  message = 'Loading...',
}) => (
  <View style={styles.fullScreenContainer}>
    <ActivityIndicator size="large" color="#F59E0B" />
    <Text style={styles.loadingText}>{message}</Text>
  </View>
);

/**
 * Connection error state
 */
export const ConnectionError: React.FC<{ onRetry: () => void; message?: string }> = ({
  onRetry,
  message = 'Failed to connect. Please check your internet connection.',
}) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorEmoji}>📡</Text>
    <Text style={styles.errorTitle}>Connection Error</Text>
    <Text style={styles.errorMessage}>{message}</Text>
    <View style={styles.retryButton} onTouchEnd={onRetry}>
      <Text style={styles.retryButtonText}>Retry</Text>
    </View>
  </View>
);

/**
 * Offline mode indicator
 */
export const OfflineIndicator: React.FC = () => (
  <View style={styles.offlineBanner}>
    <Text style={styles.offlineText}>🔴 Offline - Playing in local mode</Text>
  </View>
);

/**
 * Connection status dot
 */
export const ConnectionStatus: React.FC<{ status: 'online' | 'connecting' | 'offline' }> = ({
  status,
}) => {
  const colors = {
    online: '#10B981',
    connecting: '#F59E0B',
    offline: '#EF4444',
  };

  const labels = {
    online: '🟢 Online',
    connecting: '🟡 Connecting...',
    offline: '🔴 Offline',
  };

  return (
    <View style={styles.connectionStatus}>
      <View style={[styles.statusDot, { backgroundColor: colors[status] }]} />
      <Text style={styles.statusText}>{labels[status]}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 16,
  },
  shimmer: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
  },
  levelSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  levelBadge: {
    borderRadius: 30,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionContent: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
  },
  achievementHeader: {
    padding: 20,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  achievementCard: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  challengeHeader: {
    padding: 20,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  challengeCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  challengeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#94A3B8',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 40,
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  offlineBanner: {
    backgroundColor: '#7F1D1D',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  offlineText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FEF2F2',
    textAlign: 'center',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '600',
  },
});
