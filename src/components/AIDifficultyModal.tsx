import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { hapticService } from '../utils/hapticService';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

interface AIDifficultyModalProps {
  visible: boolean;
  onSelect: (difficulty: AIDifficulty) => void;
  onClose: () => void;
}

/**
 * Modal for selecting AI difficulty level
 */
export const AIDifficultyModal: React.FC<AIDifficultyModalProps> = ({
  visible,
  onSelect,
  onClose,
}) => {
  const handleSelect = async (difficulty: AIDifficulty) => {
    await hapticService.light();
    onSelect(difficulty);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Difficulty</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.description}>
              Choose your AI opponent's skill level
            </Text>

            {/* Easy Difficulty */}
            <TouchableOpacity
              style={[styles.difficultyButton, styles.easyButton]}
              onPress={() => handleSelect('easy')}
            >
              <View style={styles.difficultyHeader}>
                <Text style={styles.difficultyIcon}>🟢</Text>
                <Text style={styles.difficultyTitle}>Easy</Text>
              </View>
              <Text style={styles.difficultyDescription}>
                Perfect for beginners. AI makes random moves and doesn't use strategy.
              </Text>
              <View style={styles.difficultyStats}>
                <Text style={styles.statText}>• Reaction Time: Slow</Text>
                <Text style={styles.statText}>• Strategy: None</Text>
                <Text style={styles.statText}>• Win Rate: ~25%</Text>
              </View>
            </TouchableOpacity>

            {/* Medium Difficulty */}
            <TouchableOpacity
              style={[styles.difficultyButton, styles.mediumButton]}
              onPress={() => handleSelect('medium')}
            >
              <View style={styles.difficultyHeader}>
                <Text style={styles.difficultyIcon}>🟡</Text>
                <Text style={styles.difficultyTitle}>Medium</Text>
              </View>
              <Text style={styles.difficultyDescription}>
                Balanced challenge. AI uses basic strategy and has decent timing.
              </Text>
              <View style={styles.difficultyStats}>
                <Text style={styles.statText}>• Reaction Time: Medium</Text>
                <Text style={styles.statText}>• Strategy: Basic</Text>
                <Text style={styles.statText}>• Win Rate: ~50%</Text>
              </View>
            </TouchableOpacity>

            {/* Hard Difficulty */}
            <TouchableOpacity
              style={[styles.difficultyButton, styles.hardButton]}
              onPress={() => handleSelect('hard')}
            >
              <View style={styles.difficultyHeader}>
                <Text style={styles.difficultyIcon}>🔴</Text>
                <Text style={styles.difficultyTitle}>Hard</Text>
              </View>
              <Text style={styles.difficultyDescription}>
                Expert challenge. AI uses advanced strategy and lightning-fast reactions.
              </Text>
              <View style={styles.difficultyStats}>
                <Text style={styles.statText}>• Reaction Time: Instant</Text>
                <Text style={styles.statText}>• Strategy: Advanced</Text>
                <Text style={styles.statText}>• Win Rate: ~75%</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    width: '100%',
    maxWidth: 450,
    borderWidth: 2,
    borderColor: '#F59E0B',
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
  },
  difficultyButton: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
  },
  easyButton: {
    backgroundColor: '#064E3B',
    borderColor: '#10B981',
  },
  mediumButton: {
    backgroundColor: '#78350F',
    borderColor: '#F59E0B',
  },
  hardButton: {
    backgroundColor: '#7F1D1D',
    borderColor: '#EF4444',
  },
  difficultyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  difficultyIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  difficultyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  difficultyDescription: {
    fontSize: 14,
    color: '#D1D5DB',
    marginBottom: 12,
    lineHeight: 20,
  },
  difficultyStats: {
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontFamily: 'monospace',
  },
});
