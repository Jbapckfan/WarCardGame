import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

type GameType = 'war' | 'ers' | 'gofish' | 'uno' | 'hearts' | 'phase10' | 'kings';

interface GameRulesScreenProps {
  gameType: GameType;
  onBack: () => void;
}

const GAME_RULES = {
  war: {
    title: '⚔️ War',
    objective: 'Win all the cards by having the higher card in each battle.',
    setup: [
      'Shuffle a standard 52-card deck',
      'Deal all cards equally to both players',
      'Players keep their cards face-down',
    ],
    gameplay: [
      'Both players flip their top card simultaneously',
      'The player with the higher card wins both cards',
      'Aces are high (A > K > Q > J > 10... > 2)',
      'If cards are equal rank, WAR begins!',
    ],
    war: [
      'Each player places 3 cards face-down',
      'Then flips the 4th card face-up',
      'Higher 4th card wins all cards in the pile',
      '6-7 Rule: If 6 or 7 triggered war, only 1 card face-down',
    ],
    winning: 'First player to collect all 52 cards wins!',
    tips: [
      'Wars can swing the game dramatically',
      'Keep track of high cards already played',
      'The 6-7 rule makes wars faster and less risky',
    ],
  },
  ers: {
    title: '👋 Egyptian Rat Screw',
    objective: 'Win all cards by slapping the pile when specific patterns appear.',
    setup: [
      'Shuffle a standard 52-card deck',
      'Deal all cards equally to players',
      'Players keep cards face-down without looking',
    ],
    gameplay: [
      'Players take turns playing cards from their deck',
      'Cards are played to a center pile',
      'When a slappable pattern appears, SLAP THE PILE!',
      'Fastest slapper wins all cards in the pile',
    ],
    slapRules: [
      '👥 Doubles: Two cards of the same rank (7-7, K-K)',
      '🥪 Sandwich: Same rank with one card between (5-K-5)',
      '🔟 Adds to 10: Two cards adding to 10 (7-3, 6-4, A-9)',
      '👰 Marriage: King and Queen together',
      '💔 Divorce: King and Queen with one card between',
    ],
    faceCards: [
      'When a face card (J, Q, K, A) is played, opponent must respond',
      'J = 1 card, Q = 2 cards, K = 3 cards, A = 4 cards',
      'If opponent plays a face card back, roles reverse',
      'If opponent fails, face card player wins the pile',
      'You can still slap during face card challenges!',
    ],
    penalties: [
      'Bad slap (no valid pattern): Give 1 card to pile',
      'Keep playing until one player has all cards',
    ],
    tips: [
      'Practice doubles first - easiest to spot',
      'Watch for tens: 1-9, 2-8, 3-7, 4-6, 5-5',
      'Keep your hand hovering over the pile',
      'Speed matters - fastest slap wins',
    ],
  },
  gofish: {
    title: '🐟 Go Fish',
    objective: 'Collect the most "books" (sets of 4 matching cards).',
    setup: [
      'Deal 7 cards to each player (5 cards for 3+ players)',
      'Place remaining cards face-down as the draw pile',
    ],
    gameplay: [
      'On your turn, ask any player for a specific rank',
      'You must have at least one card of that rank to ask',
      'If they have it, they give you ALL cards of that rank',
      'Take another turn if you get the cards you asked for',
      'If they don\'t have it, they say "Go Fish!"',
      'Draw one card from the pile',
    ],
    books: [
      'When you collect all 4 cards of a rank, it\'s a "book"',
      'Place the book face-up in front of you',
      'Books are worth 1 point each',
    ],
    winning: 'Player with the most books when cards run out wins!',
    tips: [
      'Remember what other players ask for',
      'Track which ranks opponents likely have',
      'Try to complete books quickly',
    ],
  },
  uno: {
    title: '🎴 UNO',
    objective: 'Be the first to play all your cards by matching colors or numbers.',
    setup: [
      'Deal 7 cards to each player',
      'Place one card face-up to start the discard pile',
      'Rest of cards form the draw pile',
    ],
    gameplay: [
      'Match the top card by color, number, or symbol',
      'If you can\'t play, draw one card',
      'If that card is playable, you may play it immediately',
      'Say "UNO!" when you have one card left',
    ],
    actionCards: [
      '⏭ Skip: Next player loses their turn',
      '🔄 Reverse: Reverses direction of play',
      '➕2 Draw 2: Next player draws 2 cards and loses turn',
      '🌈 Wild: Change the color to any color you choose',
      '➕4 Wild Draw 4: Change color + next player draws 4 cards',
    ],
    rules: [
      'You can only play Wild Draw 4 if you have no matching color',
      'Forget to say "UNO"? You might have to draw 2 cards!',
      'Can\'t play? Must draw until you can play or pass',
    ],
    winning: 'First player to empty their hand wins!',
    tips: [
      'Save Wild cards for strategic moments',
      'Watch what colors opponents are lacking',
      'Use action cards to control the game flow',
    ],
  },
  hearts: {
    title: '♥ Hearts',
    objective: 'Avoid taking hearts and the Queen of Spades. Lowest score wins!',
    setup: [
      '4 players required',
      'Deal all 52 cards equally (13 cards each)',
      'Pass 3 cards to another player before play begins',
    ],
    gameplay: [
      'Player with 2 of Clubs leads the first trick',
      'Follow suit if possible, otherwise play any card',
      'Highest card of the led suit wins the trick',
      'Winner of trick leads the next trick',
    ],
    scoring: [
      'Each ♥ = 1 point',
      'Queen of ♠ = 13 points',
      'You want the LOWEST score',
    ],
    shootingTheMoon: [
      'If one player takes ALL hearts AND the Queen of Spades...',
      'That player gets 0 points',
      'All other players get 26 points!',
      'Very risky but powerful strategy',
    ],
    restrictions: [
      'Cannot lead hearts until hearts are "broken"',
      'Hearts are broken when someone plays a heart',
      'Cannot play hearts or Queen of Spades on first trick',
    ],
    winning: 'Play to 100 points. Lowest score wins!',
    tips: [
      'Avoid taking Queen of Spades (worth 13 points)',
      'Lead with high cards to avoid winning tricks',
      'Watch for "Shoot the Moon" attempts',
    ],
  },
  phase10: {
    title: '🎯 Phase 10',
    objective: 'Complete all 10 phases before your opponents.',
    setup: [
      'Deal 10 cards to each player',
      'Place one card face-up to start discard pile',
      'Rest of cards form the draw pile',
    ],
    gameplay: [
      'On your turn: Draw 1 card (from pile or discard)',
      'Try to complete your current phase',
      'Once completed, lay it down on the table',
      'Play additional cards on any laid-down phases',
      'Discard 1 card to end your turn',
    ],
    phases: [
      'Phase 1: 2 sets of 3',
      'Phase 2: 1 set of 3 + 1 run of 4',
      'Phase 3: 1 set of 4 + 1 run of 4',
      'Phase 4: 1 run of 7',
      'Phase 5: 1 run of 8',
      'Phase 6: 1 run of 9',
      'Phase 7: 2 sets of 4',
      'Phase 8: 7 cards of one color',
      'Phase 9: 1 set of 5 + 1 set of 2',
      'Phase 10: 1 set of 5 + 1 set of 3',
    ],
    terms: [
      'Set: Cards of the same number (7-7-7)',
      'Run: Sequential numbers (3-4-5-6)',
      'Color: All cards same color (red or black)',
    ],
    winning: 'First player to complete Phase 10 wins!',
    tips: [
      'You must complete phases in order',
      'If you don\'t complete your phase, try again next round',
      'Skip cards can block opponents from drawing',
    ],
  },
  kings: {
    title: '👑 Kings in the Corners',
    objective: 'Be the first to play all your cards onto the foundation piles.',
    setup: [
      'Deal 7 cards to each player',
      'Place 4 cards in cross pattern (N, S, E, W)',
      'These are the starting foundation piles',
      'Corner positions (NE, SE, SW, NW) start empty',
    ],
    gameplay: [
      'Play cards in descending order (K, Q, J, 10... 2, A)',
      'Alternate red and black colors',
      'Example: Red 8 → Black 7 → Red 6',
      'Kings can start new corner piles',
      'Can move entire piles onto other piles if they fit',
    ],
    rules: [
      'On your turn: Play as many cards as possible',
      'Must play at least one card if possible',
      'If can\'t play, draw 1 card and end turn',
      'Kings MUST be played in corners when available',
    ],
    piles: [
      'N, S, E, W piles: Regular play (descending, alternating)',
      'Corner piles: Must start with a King',
      'Can merge piles by moving smaller onto larger',
    ],
    winning: 'First player with no cards left wins!',
    tips: [
      'Try to create long sequences',
      'Move piles strategically to open up plays',
      'Save Kings for optimal corner placement',
      'Watch what opponents need to block them',
    ],
  },
};

