import { Card } from '../types/game';
import { HeartsGameState, HeartsPlayer, CardPlayResult } from '../types/hearts';
import { createDeck, shuffleDeck } from './cardUtils';

/**
 * Deal a new Hearts game
 */
export const dealHeartsGame = (gameId: string, playerNames: string[]): HeartsGameState => {
  const deck = shuffleDeck(createDeck());

  // Deal 13 cards to each of 4 players
  const players: HeartsPlayer[] = [];
  for (let i = 0; i < 4; i++) {
    const hand = deck.slice(i * 13, (i + 1) * 13);
    players.push({
      id: `player${i}`,
      name: playerNames[i] || `Player ${i + 1}`,
      hand: hand.sort((a, b) => {
        // Sort by suit, then rank
        if (a.suit !== b.suit) {
          return a.suit.localeCompare(b.suit);
        }
        return a.rank - b.rank;
      }),
      tricksTaken: [],
      score: 0,
      totalScore: 0,
    });
  }

  // Find who has 2 of clubs (starts first trick)
  let startingPlayer = 0;
  for (let i = 0; i < players.length; i++) {
    if (players[i].hand.some(c => c.suit === 'clubs' && c.rank === 2)) {
      startingPlayer = i;
      break;
    }
  }

  return {
    id: gameId,
    players,
    currentTrick: {
      cards: [],
      leadSuit: null,
      winner: null,
    },
    currentTurn: startingPlayer,
    roundNumber: 1,
    gameStatus: 'playing',
    heartsBroken: false,
    firstTrick: true,
    lastAction: `${players[startingPlayer].name} starts with 2 of Clubs`,
    lastActionTime: Date.now(),
    winner: null,
    targetScore: 100,
  };
};

/**
 * Check if a card can be played
 */
export const canPlayCard = (
  state: HeartsGameState,
  player: HeartsPlayer,
  card: Card
): CardPlayResult => {
  const trick = state.currentTrick;

  // First trick: must play 2 of clubs
  if (state.firstTrick && trick.cards.length === 0) {
    if (card.suit !== 'clubs' || card.rank !== 2) {
      return { valid: false, reason: 'Must play 2 of Clubs on first trick' };
    }
    return { valid: true };
  }

  // First trick: no hearts or Queen of Spades allowed
  if (state.firstTrick) {
    if (card.suit === 'hearts') {
      return { valid: false, reason: 'Cannot play hearts on first trick' };
    }
    if (card.suit === 'spades' && card.rank === 12) {
      return { valid: false, reason: 'Cannot play Queen of Spades on first trick' };
    }
  }

  // Must follow suit if possible
  if (trick.leadSuit) {
    const hasSuit = player.hand.some(c => c.suit === trick.leadSuit);
    if (hasSuit && card.suit !== trick.leadSuit) {
      return { valid: false, reason: `Must follow suit (${trick.leadSuit})` };
    }
  }

  // Leading a trick: cannot lead hearts unless hearts broken or only hearts left
  if (trick.cards.length === 0 && card.suit === 'hearts') {
    if (!state.heartsBroken) {
      const onlyHearts = player.hand.every(c => c.suit === 'hearts');
      if (!onlyHearts) {
        return { valid: false, reason: 'Hearts not broken yet' };
      }
    }
  }

  return { valid: true };
};

/**
 * Play a card to the current trick
 */
