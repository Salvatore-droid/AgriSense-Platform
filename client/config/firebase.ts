import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration - MUST use your exact config
const firebaseConfig = {
  apiKey: "AIzaSyD6NPnDw7xruqaVnAKvxYxmX3HIgWCPjTk",
  authDomain: "agrisense-11849.firebaseapp.com",
  projectId: "agrisense-11849",
  storageBucket: "agrisense-11849.firebasestorage.app",
  messagingSenderId: "137280528526",
  appId: "1:137280528526:android:50dd6ac7647a51a5f2e9df",
};

// Initialize Firebase
let app;
let auth;
let db;
let storage;

try {
  console.log('🚀 Initializing Firebase for Expo...');
  
  // 1. Initialize Firebase App
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase App initialized');
  
  // 2. Initialize Auth with AsyncStorage persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
  console.log('✅ Firebase Auth initialized');
  
  // 3. Initialize Firestore
  db = getFirestore(app);
  console.log('✅ Firebase Firestore initialized');
  
  // 4. Initialize Storage
  storage = getStorage(app);
  console.log('✅ Firebase Storage initialized');
  
  console.log('🎉 All Firebase services ready for Expo!');
  
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
    console.log('⚠️ Firebase offline (normal for first connection)');
    return false;
  }
};