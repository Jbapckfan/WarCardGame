import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Import sub-modules
import { validateMove } from './gameValidation';
import { checkTurnTimeout, cleanupExpiredGames } from './turnTimer';
import { validateERSSlap } from './ersLagCompensation';
import { handlePlayerDisconnect, handlePlayerReconnect } from './reconnectionHandler';

// Export all functions
export { validateMove, checkTurnTimeout, cleanupExpiredGames, validateERSSlap, handlePlayerDisconnect, handlePlayerReconnect };

// Health check endpoint
export const healthCheck = functions.https.onRequest((request, response) => {
  response.json({
    status: 'healthy',
    timestamp: Date.now(),
    version: '1.0.0'
  });
});
