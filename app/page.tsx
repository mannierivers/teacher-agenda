'use client';

import { useState, useEffect, useRef } from 'react';
import { auth, provider, signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider } from '@/lib/firebase';
import { User } from 'firebase/auth';
import { agendaService } from '@/lib/firestore-service';
import { THEMES } from '@/lib/themes';
import { 
  ChevronLeft, ChevronRight, Share2, LogOut, 
  Calendar as CalendarIcon, Loader2, GraduationCap, 
  Palette, Columns, Maximize2, Send, CheckCircle2 
} from 'lucide-react';
import AgendaSection from '@/components/AgendaSection';
import TabNavigation from '@/components/TabNavigation';

export default function LancerDashboard() {
  // 1. STATE & REFS
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [theme, setTheme] = useState(THEMES.standard);
  const [isSaving, setIsSaving] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentClass, setCurrentClass] = useState('p1');
  const [layout, setLayout] = useState({ col1: 1, col2: 1, col3: 1, row1: 1, row2: 1 });
  
  // Lesson Agenda State
  const [agenda, setAgenda] = useState<any>({
    objective: { text: '', media: null },
    bellRinger: { text: '', media: null },
    miniLecture: { text: '', media: null },
    discussion: { text: '', media: null },
    activity: { text: '', media: null },
    independentWork: { text: '', media: null }
  });

  // Google Classroom State
  const [courses, setCourses] = useState<any[]>([]);
  const [showClassroomModal, setShowClassroomModal] = useState(false);

  // 2. AUTHENTICATION
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 3. LOAD DATA (With Legacy Fallback)
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const data = await agendaService.getAgenda(user.uid, date, currentClass);
      if (data) {
        // If 'content' exists, use it. Otherwise, assume flat structure (legacy)
        const savedContent = data.content || data;
        
        setAgenda({
          objective: savedContent.objective || { text: '', media: null },
          bellRinger: savedContent.bellRinger || { text: '', media: null },
          miniLecture: savedContent.miniLecture || { text: '', media: null },
          discussion: savedContent.discussion || { text: '', media: null },
          activity: savedContent.activity || { text: '', media: null },
          independentWork: savedContent.independentWork || { text: '', media: null }
        });

        if (data.layout) setLayout(data.layout);
        if (data.themeId && THEMES[data.themeId]) setTheme(THEMES[data.themeId]);
      } else {
        // Reset for empty days
        setAgenda({
          objective: { text: '', media: null }, bellRinger: { text: '', media: null },
          miniLecture: { text: '', media: null }, discussion: { text: '', media: null },
          activity: { text: '', media: null }, independentWork: { text: '', media: null }
        });
      }
    };
    load();
  }, [user, date, currentClass]);

  // 4. AUTOSAVE (Separated Content/Metadata)
  useEffect(() => {
    if (!user || authLoading) return;
    const timer = setTimeout(async () => {
      setIsSaving(true);
      await agendaService.saveAgenda(user.uid, date, currentClass, { 
        agenda, 
        layout, 
        themeId: theme.id 
      });
      setIsSaving(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [agenda, layout, theme, date, currentClass]);

  // 5. RENDER HELPERS
  if (authLoading) return <div className="h-screen bg-[#8a2529] flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>;

  if (!user) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#8a2529] font-serif text-white">
      <img src="/lancer-seal.png" className="w-40 mb-8 drop-shadow-2xl" alt="Lancer Logo" />
      <h1 className="text-6xl font-black italic tracking-tighter mb-6">Lancer Agenda.OS</h1>
      <button onClick={async () => {
        const result = await signInWithPopup(auth, provider);
        const token = GoogleAuthProvider.credentialFromResult(result)?.accessToken;
        if (token) sessionStorage.setItem('gc_token', token);
      }} className="px-10 py-5 bg-[#FCD450] text-[#8a2529] rounded-2xl font-bold text-xl hover:scale-105 transition shadow-2xl">
        Teacher Sign-In
      </button>
    </div>
  );

  return (
    <div className={`h-screen w-screen flex flex-col p-4 transition-colors duration-1000 overflow-hidden ${theme.bg}`}>
      
      {/* HEADER: CONSOLIDATED COMMAND CENTER */}
      <header className="flex items-center justify-between bg-black/30 backdrop-blur-2xl p-3 rounded-[2.2rem] border border-white/10 shadow-2xl mb-4">
        <div className="flex items-center gap-4">
          <img src={theme.logo} className="h-10 w-auto" alt="Logo" />
          <div className="flex items-center bg-black/40 rounded-2xl p-1 border border-white/5">
            <button onClick={() => {
              const d = new Date(date + 'T00:00:00');
              d.setDate(d.getDate() - 1);
              setDate(d.toISOString().split('T')[0]);
            }} className="p-2 text-white/40 hover:text-white"><ChevronLeft size={22}/></button>
            <div onClick={() => dateInputRef.current?.showPicker()} className="px-4 cursor-pointer font-black text-sm text-white min-w-[120px] text-center">
               {new Date(date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
               <input ref={dateInputRef} type="date" className="absolute invisible w-0 h-0" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <button onClick={() => {
              const d = new Date(date + 'T00:00:00');
              d.setDate(d.getDate() + 1);
              setDate(d.toISOString().split('T')[0]);
            }} className="p-2 text-white/40 hover:text-white"><ChevronRight size={22}/></button>
          </div>
        </div>

        <div className="flex-1 px-10">
          <TabNavigation currentClass={currentClass} setClass={setCurrentClass} />
        </div>

        <div className="flex items-center gap-2">
          <div className="mr-3 flex items-center gap-2 px-4 py-2 bg-black/30 rounded-xl border border-white/5">
            <div className={`h-2.5 w-2.5 rounded-full ${isSaving ? 'bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`} />
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{isSaving ? 'Saving' : 'Synced'}</span>
          </div>

          <button onClick={async () => {
             const token = sessionStorage.getItem('gc_token');
             const res = await fetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE', {
               headers: { 'Authorization': `Bearer ${token}` }
             });
             const d = await res.json();
             setCourses(d.courses || []);
             setShowClassroomModal(true);
          }} className="p-3 bg-white/5 text-white/80 hover:bg-emerald-600 hover:text-white rounded-xl transition border border-white/5" title="Google Classroom">
            <GraduationCap size={22}/>
          </button>

          <div className="relative group">
            <button className="p-3 bg-white/5 text-white/80 hover:bg-white/20 rounded-xl transition border border-white/5">
              <Palette size={22} />
            </button>
            <div className="absolute right-0 top-14 hidden group-hover:grid grid-cols-2 bg-slate-900 border border-slate-800 p-2 rounded-2xl shadow-2xl z-50 w-80 gap-1 overflow-hidden">
              {Object.values(THEMES).map((t: any) => (
                <button key={t.id} onClick={() => setTheme(t)} className="text-left px-3 py-2.5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-wider text-white flex justify-between items-center transition">
                  {t.name}
                  <div className={`h-2 w-2 rounded-full ${t.accent.replace('border-', 'bg-')}`} />
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => {
             const url = `${window.location.origin}/share/${user.uid}/${currentClass}/${date}`;
             navigator.clipboard.writeText(url);
             alert("Lancer Link Copied!");
          }} className="p-3 bg-[#FCD450] text-[#8a2529] rounded-xl hover:scale-105 transition shadow-lg"><Share2 size={22}/></button>
          <button onClick={() => signOut(auth)} className="ml-2 p-3 text-white/20 hover:text-red-400 transition"><LogOut size={22}/></button>
        </div>
      </header>

      {/* THE 6-GRID: Strictly mapping lesson keys only */}
      <main 
        className="flex-1 grid gap-4 transition-all duration-700 ease-in-out"
        style={{
          gridTemplateColumns: `${layout.col1}fr ${layout.col2}fr ${layout.col3}fr`,
          gridTemplateRows: `${layout.row1}fr ${layout.row2}fr`
        }}
      >
        {['objective', 'bellRinger', 'miniLecture', 'discussion', 'activity', 'independentWork'].map((key) => (
          <AgendaSection 
            key={key}
            title={key.replace(/([A-Z])/g, ' $1').trim()}
            data={agenda[key]}
            theme={theme}
            onChange={(newData: any) => setAgenda({ ...agenda, [key]: newData })}
            aiPrompt={`Suggest a ${key} for a lesson about...`}
          />
        ))}
      </main>

      {/* FOOTER */}
      <footer className="mt-4 flex justify-between items-center px-6 py-2 bg-black/10 rounded-2xl border border-white/5 text-[10px] uppercase tracking-[0.3em] font-bold text-white/20">
        <div className="flex gap-8">
           <div className="flex gap-2 items-center">
             <span className="opacity-40 flex items-center gap-1"><Columns size={12}/> COLS:</span>
             {[1,2,3].map(n => (
               <button key={n} onClick={() => setLayout({...layout, [`col${n}`]: Math.max(0.5, (layout as any)[`col${n}`] + 0.1)})} className="hover:text-white transition">GROW {n}</button>
             ))}
           </div>
           <div className="flex gap-2 items-center">
             <span className="opacity-40 flex items-center gap-1"><Maximize2 size={12}/> ROWS:</span>
             {[1,2].map(n => (
               <button key={n} onClick={() => setLayout({...layout, [`row${n}`]: Math.max(0.5, (layout as any)[`row${n}`] + 0.1)})} className="hover:text-white transition">GROW {n}</button>
             ))}
           </div>
        </div>
        <span>Salpointe Catholic High School • Establishing Excellence Since 1950</span>
      </footer>

      {/* MODAL: GOOGLE CLASSROOM */}
      {showClassroomModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 text-white">
          <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-md rounded-[3rem] p-8 shadow-2xl flex flex-col max-h-[85vh]">
             <div className="flex justify-between items-center mb-6 px-2">
               <h2 className="text-xl font-black italic tracking-tighter">Post to Classroom</h2>
               <button onClick={() => setShowClassroomModal(false)} className="text-white/20 hover:text-white text-xs font-bold uppercase">Close</button>
             </div>
             <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar">
               {courses.map(course => (
                 <button key={course.id} onClick={async () => {
                    const token = sessionStorage.getItem('gc_token');
                    await fetch(`https://classroom.googleapis.com/v1/courses/${course.id}/announcements`, {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        text: `Agenda for ${new Date(date).toLocaleDateString()}: ${agenda.objective.text}`,
                        materials: [{ link: { url: `${window.location.origin}/share/${user.uid}/${currentClass}/${date}` } }],
                        state: "PUBLISHED"
                      }),
                    });
                    setShowClassroomModal(false);
                    alert("Posted!");
                 }} className="w-full flex justify-between items-center p-5 bg-white/5 hover:bg-emerald-600/20 border border-white/5 rounded-2xl transition group text-left">
                   <span className="font-bold text-white group-hover:text-emerald-400 truncate mr-4">{course.name}</span>
                   <Send size={18} className="text-white/20 group-hover:text-emerald-400" />
                 </button>
               ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}