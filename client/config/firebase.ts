import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth, 
  getReactNativePersistence,
  indexedDBLocalPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Your Firebase configuration from the provided JSON
const firebaseConfig = {
  apiKey: "AIzaSyD6NPnDw7xruqaVnAKvxYxmX3HIgWCPjTk",
  authDomain: "agrisense-11849.firebaseapp.com", // You need to set this up
  projectId: "agrisense-11849",
  storageBucket: "agrisense-11849.firebasestorage.app",
  messagingSenderId: "137280528526", // This is your project number
  appId: "1:137280528526:android:50dd6ac7647a51a5f2e9df",
};

// First, let's check if the configuration is valid
console.log('Firebase Config:', {
  apiKey: firebaseConfig.apiKey ? '✅ Set' : '❌ Missing',
  projectId: firebaseConfig.projectId ? '✅ Set' : '❌ Missing',
  appId: firebaseConfig.appId ? '✅ Set' : '❌ Missing',
});

// Initialize Firebase
let app;
let auth;
let db;
let storage;

try {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase app initialized successfully');
  
  // Initialize Auth with platform-specific persistence
  if (Platform.OS === 'web') {
    // For web, use browser persistence
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } else {
    // For React Native, use AsyncStorage
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  }
  
  // Initialize Firestore
  db = getFirestore(app);
  
  // Initialize Storage
  storage = getStorage(app);
  
  console.log('✅ All Firebase services initialized');
  
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  
  // Fallback configuration (for development/testing)
  const fallbackConfig = {
    apiKey: "AIzaSyD6NPnDw7xruqaVnAKvxYxmX3HIgWCPjTk",
    authDomain: "agrisense-11849.firebaseapp.com",
    projectId: "agrisense-11849",
    storageBucket: "agrisense-11849.firebasestorage.app",
    messagingSenderId: "137280528526",
    appId: "1:137280528526:android:50dd6ac7647a51a5f2e9df",
  };
  
  try {
    app = initializeApp(fallbackConfig, 'AgriSenseFallback');
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    console.log('✅ Firebase fallback initialized');
  } catch (fallbackError) {
    console.error('❌ Firebase fallback also failed:', fallbackError);
    throw new Error('Firebase initialization failed. Please check your configuration.');
  }
}

// Test Firebase connection
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    // Simple test to check if Firebase is connected
    await auth.ready;
    return true;
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return false;
  }
}

// Export initialized services
export { app, auth, db, storage };

// Export Firebase types for TypeScript
export type { User } from 'firebase/auth';
export type { DocumentData } from 'firebase/firestore';
