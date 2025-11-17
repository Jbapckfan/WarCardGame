import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.database();

const SLAP_WINDOW_MS = 200; // 200ms tolerance window

interface SlapRequest {
  gameId: string;
  playerId: string;
  clientTimestamp: number;
  cardTimestamp: number; // When the card was played
}

/**
 * Server-side slap validation with lag compensation
 * Records server timestamp and determines winner within slap window
 */
export const validateERSSlap = functions.https.onCall(async (data: SlapRequest, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { gameId, playerId, clientTimestamp, cardTimestamp } = data;
  const serverTimestamp = Date.now();

  // Get game state
  const gameRef = db.ref(`games/${gameId}`);
  const gameSnapshot = await gameRef.once('value');

  if (!gameSnapshot.exists()) {
    throw new functions.https.HttpsError('not-found', 'Game not found');
  }

  const gameState = gameSnapshot.val();

  // Check if pile is still slappable
  if (!gameState.pile || gameState.pile.length === 0) {
    throw new functions.https.HttpsError('failed-precondition', 'No cards to slap');
  }

  // Calculate reaction time
  const reactionTime = serverTimestamp - cardTimestamp;

  // Check if slap is valid based on pile
  const topCard = gameState.pile[gameState.pile.length - 1];
  const isValidSlap = checkSlapValidity(gameState.pile);

  if (!isValidSlap) {
    // Invalid slap - penalty
    return {
      success: false,
      penalty: true,
      reactionTime,
      message: 'Invalid slap! Penalty card.'
    };
  }

  // Check for other slaps within the window
  const slapsRef = db.ref(`slapAttempts/${gameId}`);
  const recentSlapsSnapshot = await slapsRef
    .orderByChild('serverTimestamp')
    .startAt(serverTimestamp - SLAP_WINDOW_MS)
    .once('value');

  const slaps: any[] = [];
  recentSlapsSnapshot.forEach((child) => {
    slaps.push({ ...child.val(), id: child.key });
  });

  // Record this slap
  const slapId = await slapsRef.push({
    playerId,
    clientTimestamp,
    serverTimestamp,
    reactionTime,
    valid: true,
  }).key;

  // Determine winner
  let winnerId = playerId;
  let winnerTime = serverTimestamp;

  // If multiple slaps within window, use client timestamp as tiebreaker
  slaps.forEach((slap) => {
    if (slap.clientTimestamp < clientTimestamp && slap.valid) {
      winnerId = slap.playerId;
      winnerTime = slap.serverTimestamp;
    }
  });

  // Award pile to winner
  if (winnerId === playerId) {
    const player = gameState.player1.id === playerId ? gameState.player1 : gameState.player2;
    const newDeck = [...player.deck, ...gameState.pile];

    await gameRef.update({
      pile: [],
      [`${gameState.player1.id === playerId ? 'player1' : 'player2'}/deck`]: newDeck,
      lastAction: `${player.name} won the slap! (${reactionTime}ms)`,
      lastActionTime: admin.database.ServerValue.TIMESTAMP,
      lastSlap: {
        playerId,
        timestamp: serverTimestamp,
        reactionTime,
        valid: true,
      },
      canSlap: false,
    });

    // Clear slap attempts
    await slapsRef.remove();

    return {
      success: true,
      winner: true,
      reactionTime,
      cardsWon: gameState.pile.length,
      message: `Great slap! Won ${gameState.pile.length} cards.`
    };
  } else {
    // Someone else was faster
    return {
      success: true,
      winner: false,
      reactionTime,
      message: 'Someone else slapped first!'
    };
  }
});

function checkSlapValidity(pile: any[]): boolean {
  if (pile.length < 1) return false;

  const topCard = pile[pile.length - 1];

  // Doubles
  if (pile.length >= 2) {
    const secondCard = pile[pile.length - 2];
    if (topCard.rank === secondCard.rank) return true;
  }

  // Sandwiches
  if (pile.length >= 3) {
    const thirdCard = pile[pile.length - 3];
    if (topCard.rank === thirdCard.rank) return true;
  }

  // Tens (two cards add up to 10)
  if (pile.length >= 2) {
    const secondCard = pile[pile.length - 2];
    if (topCard.rank + secondCard.rank === 10) return true;
  }

  // Marriage (King and Queen in either order)
  if (pile.length >= 2) {
    const secondCard = pile[pile.length - 2];
    if ((topCard.rank === 13 && secondCard.rank === 12) ||
        (topCard.rank === 12 && secondCard.rank === 13)) {
      return true;
    }
  }

  // Divorce (Queen and King with any card in between)
  if (pile.length >= 3) {
    const secondCard = pile[pile.length - 2];
    const thirdCard = pile[pile.length - 3];
    if ((topCard.rank === 13 && thirdCard.rank === 12) ||
        (topCard.rank === 12 && thirdCard.rank === 13)) {
      return true;
    }
  }

  return false;
}
