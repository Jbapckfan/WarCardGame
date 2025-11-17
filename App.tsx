import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';
import { MenuScreen } from './src/screens/MenuScreen';
import { GameScreen } from './src/screens/GameScreen';
import { ERSScreen } from './src/screens/ERSScreen';
import { Phase10Screen } from './src/screens/Phase10Screen';
import { KingsCornersScreen } from './src/screens/KingsCornersScreen';
import { GoFishScreen } from './src/screens/GoFishScreen';
import { UnoScreen } from './src/screens/UnoScreen';
import { HeartsScreen } from './src/screens/HeartsScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { AchievementsScreen } from './src/screens/AchievementsScreen';
import { DailyChallengesScreen } from './src/screens/DailyChallengesScreen';
import { TutorialScreen } from './src/screens/TutorialScreen';

type GameType = 'war' | 'ers' | 'phase10' | 'kings' | 'gofish' | 'uno' | 'hearts' | null;

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'menu' | 'game' | 'stats' | 'achievements' | 'dailyChallenges' | 'tutorial'>('menu');
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

  const handleViewStats = () => {
    setCurrentScreen('stats');
  };

  const handleViewAchievements = () => {
    setCurrentScreen('achievements');
  };

  const handleViewDailyChallenges = () => {
    setCurrentScreen('dailyChallenges');
  };

  const handleViewTutorial = () => {
    setCurrentScreen('tutorial');
  };

  const handleBackToMenu = () => {
    setCurrentScreen('menu');
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
      case 'gofish':
        return <GoFishScreen gameId={gameId} playerId={playerId} onExit={handleExitGame} />;
      case 'uno':
        return <UnoScreen gameId={gameId} playerId={playerId} onExit={handleExitGame} />;
      case 'hearts':
        return <HeartsScreen gameId={gameId} playerId={playerId} onExit={handleExitGame} />;
      case 'war':
      default:
        return <GameScreen gameId={gameId} playerId={playerId} onExit={handleExitGame} />;
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'menu':
        return (
          <MenuScreen
            onStartGame={handleStartGame}
            onViewStats={handleViewStats}
            onViewAchievements={handleViewAchievements}
            onViewDailyChallenges={handleViewDailyChallenges}
            onViewTutorial={handleViewTutorial}
          />
        );
      case 'stats':
        return <StatsScreen playerId={playerId || `player_${Date.now()}`} onBack={handleBackToMenu} />;
      case 'achievements':
        return <AchievementsScreen playerId={playerId || `player_${Date.now()}`} onBack={handleBackToMenu} />;
      case 'dailyChallenges':
        return <DailyChallengesScreen onBack={handleBackToMenu} />;
      case 'tutorial':
        return <TutorialScreen onComplete={handleBackToMenu} onSkip={handleBackToMenu} />;
      case 'game':
        return renderGameScreen();
      default:
        return (
          <MenuScreen
            onStartGame={handleStartGame}
            onViewStats={handleViewStats}
            onViewAchievements={handleViewAchievements}
            onViewDailyChallenges={handleViewDailyChallenges}
            onViewTutorial={handleViewTutorial}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      {renderScreen()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
});
