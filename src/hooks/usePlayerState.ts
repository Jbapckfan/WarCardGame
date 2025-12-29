import { useMemo } from 'react';

interface Player {
  id: string;
  name: string;
  [key: string]: any;
}

interface UsePlayerStateOptions {
  gameState: any;
  playerId: string;
  player1Key?: string;
  player2Key?: string;
  playersArrayKey?: string;
}

export const usePlayerState = ({
  gameState,
  playerId,
  player1Key = 'player1',
  player2Key = 'player2',
  playersArrayKey,
}: UsePlayerStateOptions) => {
  // Determine if this is an array-based or object-based game state
  const players = useMemo(() => {
    if (!gameState) return null;

    if (playersArrayKey && gameState[playersArrayKey]) {
      return gameState[playersArrayKey];
    }

    return [gameState[player1Key], gameState[player2Key]].filter(Boolean);
  }, [gameState, player1Key, player2Key, playersArrayKey]);

  // Find current player
  const myPlayer = useMemo(() => {
    if (!players) return null;
    return players.find((p: Player) => p.id === playerId) || null;
  }, [players, playerId]);

  // Find opponent(s)
  const opponents = useMemo(() => {
    if (!players) return [];
    return players.filter((p: Player) => p.id !== playerId);
  }, [players, playerId]);

  // Check if it's player's turn
  const isMyTurn = useMemo(() => {
    if (!gameState) return false;
    return gameState.currentTurn === playerId;
  }, [gameState?.currentTurn, playerId]);

  // Get player index
  const myPlayerIndex = useMemo(() => {
    if (!players) return -1;
    return players.findIndex((p: Player) => p.id === playerId);
  }, [players, playerId]);

  // Check if player1
  const isPlayer1 = useMemo(() => {
    if (!gameState) return false;
    return gameState[player1Key]?.id === playerId;
  }, [gameState, playerId, player1Key]);

  return {
    players,
    myPlayer,
    opponents,
    opponent: opponents[0] || null, // For 2-player games
    isMyTurn,
    myPlayerIndex,
    isPlayer1,
  };
};
