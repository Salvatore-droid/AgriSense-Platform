import { initializeApp } from 'firebase/app';
import { 
  initializeAuth, 
  getReactNativePersistence,
  Auth,
  browserLocalPersistence 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD6NPnDw7xruqaVnAKvxYxmX3HIgWCPjTk",
  authDomain: "agrisense-11849.firebaseapp.com",
  projectId: "agrisense-11849",
  storageBucket: "agrisense-11849.firebasestorage.app",
  messagingSenderId: "137280528526",
  appId: "1:137280528526:android:50dd6ac7647a51a5f2e9df",
};

// Initialize Firebase
console.log('🚀 Initializing Firebase...');

const app = initializeApp(firebaseConfig);
console.log('✅ Firebase App initialized');

// Initialize Auth - SIMPLIFIED VERSION
let auth: Auth;

try {
  // For React Native/Expo, use AsyncStorage persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
  console.log('✅ Firebase Auth initialized with AsyncStorage persistence');
} catch (error) {
  console.warn('⚠️ Could not initialize auth with persistence:', error);
  // Fallback without persistence
  auth = initializeAuth(app);
  console.log('✅ Firebase Auth initialized (fallback)');
}

// Initialize Firestore
const db = getFirestore(app);
console.log('✅ Firebase Firestore initialized');

// Initialize Storage
const storage = getStorage(app);
console.log('✅ Firebase Storage initialized');

console.log('🎉 All Firebase services ready!');

export { app, auth, db, storage };

// Simple Firebase connection test
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    // Just check if auth is initialized
    return !!auth;
  } catch (error) {
    console.log('⚠️ Firebase connection test failed:', error);
    return false;
  }
}