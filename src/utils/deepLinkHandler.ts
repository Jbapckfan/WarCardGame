import { Linking } from 'react-native';

/**
 * Deep link handler for cardwars:// URLs
 * Handles joining rooms via deep links
 */

export interface DeepLinkData {
  type: 'join' | 'unknown';
  roomCode?: string;
}

/**
 * Parse a deep link URL and extract room code
 */
export const parseDeepLink = (url: string): DeepLinkData | null => {
  if (!url) return null;

  try {
    // Handle both cardwars:// and https:// URLs
    // cardwars://join/ABC123
    // https://cardwars.app/join/ABC123

    const regex = /(?:cardwars:\/\/|https?:\/\/cardwars\.app\/)join\/([A-Z0-9]+)/i;
    const match = url.match(regex);

    if (match && match[1]) {
      return {
        type: 'join',
        roomCode: match[1].toUpperCase(),
      };
    }

    return { type: 'unknown' };
  } catch (error) {
    console.error('Error parsing deep link:', error);
    return null;
  }
};

/**
 * Initialize deep link listener
 * Call this in App.tsx on mount
 */
export const initializeDeepLinking = (
  onJoinRoom: (roomCode: string) => void
): (() => void) => {
  // Handle initial URL (app opened from link)
  Linking.getInitialURL().then((url) => {
    if (url) {
      const data = parseDeepLink(url);
      if (data?.type === 'join' && data.roomCode) {
        onJoinRoom(data.roomCode);
      }
    }
  });

  // Handle subsequent URLs (app already open)
  const subscription = Linking.addEventListener('url', (event) => {
    const data = parseDeepLink(event.url);
    if (data?.type === 'join' && data.roomCode) {
      onJoinRoom(data.roomCode);
    }
  });

  // Return cleanup function
  return () => {
    subscription.remove();
  };
};

/**
 * Create a deep link for a room code
 */
export const createRoomDeepLink = (roomCode: string): string => {
  return `cardwars://join/${roomCode}`;
};

/**
 * Create a web link for a room code (for future web version)
 */
export const createRoomWebLink = (roomCode: string): string => {
  return `https://cardwars.app/join/${roomCode}`;
};