export const GameRulesScreen: React.FC<GameRulesScreenProps> = ({ gameType, onBack }) => {
  const rules = GAME_RULES[gameType];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Rules</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.gameTitle}>{rules.title}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Objective</Text>
          <Text style={styles.text}>{rules.objective}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Setup</Text>
          {rules.setup.map((item, index) => (
            <Text key={index} style={styles.listItem}>
              • {item}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎮 How to Play</Text>
          {rules.gameplay.map((item, index) => (
            <Text key={index} style={styles.listItem}>
              • {item}
            </Text>
          ))}
        </View>

        {gameType === 'war' && rules.war && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚔️ WAR!</Text>
            {rules.war.map((item, index) => (
              <Text key={index} style={styles.listItem}>
                • {item}
              </Text>
            ))}
          </View>
        )}

        {gameType === 'ers' && rules.slapRules && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👋 Slap Patterns</Text>
            {rules.slapRules.map((item, index) => (
              <Text key={index} style={styles.listItem}>
                {item}
              </Text>
            ))}
          </View>
        )}

        {gameType === 'ers' && rules.faceCards && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🃏 Face Card Challenge</Text>
            {rules.faceCards.map((item, index) => (
              <Text key={index} style={styles.listItem}>
                • {item}
              </Text>
            ))}
          </View>
        )}

        {gameType === 'gofish' && rules.books && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📚 Books</Text>
            {rules.books.map((item, index) => (
              <Text key={index} style={styles.listItem}>
                • {item}
              </Text>
            ))}
          </View>
        )}

        {gameType === 'uno' && rules.actionCards && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎴 Action Cards</Text>
            {rules.actionCards.map((item, index) => (
              <Text key={index} style={styles.listItem}>
                {item}
              </Text>
            ))}
          </View>
        )}

        {gameType === 'hearts' && rules.shootingTheMoon && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🌙 Shooting the Moon</Text>
            {rules.shootingTheMoon.map((item, index) => (
              <Text key={index} style={styles.listItem}>
                • {item}
              </Text>
            ))}
          </View>
        )}

        {gameType === 'hearts' && rules.restrictions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ Restrictions</Text>
            {rules.restrictions.map((item, index) => (
              <Text key={index} style={styles.listItem}>
                • {item}
              </Text>
            ))}
          </View>
        )}

        {gameType === 'phase10' && rules.phases && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 The 10 Phases</Text>
            {rules.phases.map((item, index) => (
              <Text key={index} style={styles.listItem}>
                {item}
              </Text>
            ))}
          </View>
        )}

        {gameType === 'phase10' && rules.terms && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📖 Terms</Text>
            {rules.terms.map((item, index) => (
              <Text key={index} style={styles.listItem}>
                • {item}
              </Text>
            ))}
          </View>
        )}

        {gameType === 'kings' && rules.piles && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎴 Foundation Piles</Text>
            {rules.piles.map((item, index) => (
              <Text key={index} style={styles.listItem}>
                • {item}
              </Text>
            ))}
          </View>
        )}

        {rules.penalties && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>❌ Penalties</Text>
            {rules.penalties.map((item, index) => (
              <Text key={index} style={styles.listItem}>
                • {item}
              </Text>
            ))}
          </View>
        )}

        {rules.rules && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📜 Important Rules</Text>
            {rules.rules.map((item, index) => (
              <Text key={index} style={styles.listItem}>
                • {item}
              </Text>
            ))}
          </View>
        )}

        {rules.scoring && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Scoring</Text>
            {rules.scoring.map((item, index) => (
              <Text key={index} style={styles.listItem}>
                • {item}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Winning</Text>
          <Text style={styles.text}>{rules.winning}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Tips & Strategy</Text>
          {rules.tips.map((item, index) => (
            <Text key={index} style={styles.listItem}>
              • {item}
            </Text>
          ))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: '#60A5FA',
    fontSize: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  placeholder: {
    width: 50,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  gameTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F59E0B',
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    color: '#94A3B8',
    lineHeight: 24,
  },
  listItem: {
    fontSize: 16,
    color: '#94A3B8',
    lineHeight: 24,
    marginBottom: 8,
  },
  bottomPadding: {
    height: 40,
  },
});
