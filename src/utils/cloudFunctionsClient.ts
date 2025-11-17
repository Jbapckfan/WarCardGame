/**
 * Client-side helpers for calling Cloud Functions
 *
 * Note: These require Firebase Functions SDK to be installed:
 * npm install firebase@^10.7.0
 */

import { getFunctions, httpsCallable, HttpsCallableResult } from 'firebase/functions';
import { getApp } from 'firebase/app';

// Initialize Functions
let functions: any;

export const initializeCloudFunctions = () => {
  try {
    const app = getApp();
    functions = getFunctions(app);
    console.log('Cloud Functions initialized');
  } catch (error) {
    console.warn('Cloud Functions not available:', error);
  }
};

/**
 * Validate a game move server-side
 */
export const validateMoveServerSide = async (
  gameId: string,
  playerId: string,
  gameType: string,
  moveType: string,
  moveData: any
): Promise<{ success: boolean; updates?: any; error?: string }> => {
  if (!functions) {
    console.warn('Cloud Functions not initialized - skipping server validation');
    return { success: true }; // Fallback to client-side only
  }

  try {
    const validateMove = httpsCallable(functions, 'validateMove');
    const result: HttpsCallableResult = await validateMove({
      gameId,
      playerId,
      gameType,
      moveType,
      moveData,
    });

    return result.data as any;
  } catch (error: any) {
    console.error('Server validation failed:', error);
    return {
      success: false,
      error: error.message || 'Server validation failed',
    };
  }
};

/**
 * Validate ERS slap with lag compensation
 */
export const validateERSSlapServerSide = async (
  gameId: string,
  playerId: string,
  clientTimestamp: number,
  cardTimestamp: number
): Promise<{
  success: boolean;
  winner?: boolean;
  reactionTime?: number;
  cardsWon?: number;
  message?: string;
  penalty?: boolean;
}> => {
  if (!functions) {
    console.warn('Cloud Functions not initialized - using client-side slap validation');
    return { success: true, winner: true }; // Fallback
  }

  try {
    const validateERSSlap = httpsCallable(functions, 'validateERSSlap');
    const result: HttpsCallableResult = await validateERSSlap({
      gameId,
      playerId,
      clientTimestamp,
      cardTimestamp,
    });

    return result.data as any;
  } catch (error: any) {
    console.error('ERS slap validation failed:', error);
    return {
      success: false,
      message: error.message || 'Slap validation failed',
    };
  }
};

/**
 * Update player presence for reconnection tracking
 */
export const updatePlayerPresence = async (
  gameId: string,
  playerId: string,
  online: boolean
): Promise<void> => {
  // This would typically use Firebase Realtime Database presence
  // The actual implementation depends on your Firebase setup
  console.log(`Player ${playerId} is ${online ? 'online' : 'offline'} in game ${gameId}`);
};

/**
 * Check if Cloud Functions are available
 */
export const areCloudFunctionsAvailable = (): boolean => {
  return functions !== undefined && functions !== null;
};

// Initialize on module load
try {
  initializeCloudFunctions();
} catch (error) {
  console.warn('Could not initialize Cloud Functions on load');
}
