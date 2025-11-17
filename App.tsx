import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';
import { MenuScreen } from './src/screens/MenuScreen';
import { GameScreen } from './src/screens/GameScreen';
import { ERSScreen } from './src/screens/ERSScreen';
import { Phase10Screen } from './src/screens/Phase10Screen';
import { KingsCornersScreen } from './src/screens/KingsCornersScreen';

type GameType = 'war' | 'ers' | 'phase10' | 'kings' | null;

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'menu' | 'game'>('menu');
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [gameType, setGameType] = useState<GameType>(null);

  const handleStartGame = (id: string, pId: string, type: GameType) => {
    setGameId(id);
    setPlayerId(pId);
    setGameType(type);
    setCurrentScreen('game');
  };

  const handleExitGame = () => {
    setCurrentScreen('menu');
    setGameId(null);
    setPlayerId(null);
    setGameType(null);
  };

  const renderGameScreen = () => {
    if (!gameId || !playerId) return null;

    switch (gameType) {
      case 'ers':
        return <ERSScreen gameId={gameId} playerId={playerId} onExit={handleExitGame} />;
      case 'phase10':
        return <Phase10Screen gameId={gameId} playerId={playerId} onExit={handleExitGame} />;
      case 'kings':
        return <KingsCornersScreen gameId={gameId} playerId={playerId} onExit={handleExitGame} />;
      case 'war':
      default:
        return <GameScreen gameId={gameId} playerId={playerId} onExit={handleExitGame} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      {currentScreen === 'menu' ? (
        <MenuScreen onStartGame={handleStartGame} />
      ) : (
        renderGameScreen()
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
});
