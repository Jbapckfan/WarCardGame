import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.database();

interface MoveRequest {
  gameId: string;
  playerId: string;
  gameType: string;
  moveType: string;
  moveData: any;
}

/**
 * Validates a game move server-side to prevent cheating
 */
export const validateMove = functions.https.onCall(async (data: MoveRequest, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { gameId, playerId, gameType, moveType, moveData } = data;

  // Verify the player is part of this game
  const gameRef = db.ref(`${gameType}Games/${gameId}`);
  const gameSnapshot = await gameRef.once('value');

  if (!gameSnapshot.exists()) {
    throw new functions.https.HttpsError('not-found', 'Game not found');
  }

  const gameState = gameSnapshot.val();

  // Check if player is authorized
  const isAuthorized = isPlayerInGame(gameState, playerId);
  if (!isAuthorized) {
    throw new functions.https.HttpsError('permission-denied', 'Player not in this game');
  }

  // Validate it's the player's turn
  if (!isPlayerTurn(gameState, playerId)) {
    throw new functions.https.HttpsError('failed-precondition', 'Not your turn');
  }

  // Validate the move based on game type
  const validation = await validateGameMove(gameType, moveType, gameState, playerId, moveData);

  if (!validation.valid) {
    throw new functions.https.HttpsError('invalid-argument', validation.error || 'Invalid move');
  }

  // If valid, apply the move with server timestamp
  const updates = {
    ...validation.updates,
    lastActionTime: admin.database.ServerValue.TIMESTAMP,
    lastValidatedBy: 'server',
  };

  await gameRef.update(updates);

  return { success: true, updates };
});

function isPlayerInGame(gameState: any, playerId: string): boolean {
  // Check if player is in 2-player game
  if (gameState.player1?.id === playerId || gameState.player2?.id === playerId) {
    return true;
  }

  // Check if player is in multi-player game
  if (gameState.players) {
    return gameState.players.some((p: any) => p.id === playerId);
  }

  return false;
}

function isPlayerTurn(gameState: any, playerId: string): boolean {
  // For 2-player games
  if (gameState.currentTurn) {
    return gameState.currentTurn === playerId;
  }

  // For multi-player games with index
  if (gameState.currentPlayerIndex !== undefined && gameState.players) {
    return gameState.players[gameState.currentPlayerIndex]?.id === playerId;
  }

  return false;
}

async function validateGameMove(
  gameType: string,
  moveType: string,
  gameState: any,
  playerId: string,
  moveData: any
): Promise<{ valid: boolean; error?: string; updates?: any }> {

  switch (gameType) {
    case 'war':
      return validateWarMove(moveType, gameState, playerId, moveData);
    case 'gofish':
      return validateGoFishMove(moveType, gameState, playerId, moveData);
    case 'uno':
      return validateUnoMove(moveType, gameState, playerId, moveData);
    case 'hearts':
      return validateHeartsMove(moveType, gameState, playerId, moveData);
    case 'phase10':
      return validatePhase10Move(moveType, gameState, playerId, moveData);
    case 'kings':
      return validateKingsMove(moveType, gameState, playerId, moveData);
    default:
      return { valid: false, error: 'Unknown game type' };
  }
}

// Game-specific validation functions
function validateWarMove(moveType: string, gameState: any, playerId: string, moveData: any) {
  // Simple validation - ensure player has cards
  const player = gameState.player1.id === playerId ? gameState.player1 : gameState.player2;

  if (!player.deck || player.deck.length === 0) {
    return { valid: false, error: 'No cards to play' };
  }

  return { valid: true, updates: moveData };
}

function validateGoFishMove(moveType: string, gameState: any, playerId: string, moveData: any) {
  if (moveType === 'ask') {
    const currentPlayer = gameState.players.find((p: any) => p.id === playerId);
    const requestedRank = moveData.rank;

    // Verify player has at least one card of the requested rank
    const hasRank = currentPlayer.hand.some((card: any) => card.rank === requestedRank);

    if (!hasRank) {
      return { valid: false, error: 'You must have at least one card of the rank you ask for' };
    }

    return { valid: true, updates: moveData };
  }

  return { valid: true, updates: moveData };
}

function validateUnoMove(moveType: string, gameState: any, playerId: string, moveData: any) {
  if (moveType === 'play') {
    const { card } = moveData;
    const topCard = gameState.discardPile[gameState.discardPile.length - 1];

    // Check if card can be played
    if (card.color !== 'wild') {
      const canPlay = card.color === gameState.currentColor ||
                      card.value === topCard.value ||
                      card.color === topCard.color;

      if (!canPlay) {
        return { valid: false, error: 'Card cannot be played' };
      }
    }

    return { valid: true, updates: moveData };
  }

  return { valid: true, updates: moveData };
}

function validateHeartsMove(moveType: string, gameState: any, playerId: string, moveData: any) {
  if (moveType === 'play') {
    const { card } = moveData;
    const player = gameState.players.find((p: any) => p.id === playerId);

    // Check if player must follow suit
    if (gameState.leadingSuit) {
      const hasSuit = player.hand.some((c: any) => c.suit === gameState.leadingSuit);
      if (hasSuit && card.suit !== gameState.leadingSuit) {
        return { valid: false, error: 'Must follow suit' };
      }
    }

    // Check if hearts can be led
    if (!gameState.leadingSuit && card.suit === 'hearts' && !gameState.heartsBroken) {
      const onlyHearts = player.hand.every((c: any) => c.suit === 'hearts');
      if (!onlyHearts) {
        return { valid: false, error: 'Hearts not broken yet' };
      }
    }

    return { valid: true, updates: moveData };
  }

  return { valid: true, updates: moveData };
}

function validatePhase10Move(moveType: string, gameState: any, playerId: string, moveData: any) {
  // Basic validation - can be expanded
  return { valid: true, updates: moveData };
}

function validateKingsMove(moveType: string, gameState: any, playerId: string, moveData: any) {
  if (moveType === 'playCard') {
    const { card, pilePosition } = moveData;
    const pile = gameState.piles[pilePosition];

    // Check if card can be played on pile
    if (pile.cards.length === 0) {
      // Empty pile - only kings allowed
      if (card.rank !== 13) {
        return { valid: false, error: 'Only Kings can be played on empty piles' };
      }
    } else {
      const topCard = pile.cards[pile.cards.length - 1];

      // Must be descending rank
      if (card.rank !== topCard.rank - 1) {
        return { valid: false, error: 'Card must be one rank lower' };
      }

      // Must be alternating colors
      const isCardRed = card.suit === 'hearts' || card.suit === 'diamonds';
      const isTopRed = topCard.suit === 'hearts' || topCard.suit === 'diamonds';

      if (isCardRed === isTopRed) {
        return { valid: false, error: 'Must alternate colors' };
      }
    }

    return { valid: true, updates: moveData };
  }

  return { valid: true, updates: moveData };
}
