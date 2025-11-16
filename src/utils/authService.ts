import { auth } from '../config/firebase';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_ID_KEY = '@user_id';
const PLAYER_NAME_KEY = '@player_name';

/**
 * Initialize anonymous authentication
 * Automatically signs in user anonymously on app start
 */
export const initializeAuth = async (): Promise<User | null> => {
  if (!auth) {
    console.error('❌ Firebase auth not initialized');
    return null;
  }

  try {
    // Check if already authenticated
    if (auth.currentUser) {
      console.log('✅ User already authenticated:', auth.currentUser.uid);
      await AsyncStorage.setItem(USER_ID_KEY, auth.currentUser.uid);
      return auth.currentUser;
    }

    // Sign in anonymously
    const userCredential = await signInAnonymously(auth);
    console.log('✅ Anonymous sign-in successful:', userCredential.user.uid);
    await AsyncStorage.setItem(USER_ID_KEY, userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error('❌ Anonymous sign-in failed:', error);
    return null;
  }
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = (): User | null => {
  return auth?.currentUser || null;
};

/**
 * Get current user ID
 */
export const getCurrentUserId = async (): Promise<string> => {
  const user = getCurrentUser();
  if (user) {
    return user.uid;
  }

  // Fallback to stored ID
  const storedId = await AsyncStorage.getItem(USER_ID_KEY);
  if (storedId) {
    return storedId;
  }

  // Initialize auth if not authenticated
  const newUser = await initializeAuth();
  return newUser?.uid || `guest_${Date.now()}`;
};

/**
 * Listen to auth state changes
 */
export const onAuthChanged = (callback: (user: User | null) => void) => {
  if (!auth) {
    console.error('❌ Firebase auth not initialized');
    return () => {};
  }

  return onAuthStateChanged(auth, callback);
};

/**
 * Save player name locally
 */
export const savePlayerName = async (name: string): Promise<void> => {
  await AsyncStorage.setItem(PLAYER_NAME_KEY, name);
};

/**
 * Get saved player name
 */
export const getPlayerName = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(PLAYER_NAME_KEY);
};

/**
 * Generate a default player name
 */
export const generatePlayerName = (): string => {
  const adjectives = ['Swift', 'Lucky', 'Bold', 'Clever', 'Mighty', 'Sneaky', 'Brave', 'Wise'];
  const nouns = ['Fox', 'Eagle', 'Tiger', 'Wolf', 'Dragon', 'Phoenix', 'Lion', 'Bear'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj}${noun}${Math.floor(Math.random() * 100)}`;
};
