# Installing Card Wars on Beau's iPad

You have 3 options to get the game on the iPad:

## ⚡ Option 1: Expo Go (Instant - Recommended for Testing)

**Fastest way to play right now:**

1. **On iPad:** Open App Store and download **Expo Go** (free app)
2. **On iPad:** Open Expo Go app
3. **On this Mac:** Make sure the dev server is running:
   ```bash
   cd /Users/jamesalford/WarCardGame
   npm start
   ```
4. **Scan QR Code:** In Expo Go, tap "Scan QR Code" and scan the QR from terminal
5. **Play!** The game loads instantly

**Pros:** Instant, no build needed, see updates immediately
**Cons:** Requires Expo Go app, may have "development mode" banner

---

## 🔨 Option 2: Development Build (Best for Regular Use)

**Create a standalone app without Expo Go:**

1. **Download iOS 26.1 SDK in Xcode:**
   - Open Xcode
   - Go to Settings > Platforms
   - Download "iOS 26.1"
   - Wait ~15-20 minutes for download

2. **Build and Install:**
   ```bash
   cd /Users/jamesalford/WarCardGame
   npx expo run:ios --device "Beau's iPad Pro 10.5\""
   ```

3. **Trust Developer on iPad:**
   - Settings > General > VPN & Device Management
   - Trust "james.alford@gmail.com"
   - Open Card Wars app

**Pros:** Native app, no Expo Go needed
**Cons:** Requires downloading iOS SDK first

---

## 📱 Option 3: TestFlight Distribution (For Long-term)

**Professional distribution method:**

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Build for TestFlight:**
   ```bash
   cd /Users/jamesalford/WarCardGame
   eas build --profile development --platform ios
   ```

3. **Upload to TestFlight:**
   - Follow EAS instructions
   - Add Beau as tester in App Store Connect
   - He installs via TestFlight app

**Pros:** Professional, easy updates, no cables needed
**Cons:** Takes 20-30 minutes for first build

---

## 🎮 Current Status

**Xcode Project:** ✅ Created (`ios/CardWars.xcworkspace`)
**Issue:** iOS 26.1 SDK not installed in Xcode
**Solution:** Either use Expo Go (instant) or download SDK (15 min wait)

---

## Recommended Path

For **playing right now**: Use **Option 1** (Expo Go)

For **permanent installation**: Download iOS SDK then use **Option 2**

For **distributing to others**: Use **Option 3** (TestFlight)

---

## Quick Commands

```bash
# Start dev server
npm start

# Build for iPad (after SDK download)
npx expo run:ios --device "Beau's iPad Pro 10.5\""

# Or with UDID
npx expo run:ios --device 2b936f20ad50323fdf3e15700563d657a4590d50
```

---

## Troubleshooting

**"iOS 26.1 is not installed":**
- Open Xcode > Settings > Platforms
- Download iOS 26.1
- Try build again

**"Cannot find device":**
- Make sure iPad is connected via USB
- Make sure iPad is unlocked
- Trust this computer on iPad

**"App won't open":**
- Settings > General > VPN & Device Management
- Trust developer certificate
