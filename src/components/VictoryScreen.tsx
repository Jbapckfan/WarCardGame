import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface VictoryScreenProps {
  didWin: boolean;
  winnerName?: string;
  victoryTitle?: string;
  victoryMessage?: string;
  defeatTitle?: string;
  defeatMessage?: string;
  themeColor?: string;
  score?: string;
  onExit: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({
  didWin,
  winnerName,
  victoryTitle = '🎉 Victory! 🎉',
  victoryMessage = 'You won the game!',
  defeatTitle = '😔 Defeated 😔',
  defeatMessage = 'Better luck next time!',
  themeColor = '#3B82F6',
  score,
  onExit,
}) => {
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: didWin ? themeColor : '#94A3B8' }]}>
        {didWin ? victoryTitle : defeatTitle}
      </Text>

      <Text style={styles.message}>
        {didWin ? victoryMessage : defeatMessage}
        {!didWin && winnerName && ` ${winnerName} won!`}
      </Text>

      {score && (
        <Text style={[styles.score, { color: themeColor }]}>
          {score}
        </Text>
      )}

      <TouchableOpacity
        style={[styles.button, { backgroundColor: themeColor }]}
        onPress={onExit}
      >
        <Text style={styles.buttonText}>Back to Menu</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  message: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  score: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
