import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if Firebase config is missing
const isFirebaseConfigured = Object.values(firebaseConfig).every(val => !!val);

if (!isFirebaseConfigured) {
  console.warn("Firebase configuration is missing in environment variables. Magic Link auth will not work.");
} else {
  console.log("Firebase initialized successfully with Project ID:", firebaseConfig.projectId);
}

// Initialize Firebase only if config is complete
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
