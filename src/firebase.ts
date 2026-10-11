import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDXtveyFl1g4vBmGPeOKBp1kzzLqCvrMwE",
  authDomain: "trustedvin-15d6f.firebaseapp.com",
  projectId: "trustedvin-15d6f",
  storageBucket: "trustedvin-15d6f.firebasestorage.app",
  messagingSenderId: "93919322063",
  appId: "1:93919322063:web:a7a9b47b7138e07c87bcba",
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Configure Firebase Authentication with browserSessionPersistence
export const initAuthPersistence = async () => {
  try {
    await setPersistence(auth, browserSessionPersistence);
  } catch (error) {
    console.warn("Firebase browserSessionPersistence warning:", error);
  }
};

// Eagerly set browserSessionPersistence
initAuthPersistence();

export {
  browserSessionPersistence,
  setPersistence,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
};
