import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { SettingsScreen } from './src/screens/SettingsScreen';
import { CosmeticSelectorScreen } from './src/screens/CosmeticSelectorScreen';
import { GameRulesScreen } from './src/screens/GameRulesScreen';
import { FirstTimeUserModal } from './src/components/FirstTimeUserModal';
import { initializeDeepLinking } from './src/utils/deepLinkHandler';

type GameType = 'war' | 'ers' | 'phase10' | 'kings' | 'gofish' | 'uno' | 'hearts' | null;
type ScreenType = 'menu' | 'game' | 'stats' | 'achievements' | 'dailyChallenges' | 'tutorial' | 'settings' | 'cosmetics' | 'gameRules';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('menu');
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [gameType, setGameType] = useState<GameType>(null);
  const [rulesGameType, setRulesGameType] = useState<GameType>(null);
  const [showFirstTimeModal, setShowFirstTimeModal] = useState(false);
  const [sessionGameState, setSessionGameState] = useState<any>(null);

  // Initialize deep linking and first-time user modal
  useEffect(() => {
    checkFirstTimeUser();
    loadSessionState();

    const cleanupDeepLink = initializeDeepLinking(handleJoinRoomFromLink);
    return cleanupDeepLink;
  }, []);

  const checkFirstTimeUser = async () => {
    try {
      const seen = await AsyncStorage.getItem('tutorial_seen');
      if (!seen) {
        setShowFirstTimeModal(true);
      }
    } catch (error) {
      console.error('Error checking first time user:', error);
    }
  };

  const loadSessionState = async () => {
    try {
      const saved = await AsyncStorage.getItem('session_game_state');
      if (saved) {
        const state = JSON.parse(saved);
        setSessionGameState(state);

        // Optionally auto-restore the game
        Alert.alert(
          'Resume Game?',
          'You have an ongoing game. Would you like to resume?',
          [
            { text: 'No', style: 'cancel', onPress: () => clearSessionState() },
            {
              text: 'Yes',
              onPress: () => {
                setGameId(state.gameId);
                setPlayerId(state.playerId);
                setGameType(state.gameType);
                setCurrentScreen('game');
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  const saveSessionState = async () => {
    if (gameId && playerId && gameType) {
      try {
        await AsyncStorage.setItem(
          'session_game_state',
          JSON.stringify({ gameId, playerId, gameType })
        );
      } catch (error) {
        console.error('Error saving session:', error);
      }
    }
  };

  const clearSessionState = async () => {
    try {
      await AsyncStorage.removeItem('session_game_state');
      setSessionGameState(null);
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  };

  const handleJoinRoomFromLink = (roomCode: string) => {
    Alert.alert(
      'Join Game',
      `Join game with room code ${roomCode}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join',
          onPress: () => {
            // This would need to integrate with MenuScreen's join logic
            // For now, just navigate to menu
            setCurrentScreen('menu');
          },
        },
      ]
    );
  };

  const handleStartGame = (id: string, pId: string, type: GameType) => {
    setGameId(id);
    setPlayerId(pId);
    setGameType(type);
    setCurrentScreen('game');
    saveSessionState();
  };

  const handleExitGame = () => {
    setCurrentScreen('menu');
    setGameId(null);
    setPlayerId(null);
    setGameType(null);
    clearSessionState();
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

  const handleViewSettings = () => {
    setCurrentScreen('settings');
  };

  const handleViewCosmetics = () => {
    setCurrentScreen('cosmetics');
  };

  const handleViewGameRules = (type: GameType) => {
    setRulesGameType(type);
    setCurrentScreen('gameRules');
  };

  const handleBackToMenu = () => {
    setCurrentScreen('menu');
  };

  const handleStartTutorial = async () => {
    await AsyncStorage.setItem('tutorial_seen', 'true');
    setShowFirstTimeModal(false);
    handleViewTutorial();
  };

  const handleSkipTutorial = async () => {
    await AsyncStorage.setItem('tutorial_seen', 'true');
    setShowFirstTimeModal(false);
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
            onViewSettings={handleViewSettings}
            onViewCosmetics={handleViewCosmetics}
            onViewGameRules={handleViewGameRules}
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
      case 'settings':
        return <SettingsScreen playerId={playerId || `player_${Date.now()}`} onBack={handleBackToMenu} />;
      case 'cosmetics':
        return <CosmeticSelectorScreen playerId={playerId || `player_${Date.now()}`} onBack={handleBackToMenu} />;
      case 'gameRules':
        return <GameRulesScreen gameType={rulesGameType || 'war'} onBack={handleBackToMenu} />;
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
            onViewSettings={handleViewSettings}
            onViewCosmetics={handleViewCosmetics}
            onViewGameRules={handleViewGameRules}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      {renderScreen()}
      <FirstTimeUserModal
        visible={showFirstTimeModal}
        onStartTutorial={handleStartTutorial}
        onSkip={handleSkipTutorial}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
});
