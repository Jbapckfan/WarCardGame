import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.database();

const TURN_TIMEOUT_MS = 30000; // 30 seconds
const GAME_EXPIRY_MS = 3600000; // 1 hour

/**
 * Checks for turn timeouts and auto-forfeits or auto-plays
 * Runs every minute
 */
export const checkTurnTimeout = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    const now = Date.now();
    const cutoff = now - TURN_TIMEOUT_MS;

    // Check all active games
    const gameTypes = ['games', 'goFishGames', 'unoGames', 'heartsGames', 'phase10Games', 'kingsGames'];

    for (const gameType of gameTypes) {
      const gamesRef = db.ref(gameType);
      const snapshot = await gamesRef
        .orderByChild('lastActionTime')
        .endAt(cutoff)
        .once('value');

      const updates: { [key: string]: any } = {};

      snapshot.forEach((childSnapshot) => {
        const game = childSnapshot.val();
        const gameId = childSnapshot.key;

        // Only process games that are actively playing
        if (game.gameStatus === 'playing' && !game.turnTimedOut) {
          console.log(`Turn timeout for game ${gameId}`);

          // Get current player
          const currentPlayer = getCurrentPlayer(game);

          if (currentPlayer) {
            // Mark as timed out and forfeit the turn
            updates[`${gameType}/${gameId}/turnTimedOut`] = true;
            updates[`${gameType}/${gameId}/lastAction`] = `${currentPlayer.name} timed out`;
            updates[`${gameType}/${gameId}/lastActionTime`] = admin.database.ServerValue.TIMESTAMP;

            // Auto-skip to next player
            const nextPlayerIndex = getNextPlayerIndex(game);
            if (nextPlayerIndex !== null) {
              updates[`${gameType}/${gameId}/currentPlayerIndex`] = nextPlayerIndex;
            }

            // Add penalty (optional - can be removed)
            updates[`${gameType}/${gameId}/timeoutCount/${currentPlayer.id}`] = (game.timeoutCount?.[currentPlayer.id] || 0) + 1;

            // If player has timed out 3 times, forfeit the game
            if ((game.timeoutCount?.[currentPlayer.id] || 0) >= 2) {
              updates[`${gameType}/${gameId}/gameStatus`] = 'finished';
              updates[`${gameType}/${gameId}/winner`] = getOtherPlayerId(game, currentPlayer.id);
              updates[`${gameType}/${gameId}/forfeitedBy`] = currentPlayer.id;
            }
          }
        }
      });

      // Apply all updates atomically
      if (Object.keys(updates).length > 0) {
        await db.ref().update(updates);
        console.log(`Applied ${Object.keys(updates).length} turn timeout updates`);
      }
    }

    return null;
  });

/**
 * Cleans up expired games (older than 1 hour with no activity)
 * Runs daily
 */
export const cleanupExpiredGames = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const now = Date.now();
    const cutoff = now - GAME_EXPIRY_MS;

    const gameTypes = ['games', 'goFishGames', 'unoGames', 'heartsGames', 'phase10Games', 'kingsGames'];

    for (const gameType of gameTypes) {
      const gamesRef = db.ref(gameType);
      const snapshot = await gamesRef
        .orderByChild('lastActionTime')
        .endAt(cutoff)
        .once('value');

      const deletes: Promise<void>[] = [];

      snapshot.forEach((childSnapshot) => {
        const gameId = childSnapshot.key;
        if (gameId) {
          console.log(`Deleting expired game: ${gameId}`);
          deletes.push(gamesRef.child(gameId).remove());
        }
      });

      await Promise.all(deletes);
      console.log(`Cleaned up ${deletes.length} expired games from ${gameType}`);
    }

    return null;
  });

// Helper functions
function getCurrentPlayer(game: any): any | null {
  if (game.currentPlayerIndex !== undefined && game.players) {
    return game.players[game.currentPlayerIndex];
  }

  if (game.currentTurn) {
    if (game.player1?.id === game.currentTurn) {
      return game.player1;
    }
    if (game.player2?.id === game.currentTurn) {
      return game.player2;
    }
  }

  return null;
}

function getNextPlayerIndex(game: any): number | null {
  if (game.currentPlayerIndex !== undefined && game.players) {
    const direction = game.direction || 1;
    const nextIndex = (game.currentPlayerIndex + direction + game.players.length) % game.players.length;
    return nextIndex;
  }

  return null;
}

function getOtherPlayerId(game: any, currentPlayerId: string): string | null {
  if (game.player1 && game.player2) {
    return game.player1.id === currentPlayerId ? game.player2.id : game.player1.id;
  }

  if (game.players) {
    const otherPlayer = game.players.find((p: any) => p.id !== currentPlayerId);
    return otherPlayer?.id || null;
  }

  return null;
}
