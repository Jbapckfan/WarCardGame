import { Card } from '../types/game';

/**
 * Edge case handlers to prevent crashes and exploits
 */

// Rate limiting for slaps to prevent spam
const slapAttempts: Map<string, number[]> = new Map();
const MAX_SLAPS_PER_SECOND = 3;
const SLAP_RATE_WINDOW_MS = 1000;

export const rateLimitSlap = (playerId: string): boolean => {
  const now = Date.now();
  const attempts = slapAttempts.get(playerId) || [];

  // Remove old attempts outside the window
  const recentAttempts = attempts.filter(time => now - time < SLAP_RATE_WINDOW_MS);

  if (recentAttempts.length >= MAX_SLAPS_PER_SECOND) {
    console.warn(`Player ${playerId} exceeded slap rate limit`);
    return false; // Rate limit exceeded
  }

  // Record this attempt
  recentAttempts.push(now);
  slapAttempts.set(playerId, recentAttempts);

  return true; // Allowed
};

// Clear rate limit data periodically
setInterval(() => {
  const now = Date.now();
  slapAttempts.forEach((attempts, playerId) => {
    const recentAttempts = attempts.filter(time => now - time < SLAP_RATE_WINDOW_MS);
    if (recentAttempts.length === 0) {
      slapAttempts.delete(playerId);
    } else {
      slapAttempts.set(playerId, recentAttempts);
    }
  });
}, 5000);

/**
 * Handle War with insufficient cards
 * If player doesn't have enough cards for war, they lose automatically
 */
export const handleInsufficientWarCards = (
  player1Deck: Card[],
  player2Deck: Card[],
  cardsNeeded: number
): { winner: 'player1' | 'player2' | null; reason?: string } => {
  const p1HasEnough = player1Deck.length >= cardsNeeded;
  const p2HasEnough = player2Deck.length >= cardsNeeded;

  if (!p1HasEnough && !p2HasEnough) {
    // Both insufficient - most cards wins
    if (player1Deck.length > player2Deck.length) {
      return { winner: 'player1', reason: 'Opponent had insufficient cards' };
    } else if (player2Deck.length > player1Deck.length) {
      return { winner: 'player2', reason: 'Opponent had insufficient cards' };
    } else {
      // Tie - arbitrary winner (player1)
      return { winner: 'player1', reason: 'Both players had insufficient cards (tie)' };
    }
  } else if (!p1HasEnough) {
    return { winner: 'player2', reason: 'Player 1 had insufficient cards' };
  } else if (!p2HasEnough) {
    return { winner: 'player1', reason: 'Player 2 had insufficient cards' };
  }

  return { winner: null }; // Both have enough cards
};

/**
 * Prevent endless games by limiting total turns
 */
const MAX_TURNS = 500;

export const checkGameTurnLimit = (turnCount: number): boolean => {
  return turnCount >= MAX_TURNS;
};

export const resolveTurnLimitTiebreaker = (
  player1Cards: number,
  player2Cards: number
): 'player1' | 'player2' | 'tie' => {
  if (player1Cards > player2Cards) return 'player1';
  if (player2Cards > player1Cards) return 'player2';
  return 'tie';
};

/**
 * Validate deck integrity - prevent card duplication exploits
 */
export const validateDeckIntegrity = (deck: Card[]): boolean => {
  const cardIds = new Set<string>();

  for (const card of deck) {
    if (cardIds.has(card.id)) {
      console.error('Duplicate card detected:', card.id);
      return false; // Duplicate card!
    }
    cardIds.add(card.id);
  }

  return true;
};

/**
 * Sanitize player input to prevent XSS
 */
export const sanitizePlayerName = (name: string): string => {
  return name
    .trim()
    .slice(0, 20) // Max 20 characters
    .replace(/[<>'"]/g, ''); // Remove HTML/script characters
};

/**
 * Handle network errors gracefully
 */
export const handleFirebaseError = (error: any): string => {
  if (!error) return 'Unknown error occurred';

  if (error.code === 'PERMISSION_DENIED') {
    return 'You do not have permission to perform this action';
  }

  if (error.code === 'NETWORK_ERROR') {
    return 'Network error. Please check your connection and try again';
  }

  if (error.code === 'DISCONNECTED') {
    return 'Connection lost. Attempting to reconnect...';
  }

  return error.message || 'An error occurred';
};

/**
 * Prevent simultaneous writes conflicts
 */
export const generateTransactionId = (): string => {
  return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Validate game state before processing
 */
export const isGameStateValid = (gameState: any): boolean => {
  if (!gameState) return false;
  if (!gameState.id) return false;
  if (!gameState.gameStatus) return false;

  // Must have at least one player
  if (!gameState.player1 && (!gameState.players || gameState.players.length === 0)) {
    return false;
  }

  return true;
};

/**
 * Handle deck exhaustion in card games
 */
export const reshuffleDiscardPile = (discardPile: Card[]): Card[] => {
  if (discardPile.length <= 1) {
    return [];
  }

  // Keep the top card, reshuffle the rest
  const topCard = discardPile[discardPile.length - 1];
  const cardsToShuffle = discardPile.slice(0, -1);

  // Fisher-Yates shuffle
  for (let i = cardsToShuffle.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cardsToShuffle[i], cardsToShuffle[j]] = [cardsToShuffle[j], cardsToShuffle[i]];
  }

  return cardsToShuffle;
};
