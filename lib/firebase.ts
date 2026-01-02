import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCMiHxHhc4xOl0T74fvRb3YIcMh1N2h1sY",
  authDomain: "teacher-agenda-52aa8.firebaseapp.com",
  projectId: "teacher-agenda-52aa8",
  storageBucket: "teacher-agenda-52aa8.firebasestorage.app",
  messagingSenderId: "770997507998",
  appId: "1:770997507998:web:f280d73b19c4149974a88f"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Configure Google Provider with Classroom Scopes
const provider = new GoogleAuthProvider();

// Scope to see classes
provider.addScope('https://www.googleapis.com/auth/classroom.courses.readonly');
// Scope to post announcements
provider.addScope('https://www.googleapis.com/auth/classroom.announcements');

// Force consent to ensure we get the access token every time
provider.setCustomParameters({
  prompt: 'consent'
});

export { db, auth, provider, signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider };