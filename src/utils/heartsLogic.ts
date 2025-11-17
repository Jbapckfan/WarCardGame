import { Card } from '../types/game';
import { HeartsPlayer, PassDirection } from '../types/hearts';

export const canPlayCard = (
  card: Card,
  hand: Card[],
  leadingSuit: string | null,
  heartsBroken: boolean
): boolean => {
  // First card of trick
  if (!leadingSuit) {
    // Can't lead hearts unless broken or only have hearts
    if (card.suit === 'hearts' && !heartsBroken) {
      const hasOnlyHearts = hand.every(c => c.suit === 'hearts');
      return hasOnlyHearts;
    }
    return true;
  }

  // Must follow suit if possible
  const hasSuit = hand.some(c => c.suit === leadingSuit);
  if (hasSuit) {
    return card.suit === leadingSuit;
  }

  // Can play any card if can't follow suit
  return true;
};

export const determineTrickWinner = (
  trick: Card[],
  playerIds: string[],
  leadingSuit: string
): string => {
  let highestCard = trick[0];
  let winnerIndex = 0;

  for (let i = 1; i < trick.length; i++) {
    const card = trick[i];
    // Only cards of leading suit can win
    if (card.suit === leadingSuit && card.rank > highestCard.rank) {
      highestCard = card;
      winnerIndex = i;
    }
  }

  return playerIds[winnerIndex];
};

export const calculateTrickPoints = (trick: Card[]): number => {
  let points = 0;
  trick.forEach(card => {
    if (card.suit === 'hearts') {
      points += 1;
    } else if (card.suit === 'spades' && card.rank === 12) {
      // Queen of Spades
      points += 13;
    }
  });
  return points;
};

export const hasShootTheMoon = (player: HeartsPlayer): boolean => {
  const totalPoints = player.tricksTaken.reduce((sum, trick) => {
    return sum + calculateTrickPoints(trick);
  }, 0);
  return totalPoints === 26;
};

export const calculateRoundScores = (players: HeartsPlayer[]): HeartsPlayer[] => {
  const updatedPlayers = players.map(p => ({ ...p }));

  // Check for shoot the moon
  const shooterIndex = updatedPlayers.findIndex(hasShootTheMoon);

  if (shooterIndex !== -1) {
    // Subtract 26 from shooter, add 26 to everyone else
    updatedPlayers.forEach((player, idx) => {
      if (idx === shooterIndex) {
        player.score -= 26;
      } else {
        player.score += 26;
      }
    });
  } else {
    // Normal scoring
    updatedPlayers.forEach(player => {
      const roundPoints = player.tricksTaken.reduce((sum, trick) => {
        return sum + calculateTrickPoints(trick);
      }, 0);
      player.score += roundPoints;
    });
  }

  return updatedPlayers;
};

export const getPassDirection = (roundNumber: number): PassDirection => {
  const directions: PassDirection[] = ['left', 'right', 'across', 'none'];
  return directions[roundNumber % 4];
};

export const hasCard = (hand: Card[], suit: string, rank: number): boolean => {
  return hand.some(c => c.suit === suit && c.rank === rank);
};

export const has2OfClubs = (hand: Card[]): boolean => {
  return hasCard(hand, 'clubs', 2);
};
