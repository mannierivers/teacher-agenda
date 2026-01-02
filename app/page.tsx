'use client';

/** 
 * MODULE 1: IMPORTS
 */
import { useState, useEffect, useRef } from 'react';
import { auth, provider, signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider } from '@/lib/firebase';
import { User } from 'firebase/auth';
import { agendaService } from '@/lib/firestore-service';
import { THEMES } from '@/lib/themes';
import { 
  ChevronLeft, ChevronRight, Share2, LogOut, 
  Calendar as CalendarIcon, Loader2, GraduationCap, 
  Palette, Columns, Maximize2, Send, CheckCircle2, X 
} from 'lucide-react';
import AgendaSection from '@/components/AgendaSection';
import TabNavigation from '@/components/TabNavigation';

export default function LancerDashboard() {
  /** 
   * MODULE 2: STATE & REFS
   */
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [theme, setTheme] = useState(THEMES.standard);
  const [isSaving, setIsSaving] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentClass, setCurrentClass] = useState('p1');
  const [layout, setLayout] = useState({ col1: 1, col2: 1, col3: 1, row1: 1, row2: 1 });
  
  // Lesson Agenda State: Strict Text + Media structure
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
  const [assignmentList, setAssignmentList] = useState<any[]>([]);
  const [showClassroomModal, setShowClassroomModal] = useState(false); // For Posting
  const [isAssignPickerOpen, setIsAssignPickerOpen] = useState(false); // For Linking
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [pickerStep, setPickerStep] = useState<'course' | 'task'>('course');
  const [isClassroomLoading, setIsClassroomLoading] = useState(false);

  /** 
   * MODULE 3: AUTHENTICATION
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        sessionStorage.setItem('gc_token', credential.accessToken);
      }
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  /** 
   * MODULE 4: FIREBASE LOAD & SAVE (Metadata Split Fix)
   */
  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      const data = await agendaService.getAgenda(user.uid, date, currentClass);
      if (data) {
        // Fallback for legacy flat data or new nested 'content'
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
        setAgenda({
          objective: { text: '', media: null }, bellRinger: { text: '', media: null },
          miniLecture: { text: '', media: null }, discussion: { text: '', media: null },
          activity: { text: '', media: null }, independentWork: { text: '', media: null }
        });
      }
    };
    loadData();
  }, [user, date, currentClass]);

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

  /** 
   * MODULE 5: GOOGLE CLASSROOM LOGIC
   */
  const fetchCourses = async () => {
    const token = sessionStorage.getItem('gc_token');
    setIsClassroomLoading(true);
    try {
      const res = await fetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setCourses(data.courses || []);
    } catch (e) { alert("Session expired. Please log in again."); }
    finally { setIsClassroomLoading(false); }
  };

  const fetchAssignments = async (courseId: string) => {
    const token = sessionStorage.getItem('gc_token');
    setIsClassroomLoading(true);
    try {
      const res = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/courseWork`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setAssignmentList(data.courseWork || []);
      setPickerStep('task');
    } catch (e) { alert("Could not fetch assignments."); }
    finally { setIsClassroomLoading(false); }
  };

  const linkAssignment = (task: any) => {
    if (!activeSection) return;
    setAgenda({
      ...agenda,
      [activeSection]: { 
        ...agenda[activeSection], 
        media: { type: 'assignment', url: task.alternateLink, title: task.title } 
      }
    });
    setIsAssignPickerOpen(false);
    setPickerStep('course');
  };

  /** 
   * MODULE 6: UI HELPERS
   */
  const changeDate = (days: number) => {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
  };

  if (authLoading) return <div className="h-screen bg-[#8a2529] flex items-center justify-center"><Loader2 className="animate-spin text-white" size={40} /></div>;

  if (!user) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#8a2529] font-serif text-white">
      <img src="/lancer-seal.png" className="w-40 mb-8 drop-shadow-2xl" alt="Lancer Logo" />
      <h1 className="text-6xl font-black italic tracking-tighter mb-6">Lancer Agenda.OS</h1>
      <button onClick={handleLogin} className="px-12 py-5 bg-[#FCD450] text-[#8a2529] rounded-2xl font-bold text-2xl hover:scale-105 transition shadow-2xl">
        Teacher Sign-In
      </button>
    </div>
  );

  return (
    <div className={`h-screen w-screen flex flex-col p-3 transition-colors duration-1000 overflow-hidden ${theme.bg}`}>
      
      {/* HEADER: CONSOLIDATED COMMAND CENTER */}
      <header className="flex items-center justify-between bg-black/30 backdrop-blur-2xl p-2.5 rounded-[2.2rem] border border-white/10 shadow-2xl mb-3">
        <div className="flex items-center gap-4">
          <img src={theme.logo} className="h-10 w-auto" alt="Logo" />
          <div className="flex items-center bg-black/40 rounded-2xl p-1 border border-white/5">
            <button onClick={() => changeDate(-1)} className="p-2 text-white/40 hover:text-white"><ChevronLeft size={20}/></button>
            <div onClick={() => dateInputRef.current?.showPicker()} className="px-3 cursor-pointer font-black text-sm text-white min-w-[120px] text-center">
               {new Date(date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
               <input ref={dateInputRef} type="date" className="absolute invisible w-0 h-0" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <button onClick={() => changeDate(1)} className="p-2 text-white/40 hover:text-white transition"><ChevronRight size={20}/></button>
          </div>
        </div>

        <div className="flex-1 px-8">
          <TabNavigation currentClass={currentClass} setClass={setCurrentClass} />
        </div>

        <div className="flex items-center gap-2">
          {/* Sync Pill */}
          <div className="mr-3 flex items-center gap-2 px-4 py-2 bg-black/30 rounded-xl border border-white/5">
            <div className={`h-2.5 w-2.5 rounded-full ${isSaving ? 'bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`} />
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">{isSaving ? 'Saving' : 'Synced'}</span>
          </div>

          <button onClick={() => { fetchCourses(); setShowClassroomModal(true); }} className="p-2.5 bg-white/5 text-white/80 hover:bg-emerald-600 hover:text-white rounded-xl transition border border-white/5" title="Post to Classroom">
            <GraduationCap size={22}/>
          </button>

          <div className="relative group">
            <button className="p-2.5 bg-white/5 text-white/80 hover:bg-white/20 rounded-xl transition border border-white/5">
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
          }} className="p-2.5 bg-[#FCD450] text-[#8a2529] rounded-xl hover:scale-105 transition shadow-lg"><Share2 size={22}/></button>
          
          <button onClick={() => signOut(auth)} className="ml-2 p-3 text-white/20 hover:text-red-400 transition"><LogOut size={22}/></button>
        </div>
      </header>

      {/* THE GRID: NO-SCROLL LAYOUT */}
      <main 
        className="flex-1 grid gap-3 transition-all duration-700 ease-in-out"
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
            onOpenAssignmentPicker={() => { fetchCourses(); setActiveSection(key); setIsAssignPickerOpen(true); }}
            aiPrompt={`Suggest a ${key} for...`}
          />
        ))}
      </main>

      {/* FOOTER: WEIGHT CONTROLS */}
      <footer className="mt-3 flex justify-between items-center px-6 py-1.5 bg-black/10 rounded-2xl border border-white/5 text-[9px] uppercase tracking-[0.2em] font-bold text-white/20">
        <div className="flex gap-8">
           <div className="flex gap-1.5 items-center">
             <span className="opacity-40 flex items-center gap-1"><Columns size={10}/> COLS</span>
             {[1,2,3].map(n => (
               <button key={n} onClick={() => setLayout({...layout, [`col${n}`]: Math.max(0.5, (layout as any)[`col${n}`] + 0.1)})} className="hover:text-white transition">GROW {n}</button>
             ))}
           </div>
           <div className="flex gap-1.5 items-center">
             <span className="opacity-40 flex items-center gap-1"><Maximize2 size={10}/> ROWS</span>
             {[1,2].map(n => (
               <button key={n} onClick={() => setLayout({...layout, [`row${n}`]: Math.max(0.5, (layout as any)[`row${n}`] + 0.1)})} className="hover:text-white transition">GROW {n}</button>
             ))}
             <button onClick={() => setLayout({col1:1,col2:1,col3:1,row1:1,row2:1})} className="ml-6 hover:text-red-400 transition">RESET</button>
           </div>
        </div>
        <span>Salpointe Catholic High School • Celebrating 75 Years</span>
      </footer>

      {/* MODAL 1: POST TO CLASSROOM STREAM */}
      {showClassroomModal && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
          <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-md rounded-[3rem] p-8 shadow-2xl flex flex-col max-h-[85vh]">
             <div className="flex justify-between items-center mb-6 px-2">
               <h2 className="text-xl font-black text-white italic tracking-tighter">Post to Stream</h2>
               <button onClick={() => setShowClassroomModal(false)} className="text-white/20 hover:text-white text-xs font-bold uppercase tracking-widest">Close</button>
             </div>
             <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar">
               {isClassroomLoading ? <Loader2 className="animate-spin text-white/20 mx-auto" /> : courses.map(course => (
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
                    alert("Posted to Google Classroom!");
                 }} className="w-full flex justify-between items-center p-5 bg-white/5 hover:bg-emerald-600/20 border border-white/5 rounded-2xl transition group text-left">
                   <span className="font-bold text-white group-hover:text-emerald-400 truncate mr-4">{course.name}</span>
                   <Send size={18} className="text-white/20 group-hover:text-emerald-400" />
                 </button>
               ))}
             </div>
          </div>
        </div>
      )}

      {/* MODAL 2: LINK ASSIGNMENT TO SECTION */}
      {isAssignPickerOpen && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
          <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-md rounded-[3rem] p-8 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-white italic flex items-center gap-2">
                <GraduationCap className="text-blue-400" /> {pickerStep === 'course' ? 'Select Class' : 'Select Task'}
              </h2>
              <button onClick={() => { setIsAssignPickerOpen(false); setPickerStep('course'); }} className="text-white/20 hover:text-white text-xs font-bold uppercase">Cancel</button>
            </div>
            <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar">
              {isClassroomLoading ? <Loader2 className="animate-spin text-white/20 mx-auto" /> : 
                pickerStep === 'course' ? courses.map(c => (
                  <button key={c.id} onClick={() => fetchAssignments(c.id)} className="w-full p-4 bg-white/5 hover:bg-blue-600/20 border border-white/5 rounded-2xl flex justify-between items-center text-white font-bold">
                    {c.name} <ChevronRight size={18} />
                  </button>
                )) : assignmentList.map(task => (
                  <button key={task.id} onClick={() => linkAssignment(task)} className="w-full p-4 bg-white/5 hover:bg-emerald-600/20 border border-white/5 rounded-2xl text-left">
                    <div className="font-bold text-white text-sm">{task.title}</div>
                    <div className="text-[9px] text-white/20">Coursework ID: {task.id}</div>
                  </button>
                ))
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}