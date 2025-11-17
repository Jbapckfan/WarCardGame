import { initializeApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';

// Firebase configuration for Card Wars
const firebaseConfig = {
  apiKey: "AIzaSyCBu2DeTDYk4vW8mcXvH-D5ZFT2ixHG89E",
  authDomain: "card-games-55bfc.firebaseapp.com",
  databaseURL: "https://card-games-55bfc-default-rtdb.firebaseio.com",
  projectId: "card-games-55bfc",
  storageBucket: "card-games-55bfc.firebasestorage.app",
  messagingSenderId: "708628784156",
  appId: "1:708628784156:web:3bfd98cd7bbdd2e0106bd9",
  measurementId: "G-F0S5G196TL"
};

let database: Database | null = null;

// Initialize Firebase
try {
  const app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization failed:', error);
}

export { database };
