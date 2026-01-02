'use client';

/**
 * MODULE 1: IMPORTS
 * We only need Firestore read functions. No Auth needed for students to view.
 */
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { 
  Calendar, 
  BookOpen, 
  Clock, 
  ChevronRight, 
  AlertCircle 
} from 'lucide-react';

export default function StudentViewPage() {
  const params = useParams();
  
  // State for data and UI
  const [agenda, setAgenda] = useState<any>(null);
  const [layout, setLayout] = useState({ col1: 1, col2: 1, col3: 1, row1: 1, row2: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  /**
   * MODULE 2: DATA FETCHING
   * Pulls the specific teacher's agenda using URL parameters
   */
  useEffect(() => {
    const fetchSharedAgenda = async () => {
      // Params are teacherId, classId, and date from the URL path
      const docId = `${params.teacherId}_${params.date}_${params.classId}`;
      const docRef = doc(db, "agendas", docId);
      
      try {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setAgenda(data);
          if (data.layout) setLayout(data.layout);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Link error:", err);
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
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center">
      <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
        <div className="w-full h-full bg-blue-500 animate-loading-bar" />
      </div>
      <p className="mt-4 text-slate-500 font-mono text-xs uppercase tracking-widest">Retrieving Lesson...</p>
    </div>
  );

  if (error) return (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-6">
      <AlertCircle size={48} className="text-red-500 mb-4 opacity-50" />
      <h1 className="text-2xl font-bold text-white mb-2">Agenda Not Found</h1>
      <p className="text-slate-400 max-w-xs">This link may be expired, or the teacher hasn't posted an agenda for this specific date yet.</p>
    </div>
  );

  /**
   * MODULE 4: MAIN RENDER
   */
  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden p-4 lg:p-8">
      
      {/* HEADER: Non-interactive info bar */}
      <header className="flex justify-between items-center mb-6 bg-slate-900/40 backdrop-blur-md p-5 rounded-[2rem] border border-slate-800/50">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2 rounded-xl">
            <BookOpen size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-white">ClassDeck<span className="text-blue-500">.</span></h1>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em]">Student Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-sm font-bold text-slate-200 uppercase tracking-widest">
              {params.classId?.toString().replace('p', 'Period ')}
            </div>
            <div className="text-xs text-slate-500 flex items-center justify-end gap-2">
              <Calendar size={12} />
              {new Date(params.date as string).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </div>
      </header>

      {/* THE GRID: Replicates Teacher's sizes but as Read-Only boxes */}
      <main 
        className="flex-1 grid gap-4 lg:gap-6 transition-all duration-1000"
        style={{
          gridTemplateColumns: `${layout.col1}fr ${layout.col2}fr ${layout.col3}fr`,
          gridTemplateRows: `${layout.row1}fr ${layout.row2}fr`
        }}
      >
        <AgendaCard title="Lesson Objective" content={agenda.objective} accent="border-t-blue-500" />
        <AgendaCard title="Bell Ringer" content={agenda.bellRinger} accent="border-t-emerald-500" />
        <AgendaCard title="Mini-Lecture" content={agenda.miniLecture} accent="border-t-purple-500" />
        <AgendaCard title="Guided Discussion" content={agenda.discussion} accent="border-t-amber-500" />
        <AgendaCard title="Activity" content={agenda.activity} accent="border-t-pink-500" />
        <AgendaCard title="Independent Work" content={agenda.independentWork} accent="border-t-sky-500" />
      </main>

      <footer className="mt-6 flex justify-center">
        <div className="px-4 py-1.5 bg-slate-900 rounded-full border border-slate-800 text-[10px] text-slate-500 uppercase tracking-[0.3em] font-bold">
          View Only Mode
        </div>
      </footer>
    </div>
  );
}

/**
 * COMPONENT: AgendaCard
 * Designed for high-readability on Chromebooks and Phones.
 */
function AgendaCard({ title, content, accent }: { title: string, content: string, accent: string }) {
  return (
    <div className={`bg-slate-900/60 border-l border-slate-800 border-t-2 ${accent} rounded-3xl p-6 lg:p-8 flex flex-col shadow-2xl`}>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-[10px] lg:text-xs font-black uppercase tracking-[0.2em] text-slate-500">
          {title}
        </h3>
        <ChevronRight size={12} className="text-slate-700" />
      </div>
      
      <div className="flex-1 text-lg lg:text-2xl leading-relaxed text-slate-200 whitespace-pre-wrap overflow-y-auto custom-scrollbar">
        {content || (
          <span className="text-slate-700 italic text-base lg:text-lg">
            Teacher has not added content for this section.
          </span>
        )}
      </div>
    </div>
  );
}