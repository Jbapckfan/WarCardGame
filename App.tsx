import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { MenuScreen } from './src/screens/MenuScreen';
import { GameScreen } from './src/screens/GameScreen';
import { ERSScreen } from './src/screens/ERSScreen';
import { UnoScreen } from './src/screens/UnoScreen';
import { Phase10Screen } from './src/screens/Phase10Screen';
import { CustomGameCreatorScreen } from './src/screens/CustomGameCreatorScreen';
import { CustomGameScreen } from './src/screens/CustomGameScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { GameTemplate } from './src/types/customGame';

type GameType = 'war' | 'ers' | 'uno' | 'phase10' | 'custom' | null;

function AppContent() {
  const { theme } = useTheme();
  const [currentScreen, setCurrentScreen] = useState<'menu' | 'game' | 'custom-creator' | 'settings'>('menu');
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [gameType, setGameType] = useState<GameType>(null);
  const [customTemplate, setCustomTemplate] = useState<GameTemplate | null>(null);

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
    setCustomTemplate(null);
  };

  const handleOpenCustomCreator = () => {
    setCurrentScreen('custom-creator');
  };

  const handleStartCustomGame = (template: GameTemplate) => {
    setGameId(`custom_${Date.now()}`);
    setPlayerId(`player_${Date.now()}`);
    setGameType('custom');
    setCustomTemplate(template);
    setCurrentScreen('game');
  };

  const handleOpenSettings = () => {
    setCurrentScreen('settings');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style="light" />
      {currentScreen === 'menu' ? (
        <MenuScreen
          onStartGame={handleStartGame}
          onOpenCustomCreator={handleOpenCustomCreator}
          onOpenSettings={handleOpenSettings}
        />
      ) : currentScreen === 'settings' ? (
        <SettingsScreen onExit={handleExitGame} />
      ) : currentScreen === 'custom-creator' ? (
        <CustomGameCreatorScreen
          onStartCustomGame={handleStartCustomGame}
          onExit={handleExitGame}
        />
      ) : gameId && playerId ? (
        gameType === 'custom' && customTemplate ? (
          <CustomGameScreen
            gameId={gameId}
            playerId={playerId}
            template={customTemplate}
            onExit={handleExitGame}
          />
        ) : gameType === 'uno' ? (
          <UnoScreen gameId={gameId} playerId={playerId} onExit={handleExitGame} />
        ) : gameType === 'phase10' ? (
          <Phase10Screen gameId={gameId} playerId={playerId} onExit={handleExitGame} />
        ) : gameType === 'ers' ? (
          <ERSScreen gameId={gameId} playerId={playerId} onExit={handleExitGame} />
        ) : (
          <GameScreen gameId={gameId} playerId={playerId} onExit={handleExitGame} />
        )
      ) : null}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
});
