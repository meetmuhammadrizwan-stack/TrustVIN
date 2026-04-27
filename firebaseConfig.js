// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDXtveyFl1g4vBmGPeOKBp1kzzLqCvrMwE",
    authDomain: "trustedvin-15d6f.firebaseapp.com",
    projectId: "trustedvin-15d6f",
    storageBucket: "trustedvin-15d6f.firebasestorage.app",
    messagingSenderId: "93919322063",
    appId: "1:93919322063:web:a7a9b47b7138e07c87bcba"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };