export interface TutorialStep {
  id: string;
  type: 'WELCOME' | 'INTERACTIVE' | 'PRACTICE' | 'COMPLETION';
  title: string;
  description: string;
  rule?: 'doubles' | 'sandwiches' | 'tens' | 'face_cards';
  practiceRequired?: boolean;
  targetSlaps?: number;
}

export interface TutorialProgress {
  currentStep: number;
  completedSteps: string[];
  practiceSlaps: {
    doubles: number;
    sandwiches: number;
    tens: number;
  };
  completedAt?: number;
  rewardClaimed: boolean;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    type: 'WELCOME',
    title: 'Welcome to Egyptian Rat Screw!',
    description:
      "ERS is a fast-paced card game where quick reflexes win! You'll slap the pile when you see certain card patterns. Let's learn the rules step by step.",
  },
  {
    id: 'doubles_intro',
    type: 'INTERACTIVE',
    title: 'Rule 1: Doubles',
    description:
      'Slap when TWO cards of the same rank appear back-to-back. For example: 7-7, King-King, or Ace-Ace.',
    rule: 'doubles',
  },
  {
    id: 'doubles_practice',
    type: 'PRACTICE',
    title: 'Practice: Doubles',
    description: 'Great! Now practice slapping on doubles. Try to get 3 correct slaps.',
    rule: 'doubles',
    practiceRequired: true,
    targetSlaps: 3,
  },
  {
    id: 'sandwiches_intro',
    type: 'INTERACTIVE',
    title: 'Rule 2: Sandwiches',
    description:
      'Slap when two cards of the same rank have ONE card between them. For example: 5-King-5 or Jack-3-Jack.',
    rule: 'sandwiches',
  },
  {
    id: 'sandwiches_practice',
    type: 'PRACTICE',
    title: 'Practice: Sandwiches',
    description: 'Now practice sandwiches! Get 3 correct slaps.',
    rule: 'sandwiches',
    practiceRequired: true,
    targetSlaps: 3,
  },
  {
    id: 'tens_intro',
    type: 'INTERACTIVE',
    title: 'Rule 3: Tens',
    description:
      'Slap when two cards add up to 10. For example: 7-3, 6-4, or Ace-9. Face cards (J, Q, K) cannot make tens.',
    rule: 'tens',
  },
  {
    id: 'tens_practice',
    type: 'PRACTICE',
    title: 'Practice: Tens',
    description: 'Practice tens! Get 3 correct slaps.',
    rule: 'tens',
    practiceRequired: true,
    targetSlaps: 3,
  },
  {
    id: 'face_cards_intro',
    type: 'INTERACTIVE',
    title: 'Rule 4: Face Card Challenge',
    description:
      "When a face card is played (J, Q, K, A), the opponent must play cards until they play a face card too. If they can't, you win the pile! You can also slap during face card challenges.",
    rule: 'face_cards',
  },
  {
    id: 'completion',
    type: 'COMPLETION',
    title: 'Tutorial Complete! 🎉',
    description:
      "Excellent work! You've learned all the ERS slapping rules. Remember: doubles, sandwiches, tens, and face card challenges. Now go win some games!",
  },
];

export const TUTORIAL_REWARD = {
  xp: 200,
  cardBack: 'neon',
  achievement: 'tutorial_complete',
};
