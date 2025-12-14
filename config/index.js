// Import the functions you need from the SDKs you need
import { initializeApp, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD7ngJP-kjiziBlYSD9wlSzXW395UsaSsc",
  authDomain: "gestionprofil-33ec4.firebaseapp.com",
  projectId: "gestionprofil-33ec4",
  storageBucket: "gestionprofil-33ec4.firebasestorage.app",
  messagingSenderId: "663471036608",
  appId: "1:663471036608:web:b54d5bb5da93357294b525",
  measurementId: "G-CTRYLN36C9"
};

let firebaseApp;
let firebaseAuth;
let firebaseDatabase;

try {
  // Try to get existing app instance first
  firebaseApp = getApp();
  console.log('✅ Firebase App already initialized');
} catch {
  // App doesn't exist, initialize it
  firebaseApp = initializeApp(firebaseConfig);
  console.log('✅ Firebase App initialized');
}

// Try to initialize Auth with AsyncStorage persistence
try {
  firebaseAuth = initializeAuth(firebaseApp, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
  console.log('✅ Firebase Auth initialized successfully with AsyncStorage persistence');
} catch (error) {
  // If auth already initialized, try to get the existing instance
  try {
    firebaseAuth = getAuth(firebaseApp);
    console.log('✅ Firebase Auth already initialized, retrieved existing instance');
  } catch (innerError) {
    console.error('❌ Failed to retrieve existing Auth instance:', innerError);
  }
}

// Initialize Realtime Database
try {
  firebaseDatabase = getDatabase(firebaseApp);
  console.log('✅ Firebase Realtime Database initialized');
} catch (error) {
  console.error('❌ Failed to initialize Realtime Database:', error.message);
}

// Ensure auth is set - if initializeAuth failed, we need the instance somehow
if (!firebaseAuth) {
  console.error('❌ CRITICAL: Firebase Auth initialization failed and no instance available');
  // Attempt one last time to get auth, just in case
  try {
    firebaseAuth = getAuth(firebaseApp);
  } catch (e) {
    throw new Error('Firebase Auth could not be initialized');
  }
}

if (!firebaseDatabase) {
  console.error('❌ CRITICAL: Firebase Realtime Database failed to initialize');
  throw new Error('Firebase Realtime Database could not be initialized');
}

export { firebaseApp, firebaseAuth, firebaseDatabase };
export default firebaseApp;