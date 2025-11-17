import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';

interface FirstTimeUserModalProps {
  visible: boolean;
  onStartTutorial: () => void;
  onSkip: () => void;
}

export const FirstTimeUserModal: React.FC<FirstTimeUserModalProps> = ({
  visible,
  onStartTutorial,
  onSkip,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.emoji}>👋</Text>
          <Text style={styles.title}>Welcome to Card Wars!</Text>
          <Text style={styles.description}>
            We notice this is your first time here. Would you like to learn how to play
            Egyptian Rat Screw with our interactive tutorial?
          </Text>

          <View style={styles.features}>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>🎓</Text>
              <Text style={styles.featureText}>Learn all the slapping rules</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>🎯</Text>
              <Text style={styles.featureText}>Practice with hands-on exercises</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>🏆</Text>
              <Text style={styles.featureText}>Earn +200 XP and unlock rewards</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={onStartTutorial}>
            <Text style={styles.primaryButtonText}>Start Tutorial</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={onSkip}>
            <Text style={styles.secondaryButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    padding: 20,
  },
  container: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: '#334155',
  },
  emoji: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F59E0B',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  features: {
    marginBottom: 24,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: 'white',
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
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
});
