'use client';

/** 
 * MODULE 1: IMPORTS
 */
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { 
  Calendar, 
  BookOpen, 
  Clock, 
  ExternalLink, 
  GraduationCap, 
  AlertCircle,
  Loader2,
  Presentation
} from 'lucide-react';
import { THEMES } from '@/lib/themes';

export default function StudentViewPage() {
  const params = useParams();
  
  // State for data and styling
  const [agenda, setAgenda] = useState<any>(null);
  const [theme, setTheme] = useState(THEMES.standard);
  const [layout, setLayout] = useState({ col1: 1, col2: 1, col3: 1, row1: 1, row2: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  /** 
   * MODULE 2: DATA FETCHING
   */
  useEffect(() => {
    const fetchSharedAgenda = async () => {
      // Reconstruct ID: {uid}_{date}_{classId}
      const docId = `${params.teacherId}_${params.date}_${params.classId}`;
      const docRef = doc(db, "agendas", docId);
      
      try {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          // Handle both old flat structure and new nested structure
          const content = data.content || data;
          setAgenda(content);
          
          if (data.layout) setLayout(data.layout);
          if (data.themeId && THEMES[data.themeId]) setTheme(THEMES[data.themeId]);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Shared View Error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (params.teacherId) fetchSharedAgenda();
  }, [params]);

  /** 
   * MODULE 3: LOADING & ERROR STATES
   */
  if (loading) return (
    <div className="h-screen bg-[#8a2529] flex flex-col items-center justify-center text-white">
      <Loader2 className="animate-spin mb-4" size={40} />
      <p className="font-serif italic tracking-widest text-sm opacity-60 uppercase">Loading Lancer Agenda...</p>
    </div>
  );

  if (error) return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-center p-6 text-slate-400">
      <AlertCircle size={48} className="text-red-900 mb-4" />
      <h1 className="text-2xl font-bold text-white mb-2">Agenda Not Found</h1>
      <p className="text-sm max-w-xs">The teacher may not have posted an agenda for this date yet, or the link is incorrect.</p>
    </div>
  );

  /** 
   * MODULE 4: MAIN RENDER
   */
  return (
    <div className={`h-screen w-screen flex flex-col p-4 transition-colors duration-1000 overflow-hidden ${theme.bg}`}>
      
      {/* CONSOLIDATED HEADER (Matches Teacher View) */}
      <header className="flex justify-between items-center mb-4 bg-black/30 backdrop-blur-2xl p-4 rounded-[2.5rem] border border-white/10 shadow-2xl">
        <div className="flex items-center gap-4">
          <img src={theme.logo} className="h-12 w-auto drop-shadow-lg" alt="Lancer Logo" />
          <div className="h-10 w-[1px] bg-white/10 mx-2" />
          <div className="flex flex-col">
            <h1 className={`text-lg font-black tracking-tighter italic leading-none ${theme.text}`}>ClassDeck.OS</h1>
            <p className={`text-[9px] uppercase tracking-[0.3em] font-bold ${theme.secondaryText} opacity-70`}>Student Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right flex flex-col items-end">
            <div className={`text-sm font-black uppercase tracking-widest ${theme.text}`}>
              {params.classId?.toString().replace('p', 'Period ')}
            </div>
            <div className={`text-[10px] font-bold flex items-center gap-2 ${theme.secondaryText} opacity-60`}>
              <Calendar size={12} />
              {new Date(params.date as string + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </div>
      </header>

      {/* THE GRID (Replicates Teacher's sizes and Media) */}
      <main 
        className="flex-1 grid gap-4 transition-all duration-1000"
        style={{
          gridTemplateColumns: `${layout.col1}fr ${layout.col2}fr ${layout.col3}fr`,
          gridTemplateRows: `${layout.row1}fr ${layout.row2}fr`
        }}
      >
        <ReadOnlyCard title="Lesson Objective" data={agenda.objective} theme={theme} />
        <ReadOnlyCard title="Bell Ringer" data={agenda.bellRinger} theme={theme} />
        <ReadOnlyCard title="Mini-Lecture" data={agenda.miniLecture} theme={theme} />
        <ReadOnlyCard title="Guided Discussion" data={agenda.discussion} theme={theme} />
        <ReadOnlyCard title="Activity" data={agenda.activity} theme={theme} />
        <ReadOnlyCard title="Independent Work" data={agenda.independentWork} theme={theme} />
      </main>

      <footer className="mt-4 flex justify-between items-center px-4">
        <span className="text-[10px] text-white/20 uppercase tracking-[0.4em] font-serif">Salpointe Catholic • Established 1950</span>
        <div className="px-4 py-1.5 bg-black/20 rounded-full border border-white/5 text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold">
          Read Only View
        </div>
      </footer>
    </div>
  );
}

/**
 * COMPONENT: ReadOnlyCard
 * Handles the nested {text, media} structure.
 */
function ReadOnlyCard({ title, data, theme }: any) {
  // Support both old flat string data and new object data
  const text = typeof data === 'string' ? data : data?.text;
  const media = typeof data === 'string' ? null : data?.media;

  return (
    <div className={`${theme.card} border-l-4 ${theme.accent} rounded-[2.5rem] p-6 flex flex-col shadow-2xl overflow-hidden`}>
      <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-50 ${theme.secondaryText}`}>
        {title}
      </h3>
      
      <div className="flex-1 overflow-hidden flex flex-col">
        {media ? (
          <div className="h-full w-full rounded-2xl overflow-hidden bg-black/20 border border-white/5 shadow-inner">
            {media.type === 'slides' && (
              <iframe 
                src={`https://docs.google.com/presentation/d/${media.url}/embed`} 
                className="w-full h-full" 
                allowFullScreen 
              />
            )}
            
            {media.type === 'image' && (
              <img src={media.url} className="h-full w-full object-contain" alt="Lesson Graphic" />
            )}
            
            {(media.type === 'link' || media.type === 'assignment') && (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white/5">
                {media.type === 'assignment' ? <GraduationCap size={48} className="mb-4 text-emerald-400" /> : <ExternalLink size={48} className="mb-4 opacity-20" />}
                <p className="text-xl font-bold mb-4">{media.title}</p>
                <a 
                  href={media.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-8 py-3 bg-white text-black rounded-full font-bold hover:scale-105 transition active:scale-95"
                >
                  Open Resource
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className={`text-xl lg:text-2xl font-sans leading-relaxed whitespace-pre-wrap overflow-y-auto pr-2 custom-scrollbar ${theme.text}`}>
            {text || <span className="opacity-10 italic">Not specified for today.</span>}
          </div>
        )}
      </div>
    </div>
  );
}