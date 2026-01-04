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
  Lock, Edit3, Save, Settings2, Type, Cloud, Bell, Info
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

  // App Context
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentClass, setCurrentClass] = useState('p1');
  const [layout, setLayout] = useState({ col1: 1, col2: 1, col3: 1, row1: 1, row2: 1 });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isScheduleSyncing, setIsScheduleSyncing] = useState(false);
  
  // UI Overlays
  const [showThemeMenu, setShowThemeMenu] = useState(false);
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
  const [schoolEvents, setSchoolEvents] = useState<string[]>([]); // 👈 NEW STATE
  
  const [sectionNames, setSectionNames] = useState<any>({
    objective: "Lesson Objective", bellRinger: "Bell Ringer", miniLecture: "Mini-Lecture",
    discussion: "Guided Discussion", activity: "Activity", independentWork: "Independent Work"
  });

  const [agenda, setAgenda] = useState<any>({
    objective: { text: '', media: null }, bellRinger: { text: '', media: null },
    miniLecture: { text: '', media: null }, discussion: { text: '', media: null },
    activity: { text: '', media: null }, independentWork: { text: '', media: null }
  });

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
   * MODULE 3: PERSISTENCE & SYNC
   */
  const manualSave = async () => {
    if (!user) return;
    setIsSaving(true);
    await agendaService.saveAgenda(user.uid, date, currentClass, { agenda, layout, themeId: theme.id, scheduleType });
    setTimeout(() => setIsSaving(false), 800);
  };

  const handleDateChange = async (days: number) => {
    await manualSave();
    const d = new Date(date + 'T00:00:00'); 
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
  };

  // 👈 IMPROVED SYNC: Handles A/B Day and School Events
  useEffect(() => {
    if (!user) return;
    const syncBoard = async () => {
      setIsScheduleSyncing(true);
      try {
        const res = await fetch(`/api/schedule?date=${date}`, { cache: 'no-store' });
        const d = await res.json();
        setScheduleType((d.scheduleType || 'NONE') as ScheduleType);
        setSchoolEvents(d.schoolEvents || []); // Update School Events state
      } catch (e) {
        setScheduleType('NONE');
        setSchoolEvents([]);
      }
      setIsScheduleSyncing(false);

      const data = await agendaService.getAgenda(user.uid, date, currentClass);
      if (data) {
        const c = data.content || data;
        setAgenda({ objective: c.objective || { text: '', media: null }, bellRinger: c.bellRinger || { text: '', media: null }, miniLecture: c.miniLecture || { text: '', media: null }, discussion: c.discussion || { text: '', media: null }, activity: c.activity || { text: '', media: null }, independentWork: c.independentWork || { text: '', media: null } });
        if (data.layout) setLayout(data.layout);
        if (data.themeId && THEMES[data.themeId]) setTheme(THEMES[data.themeId]);
      } else {
        setAgenda({ objective: { text: '', media: null }, bellRinger: { text: '', media: null }, miniLecture: { text: '', media: null }, discussion: { text: '', media: null }, activity: { text: '', media: null }, independentWork: { text: '', media: null } });
      }
    };
    syncBoard();
  }, [user, date, currentClass]);

  /** 
   * MODULE 4: SYSTEM BOOT
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
    return () => { unsubscribe(); clearInterval(clock); };
  }, []);

  /** 
   * MODULE 5: RENDER UI
   */
  const sched = getScheduleDetails(scheduleType, roomNumber || "200");
  const lunchData = getLunchTier(roomNumber || "200");
  const linkedId = mappings[currentClass];

  if (authLoading) return <div className="h-screen bg-black flex items-center justify-center text-white font-black italic tracking-widest animate-pulse">Lancer.OS...</div>;

  if (!user) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#8a2529] font-serif text-white text-center p-6">
      <img src="/lancer-seal.png" className="w-40 mb-8 drop-shadow-2xl" />
      <h1 className="text-7xl font-black italic tracking-tighter mb-8 text-[#FCD450]">Agenda.OS</h1>
      <button onClick={() => signInWithPopup(auth, provider)} className="px-12 py-6 bg-white text-[#8a2529] rounded-[2.5rem] font-black text-2xl shadow-2xl hover:scale-105 transition active:scale-95 uppercase">Teacher Login</button>
    </div>
  );

  return (
    <div className={`h-screen w-screen flex flex-col p-3 transition-colors duration-1000 overflow-hidden ${theme.bg}`}>
      
      {/* COMMAND CENTER HEADER */}
      <header className="flex items-center justify-between bg-black/40 backdrop-blur-3xl p-2 rounded-3xl border border-white/10 shadow-2xl mb-3 relative z-[90]">
        <div className="flex items-center gap-2">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-white/5 text-white/40 hover:text-white rounded-xl border border-white/5 transition shadow-inner">
            {isSidebarOpen ? <PanelLeftClose size={18}/> : <PanelLeftOpen size={18} className="text-[#FCD450]"/>}
          </button>
          
          <img src={theme.logo} className="h-8 w-auto mr-1" />

          {/* DATE NAVIGATION */}
          <div className="flex items-center bg-black/40 rounded-xl p-0.5 border border-white/5 shadow-inner">
            <button onClick={() => handleDateChange(-1)} className="p-1 text-white/40 hover:text-white transition"><ChevronLeft size={22}/></button>
            <div onClick={() => dateInputRef.current?.showPicker()} className="px-3 font-black text-xs text-white min-w-[80px] text-center cursor-pointer hover:text-[#FCD450]">
               {new Date(date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
               <input ref={dateInputRef} type="date" className="absolute invisible" value={date} onChange={async (e) => { await manualSave(); setDate(e.target.value); }} />
            </div>
            <button onClick={() => handleDateChange(1)} className="p-1 text-white/40 hover:text-white transition"><ChevronRight size={22}/></button>
          </div>

          <div className="flex flex-col border-l border-white/10 pl-3">
             <div className="flex items-center gap-1.5">
                <ClockIcon size={12} className="text-[#FCD450]" />
                <span className="text-white font-black text-sm leading-none">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
             </div>
             <a href="https://salpointe-prayers.web.app" target="_blank" className="text-[7px] text-[#FCD450] font-black uppercase mt-0.5 hover:underline">PRAY</a>
          </div>
        </div>

        <div className="flex-1 px-4"><TabNavigation currentClass={currentClass} setClass={(id: string) => { manualSave(); setCurrentClass(id); }} /></div>

        <div className="flex items-center gap-2">
          <div className="mr-1 flex items-center gap-2 px-3 py-1.5 bg-black/30 rounded-xl border border-white/5">
            <div className={`h-2 w-2 rounded-full ${isSaving ? 'bg-amber-500 animate-pulse shadow-[0_0_8px_orange]' : 'bg-emerald-500 shadow-[0_0_8px_lime]'}`} />
            <span className="text-[8px] font-black text-white/40 uppercase tracking-widest leading-none">{isSaving ? 'Saving' : 'Synced'}</span>
          </div>

          <button onClick={manualSave} className="p-2.5 bg-white/10 text-white rounded-xl hover:bg-emerald-600 transition"><Cloud size={18}/></button>

          {/* TIMER TOOL */}
          <div className="relative" ref={timerMenuRef}>
            <button onClick={() => setIsTimerMenuOpen(!isTimerMenuOpen)} className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border transition-all shadow-lg ${isTimerRunning ? 'bg-[#FCD450] border-[#FCD450] text-black scale-105' : 'bg-white/5 border-white/5 text-white/80'}`}>
              <TimerIcon size={16} className={isTimerRunning ? "animate-pulse" : "opacity-40"} />
              <span className="text-sm font-mono font-black">{Math.floor(timerSeconds / 60).toString().padStart(2, '0')}:{(timerSeconds % 60).toString().padStart(2, '0')}</span>
            </button>
            {isTimerMenuOpen && (
              <div className="absolute right-0 top-14 w-64 bg-[#0f172a] border border-white/20 rounded-[2rem] shadow-3xl z-[110] p-5 animate-in zoom-in text-white text-center">
                <div className="grid grid-cols-2 gap-2 mb-4">{[1, 5, 10, 20].map(m => (<button key={m} onClick={() => { setTimerSeconds(m * 60); setIsTimerRunning(true); setIsTimerMenuOpen(false); }} className="py-2.5 bg-white/5 rounded-xl text-[10px] font-black hover:bg-white/10 border border-white/5 transition">{m} MIN</button>))}</div>
                <input type="number" value={customTimerMins} onChange={(e) => setCustomTimerMins(e.target.value)} placeholder="00" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white font-bold text-center outline-none mb-2" />
                <div className="flex gap-2">
                  <button onClick={() => { if(customTimerMins !== "") { setTimerSeconds(parseInt(customTimerMins)*60); setIsTimerRunning(true); setCustomTimerMins(""); setIsTimerMenuOpen(false); } else { setIsTimerRunning(!isTimerRunning); } }} className={`flex-1 py-3 rounded-xl font-black text-xs transition ${isTimerRunning ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500 text-white shadow-lg'}`}>{isTimerRunning ? <Pause size={12}/> : <Play size={12}/>} START</button>
                  <button onClick={() => { setTimerSeconds(0); setIsTimerRunning(false); }} className="px-3 bg-white/5 rounded-xl text-white/40"><RotateCcw size={16} /></button>
                </div>
              </div>
            )}
          </div>

          <button onClick={() => setAiModal({ isOpen: true, mode: 'bulk', sectionKey: 'objective' })} className="p-2.5 bg-white/5 text-[#FCD450] border border-white/5 rounded-xl hover:bg-[#FCD450] transition shadow-lg"><Wand2 size={20}/></button>

          <button onClick={() => signOut(auth)} className="ml-1 p-2 text-white/10 hover:text-red-400 transition"><LogOut size={22}/></button>
        </div>
      </header>

      {/* MAIN VIEW AREA */}
      <div className="flex-1 flex gap-4 min-h-0 relative">
        <aside className={`bg-black/30 backdrop-blur-md rounded-[3rem] border border-white/5 flex flex-col gap-5 overflow-hidden transition-all duration-500 shadow-2xl ${isSidebarOpen ? 'w-72 p-6 opacity-100' : 'w-0 p-0 opacity-0 border-none'}`}>
           
           {/* ROOM & LUNCH LOGIC */}
           <div className="flex flex-col gap-3 min-w-[240px]">
             <div className="flex justify-between items-center px-2"><span className="text-[10px] font-black text-white/30 uppercase tracking-widest leading-none">Room Tracking</span>{lunchData.recognized && !isRoomEditing && <div className="flex items-center gap-1 text-[9px] font-black text-emerald-400 uppercase leading-none"><Lock size={10} /> Saved</div>}</div>
             <div className="relative group">
               <input value={roomNumber} disabled={!isRoomEditing} onChange={(e) => setRoomNumber(e.target.value)} className={`w-full bg-white/5 border rounded-2xl p-4 text-white font-black text-2xl outline-none transition-all ${!isRoomEditing ? 'border-transparent opacity-80' : 'border-[#FCD450]'}`} />
               <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isRoomEditing ? <button onClick={async () => { await agendaService.saveTeacherSettings(user!.uid, { roomNumber }); setIsRoomEditing(false); }} className="p-2 bg-emerald-500 text-white rounded-lg shadow-lg"><Save size={14}/></button> : <button onClick={() => setIsRoomEditing(true)} className="p-2 bg-white/10 text-white/40 rounded-lg"><Edit3 size={14}/></button>}
               </div>
             </div>
             {lunchData.recognized && (<div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex justify-between items-center animate-in slide-in-from-top-2"><span className="text-[10px] font-black text-emerald-400 uppercase leading-none">Detection</span><span className="text-xs font-black text-white leading-none">{lunchData.tier === 1 ? '1st' : '2nd'} LUNCH</span></div>)}
           </div>
           
           {/* AUTO-SYNCED SCHEDULE DISPLAY */}
           <div className="flex flex-col gap-2 border-t border-white/5 pt-4 min-w-[240px]">
             <div className="flex justify-between items-end px-2">
               <h3 className="text-white font-black italic text-sm leading-none">Schedule</h3>
               <span className={`text-[8px] font-bold uppercase flex items-center gap-1 ${isScheduleSyncing ? 'text-amber-500' : 'text-emerald-400'}`}>
                 {isScheduleSyncing ? <Loader2 size={8} className="animate-spin" /> : <CalendarIcon size={8} />} 
                 {isScheduleSyncing ? 'Syncing...' : 'Auto-Synced'}
               </span>
             </div>
             <div className="bg-white/10 rounded-2xl p-4 border border-white/10 text-center shadow-inner relative group">
                <p className="text-[10px] font-black text-[#FCD450] uppercase tracking-widest mb-1">{sched.title}</p>
                <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                   <select value={scheduleType} onChange={(e) => setScheduleType(e.target.value as ScheduleType)} className="bg-transparent text-white font-black text-[10px] outline-none">
                     <option value="A">Set A</option><option value="B">Set B</option><option value="C">Set C</option><option value="NONE">None</option>
                   </select>
                </div>
             </div>
           </div>

           {/* 👈 NEW: SCHOOL EVENTS FEED */}
           <div className="flex flex-col gap-2 border-t border-white/5 pt-4 min-w-[240px] flex-1 overflow-hidden">
              <div className="flex items-center gap-2 px-2 text-white/40 font-black italic text-sm uppercase mb-2">
                 <Bell size={14} /> School Events
              </div>
              <div className="overflow-y-auto custom-scrollbar flex-1 space-y-2">
                 {schoolEvents.length > 0 ? schoolEvents.map((ev, i) => (
                   <div key={i} className="bg-blue-600/10 border border-blue-500/20 p-3 rounded-2xl flex items-start gap-3">
                      <Info size={12} className="text-blue-400 mt-0.5 shrink-0" />
                      <span className="text-[11px] font-bold text-blue-50 leading-tight">{ev}</span>
                   </div>
                 )) : (
                   <p className="text-center text-[10px] text-white/10 italic py-4">No events listed for today.</p>
                 )}
              </div>
           </div>

           {/* PERIOD TIMES (Condensed) */}
           <div className="space-y-1.5 min-w-[240px]">
              {sched.periods.map((p: any, i: number) => (<div key={i} className="bg-white/5 p-2 px-3 rounded-xl border border-white/5 flex justify-between items-center"><span className="text-[9px] font-bold text-white/30 uppercase">{p.label}</span><span className="text-[10px] font-black text-white">{p.time}</span></div>))}
           </div>
        </aside>

        <main className="flex-1 grid grid-cols-3 grid-rows-2 gap-4 relative">
          {isAiProcessing && (<div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md rounded-[3.5rem] flex flex-col items-center justify-center animate-in fade-in"><Sparkles size={80} className="text-[#FCD450] animate-pulse mb-8" /><h2 className="text-4xl font-black italic text-white tracking-tighter uppercase text-center px-12 italic tracking-[0.1em]">Salpointe AI Assistant...</h2></div>)}
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
      </div>

      <footer className="mt-1 flex justify-center text-[7px] font-black text-white/5 uppercase tracking-[0.4em] font-serif italic border-t border-white/5 pt-2">Salpointe Catholic • Established 1950</footer>
    </div>
  );
}