# Fix Apple Developer Agreement Issue

## Step 1: Accept Program License Agreement

1. **Go to:** https://developer.apple.com/account
2. **Sign in** with your Apple ID (james.alford@gmail.com)
3. You'll see a banner saying **"Program License Agreement Update"**
4. Click **"Review Agreement"**
5. Read and click **"Agree"**
6. Done! This only needs to be done once.

## Step 2: Build the App

Once you've accepted the agreement, run:

```bash
cd /Users/jamesalford/WarCardGame
npx expo run:ios --device "Beau's iPad Pro 10.5\""
```

## What I Fixed:

✅ Removed push notifications capability (was causing provisioning errors)
✅ Regenerated iOS project without notification entitlements
✅ App will now build with basic capabilities only

You can add push notifications later if needed!

## Next Steps After Agreement:

1. Accept the agreement (link above)
2. Make sure Beau's iPad has Developer Mode enabled
3. Keep iPad unlocked and connected
4. Run the build command above
5. App will install automatically!
