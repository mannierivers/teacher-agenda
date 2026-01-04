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
  Clock as ClockIcon, Timer as TimerIcon, Cross, PanelRightClose, PanelRightOpen, RotateCcw, Play, Pause,
  Lock, Edit3, Save, Settings2, Type, Cloud, Bell, Info, MoreVertical
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
  const commandMenuRef = useRef<HTMLDivElement>(null);

  // App Navigation
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentClass, setCurrentClass] = useState('p1');
  const [layout, setLayout] = useState({ col1: 1, col2: 1, col3: 1, row1: 1, row2: 1 });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isScheduleSyncing, setIsScheduleSyncing] = useState(false);
  
  // UI Overlays
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showClassroomModal, setShowClassroomModal] = useState(false);

  // Time Tools
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isTimerMenuOpen, setIsTimerMenuOpen] = useState(false);
  const [customTimerMins, setCustomTimerMins] = useState("");

  // Room & Schedule
  const [roomNumber, setRoomNumber] = useState("");
  const [isRoomEditing, setIsRoomEditing] = useState(false);
  const [scheduleType, setScheduleType] = useState<ScheduleType>('NONE');
  const [schoolEvents, setSchoolEvents] = useState<string[]>([]);
  
  // Custom Labels
  const [sectionNames, setSectionNames] = useState<any>({
    objective: "Lesson Objective", bellRinger: "Bell Ringer", miniLecture: "Mini-Lecture",
    discussion: "Guided Discussion", activity: "Activity", independentWork: "Independent Work"
  });

  // Daily Lesson Data
  const [agenda, setAgenda] = useState<any>({
    objective: { text: '', media: null }, bellRinger: { text: '', media: null },
    miniLecture: { text: '', media: null }, discussion: { text: '', media: null },
    activity: { text: '', media: null }, independentWork: { text: '', media: null }
  });

  // Integrations State
  const [aiModal, setAiModal] = useState({ isOpen: false, mode: 'bulk' as 'bulk' | 'single', sectionKey: 'objective' });
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
   * MODULE 3: CORE FUNCTIONS
   */
  const manualSave = async () => {
    if (!user) return;
    setIsSaving(true);
    await agendaService.saveAgenda(user.uid, date, currentClass, { agenda, layout, themeId: theme.id, scheduleType });
    setTimeout(() => setIsSaving(false), 800);
  };

  const adjustLayout = (dim: string, amount: number) => {
    setLayout(prev => ({ ...prev, [dim]: Math.max(0.5, Math.min(3, (prev as any)[dim] + amount)) }));
  };

  const handleTimerAction = () => {
    if (customTimerMins !== "") {
      const mins = parseInt(customTimerMins);
      if (!isNaN(mins) && mins > 0) {
        setTimerSeconds(mins * 60); setIsTimerRunning(true); setCustomTimerMins(""); setIsTimerMenuOpen(false);
        return;
      }
    }
    setIsTimerRunning(!isTimerRunning);
  };

  const handleClassTabChange = async (id: string) => {
    await manualSave(); 
    setCurrentClass(id);
  };

  const handleDateChange = async (days: number) => {
    await manualSave();
    const d = new Date(date + 'T00:00:00'); 
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
  };

  const copyPublicShareLink = () => {
    const url = `${window.location.origin}/share/${user?.uid}/${currentClass}/${date}`;
    navigator.clipboard.writeText(url);
    alert("Public link copied!");
    setShowCommandMenu(false);
  };

  const handlePostToClassroom = async (courseId: string) => {
    const token = sessionStorage.getItem('gc_token');
    const shareLink = `${window.location.origin}/share/${user?.uid}/${currentClass}/${date}`;
    setIsClassroomLoading(true);
    try {
      await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/announcements`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `Agenda: ${agenda.objective.text.replace(/<[^>]*>/g, '')}`, materials: [{ link: { url: shareLink } }], state: "PUBLISHED" }),
      });
      alert("Synced to Google Classroom.");
    } finally { setIsClassroomLoading(false); setShowClassroomModal(false); }
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
        setAgenda({ objective: { text: `<p>${data.objective}</p>`, media: null }, bellRinger: { text: `<p>${data.bellRinger}</p>`, media: null }, miniLecture: { text: `<p>${data.miniLecture}</p>`, media: null }, discussion: { text: `<p>${data.discussion}</p>`, media: null }, activity: { text: `<p>${data.activity}</p>`, media: null }, independentWork: { text: `<p>${data.independentWork}</p>`, media: null } });
      } else {
        setAgenda({ ...agenda, [aiModal.sectionKey]: { ...agenda[aiModal.sectionKey], text: `<p>${data.content}</p>` } });
      }
      setAiModal({ ...aiModal, isOpen: false });
    } catch (e) { alert("AI Service Error."); }
    finally { setIsAiProcessing(false); }
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

    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    const handleClickOutside = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) setShowThemeMenu(false);
      if (timerMenuRef.current && !timerMenuRef.current.contains(e.target as Node)) setIsTimerMenuOpen(false);
      if (commandMenuRef.current && !commandMenuRef.current.contains(e.target as Node)) setShowCommandMenu(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => { unsubscribe(); clearInterval(clockInterval); document.removeEventListener('mousedown', handleClickOutside); };
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
        const res = await fetch(`/api/schedule?date=${date}&t=${Date.now()}`, { cache: 'no-store' });
        const d = await res.json();
        setScheduleType((d.scheduleType || 'NONE') as ScheduleType);
        setSchoolEvents(d.schoolEvents || []);
      } catch (e) {}
      setIsScheduleSyncing(false);

      const data = await agendaService.getAgenda(user.uid, date, currentClass);
      if (data) {
        const c = data.content || data;
        setAgenda({ objective: c.objective || { text: '', media: null }, bellRinger: c.bellRinger || { text: '', media: null }, miniLecture: c.miniLecture || { text: '', media: null }, discussion: c.discussion || { text: '', media: null }, activity: c.activity || { text: '', media: null }, independentWork: c.independentWork || { text: '', media: null } });
        if (data.layout) setLayout(data.layout);
        if (data.themeId && THEMES[data.themeId]) setTheme(THEMES[data.themeId]);
        if (data.scheduleType) setScheduleType(data.scheduleType);
      } else { setAgenda({ objective: { text: '', media: null }, bellRinger: { text: '', media: null }, miniLecture: { text: '', media: null }, discussion: { text: '', media: null }, activity: { text: '', media: null }, independentWork: { text: '', media: null } }); }
    };
    syncBoard();
  }, [user, date, currentClass]);

  useEffect(() => {
    if (!user || authLoading) return;
    const timer = setTimeout(() => { manualSave(); }, 3000);
    return () => clearTimeout(timer);
  }, [agenda, layout, theme, scheduleType]);

  /** 
   * MODULE 5: RENDER UI
   */
  const sched = getScheduleDetails(scheduleType, roomNumber || "200");
  const lunchData = getLunchTier(roomNumber || "200");
  const linkedId = mappings[currentClass];

  if (authLoading) return <div className="h-screen bg-black flex items-center justify-center text-white font-black italic shadow-2xl uppercase tracking-widest animate-pulse">Initializing Lancer.OS...</div>;

  if (!user) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#8a2529] font-serif text-white text-center p-6 select-none overflow-hidden">
      <img src="/lancer-seal.png" className="w-32 mb-6 drop-shadow-2xl" />
      <h1 className="text-6xl font-black italic tracking-tighter mb-4 text-[#FCD450]">Agenda.OS</h1>
      <button onClick={async () => {
        const result = await signInWithPopup(auth, provider);
        const token = GoogleAuthProvider.credentialFromResult(result)?.accessToken;
        if (token) sessionStorage.setItem('gc_token', token);
      }} className="px-10 py-5 bg-white text-[#8a2529] rounded-3xl font-black text-xl shadow-2xl hover:scale-105 transition active:scale-95 uppercase tracking-widest">Teacher Login</button>
    </div>
  );

  return (
    <div className={`h-screen w-screen flex flex-col p-2 transition-colors duration-1000 overflow-hidden ${theme.bg}`}>
      
      {/* COMMAND CENTER HEADER */}
      <header className="flex items-center justify-between bg-black/40 backdrop-blur-3xl p-1.5 rounded-[2rem] border border-white/10 shadow-2xl mb-2 relative z-[90]">
        <div className="flex items-center gap-2">
          <img src={theme.logo} className="h-7 w-auto mx-1" />
          <div className="flex items-center bg-black/40 rounded-xl p-0.5 border border-white/5 shadow-inner">
            <button onClick={() => handleDateChange(-1)} className="p-1.5 text-white/40 hover:text-white transition"><ChevronLeft size={22}/></button>
            <div onClick={() => dateInputRef.current?.showPicker()} className="px-3 font-black text-xs text-white min-w-[80px] text-center cursor-pointer hover:text-[#FCD450]">
               {new Date(date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
               <input ref={dateInputRef} type="date" className="absolute invisible" value={date} onChange={async (e) => { await manualSave(); setDate(e.target.value); }} />
            </div>
            <button onClick={() => handleDateChange(1)} className="p-1.5 text-white/40 hover:text-white transition"><ChevronRight size={22}/></button>
          </div>
          <div className="flex flex-col border-l border-white/10 pl-3">
             <div className="flex items-center gap-1.5 leading-none">
                <ClockIcon size={10} className="text-[#FCD450]" />
                <span className="text-white font-black text-xs">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
             </div>
             <a href="https://salpointe-prayers.web.app" target="_blank" className="text-[6px] text-[#FCD450] font-black uppercase mt-0.5 hover:underline">PRAY</a>
          </div>
        </div>

        <div className="flex-1 px-4 min-w-0"><TabNavigation currentClass={currentClass} setClass={handleClassTabChange} /></div>

        <div className="flex items-center gap-1.5 pr-2">
          <div className={`h-1.5 w-1.5 rounded-full ${isSaving ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 shadow-[0_0_8px_lime]'}`} />
          <button onClick={manualSave} disabled={isSaving} className="p-2 bg-white/10 text-white rounded-xl hover:bg-emerald-600 transition" title="Save Board"><Cloud size={16}/></button>

          <div className="relative" ref={timerMenuRef}>
            <button onClick={() => setIsTimerMenuOpen(!isTimerMenuOpen)} className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border transition-all ${isTimerRunning ? 'bg-[#FCD450] border-[#FCD450] text-black scale-105' : 'bg-white/5 border-white/5 text-white/80'}`}>
              <TimerIcon size={14} className={isTimerRunning ? "animate-pulse" : "opacity-40"} />
              <span className="text-xs font-mono font-black">{Math.floor(timerSeconds / 60).toString().padStart(2, '0')}:{(timerSeconds % 60).toString().padStart(2, '0')}</span>
            </button>
            {isTimerMenuOpen && (
              <div className="absolute right-0 top-12 w-64 bg-[#0f172a] border border-white/20 rounded-[2rem] shadow-3xl z-[110] p-5 animate-in zoom-in text-white text-center">
                <div className="grid grid-cols-2 gap-2 mb-4">{[1, 5, 10, 20].map(m => (<button key={m} onClick={() => { setTimerSeconds(m * 60); setIsTimerRunning(true); setIsTimerMenuOpen(false); }} className="py-2.5 bg-white/5 rounded-xl text-[10px] font-black hover:bg-white/10 border border-white/5 transition">{m} MIN</button>))}</div>
                <input type="number" value={customTimerMins} onChange={(e) => setCustomTimerMins(e.target.value)} placeholder="00" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white font-bold text-center outline-none mb-2" />
                <div className="flex gap-2">
                  <button onClick={handleTimerAction} className={`flex-1 py-3 rounded-xl font-black text-xs transition ${isTimerRunning ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500 text-white shadow-lg'}`}>{isTimerRunning ? <Pause size={12}/> : <Play size={12}/>} START</button>
                  <button onClick={() => { setTimerSeconds(0); setIsTimerRunning(false); }} className="px-3 bg-white/5 rounded-xl text-white/40"><RotateCcw size={16} /></button>
                </div>
              </div>
            )}
          </div>

          <button onClick={() => setAiModal({ isOpen: true, mode: 'bulk', sectionKey: 'objective' })} className="p-2 bg-white/5 text-[#FCD450] border border-white/5 rounded-xl hover:bg-[#FCD450] hover:text-black transition shadow-lg"><Wand2 size={16}/></button>

          {/* MORE TOOLS MENU */}
          <div className="relative" ref={commandMenuRef}>
            <button onClick={() => setShowCommandMenu(!showCommandMenu)} className={`p-2 rounded-xl transition-all border ${showCommandMenu ? 'bg-white text-black' : 'bg-white/5 text-white/40 border-white/5'}`}>
              <MoreVertical size={18} />
            </button>
            {showCommandMenu && (
              <div className="absolute right-0 top-12 w-56 bg-[#0f172a] border border-white/20 rounded-[2rem] shadow-3xl z-[100] p-3 animate-in zoom-in flex flex-col gap-1">
                <button onClick={() => { setShowThemeMenu(true); setShowCommandMenu(false); }} className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-2xl text-[10px] font-black uppercase text-white"><Palette size={16} className="text-blue-400"/> Theme</button>
                <button onClick={copyPublicShareLink} className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-2xl text-[10px] font-black uppercase text-white"><Share2 size={16} className="text-emerald-400"/> Share</button>
                <button onClick={() => { setShowSettingsModal(true); setShowCommandMenu(false); }} className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-2xl text-[10px] font-black uppercase text-white"><Settings2 size={16} className="text-[#FCD450]"/> Labels</button>
                <button onClick={async () => {
                      const token = sessionStorage.getItem('gc_token');
                      const res = await fetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE', { headers: { 'Authorization': `Bearer ${token}` } });
                      const d = await res.json(); setCourses(d.courses || []); setShowClassroomModal(true); setShowCommandMenu(false);
                }} className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-2xl text-[10px] font-black uppercase text-white"><GraduationCap size={16} className="text-emerald-400"/> Link GC</button>
                {linkedId && <button onClick={() => handlePostToClassroom(linkedId)} className="w-full flex items-center gap-3 p-3 hover:bg-emerald-500/20 rounded-2xl text-[10px] font-black uppercase text-emerald-400"><Send size={16}/> Sync GC</button>}
                <div className="h-[1px] bg-white/10 my-1 mx-2" />
                <button onClick={() => signOut(auth)} className="w-full flex items-center gap-3 p-3 hover:bg-red-500/20 rounded-2xl text-[10px] font-black uppercase text-red-400"><LogOut size={16}/> Logout</button>
              </div>
            )}
          </div>

          {showThemeMenu && (
            <div className="absolute right-0 top-12 w-[400px] bg-[#0f172a] border border-white/20 rounded-[2.5rem] shadow-3xl z-[110] p-5 grid grid-cols-2 gap-2 animate-in zoom-in" ref={themeMenuRef}>
              {Object.values(THEMES).map((t: any) => (<button key={t.id} onClick={() => { setTheme(t); setShowThemeMenu(false); }} className={`flex flex-col items-start p-3 rounded-[1.5rem] transition-all border-2 ${theme.id === t.id ? 'bg-white border-white shadow-xl' : 'bg-white/5 border-transparent hover:bg-white/10'}`}><div className="flex justify-between w-full mb-1"><div className={`h-4 w-4 rounded-full shadow-md ${t.bg}`} /><div className={`h-1.5 w-1.5 rounded-full ${t.accent.replace('border-', 'bg-')}`} /></div><span className={`text-[9px] font-black uppercase tracking-widest ${theme.id === t.id ? 'text-black' : 'text-white'}`}>{t.name}</span></button>))}
            </div>
          )}
        </div>
      </header>

      {/* MAIN VIEW AREA */}
      <div className="flex-1 flex gap-3 min-h-0 relative">
        <main className="flex-1 grid grid-cols-3 grid-rows-2 gap-3 relative">
          {isAiProcessing && (<div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md rounded-[3.5rem] flex flex-col items-center justify-center animate-in fade-in"><Sparkles size={80} className="text-[#FCD450] animate-pulse mb-8" /><h2 className="text-4xl font-black italic text-white tracking-tighter uppercase text-center px-12 italic tracking-[0.1em]">Salpointe AI is building your board...</h2></div>)}
          {['objective', 'bellRinger', 'miniLecture', 'discussion', 'activity', 'independentWork'].map((key) => (
            <AgendaSection 
              key={key} 
              title={sectionNames[key]} 
              data={agenda[key]} 
              theme={theme} 
              onChange={(newData: any) => setAgenda({ ...agenda, [key]: newData })} 
              onMaximize={() => setFocusedSection(key)} 
              onOpenAI={() => setAiModal({ isOpen: true, mode: 'single', sectionKey: key })} 
              onOpenAssignmentPicker={async () => { setActiveSection(key); setPickerStep('course'); setIsAssignPickerOpen(true); const token = sessionStorage.getItem('gc_token'); const res = await fetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE', { headers: { 'Authorization': `Bearer ${token}` } }); const d = await res.json(); setCourses(d.courses || []); }} 
            />
          ))}
        </main>

        {/* FOCUS OVERLAY */}
        {focusedSection && (
          <div className={`absolute inset-0 z-[140] flex flex-col p-16 rounded-[4rem] animate-in fade-in ${theme.card} ${theme.accent} bg-black/90 backdrop-blur-3xl shadow-3xl`}>
             <div className="flex justify-between items-center mb-14 px-10"><h2 className={`text-6xl font-black uppercase tracking-[0.5em] ${theme.secondaryText}`}>{sectionNames[focusedSection]}</h2><button onClick={() => setFocusedSection(null)} className="px-12 py-6 bg-white text-black rounded-full font-black text-2xl flex items-center gap-4 hover:bg-red-500 hover:text-white transition shadow-2xl"><X size={40}/> EXIT FOCUS</button></div>
             <div className={`flex-1 px-14 text-8xl font-sans font-black leading-tight whitespace-pre-wrap overflow-y-auto custom-scrollbar prose prose-invert max-w-none ${theme.text}`} dangerouslySetInnerHTML={{ __html: agenda[focusedSection].text || "Lesson pending..." }} />
          </div>
        )}

        {/* SIDEBAR TOGGLE BAR (ON RIGHT) */}
        <div 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="w-2 hover:w-4 bg-white/5 hover:bg-[#FCD450]/20 cursor-pointer transition-all flex items-center justify-center group z-[80]"
        >
          {isSidebarOpen ? <PanelRightClose size={12} className="opacity-0 group-hover:opacity-100"/> : <PanelRightOpen size={12} className="opacity-0 group-hover:opacity-100 text-[#FCD450]"/>}
        </div>

        {/* THE SIDEBAR */}
        <aside className={`bg-black/30 backdrop-blur-md rounded-[3rem] border border-white/5 flex flex-col gap-4 overflow-hidden transition-all duration-500 shadow-2xl ${isSidebarOpen ? 'w-72 p-6 opacity-100' : 'w-0 p-0 opacity-0 border-none'}`}>
           <div className="flex flex-col gap-2 min-w-[240px]">
             <div className="flex justify-between items-center px-2"><span className="text-[10px] font-black text-white/30 uppercase tracking-widest leading-none">Room Setting</span>{lunchData.recognized && !isRoomEditing && <div className="flex items-center gap-1 text-[9px] font-black text-emerald-400 uppercase leading-none"><Lock size={10} /> Saved</div>}</div>
             <div className="relative group">
               <input value={roomNumber} disabled={!isRoomEditing} onChange={(e) => setRoomNumber(e.target.value)} className={`w-full bg-white/5 border rounded-2xl p-3 text-white font-black text-2xl outline-none transition-all ${!isRoomEditing ? 'border-transparent opacity-80' : 'border-[#FCD450]'}`} />
               <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                  {isRoomEditing ? <button onClick={async () => { await agendaService.saveTeacherSettings(user!.uid, { roomNumber }); setIsRoomEditing(false); }} className="p-2 bg-emerald-500 text-white rounded-lg shadow-lg"><Save size={14}/></button> : <button onClick={() => setIsRoomEditing(true)} className="p-2 bg-white/10 text-white/40 rounded-lg hover:text-white transition"><Edit3 size={14}/></button>}
               </div>
             </div>
             {lunchData.recognized && (<div className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex justify-between items-center animate-in slide-in-from-top-2"><span className="text-[10px] font-black text-emerald-400 uppercase">Lunch</span><span className="text-xs font-black text-white">{lunchData.tier === 1 ? '1st' : '2nd'}</span></div>)}
           </div>
           
           <div className="flex flex-col gap-2 border-t border-white/5 pt-3 min-w-[240px]">
             <h3 className="text-white font-black italic text-sm leading-none px-2">Schedule</h3>
             <select value={scheduleType} onChange={(e) => setScheduleType(e.target.value as ScheduleType)} className="w-full bg-white/10 text-white text-xs p-3 rounded-2xl border-none font-black outline-none cursor-pointer hover:bg-white/20 transition text-center appearance-none">
               <option value="A">Schedule A</option><option value="B">Schedule B</option><option value="B-Late">Late Arrival</option><option value="B-Assembly">Assembly</option><option value="B-Early">Early Dismiss</option><option value="C">Schedule C</option><option value="NONE">No School</option>
             </select>
           </div>

           <div className="space-y-1.5 min-w-[240px] overflow-y-auto custom-scrollbar pr-1 flex-1">
              <p className="text-[10px] font-black text-[#FCD450] uppercase tracking-widest mb-2 leading-none text-center underline underline-offset-4">{sched.title}</p>
              {sched.periods.map((p: any, i: number) => (<div key={i} className="bg-white/5 p-2 px-3 rounded-xl border border-white/5 flex justify-between items-center"><span className="text-[9px] font-bold text-white/30 uppercase">{p.label}</span><span className="text-[10px] font-black text-white">{p.time}</span></div>))}
              {sched.lunch && (<div className="bg-emerald-500/10 p-2 px-3 rounded-xl border border-emerald-500/30 flex justify-between items-center"><span className="text-[9px] font-black text-emerald-400 uppercase">Lunch</span><span className="text-[10px] font-black text-white">{sched.lunch.time}</span></div>)}
           </div>

           <div className="flex flex-col gap-2 border-t border-white/5 pt-3 min-w-[240px] h-32 overflow-hidden text-left">
              <div className="flex items-center gap-2 px-2 text-white/40 font-black italic text-xs uppercase mb-1"><Bell size={12} /> Events</div>
              <div className="overflow-y-auto custom-scrollbar flex-1 space-y-2 pr-1 text-[10px] text-blue-50 font-bold">
                 {schoolEvents.length > 0 ? schoolEvents.map((ev, i) => (
                   <div key={i} className="bg-blue-600/10 border border-blue-500/20 p-2 rounded-xl flex items-start gap-2"><Info size={10} className="text-blue-400 mt-0.5" />{ev}</div>
                 )) : <p className="text-center opacity-20 italic">No events.</p>}
              </div>
           </div>
        </aside>
      </div>

      <footer className="mt-1 flex justify-center text-[7px] font-black text-white/5 uppercase tracking-[0.4em] font-serif italic border-t border-white/5 pt-1 select-none">Salpointe Catholic • Established 1950</footer>

      {/* MODALS: BOARD SETTINGS, AI, CLASSROOM (Inherited logic from previous builds) */}
      {showSettingsModal && (
        <div className="absolute inset-0 z-[160] flex items-center justify-center bg-black/95 p-6 text-white font-sans text-left">
          <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-2xl rounded-[4rem] p-12 shadow-3xl flex flex-col animate-in zoom-in">
             <div className="flex justify-between items-center mb-10"><h2 className="text-4xl font-black italic tracking-tighter uppercase text-[#FCD450]">Board Settings</h2><button onClick={() => setShowSettingsModal(false)}><X size={32} className="text-white/20"/></button></div>
             <div className="grid grid-cols-2 gap-6 mb-10">
                {Object.keys(sectionNames).map((key) => (<div key={key}><label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2 block">{key} Name</label><input value={sectionNames[key]} onChange={(e) => setSectionNames({...sectionNames, [key]: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-[#FCD450]" /></div>))}
             </div>
             <button onClick={async () => { await agendaService.saveTeacherSettings(user!.uid, { sectionNames }); setShowSettingsModal(false); alert("Labels saved."); }} className="w-full py-8 bg-[#FCD450] text-[#8a2529] rounded-[3rem] font-black text-2xl uppercase tracking-widest leading-none shadow-2xl">Update Labels</button>
          </div>
        </div>
      )}

      {aiModal.isOpen && (
        <div className="absolute inset-0 z-[150] flex items-center justify-center bg-black/95 p-6 text-white font-sans text-left">
          <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-2xl rounded-[4rem] p-12 shadow-3xl flex flex-col animate-in zoom-in">
             <div className="flex justify-between items-center mb-10"><div className="flex items-center gap-4"><div className="bg-[#FCD450] p-4 rounded-2xl text-black"><Sparkles size={28}/></div><h2 className="text-4xl font-black italic tracking-tighter uppercase">AI Helper</h2></div><button onClick={() => setAiModal({ ...aiModal, isOpen: false })}><X size={32} className="text-white/20"/></button></div>
             <div className="space-y-8"><div className="grid grid-cols-2 gap-6"><div><label className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em] block mb-3 px-2">Subject</label><select value={aiSubject} onChange={(e) => setAiSubject(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-white font-black outline-none focus:border-[#FCD450] appearance-none"><option value="General">General</option><option value="Theology">Theology</option><option value="STEM">Science/Tech</option><option value="Mathematics">Math</option><option value="English">English</option><option value="Fine Arts">Fine Arts</option></select></div><div><label className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em] block mb-3 px-2">Topic</label><input autoFocus placeholder="Civil War..." value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-white font-black outline-none focus:border-[#FCD450]" /></div></div><button onClick={executeAIGeneration} disabled={!aiTopic.trim() || isAiProcessing} className="w-full py-8 bg-white text-black rounded-[3rem] font-black text-2xl hover:bg-[#FCD450] transition shadow-2xl disabled:opacity-20 uppercase tracking-widest">{isAiProcessing ? <Loader2 className="animate-spin" size={32}/> : <Wand2 size={32}/>}{aiModal.mode === 'bulk' ? 'BUILD FULL BOARD' : 'BUILD SECTION'}</button></div>
          </div>
        </div>
      )}

      {showClassroomModal && (
        <div className="absolute inset-0 z-[120] flex items-center justify-center bg-black/90 p-6 text-white text-left">
          <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-lg rounded-[3.5rem] p-10 shadow-2xl flex flex-col max-h-[85vh]">
             <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-black italic tracking-tighter">Link Classroom</h2><button onClick={() => setShowClassroomModal(false)}><X size={24}/></button></div>
             <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar">
               {courses.map(course => (
                 <div key={course.id} className="flex gap-2">
                   <button onClick={() => handlePostToClassroom(course.id)} className="flex-1 p-5 bg-white/5 hover:bg-emerald-600/20 border border-white/5 rounded-2xl text-left font-bold text-sm truncate">{course.name}</button>
                   <button onClick={async () => { const newM = { ...mappings, [currentClass]: course.id }; await agendaService.saveTeacherSettings(user!.uid, { classroomMappings: newM }); setMappings(newM); setShowClassroomModal(false); }} className={`p-5 rounded-2xl border ${mappings[currentClass] === course.id ? 'bg-[#FCD450] text-black border-[#FCD450]' : 'bg-white/5 border-white/5'}`}><LinkIcon size={18}/></button>
                 </div>
               ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}