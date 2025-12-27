'use client';

import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import AgendaSection from '@/components/AgendaSection';
import TabNavigation from '@/components/TabNavigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function DailyAgenda() {
  // 1. STATE: Track current date, class, and agenda content
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentClass, setCurrentClass] = useState('p1');
  const [agenda, setAgenda] = useState({
    objective: '',
    bellRinger: '',
    miniLecture: '',
    discussion: '',
    activity: '',
    independentWork: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  // 2. LOAD: Fetch data from Firebase when date or class changes
  useEffect(() => {
    const loadData = async () => {
      const docId = `${date}_${currentClass}`;
      const docRef = doc(db, "agendas", docId);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        setAgenda(snap.data() as any);
      } else {
        // Reset to empty for new entries
        setAgenda({
          objective: '', bellRinger: '', miniLecture: '', 
          discussion: '', activity: '', independentWork: ''
        });
      }
    };
    loadData();
  }, [date, currentClass]);

  // 3. AUTO-SAVE: Save to Firebase 1.5 seconds after user stops typing
  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsSaving(true);
      const docId = `${date}_${currentClass}`;
      await setDoc(doc(db, "agendas", docId), {
        ...agenda,
        date,
        classId: currentClass,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
      setIsSaving(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [agenda, date, currentClass]);

  // 4. HELPERS: Date navigation
  const changeDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Sub-Header: Date Controls & Save Status */}
      <div className="flex justify-between items-center bg-slate-900 p-2 rounded-xl border border-slate-800 px-6">
        <div className="flex items-center gap-4">
          <button onClick={() => changeDate(-1)} className="p-2 hover:bg-slate-700 rounded-full transition"><ChevronLeft /></button>
          <span className="text-xl font-bold tracking-tight w-48 text-center">{date}</span>
          <button onClick={() => changeDate(1)} className="p-2 hover:bg-slate-700 rounded-full transition"><ChevronRight /></button>
        </div>
        
        <TabNavigation currentClass={currentClass} setClass={setCurrentClass} />

        <div className="text-sm font-mono text-slate-500 w-24 text-right">
          {isSaving ? 'Saving...' : 'Synced'}
        </div>
      </div>

      {/* The 6-Grid Agenda */}
      <div className="flex-1 grid grid-cols-3 grid-rows-2 gap-4">
        <AgendaSection 
          title="Lesson Objective" 
          value={agenda.objective} 
          onChange={(v) => setAgenda({...agenda, objective: v})} 
          aiPrompt="Create a learning objective for a lesson about..."
        />
        <AgendaSection 
          title="Bell Ringer" 
          value={agenda.bellRinger} 
          onChange={(v) => setAgenda({...agenda, bellRinger: v})} 
          aiPrompt="Create an engaging warm-up question for..."
        />
        <AgendaSection 
          title="Mini-Lecture" 
          value={agenda.miniLecture} 
          onChange={(v) => setAgenda({...agenda, miniLecture: v})} 
          aiPrompt="Summarize 3 key teaching points for..."
        />
        <AgendaSection 
          title="Guided Discussion" 
          value={agenda.discussion} 
          onChange={(v) => setAgenda({...agenda, discussion: v})} 
          aiPrompt="Generate 3 deep discussion questions about..."
        />
        <AgendaSection 
          title="Activity" 
          value={agenda.activity} 
          onChange={(v) => setAgenda({...agenda, activity: v})} 
          aiPrompt="Outline a hands-on activity for..."
        />
        <AgendaSection 
          title="Independent Work" 
          value={agenda.independentWork} 
          onChange={(v) => setAgenda({...agenda, independentWork: v})} 
          aiPrompt="Suggest an exit ticket task for..."
        />
      </div>
    </div>
  );
}