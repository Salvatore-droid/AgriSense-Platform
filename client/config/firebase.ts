// firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your Firebase config looks correct, but let's ensure it's properly structured
const firebaseConfig = {
  apiKey: "AIzaSyAETa9y1zBLsNi-DR7zwOrWBMiG-mDTOdU",
  authDomain: "agrisense-f4c16.firebaseapp.com",
  projectId: "agrisense-f4c16",
  storageBucket: "agrisense-f4c16.firebasestorage.app",
  messagingSenderId: "655954688754",
  appId: "1:655954688754:android:15f6bb92146da40a1b6e6b",
  measurementId: "G-XXXXXX" // Optional: Add if you have one
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Optional: Set persistence if needed
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// If you want persistence, use this instead:
// export const auth = initializeAuth(app, {
//   persistence: getReactNativePersistence(AsyncStorage)
// });

export default app;