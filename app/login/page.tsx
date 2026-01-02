'use client';
import { auth, provider, signInWithPopup } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const login = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email || "";
      const handle = email.split('@')[0];

      // Regex check: If it has any digit, it's a student.
      if (/\d/.test(handle)) {
        await auth.signOut();
        alert("Access Denied: Students must use the Student Share Link provided by their teacher.");
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
      <h1 className="text-4xl font-black mb-8 text-blue-500 tracking-tighter">AGENDA.OS</h1>
      <button 
        onClick={login}
        className="px-8 py-4 bg-white text-black rounded-full font-bold hover:bg-blue-100 transition"
      >
        Teacher Sign In with Google
      </button>
      <p className="mt-4 text-slate-500 text-sm italic">Authorized Teacher Accounts Only</p>
    </div>
  );
}