'use client';

/** 
 * MODULE 1: IMPORTS
 */
import { useState, useEffect, useRef } from 'react';
import { auth, provider, signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider } from '@/lib/firebase';
import { User } from 'firebase/auth';
import { agendaService } from '@/lib/firestore-service';
import { THEMES } from '@/lib/themes';
import { getScheduleDetails, getLunchTier, ScheduleType } from '@/lib/schedule-utils';
import { 
  ChevronLeft, ChevronRight, Share2, LogOut, Calendar as CalendarIcon, Loader2, GraduationCap, 
  Palette, Columns, Maximize2, Send, Link as LinkIcon, CheckCircle2, X, ArrowLeft, Sparkles, Wand2,
  Clock as ClockIcon, Timer as TimerIcon, Cross, PanelLeftClose, PanelLeftOpen, RotateCcw, Play, Pause,
  Lock, Edit3, Save, Settings2, Type
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
  const [focusedSection, setFocusedSection] = useState<string | null>(null);
  
  const dateInputRef = useRef<HTMLInputElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const timerMenuRef = useRef<HTMLDivElement>(null);

  // App Navigation
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentClass, setCurrentClass] = useState('p1');
  const [layout, setLayout] = useState({ col1: 1, col2: 1, col3: 1, row1: 1, row2: 1 });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isScheduleSyncing, setIsScheduleSyncing] = useState(false);
  
  // UI Modals
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showClassroomModal, setShowClassroomModal] = useState(false);

  // Clock & Timer
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isTimerMenuOpen, setIsTimerMenuOpen] = useState(false);
  const [customTimerMins, setCustomTimerMins] = useState("");

  // Room & Schedule
  const [roomNumber, setRoomNumber] = useState("");
  const [isRoomEditing, setIsRoomEditing] = useState(false);
  const [scheduleType, setScheduleType] = useState<ScheduleType>('NONE');
  
  // Custom Section Labels
  const [sectionNames, setSectionNames] = useState<any>({
    objective: "Lesson Objective",
    bellRinger: "Bell Ringer",
    miniLecture: "Mini-Lecture",
    discussion: "Guided Discussion",
    activity: "Activity",
    independentWork: "Independent Work"
  });

  // Lesson Data
  const [agenda, setAgenda] = useState<any>({
    objective: { text: '', media: null },
    bellRinger: { text: '', media: null },
    miniLecture: { text: '', media: null },
    discussion: { text: '', media: null },
    activity: { text: '', media: null },
    independentWork: { text: '', media: null }
  });

  // AI & Classroom State
  const [aiModal, setAiModal] = useState({ isOpen: false, mode: 'bulk' as 'bulk' | 'single', sectionKey: '' });
  const [aiTopic, setAiTopic] = useState("");
  const [aiSubject, setAiSubject] = useState("General");
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  
  const [courses, setCourses] = useState<any[]>([]);
  const [mappings, setMappings] = useState<any>({});
  const [isAssignPickerOpen, setIsAssignPickerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [assignmentList, setAssignmentList] = useState<any[]>([]);
  const [pickerStep, setPickerStep] = useState<'course' | 'task'>('course');
  const [isClassroomLoading, setIsClassroomLoading] = useState(false);

  /** 
   * MODULE 3: CORE LOGIC HANDLERS
   */

  const adjustLayout = (dim: string, amount: number) => {
    setLayout(prev => ({ ...prev, [dim]: Math.max(0.5, Math.min(3, (prev as any)[dim] + amount)) }));
  };

  const handleTimerAction = () => {
    if (customTimerMins !== "") {
      const mins = parseInt(customTimerMins);
      if (!isNaN(mins) && mins > 0) {
        setTimerSeconds(mins * 60);
        setIsTimerRunning(true);
        setCustomTimerMins("");
        setIsTimerMenuOpen(false);
        return;
      }
    }
    setIsTimerRunning(!isTimerRunning);
  };

  const changeDate = (days: number) => {
    const d = new Date(date + 'T00:00:00'); 
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
  };

  const copyPublicShareLink = () => {
    const url = `${window.location.origin}/share/${user?.uid}/${currentClass}/${date}`;
    navigator.clipboard.writeText(url);
    alert("Public share link copied to clipboard.");
  };

  const executeAIGeneration = async () => {
    if (!aiTopic.trim()) return;
    setIsAiProcessing(true);
    try {
      const isBulk = aiModal.mode === 'bulk';
      const res = await fetch('/api/generate-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: aiTopic, isBulk, sectionTitle: sectionNames[aiModal.sectionKey], subject: aiSubject }),
      });
      const data = await res.json();

      if (isBulk) {
        setAgenda({
          objective: { text: `<p>${data.objective}</p>`, media: null },
          bellRinger: { text: `<p>${data.bellRinger}</p>`, media: null },
          miniLecture: { text: `<p>${data.miniLecture}</p>`, media: null },
          discussion: { text: `<p>${data.discussion}</p>`, media: null },
          activity: { text: `<p>${data.activity}</p>`, media: null },
          independentWork: { text: `<p>${data.independentWork}</p>`, media: null }
        });
      } else {
        setAgenda({ ...agenda, [aiModal.sectionKey]: { ...agenda[aiModal.sectionKey], text: `<p>${data.content}</p>` } });
      }
      setAiModal({ ...aiModal, isOpen: false });
      setAiTopic("");
    } catch (e) { alert("AI Service Error."); }
    finally { setIsAiProcessing(false); }
  };

  const handlePostToClassroom = async (courseId: string) => {
    const token = sessionStorage.getItem('gc_token');
    const shareLink = `${window.location.origin}/share/${user?.uid}/${currentClass}/${date}`;
    setIsClassroomLoading(true);
    try {
      await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/announcements`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `Today's Agenda: ${agenda.objective.text.replace(/<[^>]*>/g, '')}`,
          materials: [{ link: { url: shareLink } }],
          state: "PUBLISHED"
        }),
      });
      alert("Synced to Google Classroom Stream.");
    } finally { setIsClassroomLoading(false); setShowClassroomModal(false); }
  };

  /** 
   * MODULE 4: SYSTEM LIFECYCLE
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const handle = u.email?.split('@')[0] || "";
        if (/\d/.test(handle)) { await signOut(auth); return; }
        setUser(u);
        const settings = await agendaService.getTeacherSettings(u.uid);
        if (settings) {
          if (settings.roomNumber) setRoomNumber(settings.roomNumber);
          if (settings.classroomMappings) setMappings(settings.classroomMappings);
          if (settings.sectionNames) setSectionNames(settings.sectionNames);
        }
      } else { setUser(null); }
      setAuthLoading(false);
    });

    const clock = setInterval(() => setCurrentTime(new Date()), 1000);
    const handleClickOutside = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) setShowThemeMenu(false);
      if (timerMenuRef.current && !timerMenuRef.current.contains(e.target as Node)) setIsTimerMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => { unsubscribe(); clearInterval(clock); document.removeEventListener('mousedown', handleClickOutside); };
  }, []);

  useEffect(() => {
    let interval: any;
    if (isTimerRunning && timerSeconds > 0) { interval = setInterval(() => setTimerSeconds(s => s - 1), 1000); }
    else if (timerSeconds === 0) { setIsTimerRunning(false); }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  useEffect(() => {
    if (!user) return;
    const syncBoard = async () => {
      setIsScheduleSyncing(true);
      try {
        const res = await fetch(`/api/schedule?date=${date}`, { cache: 'no-store' });
        const d = await res.json();
        setScheduleType((d.scheduleType || 'NONE') as ScheduleType);
      } catch (e) {}
      setIsScheduleSyncing(false);

      const data = await agendaService.getAgenda(user.uid, date, currentClass);
      if (data) {
        const c = data.content || data;
        setAgenda({
          objective: c.objective || { text: '', media: null },
          bellRinger: c.bellRinger || { text: '', media: null },
          miniLecture: c.miniLecture || { text: '', media: null },
          discussion: c.discussion || { text: '', media: null },
          activity: c.activity || { text: '', media: null },
          independentWork: c.independentWork || { text: '', media: null }
        });
        if (data.layout) setLayout(data.layout);
        if (data.themeId && THEMES[data.themeId]) setTheme(THEMES[data.themeId]);
      } else {
        setAgenda({ objective: { text: '', media: null }, bellRinger: { text: '', media: null }, miniLecture: { text: '', media: null }, discussion: { text: '', media: null }, activity: { text: '', media: null }, independentWork: { text: '', media: null } });
      }
    };
    syncBoard();
  }, [user, date, currentClass]);

  useEffect(() => {
    if (!user || authLoading) return;
    const timer = setTimeout(async () => {
      setIsSaving(true);
      await agendaService.saveAgenda(user.uid, date, currentClass, { agenda, layout, themeId: theme.id, scheduleType });
      setIsSaving(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [agenda, layout, theme, scheduleType]);

  /** 
   * MODULE 5: RENDER UI
   */
  const sched = getScheduleDetails(scheduleType, roomNumber || "200");
  const lunchData = getLunchTier(roomNumber || "200");
  const linkedId = mappings[currentClass];

  if (authLoading) return <div className="h-screen bg-black flex items-center justify-center text-white font-black">LANCER.OS LOADING...</div>;

  if (!user) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#8a2529] font-serif text-white text-center p-6">
      <img src="/lancer-seal.png" className="w-40 mb-8 drop-shadow-2xl" />
      <h1 className="text-7xl font-black italic tracking-tighter mb-8 text-[#FCD450]">Agenda.OS</h1>
      <button onClick={async () => {
        const result = await signInWithPopup(auth, provider);
        const token = GoogleAuthProvider.credentialFromResult(result)?.accessToken;
        if (token) sessionStorage.setItem('gc_token', token);
      }} className="px-12 py-6 bg-white text-[#8a2529] rounded-3xl font-black text-2xl shadow-2xl hover:scale-105 transition active:scale-95 uppercase">Teacher Login</button>
    </div>
  );

  return (
    <div className={`h-screen w-screen flex flex-col p-3 transition-colors duration-1000 overflow-hidden ${theme.bg}`}>
      
      {/* COMMAND CENTER HEADER */}
      <header className="flex items-center justify-between bg-black/40 backdrop-blur-3xl p-2 rounded-3xl border border-white/10 shadow-2xl mb-3 relative z-[90]">
        
        <div className="flex items-center gap-2">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-white/5 text-white/40 hover:text-white rounded-xl border border-white/5 transition">
            {isSidebarOpen ? <PanelLeftClose size={18}/> : <PanelLeftOpen size={18} className="text-[#FCD450]"/>}
          </button>
          
          <img src={theme.logo} className="h-8 w-auto mr-1" />

          {/* DATE NAVIGATION */}
          <div className="flex items-center bg-black/40 rounded-xl p-0.5 border border-white/5 shadow-inner">
            <button onClick={() => changeDate(-1)} className="p-1 text-white/40 hover:text-white transition"><ChevronLeft size={18}/></button>
            <div onClick={() => dateInputRef.current?.showPicker()} className="px-2 font-black text-xs text-white min-w-[70px] text-center cursor-pointer hover:text-[#FCD450]">
               {new Date(date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
               <input ref={dateInputRef} type="date" className="absolute invisible" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <button onClick={() => changeDate(1)} className="p-1 text-white/40 hover:text-white transition"><ChevronRight size={18}/></button>
          </div>

          <div className="flex flex-col border-l border-white/10 pl-3">
             <div className="flex items-center gap-1.5">
                <ClockIcon size={12} className="text-[#FCD450]" />
                <span className="text-white font-black text-sm leading-none">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
             </div>
             <a href="https://salpointe-prayers.web.app" target="_blank" className="text-[7px] text-[#FCD450] font-black uppercase mt-0.5 hover:underline">PRAY</a>
          </div>
        </div>

        <div className="flex-1 px-4"><TabNavigation currentClass={currentClass} setClass={setCurrentClass} /></div>

        <div className="flex items-center gap-2">
          {/* SYNC PILL */}
          <div className="mr-1 flex items-center gap-2 px-3 py-1.5 bg-black/30 rounded-xl border border-white/5">
            <div className={`h-2 w-2 rounded-full ${isSaving ? 'bg-amber-500 animate-pulse shadow-[0_0_8px_orange]' : 'bg-emerald-500 shadow-[0_0_8px_lime]'}`} />
            <span className="text-[8px] font-black text-white/40 uppercase tracking-widest leading-none">{isSaving ? 'Saving' : 'Synced'}</span>
          </div>

          {/* TIMER */}
          <div className="relative" ref={timerMenuRef}>
            <button onClick={() => setIsTimerMenuOpen(!isTimerMenuOpen)} className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border transition-all ${isTimerRunning ? 'bg-[#FCD450] border-[#FCD450] text-black scale-105' : 'bg-white/5 border-white/5 text-white/80'}`}>
              <TimerIcon size={16} className={isTimerRunning ? "animate-pulse" : "opacity-40"} />
              <span className="text-sm font-mono font-black">{Math.floor(timerSeconds / 60).toString().padStart(2, '0')}:{(timerSeconds % 60).toString().padStart(2, '0')}</span>
            </button>
            {isTimerMenuOpen && (
              <div className="absolute right-0 top-14 w-64 bg-[#0f172a] border border-white/20 rounded-[2rem] shadow-3xl z-[110] p-5 animate-in zoom-in text-white text-center">
                <div className="grid grid-cols-2 gap-2 mb-4">{[1, 5, 10, 20].map(m => (<button key={m} onClick={() => { setTimerSeconds(m * 60); setIsTimerRunning(true); setIsTimerMenuOpen(false); }} className="py-2.5 bg-white/5 rounded-xl text-[10px] font-black hover:bg-white/10 border border-white/5 transition">{m} MIN</button>))}</div>
                <input type="number" value={customTimerMins} onChange={(e) => setCustomTimerMins(e.target.value)} placeholder="00" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white font-bold text-center outline-none mb-2" />
                <div className="flex gap-2">
                  <button onClick={handleTimerAction} className={`flex-1 py-3 rounded-xl font-black text-xs transition ${isTimerRunning ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500 text-white shadow-lg'}`}>{isTimerRunning ? <Pause size={12} className="inline mr-1"/> : <Play size={12} className="inline mr-1"/>} START</button>
                  <button onClick={() => { setTimerSeconds(0); setIsTimerRunning(false); }} className="px-3 bg-white/5 rounded-xl text-white/40"><RotateCcw size={16} /></button>
                </div>
              </div>
            )}
          </div>

          <button onClick={() => setAiModal({ isOpen: true, mode: 'bulk', sectionKey: '' })} className="p-2.5 bg-white/5 text-[#FCD450] border border-white/5 rounded-xl hover:bg-[#FCD450] hover:text-black transition shadow-lg"><Wand2 size={20}/></button>

          {/* GOOGLE CLASSROOM DYNAMIC SYNC */}
          {linkedId ? (
            <div className="flex items-center bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
              <span className="text-[8px] font-black text-emerald-400 uppercase tracking-tighter mr-2">Sync</span>
              <button onClick={() => handlePostToClassroom(linkedId)} className="p-1.5 bg-emerald-500 text-white rounded-lg shadow-lg hover:scale-110 transition">
                {isClassroomLoading ? <Loader2 className="animate-spin" size={12}/> : <Send size={12}/>}
              </button>
            </div>
          ) : (
            <button onClick={async () => {
              const token = sessionStorage.getItem('gc_token');
              const res = await fetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE', { headers: { 'Authorization': `Bearer ${token}` } });
              const d = await res.json(); setCourses(d.courses || []); setShowClassroomModal(true);
            }} className="p-2.5 bg-white/5 text-white/40 hover:text-white rounded-xl border border-white/5 transition"><GraduationCap size={20}/></button>
          )}

          {/* THEME MENU */}
          <div className="relative" ref={themeMenuRef}>
            <button onClick={() => setShowThemeMenu(!showThemeMenu)} className={`p-2.5 rounded-xl transition-all border ${showThemeMenu ? 'bg-white text-black' : 'bg-white/5 text-white/80 border-white/5'}`}><Palette size={20} /></button>
            {showThemeMenu && (
              <div className="absolute right-0 top-12 w-[400px] bg-[#0f172a] border border-white/20 rounded-[2.5rem] shadow-3xl z-[100] p-5 grid grid-cols-2 gap-2 animate-in zoom-in">
                {Object.values(THEMES).map((t: any) => (<button key={t.id} onClick={() => { setTheme(t); setShowThemeMenu(false); }} className={`flex flex-col items-start p-3 rounded-[1.5rem] transition-all border-2 ${theme.id === t.id ? 'bg-white border-white shadow-xl' : 'bg-white/5 border-transparent hover:bg-white/10'}`}><div className="flex justify-between w-full mb-1"><div className={`h-4 w-4 rounded-full shadow-md ${t.bg}`} /><div className={`h-1.5 w-1.5 rounded-full ${t.accent.replace('border-', 'bg-')}`} /></div><span className={`text-[10px] font-black uppercase tracking-widest ${theme.id === t.id ? 'text-black' : 'text-white'}`}>{t.name}</span></button>))}
              </div>
            )}
          </div>

          {/* 👈 RESTORED SHARE BUTTON */}
          <button 
            onClick={copyPublicShareLink} 
            className="p-2.5 bg-white text-[#8a2529] border border-white/5 rounded-xl hover:bg-[#FCD450] transition shadow-lg flex items-center gap-2"
          >
            <Share2 size={18}/> <span className="text-[10px] font-black uppercase">Share</span>
          </button>
          
          {/* SETTINGS GEAR */}
          <button onClick={() => setShowSettingsModal(true)} className="p-2.5 bg-white/5 text-white/40 border border-white/5 rounded-xl hover:text-white transition shadow-lg">
            <Settings2 size={18}/>
          </button>
          
          <button onClick={() => signOut(auth)} className="ml-1 p-2 text-white/10 hover:text-red-400 transition"><LogOut size={20}/></button>
        </div>
      </header>

      {/* MAIN VIEW AREA */}
      <div className="flex-1 flex gap-4 min-h-0 relative">
        <aside className={`bg-black/30 backdrop-blur-md rounded-[3rem] border border-white/5 flex flex-col gap-6 overflow-hidden transition-all duration-500 shadow-2xl ${isSidebarOpen ? 'w-72 p-6 opacity-100' : 'w-0 p-0 opacity-0 border-none'}`}>
           <div className="flex flex-col gap-3 min-w-[240px]">
             <div className="flex justify-between items-center px-2"><span className="text-[10px] font-black text-white/30 uppercase tracking-widest leading-none">Room Setting</span>{lunchData.recognized && !isRoomEditing && <div className="flex items-center gap-1 text-[9px] font-black text-emerald-400 uppercase leading-none"><Lock size={10} /> Saved</div>}</div>
             <div className="relative group">
               <input value={roomNumber} disabled={!isRoomEditing} onChange={(e) => setRoomNumber(e.target.value)} className={`w-full bg-white/5 border rounded-2xl p-4 text-white font-black text-2xl outline-none transition-all ${!isRoomEditing ? 'border-transparent opacity-80' : 'border-[#FCD450]'}`} />
               <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isRoomEditing ? <button onClick={async () => { await agendaService.saveTeacherSettings(user!.uid, { roomNumber }); setIsRoomEditing(false); }} className="p-2 bg-emerald-500 text-white rounded-lg shadow-lg"><Save size={14}/></button> : <button onClick={() => setIsRoomEditing(true)} className="p-2 bg-white/10 text-white/40 rounded-lg"><Edit3 size={14}/></button>}
               </div>
             </div>
             {lunchData.recognized && (<div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex justify-between items-center animate-in slide-in-from-top-2"><span className="text-[10px] font-black text-emerald-400 uppercase">Lunch</span><span className="text-xs font-black text-white">{lunchData.tier === 1 ? '1st' : '2nd'} LUNCH</span></div>)}
           </div>
           
           <div className="flex flex-col gap-2 border-t border-white/5 pt-4 min-w-[240px]">
             <div className="flex justify-between items-end px-2">
               <h3 className="text-white font-black italic text-sm leading-none">Schedule</h3>
               <span className={`text-[8px] font-bold uppercase flex items-center gap-1 ${isScheduleSyncing ? 'text-amber-500' : 'text-emerald-400'}`}>
                 {isScheduleSyncing ? <Loader2 size={8} className="animate-spin" /> : <CheckCircle2 size={8} />} 
                 {isScheduleSyncing ? 'Syncing...' : 'Live'}
               </span>
             </div>
             <select value={scheduleType} onChange={(e) => setScheduleType(e.target.value as ScheduleType)} className="w-full bg-white/10 text-white text-xs p-3 rounded-2xl border-none font-black outline-none cursor-pointer hover:bg-white/20 transition">
               <option value="A">Schedule A</option><option value="B">Schedule B</option><option value="B-Late">Late Arrival</option><option value="B-Assembly">Assembly</option><option value="B-Early">Early Dismiss</option><option value="C">Schedule C</option><option value="NONE">No School</option>
             </select>
           </div>

           <div className="space-y-3 min-w-[240px] overflow-y-auto custom-scrollbar pr-1 flex-1">
              <p className="text-[10px] font-black text-[#FCD450] uppercase tracking-widest mb-2 leading-none text-center">{sched.title}</p>
              {sched.periods.map((p: any, i: number) => (<div key={i} className="bg-white/5 p-3 rounded-2xl border border-white/5"><p className="text-[9px] font-bold text-white/30 uppercase mb-0.5">{p.label}</p><p className="text-xs font-black text-white">{p.time}</p></div>))}
              {sched.lunch && (<div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/30 shadow-lg shadow-emerald-900/10"><p className="text-[9px] font-black text-emerald-400 uppercase mb-0.5">{sched.lunch.label}</p><p className="text-xs font-black text-white">{sched.lunch.time}</p></div>)}
              {sched.splitClass && (<div className="bg-white/5 p-3 rounded-2xl border border-white/5"><p className="text-[9px] font-bold text-white/30 uppercase mb-0.5">{sched.splitClass.label}</p><p className="text-xs font-black text-white">{sched.splitClass.time}</p></div>)}
              {sched.final && (<div className="bg-white/5 p-3 rounded-2xl border border-white/5 opacity-40"><p className="text-[9px] font-bold text-white/30 uppercase mb-0.5">{sched.final.label}</p><p className="text-xs font-black text-white">{sched.final.time}</p></div>)}
           </div>
        </aside>

        <main className="flex-1 grid grid-cols-3 grid-rows-2 gap-4 relative">
          {isAiProcessing && (<div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md rounded-[3.5rem] flex flex-col items-center justify-center animate-in fade-in"><Sparkles size={80} className="text-[#FCD450] animate-pulse mb-8" /><h2 className="text-4xl font-black italic text-white tracking-tighter uppercase text-center px-12 italic">Salpointe AI is building your lesson plan...</h2></div>)}
          {['objective', 'bellRinger', 'miniLecture', 'discussion', 'activity', 'independentWork'].map((key) => (
            <AgendaSection 
              key={key} 
              title={sectionNames[key]} 
              data={agenda[key]} 
              theme={theme} 
              onChange={(newData: any) => setAgenda({ ...agenda, [key]: newData })} 
              onMaximize={() => setFocusedSection(key)} 
              onOpenAI={() => setAiModal({ isOpen: true, mode: 'single', sectionKey: key })} 
              onOpenAssignmentPicker={async () => { 
                setActiveSection(key); setPickerStep('course'); setIsAssignPickerOpen(true); 
                const token = sessionStorage.getItem('gc_token'); 
                const res = await fetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE', { headers: { 'Authorization': `Bearer ${token}` } }); 
                const d = await res.json(); setCourses(d.courses || []); 
              }} 
            />
          ))}
        </main>

        {/* FOCUS OVERLAY */}
        {focusedSection && (
          <div className={`absolute inset-0 z-[140] flex flex-col p-16 rounded-[4rem] animate-in fade-in ${theme.card} ${theme.accent} bg-black/90 backdrop-blur-3xl shadow-3xl`}>
             <div className="flex justify-between items-center mb-14 px-10"><h2 className={`text-6xl font-black uppercase tracking-[0.5em] ${theme.secondaryText}`}>{sectionNames[focusedSection]}</h2><button onClick={() => setFocusedSection(null)} className="px-12 py-6 bg-white text-black rounded-full font-black text-2xl flex items-center gap-4 hover:bg-red-500 hover:text-white transition shadow-2xl"><X size={40}/> EXIT FOCUS</button></div>
             <div 
                className={`flex-1 px-14 text-8xl font-sans font-black leading-tight whitespace-pre-wrap overflow-y-auto custom-scrollbar prose prose-invert max-w-none ${theme.text}`}
                dangerouslySetInnerHTML={{ __html: agenda[focusedSection].text || "Lesson pending..." }}
             />
          </div>
        )}
      </div>

      {/* MODAL: BOARD SETTINGS (Rename Sections) */}
      {showSettingsModal && (
        <div className="absolute inset-0 z-[160] flex items-center justify-center bg-black/95 p-6 text-white font-sans">
          <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-2xl rounded-[4rem] p-12 shadow-3xl flex flex-col animate-in zoom-in">
             <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-600 p-4 rounded-2xl text-white"><Type size={28}/></div>
                  <h2 className="text-4xl font-black italic tracking-tighter uppercase">Board Labels</h2>
                </div>
                <button onClick={() => setShowSettingsModal(false)}><X size={32} className="text-white/20"/></button>
             </div>
             
             <div className="grid grid-cols-2 gap-6 mb-10">
                {Object.keys(sectionNames).map((key) => (
                  <div key={key}>
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2 block">{key}</label>
                    <input 
                      value={sectionNames[key]}
                      onChange={(e) => setSectionNames({...sectionNames, [key]: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-[#FCD450]"
                    />
                  </div>
                ))}
             </div>

             <button 
              onClick={async () => {
                await agendaService.saveTeacherSettings(user!.uid, { sectionNames });
                setShowSettingsModal(false);
                alert("Board labels updated.");
              }}
              className="w-full py-8 bg-[#FCD450] text-[#8a2529] rounded-[3rem] font-black text-2xl flex items-center justify-center gap-4 hover:bg-white transition shadow-2xl active:scale-95"
             >
               <Save size={28}/> SAVE CUSTOM LABELS
             </button>
          </div>
        </div>
      )}

      {/* AI MODAL */}
      {aiModal.isOpen && (
        <div className="absolute inset-0 z-[150] flex items-center justify-center bg-black/95 p-6 text-white font-sans">
          <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-2xl rounded-[4rem] p-12 shadow-3xl flex flex-col animate-in zoom-in">
             <div className="flex justify-between items-center mb-10"><div className="flex items-center gap-4"><div className="bg-[#FCD450] p-4 rounded-2xl text-black"><Sparkles size={28}/></div><h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">AI Helper</h2></div><button onClick={() => setAiModal({ ...aiModal, isOpen: false })}><X size={32} className="text-white/20 hover:text-white"/></button></div>
             <div className="space-y-8 text-left"><div className="grid grid-cols-2 gap-6"><div><label className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em] block mb-3 px-2">Subject</label><select value={aiSubject} onChange={(e) => setAiSubject(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-white font-black outline-none focus:border-[#FCD450] appearance-none"><option value="General">General</option><option value="Theology">Theology</option><option value="STEM">Science/Tech</option><option value="Mathematics">Math</option><option value="English">English</option><option value="Fine Arts">Fine Arts</option></select></div><div><label className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em] block mb-3 px-2">Topic</label><input autoFocus placeholder="Civil War..." value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-white font-black outline-none focus:border-[#FCD450]" /></div></div><button onClick={executeAIGeneration} disabled={!aiTopic.trim() || isAiProcessing} className="w-full py-8 bg-white text-black rounded-[3rem] font-black text-2xl flex items-center justify-center gap-4 hover:bg-[#FCD450] transition shadow-2xl active:scale-95 disabled:opacity-20 uppercase tracking-widest">{isAiProcessing ? <Loader2 className="animate-spin" size={32}/> : <Wand2 size={32}/>}{aiModal.mode === 'bulk' ? 'GENERATE FULL AGENDA' : 'GENERATE SECTION'}</button></div>
          </div>
        </div>
      )}

      {/* CLASSROOM LINK MODAL */}
      {showClassroomModal && (
        <div className="absolute inset-0 z-[120] flex items-center justify-center bg-black/90 p-6 text-white">
          <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-lg rounded-[3.5rem] p-10 shadow-2xl flex flex-col max-h-[85vh]">
             <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-black italic tracking-tighter">Link {currentClass.toUpperCase()}</h2><button onClick={() => setShowClassroomModal(false)}><X size={24} className="text-white/20 hover:text-white"/></button></div>
             <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar">
               {courses.map(course => (
                 <div key={course.id} className="flex gap-2">
                   <button onClick={() => handlePostToClassroom(course.id)} className="flex-1 p-5 bg-white/5 hover:bg-emerald-600/20 border border-white/5 rounded-2xl text-left font-bold text-sm truncate">{course.name}</button>
                   <button onClick={async () => { const newM = { ...mappings, [currentClass]: course.id }; await agendaService.saveTeacherSettings(user!.uid, { classroomMappings: newM }); setMappings(newM); setShowClassroomModal(false); }} className={`p-5 rounded-2xl border ${mappings[currentClass] === course.id ? 'bg-[#FCD450] text-black border-[#FCD450]' : 'bg-white/5 border-white/5 text-white/20'}`}><LinkIcon size={18}/></button>
                 </div>
               ))}
             </div>
          </div>
        </div>
      )}

      {/* ASSIGNMENT PICKER */}
      {isAssignPickerOpen && (
        <div className="absolute inset-0 z-[130] flex items-center justify-center bg-black/90 p-6 text-white font-sans">
          <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-md rounded-[3.5rem] p-10 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-8"><div className="flex items-center gap-3">{pickerStep === 'task' && <button onClick={() => setPickerStep('course')} className="p-2 bg-white/5 rounded-lg"><ArrowLeft size={20}/></button>}<h2 className="text-2xl font-black italic">{pickerStep === 'course' ? 'Select Class' : 'Pick Task'}</h2></div><button onClick={() => setIsAssignPickerOpen(false)}><X size={24} className="text-white/20 hover:text-white"/></button></div>
            <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar">{isClassroomLoading ? <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-white/40" /></div> : pickerStep === 'course' ? courses.map(c => (<button key={c.id} onClick={async () => { const token = sessionStorage.getItem('gc_token'); setIsClassroomLoading(true); const res = await fetch(`https://classroom.googleapis.com/v1/courses/${c.id}/courseWork`, { headers: { 'Authorization': `Bearer ${token}` } }); const d = await res.json(); setAssignmentList(d.courseWork || []); setPickerStep('task'); setIsClassroomLoading(false); }} className="w-full p-5 bg-white/5 hover:bg-blue-600/20 border border-white/5 rounded-2xl flex justify-between items-center text-sm font-black uppercase tracking-widest">{c.name} <ChevronRight size={18}/></button>)) : assignmentList.map(task => (<button key={task.id} onClick={() => { setAgenda({ ...agenda, [activeSection!]: { ...agenda[activeSection!], media: { type: 'assignment', url: task.alternateLink, title: task.title } } }); setIsAssignPickerOpen(false); setPickerStep('course'); }} className="w-full p-5 bg-white/5 hover:bg-emerald-600/20 border border-white/5 rounded-2xl text-left transition group"><div className="font-bold text-sm truncate group-hover:text-emerald-400">{task.title}</div></button>)) }</div>
          </div>
        </div>
      )}
      
      <footer className="mt-1 flex justify-center text-[7px] font-black text-white/5 uppercase tracking-[0.4em] font-serif italic">Salpointe Catholic • Leading Excellence Since 1950</footer>
    </div>
  );
}