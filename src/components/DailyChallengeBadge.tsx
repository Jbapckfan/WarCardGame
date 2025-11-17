import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { loadTodaysChallenges } from '../utils/dailyChallengesService';

export const DailyChallengeBadge: React.FC = () => {
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(3);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    const challenges = await loadTodaysChallenges();
    const completed = challenges.filter(c => c.completed).length;
    setCompletedCount(completed);
    setTotalCount(challenges.length);
  };

  if (completedCount === 0) return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.text}>
        {completedCount}/{totalCount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  text: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
});
