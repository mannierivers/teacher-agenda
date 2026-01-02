'use client';

/** 
 * SECTION 1: IMPORTS
 */
import { useState, useEffect, useRef } from 'react';
import { db, auth, provider, signInWithPopup, signOut, GoogleAuthProvider } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { agendaService } from '@/lib/firestore-service';
import { 
  ChevronLeft, ChevronRight, Share2, LogOut, 
  Calendar as CalendarIcon, Loader2, Maximize2, Columns, 
  GraduationCap, Send, CheckCircle2
} from 'lucide-react';
import AgendaSection from '@/components/AgendaSection';
import TabNavigation from '@/components/TabNavigation';

export default function DailyAgendaDashboard() {
  /** 
   * SECTION 2: STATE & REFS
   */
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentClass, setCurrentClass] = useState('p1');
  const [isSaving, setIsSaving] = useState(false);

  const [agenda, setAgenda] = useState({
    objective: '', bellRinger: '', miniLecture: '', 
    discussion: '', activity: '', independentWork: ''
  });

  const [layout, setLayout] = useState({
    col1: 1, col2: 1, col3: 1,
    row1: 1, row2: 1
  });

  // Google Classroom State
  const [courses, setCourses] = useState<any[]>([]);
  const [showClassroomModal, setShowClassroomModal] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  /** 
   * SECTION 3: AUTH & GOOGLE CLASSROOM LOGIC
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      // Retrieve token from session if it exists
      const savedToken = sessionStorage.getItem('gc_token');
      if (savedToken) setAccessToken(savedToken);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      
      if (token) {
        setAccessToken(token);
        sessionStorage.setItem('gc_token', token);
      }

      const email = result.user.email || "";
      if (/\d/.test(email.split('@')[0])) {
        await signOut(auth);
        alert("Teacher accounts only.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchClassroomCourses = async () => {
    if (!accessToken) return;
    setShowClassroomModal(true);
    try {
      const response = await fetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await response.json();
      setCourses(data.courses || []);
    } catch (error) {
      alert("Failed to fetch Google Courses.");
    }
  };

  const postToClassroom = async (courseId: string) => {
    setIsPosting(true);
    const shareLink = `${window.location.origin}/share/${user?.uid}/${currentClass}/${date}`;
    
    try {
      const response = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/announcements`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `Today's Agenda (${new Date(date).toLocaleDateString()}): ${agenda.objective}`,
          materials: [{ link: { url: shareLink } }],
          state: "PUBLISHED"
        }),
      });

      if (response.ok) {
        alert("Agenda posted to Classroom Stream!");
        setShowClassroomModal(false);
      }
    } catch (error) {
      alert("Error posting to Classroom.");
    } finally {
      setIsPosting(false);
    }
  };

  /** 
   * SECTION 4: DATA PERSISTENCE & HELPERS
   */
  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      const data = await agendaService.getAgenda(user.uid, date, currentClass);
      if (data) {
        setAgenda(data as any);
        if (data.layout) setLayout(data.layout);
      } else {
        setAgenda({ objective: '', bellRinger: '', miniLecture: '', discussion: '', activity: '', independentWork: '' });
      }
    };
    loadData();
  }, [user, date, currentClass]);

  useEffect(() => {
    if (!user || authLoading) return;
    const timer = setTimeout(async () => {
      setIsSaving(true);
      await agendaService.saveAgenda(user.uid, date, currentClass, { ...agenda, layout });
      setIsSaving(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [agenda, layout, date, currentClass]);

  const changeDate = (days: number) => {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
  };

  const adjustLayout = (dim: string, amount: number) => {
    setLayout(prev => ({ ...prev, [dim]: Math.max(0.5, Math.min(3, (prev as any)[dim] + amount)) }));
  };

  /** 
   * SECTION 5: RENDER
   */
  if (authLoading) return <div className="h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={48} /></div>;

  if (!user) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-12 text-center">
      <h1 className="text-7xl font-black mb-6 tracking-tighter text-blue-500">AGENDA.OS</h1>
      <button onClick={handleLogin} className="px-12 py-6 bg-white text-black rounded-3xl font-bold text-2xl hover:scale-105 transition-all shadow-2xl">
        Sign in with Google
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full gap-4 overflow-hidden select-none relative">
      
      {/* HEADER BAR */}
      <header className="flex items-center justify-between bg-slate-900/80 backdrop-blur-xl p-4 rounded-[2rem] border border-slate-800 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-slate-950 rounded-2xl p-1 border border-slate-800">
            <button onClick={() => changeDate(-1)} className="p-2 hover:bg-slate-800 rounded-xl transition text-slate-400 hover:text-white"><ChevronLeft size={24}/></button>
            <div onClick={() => dateInputRef.current?.showPicker()} className="flex items-center px-4 py-2 cursor-pointer hover:bg-slate-900 rounded-xl transition min-w-[180px] justify-center">
              <CalendarIcon size={18} className="text-blue-500 mr-3" />
              <span className="text-lg font-bold text-slate-200">{new Date(date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <input ref={dateInputRef} type="date" className="absolute invisible w-0 h-0" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <button onClick={() => changeDate(1)} className="p-2 hover:bg-slate-800 rounded-xl transition text-slate-400 hover:text-white"><ChevronRight size={24}/></button>
          </div>
          <TabNavigation currentClass={currentClass} setClass={setCurrentClass} />
        </div>

        <div className="flex items-center gap-4">
          {/* GOOGLE CLASSROOM BUTTON */}
          <button 
            onClick={fetchClassroomCourses}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl hover:bg-emerald-600 hover:text-white transition font-black text-xs"
          >
            <GraduationCap size={18}/> GOOGLE CLASSROOM
          </button>
          
          <button onClick={() => {
            const url = `${window.location.origin}/share/${user.uid}/${currentClass}/${date}`;
            navigator.clipboard.writeText(url);
            alert("Share Link Copied!");
          }} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition font-black text-xs">
            <Share2 size={18}/> SHARE LINK
          </button>
          
          <button onClick={() => signOut(auth)} className="p-3 text-slate-500 hover:text-red-400 transition"><LogOut size={24}/></button>
        </div>
      </header>

      {/* DYNAMIC GRID */}
      <main className="flex-1 grid gap-4 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
        style={{
          gridTemplateColumns: `${layout.col1}fr ${layout.col2}fr ${layout.col3}fr`,
          gridTemplateRows: `${layout.row1}fr ${layout.row2}fr`
        }}>
        <AgendaSection title="Lesson Objective" value={agenda.objective} onChange={(v:string) => setAgenda({...agenda, objective: v})} aiPrompt="Create a SWBAT objective for..." />
        <AgendaSection title="Bell Ringer" value={agenda.bellRinger} onChange={(v:string) => setAgenda({...agenda, bellRinger: v})} aiPrompt="Create a warm-up for..." />
        <AgendaSection title="Mini-Lecture" value={agenda.miniLecture} onChange={(v:string) => setAgenda({...agenda, miniLecture: v})} aiPrompt="Key points for..." />
        <AgendaSection title="Guided Discussion" value={agenda.discussion} onChange={(v:string) => setAgenda({...agenda, discussion: v})} aiPrompt="Discussion questions for..." />
        <AgendaSection title="Activity" value={agenda.activity} onChange={(v:string) => setAgenda({...agenda, activity: v})} aiPrompt="Classroom activity for..." />
        <AgendaSection title="Independent Work" value={agenda.independentWork} onChange={(v:string) => setAgenda({...agenda, independentWork: v})} aiPrompt="Practice task for..." />
      </main>

      {/* CLASSROOM SELECTOR MODAL */}
      {showClassroomModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-6">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-[2rem] p-8 shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <GraduationCap className="text-emerald-400" /> Select Course
                </h2>
                <p className="text-slate-400 text-sm">Which Google Classroom should receive this agenda link?</p>
              </div>
              <button onClick={() => setShowClassroomModal(false)} className="text-slate-500 hover:text-white font-bold">CANCEL</button>
            </div>
            
            <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar space-y-2">
              {courses.length > 0 ? courses.map((course) => (
                <button 
                  key={course.id}
                  onClick={() => postToClassroom(course.id)}
                  disabled={isPosting}
                  className="w-full flex items-center justify-between p-4 bg-slate-800 hover:bg-emerald-600/20 border border-slate-700 hover:border-emerald-500 transition rounded-2xl group text-left"
                >
                  <span className="font-bold text-slate-200 group-hover:text-white">{course.name}</span>
                  <Send size={18} className="text-slate-500 group-hover:text-emerald-400" />
                </button>
              )) : <div className="text-center py-8 text-slate-500 italic">No active courses found.</div>}
            </div>
            
            {isPosting && (
              <div className="mt-4 flex items-center justify-center gap-2 text-emerald-400 font-bold animate-pulse">
                <Loader2 className="animate-spin" size={16} /> POSTING TO CLASSROOM...
              </div>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="flex justify-between items-center px-6 py-2 bg-slate-900/40 rounded-3xl border border-slate-800/50">
        <div className="flex items-center gap-6">
          <div className="flex gap-1.5 items-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mr-2">Grid:</span>
            {[1,2,3].map(n => (
              <button key={n} onClick={() => adjustLayout(`col${n}`, 0.1)} className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-[10px] text-slate-400 hover:bg-slate-700">+ COL {n}</button>
            ))}
          </div>
        </div>
        <div className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-2 tracking-widest">
           {isSaving ? <><Loader2 size={10} className="animate-spin"/> SYNCING</> : <><CheckCircle2 size={10} className="text-emerald-500"/> ALL CHANGES SECURED</>}
        </div>
      </footer>
    </div>
  );
}