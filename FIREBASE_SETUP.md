# Firebase Security Setup Guide

## Overview
This document explains how to deploy Firebase Security Rules and Cloud Functions for the Card Wars app.

## 1. Firebase Security Rules

### Deploy Security Rules

```bash
# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not already done)
firebase init

# Select:
# - Database: Firebase Realtime Database
# - Functions: Cloud Functions
# - Use existing project

# Deploy security rules
firebase deploy --only database
```

### What the Rules Do

The security rules in `firebase.rules.json` enforce:

1. **Authentication Required**: All reads/writes require authentication
2. **Player Authorization**: Players can only access games they're part of
3. **Data Validation**: Ensures required fields exist
4. **Separate Game Collections**: Each game type has its own secured collection

### Testing Rules Locally

```bash
# Install emulator suite
firebase emulators:start

# Rules will be loaded from firebase.rules.json
# Test your app against local emulator at localhost:9000
```

## 2. Cloud Functions Setup

### Structure
```
/functions
  /src
    - index.ts          # Main exports
    - gameValidation.ts # Move validation
    - turnTimer.ts      # Turn timeout handling
    - ersLagComp.ts     # ERS slap arbitration
  - package.json
  - tsconfig.json
```

### Deploy Functions

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

## 3. Environment Variables

Set up Firebase config:

```bash
# Set Firebase config for functions
firebase functions:config:set app.environment="production"
```

## 4. Security Checklist

- [x] Security rules deployed
- [ ] Cloud Functions deployed
- [ ] Authentication properly configured
- [ ] All game collections secured
- [ ] Rate limiting enabled
- [ ] Turn timers active
- [ ] Reconnection handling tested

## 5. Testing

### Manual Testing
1. Create two test accounts
2. Start a game
3. Verify only players in game can read/write
4. Test turn timer timeout
5. Test reconnection after disconnect

### Automated Testing
```bash
cd functions
npm test
```

## 6. Monitoring

View logs in Firebase Console:
- Functions > Logs
- Database > Usage
- Authentication > Users

## 7. Emergency Rollback

If issues occur:
```bash
# Revert to previous rules
firebase deploy --only database --force

# Disable specific function
firebase functions:delete functionName
```

## Notes

- Security rules are cached for up to 10 minutes
- Cloud Functions may take 1-2 minutes to deploy
- Monitor costs in Firebase Console > Usage and billing
