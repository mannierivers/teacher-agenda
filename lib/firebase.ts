import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCMiHxHhc4xOl0T74fvRb3YIcMh1N2h1sY",
  authDomain: "teacher-agenda-52aa8.firebaseapp.com",
  projectId: "teacher-agenda-52aa8",
  storageBucket: "teacher-agenda-52aa8.firebasestorage.app",
  messagingSenderId: "770997507998",
  appId: "1:770997507998:web:f280d73b19c4149974a88f"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };