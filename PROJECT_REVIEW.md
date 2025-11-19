# Project Review

## Critical Logic/Multiplayer Issues
- **WAR remote decks shared (fixed):** Room creation now stores a single shuffled deck and reserves the second half until another player joins, removing the prior desync where each client shuffled independently. 【F:src/utils/firebaseService.ts†L16-L93】
- **WAR limited to two players:** Room discovery filters to rooms with `< 2` players and the game state only tracks two player slots, so the current implementation cannot host 3-4 player games as requested. Adding multi-player support would require schema changes (player array, turn order, pile handling) and updated UI. 【F:src/utils/firebaseService.ts†L36-L161】【F:src/types/game.ts†L23-L42】
- **ERS is local-only with AI:** The ERS screen bootstraps a mock state with an AI opponent and never connects to Firebase, so the advertised online ERS mode is missing. Multiplayer-ready state management, room lifecycle, and networked slap resolution are needed. 【F:src/screens/ERSScreen.tsx†L29-L120】【F:src/types/ers.ts†L3-L31】
- **ERS slap rules reduced:** Logic currently allows slaps only on doubles, contradicting the README description of sandwiches, tens, marriage, and divorce. This makes gameplay feel incomplete and unbalanced. Implement the additional rules and surface them in the UI. 【F:src/utils/ersLogic.ts†L16-L46】
- **Local WAR ignores menu rule toggle:** When Firebase is unavailable the game auto-enables the 6-7 rule and bypasses the player’s selection, creating rule mismatches between menus and gameplay. Thread the chosen rule into the local state initialization. 【F:src/screens/MenuScreen.tsx†L39-L109】【F:src/screens/GameScreen.tsx†L31-L63】
- **Minimal turn validation:** Online WAR only blocks input when `currentTurn` mismatches, but lacks server-side enforcement or optimistic locking. Simultaneous presses could clobber state. Introduce atomic server updates (transactions) and per-turn move timestamps to prevent race conditions. 【F:src/screens/GameScreen.tsx†L114-L214】

## UI/Animation Opportunities
- **Menu clarity:** Add inline validation (disabled buttons) when the player name is required for online play, show connection/Firebase status, and surface room capacity/latency indicators to build trust for remote users. 【F:src/screens/MenuScreen.tsx†L24-L196】
- **Game affordances:** Provide clearer turn affordances (glow/pulse on the active player area), countdowns for slow turns, and tactile feedback on the play button to reduce accidental taps. Consider haptic feedback hooks alongside the existing Reanimated flourishes. 【F:src/screens/GameScreen.tsx†L109-L214】【F:src/components/CardComponent.tsx†L27-L170】
- **ERS visual hierarchy:** Elevate the pile/hand contrast with drop shadows, add a timer ring on face-card challenges, and highlight valid slap moments (brief color flash) so remote players share a common visual language. Also expand the on-screen rules list to match the full slap rule set once implemented. 【F:src/screens/ERSScreen.tsx†L205-L365】【F:src/utils/ersLogic.ts†L16-L46】
- **Accessibility:** Current color choices rely on contrast against dark backgrounds; verify WCAG contrast, add larger text toggles, and ensure buttons have focus/press states for better usability across devices. 【F:src/screens/MenuScreen.tsx†L198-L360】【F:src/screens/GameScreen.tsx†L480-L570】

## Missing/Desired Game Modes
- To reach a broader audience and support 2-4 players, consider adding quick-to-learn modes like **Crazy Eights** or **Spades** (partner/team play). These complement WAR/ERS while fitting the card theme and can share the same room/join flow.

## Remote/Online Experience Gaps
- **Global reliability:** There is no handling for network drop/reconnect, push token refresh, or clock skew. Add presence/heartbeat data in Firebase, reconnect logic on listeners, and deterministic seeding so any late joiner reconstructs state consistently. 【F:src/utils/firebaseService.ts†L92-L163】【F:src/screens/MenuScreen.tsx†L39-L196】
- **Room lifecycle hygiene:** Finished games/rooms are never cleaned up automatically, which can clutter the lobby and leak data. Introduce TTL or periodic cleanup jobs and mark winners in the room metadata for post-game summaries. 【F:src/utils/firebaseService.ts†L141-L163】
- **Security rules:** The repo lacks Firebase security rule definitions. Add rules to restrict writes to participants, validate turn order, and prevent deck tampering to ensure fair online play worldwide.

## Recommendations Summary
1. Keep deck generation centralized in Firebase and continue sharing the same shuffled deck across all players before splitting it.
2. Redesign game state to support 2-4 players (array of players, dynamic turn index, shared discard/pile) and update UI accordingly.
3. Implement true online ERS with full slap rule coverage, synchronized pile animations, and anti-cheat validations.
4. Harden multiplayer with transactions, reconnect/presence tracking, and security rules; surface connection status in the UI.
5. Enhance visual feedback (turn highlights, timers, richer slap cues) and accessibility across both games.
6. Expand the catalog with at least one 4-player-friendly mode to meet the requested player count range.

## Additional Improvement Ideas
- **State persistence & resuming:** Enable Firebase persistence/reconnect flows so a player can relaunch the app and rejoin an in-progress match without losing their deck or turn context. The current listeners and game state do not restore abandoned sessions. 【F:src/screens/MenuScreen.tsx†L39-L196】【F:src/utils/firebaseService.ts†L92-L163】
- **Error handling and user feedback:** Add toast or modal messaging for network failures (e.g., room join denied, Firebase unreachable) instead of silent falls back to local play. Today, joins simply return `false` without UI context. 【F:src/utils/firebaseService.ts†L41-L82】【F:src/screens/MenuScreen.tsx†L81-L196】
- **Push/notifications:** Use the stored `pushToken` fields to notify invited friends when a room is ready or when it is their turn; currently tokens are saved but never used. 【F:src/utils/firebaseService.ts†L7-L83】【F:src/types/game.ts†L23-L42】
- **Testing coverage:** Add unit tests for card splitting/shuffling, slap rule validation, and Firebase room flows to prevent regressions. There is no automated test suite in the repo. 【F:package.json†L1-L39】【F:src/utils/ersLogic.ts†L16-L46】
- **Continuous integration:** Introduce CI lint/type-check/build steps (e.g., GitHub Actions) to catch issues on PRs and ensure Expo builds remain healthy across platforms. The project currently lacks any CI configuration. 【F:package.json†L1-L39】
