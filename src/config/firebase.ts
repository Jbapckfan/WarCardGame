import { initializeApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';

// TODO: Replace with your Firebase config
// Get this from Firebase Console > Project Settings > General > Your apps
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "", // Leave empty to disable Firebase
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

let database: Database | null = null;

// Only initialize Firebase if databaseURL is provided
if (firebaseConfig.databaseURL && firebaseConfig.databaseURL.includes('firebaseio.com')) {
  try {
    const app = initializeApp(firebaseConfig);
    database = getDatabase(app);
  } catch (error) {
    console.warn('Firebase initialization failed:', error);
  }
}

export { database };
