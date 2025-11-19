import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';
import { MenuScreen } from './src/screens/MenuScreen';
import { GameScreen } from './src/screens/GameScreen';
import { ERSScreen } from './src/screens/ERSScreen';

type GameType = 'war' | 'ers' | null;

interface StartOptions {
  sixSevenRule?: boolean;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'menu' | 'game'>('menu');
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [gameType, setGameType] = useState<GameType>(null);
  const [options, setOptions] = useState<StartOptions | undefined>();

  const handleStartGame = (id: string, pId: string, type: GameType, options?: StartOptions) => {
    setGameId(id);
    setPlayerId(pId);
    setGameType(type);
    setOptions(options);
    setCurrentScreen('game');
  };

  const handleExitGame = () => {
    setCurrentScreen('menu');
    setGameId(null);
    setPlayerId(null);
    setGameType(null);
    setOptions(undefined);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      {currentScreen === 'menu' ? (
        <MenuScreen onStartGame={handleStartGame} />
      ) : gameId && playerId ? (
        gameType === 'ers' ? (
          <ERSScreen gameId={gameId} playerId={playerId} onExit={handleExitGame} />
        ) : (
          <GameScreen
            gameId={gameId}
            playerId={playerId}
            onExit={handleExitGame}
            sixSevenRuleOverride={options?.sixSevenRule}
          />
        )
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
});
