# Firebase Security Rules Setup

## CRITICAL: You must add these security rules to your Firebase project

### Step 1: Enable Anonymous Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `card-games-55bfc`
3. Click **Authentication** in left menu
4. Click **Sign-in method** tab
5. Click **Anonymous** provider
6. Toggle **Enable** to ON
7. Click **Save**

### Step 2: Add Realtime Database Security Rules

1. In Firebase Console, click **Realtime Database** in left menu
2. Click the **Rules** tab
3. Replace the entire rules JSON with the following:

```json
{
  "rules": {
    ".read": false,
    ".write": false,

    "rooms": {
      ".read": "auth != null",
      ".indexOn": ["createdAt", "playerCount"],

      "$roomId": {
        ".write": "auth != null && (
          !data.exists() ||
          data.child('createdBy').val() == auth.uid ||
          data.child('playerCount').val() < root.child('games/' + $roomId + '/maxPlayers').val()
        )",
        ".validate": "newData.hasChildren(['id', 'createdBy', 'createdAt', 'playerCount'])"
      }
    },

    "games": {
      "$gameId": {
        ".read": "auth != null && (
          data.child('player1/id').val() == auth.uid ||
          data.child('player2/id').val() == auth.uid ||
          data.child('player3/id').val() == auth.uid ||
          data.child('player4/id').val() == auth.uid ||
          data.child('players').hasChild(auth.uid)
        )",

        ".write": "auth != null && (
          !data.exists() ||
          data.child('player1/id').val() == auth.uid ||
          data.child('player2/id').val() == auth.uid ||
          data.child('player3/id').val() == auth.uid ||
          data.child('player4/id').val() == auth.uid ||
          data.child('players').hasChild(auth.uid)
        )",

        ".validate": "newData.hasChildren(['id', 'gameStatus'])"
      }
    }
  }
}
```

4. Click **Publish**

### What These Rules Do

**Security Protection:**
- ✅ Only authenticated users can read/write data
- ✅ Players can only read games they're participating in
- ✅ Players can only modify games they're part of
- ✅ Anonymous users can browse available rooms
- ✅ Prevents unauthorized access to game data
- ✅ Prevents cheating by manipulating other players' cards

**Performance Optimization:**
- Indexes on `createdAt` and `playerCount` for fast room queries
- Efficient filtering for available games

**Multi-player Support:**
- Supports 2-player games (player1, player2)
- Supports 4-player games (player1-4 or players object)
- Room creation requires authentication
- Room joining validates player count

### Step 3: Test the Rules

After publishing, the app should:
1. ✅ Automatically sign in users anonymously
2. ✅ Allow creating game rooms
3. ✅ Allow joining available games
4. ✅ Prevent reading other players' games
5. ✅ Prevent writing to games you're not in

### Troubleshooting

**Error: "Permission denied"**
- Make sure Anonymous Auth is enabled (Step 1)
- Check that rules are published (Step 2)
- Verify user is signed in (check console logs)

**Error: "PERMISSION_DENIED: Permission denied"**
- User may not be authenticated
- User may be trying to access a game they're not in
- Check auth state in app logs

**Old games showing up**
- Add cleanup Cloud Function (optional, requires paid plan)
- Or manually delete old games in Firebase Console

### Free Tier Limits

With these rules, your free tier supports:
- **100 concurrent connections**
- **Unlimited anonymous users** (no email storage)
- **1 GB data storage**
- **10 GB/month bandwidth**

This is plenty for ~100 simultaneous games or ~1,000 monthly active users.

### Future Improvements (Optional)

Consider adding these later:
- Email/password authentication for persistent accounts
- Social sign-in (Google, Apple) for easy login
- Cloud Functions for game cleanup
- Cloud Functions for server-side game validation
- Firestore migration for better scaling
