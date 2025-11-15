# 🎴 Card Wars - Premium Mobile Card Game

A beautiful, feature-rich iOS card game app featuring **WAR** and **Egyptian Rat Screw** with remote multiplayer capabilities!

## ✨ Features

### War Game Mode
- Classic card battle gameplay
- **6-7 Rule**: Optional rule where playing a 6 or 7 triggers a special WAR with only 1 card face down (instead of 3)
- Real-time multiplayer over Firebase
- Beautiful card animations
- Push notifications for turn alerts

### Egyptian Rat Screw Mode
- Fast-paced slapping action
- Multiple slap rules:
  - **Doubles**: Two cards of the same rank
  - **Sandwiches**: Same rank with one card between
  - **Tens**: Two cards that sum to 10
  - **Marriage**: Queen and King together
  - **Divorce**: King and Queen with one card between
- Face card challenges
- Instant feedback animations
- Penalty system for bad slaps

### Premium Features
- Dark, modern UI theme
- Smooth animations powered by Reanimated
- Real-time multiplayer sync
- Push notifications
- Game rooms with join codes
- Rule customization

## 🚀 Setup Instructions

### Prerequisites
- Node.js 16+
- Xcode (for iOS development)
- Firebase account

### Firebase Setup

1. Create a new Firebase project at https://console.firebase.google.com/

2. Enable Realtime Database:
   - Go to Build > Realtime Database
   - Create database in test mode
   - Note your database URL

3. Get your Firebase config:
   - Go to Project Settings > General
   - Scroll down to "Your apps"
   - Add a new iOS app or web app
   - Copy the configuration object

4. Update `src/config/firebase.ts` with your Firebase credentials:
```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on iOS Simulator:
```bash
npm run ios
```

Or scan the QR code with the Expo Go app on your iOS device.

## 🎮 How to Play

### War
1. Enter your name on the main menu
2. Toggle the 6-7 Rule if desired
3. Create a game or join an existing one with a room code
4. Wait for an opponent to join
5. Take turns playing cards - highest card wins!
6. When ranks match (or 6-7 with special rule), WAR is triggered
7. First player to collect all cards wins!

### Egyptian Rat Screw
1. Enter your name on the main menu
2. Create or join an ERS game
3. Take turns playing cards to the center pile
4. Watch for slappable combinations:
   - Doubles (7-7)
   - Sandwiches (7-X-7)
   - Tens (3-7, 4-6, etc.)
   - Marriage (Q-K or K-Q)
   - Divorce (K-X-Q or Q-X-K)
5. SLAP fast when you see a valid combination!
6. Bad slaps cost you a penalty card
7. Face cards start challenges - opponent must play face cards or lose the pile
8. First player to collect all cards wins!

## 📱 Push Notifications

Push notifications alert players when:
- It's their turn to play
- A WAR is triggered
- The game ends

Notifications are automatically set up when you start a game.

## 🛠 Tech Stack

- **Expo / React Native**: Cross-platform mobile framework
- **TypeScript**: Type-safe development
- **Firebase Realtime Database**: Real-time multiplayer sync
- **Expo Notifications**: Push notifications
- **React Native Reanimated**: Smooth, native animations
- **Expo Router**: Navigation

## 📂 Project Structure

```
WarCardGame/
├── src/
│   ├── components/        # Reusable UI components
│   │   └── CardComponent.tsx
│   ├── screens/          # Main screen components
│   │   ├── MenuScreen.tsx
│   │   ├── GameScreen.tsx (War)
│   │   └── ERSScreen.tsx
│   ├── types/            # TypeScript type definitions
│   │   ├── game.ts
│   │   └── ers.ts
│   ├── utils/            # Game logic and utilities
│   │   ├── cardUtils.ts
│   │   ├── gameLogic.ts  (War logic)
│   │   ├── ersLogic.ts   (ERS logic)
│   │   ├── firebaseService.ts
│   │   └── notificationService.ts
│   └── config/
│       └── firebase.ts   # Firebase configuration
├── App.tsx               # Main app component
├── app.json             # Expo configuration
└── package.json         # Dependencies
```

## 🎨 Customization

### Colors
Edit the color schemes in the screen files to match your brand:
- Primary: `#F59E0B` (Amber)
- War theme: `#DC2626` (Red)
- ERS theme: `#7C3AED` (Purple)
- Background: `#0F172A` (Dark slate)

### Rules
Modify game rules in:
- `src/utils/gameLogic.ts` for War
- `src/utils/ersLogic.ts` for Egyptian Rat Screw

## 🐛 Troubleshooting

**Firebase not connecting:**
- Double-check your firebase config in `src/config/firebase.ts`
- Ensure Realtime Database is enabled in Firebase Console
- Check that database rules allow read/write access

**Notifications not working:**
- iOS requires a physical device for push notifications
- Ensure permissions are granted in device settings
- Expo push notifications require the Expo push service

**Build errors:**
- Clear cache: `npm start --clear`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Reset Metro bundler: `npx expo start -c`

## 📝 License

MIT License - Feel free to use this project for learning or building your own card game!

## 🎉 Enjoy!

Have fun playing Card Wars with your friends! Feel free to customize and extend the game with new rules and features.
