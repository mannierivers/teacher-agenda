import { useState, useEffect } from 'react';
import { auth, provider, signInWithPopup, signOut } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        // Teacher logic: Ensure no numbers in handle
        const handle = u.email?.split('@')[0] || "";
        if (/\d/.test(handle)) {
          signOut(auth);
          setUser(null);
        } else {
          setUser(u);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  return { user, loading, login, logout };
}