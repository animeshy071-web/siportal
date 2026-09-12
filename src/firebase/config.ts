import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAzd179DUX5NXMDzbIAW73Yng5PgXaVY9Y",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sis-126b6.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sis-126b6",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sis-126b6.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "712479149077",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:712479149077:web:7a297a5a484fe1a0dd521c"
};

// Initialize Firebase main app
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { firebaseConfig };
