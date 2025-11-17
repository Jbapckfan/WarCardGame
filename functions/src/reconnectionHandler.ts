import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.database();

const DISCONNECT_TIMEOUT_MS = 30000; // 30 seconds
const MAX_RECONNECT_TIME_MS = 300000; // 5 minutes

/**
 * Handles player disconnect - starts timeout timer
 */
export const handlePlayerDisconnect = functions.database
  .ref('/playerPresence/{gameId}/{playerId}')
  .onDelete(async (snapshot, context) => {
    const { gameId, playerId } = context.params;
    const disconnectTime = Date.now();

    console.log(`Player ${playerId} disconnected from game ${gameId}`);

    // Record disconnect time
    await db.ref(`disconnects/${gameId}/${playerId}`).set({
      disconnectTime,
      status: 'disconnected',
    });

    // Set a timeout to forfeit if not reconnected
    setTimeout(async () => {
      const disconnectRef = db.ref(`disconnects/${gameId}/${playerId}`);
      const disconnectSnap = await disconnectRef.once('value');

      if (disconnectSnap.exists()) {
        const disconnectData = disconnectSnap.val();

        // If still disconnected after timeout
        if (disconnectData.status === 'disconnected') {
          console.log(`Player ${playerId} forfeit due to disconnect timeout`);

          // Find the game
          const gameTypes = ['games', 'goFishGames', 'unoGames', 'heartsGames', 'phase10Games', 'kingsGames'];

          for (const gameType of gameTypes) {
            const gameRef = db.ref(`${gameType}/${gameId}`);
            const gameSnap = await gameRef.once('value');

            if (gameSnap.exists()) {
              const game = gameSnap.val();

              // Determine other player(s)
              const otherPlayerId = getOtherPlayerId(game, playerId);

              if (otherPlayerId) {
                // Forfeit the game
                await gameRef.update({
                  gameStatus: 'finished',
                  winner: otherPlayerId,
                  forfeitedBy: playerId,
                  forfeitReason: 'disconnect_timeout',
                  lastAction: `${getPlayerName(game, playerId)} disconnected and forfeited`,
                  lastActionTime: admin.database.ServerValue.TIMESTAMP,
                });

                console.log(`Game ${gameId} forfeited by ${playerId}`);
              }

              break;
            }
          }

          // Clean up disconnect record
          await disconnectRef.remove();
        }
      }
    }, DISCONNECT_TIMEOUT_MS);

    return null;
  });

/**
 * Handles player reconnect - cancels timeout
 */
export const handlePlayerReconnect = functions.database
  .ref('/playerPresence/{gameId}/{playerId}')
  .onCreate(async (snapshot, context) => {
    const { gameId, playerId } = context.params;

    console.log(`Player ${playerId} reconnected to game ${gameId}`);

    // Check if there's a pending disconnect
    const disconnectRef = db.ref(`disconnects/${gameId}/${playerId}`);
    const disconnectSnap = await disconnectRef.once('value');

    if (disconnectSnap.exists()) {
      const disconnectData = disconnectSnap.val();
      const reconnectTime = Date.now();
      const disconnectDuration = reconnectTime - disconnectData.disconnectTime;

      if (disconnectDuration < MAX_RECONNECT_TIME_MS) {
        console.log(`Player ${playerId} successfully reconnected within time limit`);

        // Update game with reconnection message
        const gameTypes = ['games', 'goFishGames', 'unoGames', 'heartsGames', 'phase10Games', 'kingsGames'];

        for (const gameType of gameTypes) {
          const gameRef = db.ref(`${gameType}/${gameId}`);
          const gameSnap = await gameRef.once('value');

          if (gameSnap.exists()) {
            await gameRef.update({
              lastAction: `${getPlayerName(gameSnap.val(), playerId)} reconnected`,
              lastActionTime: admin.database.ServerValue.TIMESTAMP,
            });
            break;
          }
        }

        // Remove disconnect record
        await disconnectRef.remove();
      }
    }

    return null;
  });

/**
 * Monitor player presence and auto-disconnect on timeout
 * Runs every minute
 */
export const monitorPlayerPresence = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    const now = Date.now();
    const timeout = now - (60000 * 5); // 5 minutes

    const presenceRef = db.ref('playerPresence');
    const snapshot = await presenceRef.once('value');

    const updates: { [key: string]: any } = {};

    snapshot.forEach((gameSnapshot) => {
      const gameId = gameSnapshot.key;
      gameSnapshot.forEach((playerSnapshot) => {
        const playerId = playerSnapshot.key;
        const presenceData = playerSnapshot.val();

        if (presenceData.lastSeen && presenceData.lastSeen < timeout) {
          console.log(`Removing stale presence for player ${playerId} in game ${gameId}`);
          updates[`playerPresence/${gameId}/${playerId}`] = null;
        }
      });
    });

    if (Object.keys(updates).length > 0) {
      await db.ref().update(updates);
    }

    return null;
  });

// Helper functions
function getOtherPlayerId(game: any, currentPlayerId: string): string | null {
  if (game.player1 && game.player2) {
    return game.player1.id === currentPlayerId ? game.player2.id : game.player1.id;
  }

  if (game.players) {
    const otherPlayers = game.players.filter((p: any) => p.id !== currentPlayerId);
    return otherPlayers[0]?.id || null;
  }

  return null;
}

function getPlayerName(game: any, playerId: string): string {
  if (game.player1?.id === playerId) return game.player1.name;
  if (game.player2?.id === playerId) return game.player2.name;

  if (game.players) {
    const player = game.players.find((p: any) => p.id === playerId);
    return player?.name || 'Unknown';
  }

  return 'Unknown';
}
