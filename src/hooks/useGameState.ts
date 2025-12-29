import { useState, useEffect, useCallback } from 'react';
import { listenToGameState, updateGameState as updateFirebaseState } from '../utils/firebaseService';

interface UseGameStateOptions {
  gameId: string;
  playerId: string;
  gameType?: string;
  initializeLocalGame?: (gameId: string, playerId: string) => any;
}

export const useGameState = <T = any>({
  gameId,
  playerId,
  gameType = 'generic',
  initializeLocalGame,
}: UseGameStateOptions) => {
  const [gameState, setGameState] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isLocalGame = gameId.startsWith('local_');

  // Initialize game state
  useEffect(() => {
    if (isLocalGame && initializeLocalGame) {
      const initialState = initializeLocalGame(gameId, playerId);
      setGameState(initialState);
      setIsLoading(false);
      return;
    }

    // Firebase game
    const unsubscribe = listenToGameState(gameId, (state) => {
      setGameState(state as T);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [gameId, playerId, isLocalGame]);

  // Update game state (works for both local and Firebase)
  const updateGameState = useCallback(async (updates: Partial<T>) => {
    if (isLocalGame) {
      setGameState((prev) => {
        if (!prev) return prev;
        const newState = { ...prev };

        // Handle dot notation for nested properties
        Object.keys(updates).forEach(key => {
          if (key.includes('.')) {
            const [parent, child] = key.split('.');
            (newState as any)[parent] = {
              ...(newState as any)[parent],
              [child]: (updates as any)[key],
            };
          } else {
            (newState as any)[key] = (updates as any)[key];
          }
        });

        return newState;
      });
    } else {
      await updateFirebaseState(gameId, updates);
    }
  }, [gameId, isLocalGame]);

  return {
    gameState,
    setGameState,
    updateGameState,
    isLoading,
    isLocalGame,
  };
};