export const playCard = (
  state: HeartsGameState,
  playerIndex: number,
  card: Card
): HeartsGameState | null => {
  const player = state.players[playerIndex];

  // Validate move
  const validation = canPlayCard(state, player, card);
  if (!validation.valid) {
    return null;
  }

  // Remove card from hand
  const newHand = player.hand.filter(c => c.id !== card.id);
  const newPlayers = [...state.players];
  newPlayers[playerIndex] = { ...player, hand: newHand };

  // Add to trick
  const newTrick = { ...state.currentTrick };
  newTrick.cards = [...newTrick.cards, { playerId: player.id, card }];

  // Set lead suit
  if (newTrick.cards.length === 1) {
    newTrick.leadSuit = card.suit;
  }

  // Check if hearts broken
  let heartsBroken = state.heartsBroken;
  if (card.suit === 'hearts') {
    heartsBroken = true;
  }

  // Trick complete?
  if (newTrick.cards.length === 4) {
    // Determine winner
    const winnerIndex = determineTrickWinner(newTrick);
    const winningCard = newTrick.cards[winnerIndex];

    // Find player index by ID
    const winningPlayerIndex = newPlayers.findIndex(p => p.id === winningCard.playerId);

    // Add trick to winner's taken tricks
    newPlayers[winningPlayerIndex].tricksTaken.push(newTrick.cards.map(c => c.card));

    newTrick.winner = winningCard.playerId;

    // Check if round is over (all hands empty)
    const roundOver = newPlayers.every(p => p.hand.length === 0);

    if (roundOver) {
      // Calculate scores
      newPlayers.forEach(player => {
        const points = calculatePlayerPoints(player);
        player.score = points;
        player.totalScore += points;
      });

      // Check for "shooting the moon"
      const shooter = newPlayers.find(p => p.score === 26);
      if (shooter) {
        // Others get 26 points, shooter gets 0
        newPlayers.forEach(p => {
          if (p.id !== shooter.id) {
            p.score = 26;
            p.totalScore += 26;
          }
        });
        shooter.score = 0;
        // totalScore was already incremented, subtract it
        shooter.totalScore -= 26;
      }

      // Check for game end
      const maxScore = Math.max(...newPlayers.map(p => p.totalScore));
      if (maxScore >= state.targetScore) {
        const winnerIndex = newPlayers.reduce(
          (minIdx, p, idx, arr) => (p.totalScore < arr[minIdx].totalScore ? idx : minIdx),
          0
        );

        return {
          ...state,
          players: newPlayers,
          currentTrick: newTrick,
          heartsBroken,
          gameStatus: 'gameEnd',
          winner: winnerIndex,
          lastAction: `${newPlayers[winnerIndex].name} wins!`,
          lastActionTime: Date.now(),
        };
      }

      return {
        ...state,
        players: newPlayers,
        currentTrick: newTrick,
        heartsBroken,
        gameStatus: 'roundEnd',
        lastAction: 'Round complete!',
        lastActionTime: Date.now(),
      };
    }

    // Start new trick
    return {
      ...state,
      players: newPlayers,
      currentTrick: { cards: [], leadSuit: null, winner: null },
      currentTurn: winningPlayerIndex,
      heartsBroken,
      firstTrick: false,
      lastAction: `${newPlayers[winningPlayerIndex].name} won the trick`,
      lastActionTime: Date.now(),
    };
  }

  // Next player's turn
  const nextTurn = (playerIndex + 1) % 4;

  return {
    ...state,
    players: newPlayers,
    currentTrick: newTrick,
    currentTurn: nextTurn,
    heartsBroken,
    firstTrick: state.firstTrick && newTrick.cards.length < 4,
    lastAction: `${player.name} played ${card.rank} of ${card.suit}`,
    lastActionTime: Date.now(),
  };
};

/**
 * Determine which card won the trick
 */
const determineTrickWinner = (trick: { cards: { playerId: string; card: Card }[]; leadSuit: string | null }): number => {
  let winningIndex = 0;
  let highestRank = trick.cards[0].card.rank;

  for (let i = 1; i < trick.cards.length; i++) {
    const card = trick.cards[i].card;

    // Only cards of lead suit can win
    if (card.suit === trick.leadSuit && card.rank > highestRank) {
      highestRank = card.rank;
      winningIndex = i;
    }
  }

  return winningIndex;
};

/**
 * Calculate points for a player (hearts = 1, Queen of Spades = 13)
 */
const calculatePlayerPoints = (player: HeartsPlayer): number => {
  let points = 0;

  player.tricksTaken.forEach(trick => {
    trick.forEach(card => {
      if (card.suit === 'hearts') {
        points += 1;
      }
      if (card.suit === 'spades' && card.rank === 12) {
        points += 13;
      }
    });
  });

  return points;
};

/**
 * Start a new round
 */
export const startNewRound = (state: HeartsGameState): HeartsGameState => {
  const deck = shuffleDeck(createDeck());

  // Clear tricks and scores
  const players = state.players.map((player, i) => ({
    ...player,
    hand: deck.slice(i * 13, (i + 1) * 13).sort((a, b) => {
      if (a.suit !== b.suit) {
        return a.suit.localeCompare(b.suit);
      }
      return a.rank - b.rank;
    }),
    tricksTaken: [],
    score: 0,
  }));

  // Find who has 2 of clubs
  let startingPlayer = 0;
  for (let i = 0; i < players.length; i++) {
    if (players[i].hand.some(c => c.suit === 'clubs' && c.rank === 2)) {
      startingPlayer = i;
      break;
    }
  }

  return {
    ...state,
    players,
    currentTrick: { cards: [], leadSuit: null, winner: null },
    currentTurn: startingPlayer,
    roundNumber: state.roundNumber + 1,
    gameStatus: 'playing',
    heartsBroken: false,
    firstTrick: true,
    lastAction: `Round ${state.roundNumber + 1} started`,
    lastActionTime: Date.now(),
  };
};
