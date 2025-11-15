# Enable Developer Mode on Beau's iPad

To install the Card Wars app directly on the iPad, you need to enable Developer Mode:

## Steps:

1. **On Beau's iPad Pro:**
   - Make sure it's unlocked (not on lock screen)
   - Go to **Settings**
   - Scroll down to **Privacy & Security**
   - Scroll to the bottom and tap **Developer Mode**
   - Toggle it **ON**
   
2. **Restart:**
   - iPad will ask to restart
   - Tap **Restart**
   
3. **After Restart:**
   - Unlock the iPad
   - You'll see a prompt asking to enable Developer Mode
   - Tap **Turn On**
   - Enter passcode if asked

4. **Keep iPad Unlocked:**
   - Keep the iPad unlocked and connected via USB
   - The screen should stay on during installation

## Then Run:

```bash
cd /Users/jamesalford/WarCardGame
npx expo run:ios --device "Beau's iPad Pro 10.5\""
```

The app will build and install automatically!

## After Installation:

If the app won't open:
1. Go to **Settings > General > VPN & Device Management**
2. Find **james.alford@gmail.com**
3. Tap **Trust**
4. Now you can open Card Wars!
