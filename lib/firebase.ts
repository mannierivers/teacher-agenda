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

// Configure Google Auth with Classroom Scopes
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/classroom.courses.readonly');
provider.addScope('https://www.googleapis.com/auth/classroom.announcements');
provider.addScope('https://www.googleapis.com/auth/classroom.coursework.me.readonly');

export { db, auth, provider, signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider };