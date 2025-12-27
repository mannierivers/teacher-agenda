'use client';
import { Sparkles, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function AgendaSection({ title, value, onChange, aiPrompt }: any) {
  const [loading, setLoading] = useState(false);

  const handleAI = async () => {
    const topic = prompt(`What is the specific topic for ${title}?`);
    if (!topic) return;

    setLoading(true);
    try {
      const res = await fetch('/api/generate-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `${aiPrompt} ${topic}. Keep it concise for a whiteboard.` }),
      });
      const data = await res.json();
      onChange(data.content);
    } catch (err) {
      alert("AI failed to generate. Check your Groq key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex flex-col group hover:border-blue-500/50 transition-colors">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400/70">{title}</h3>
        <button 
          onClick={handleAI}
          disabled={loading}
          className="p-2 bg-blue-600/10 text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
        </button>
      </div>
      <textarea
        className="flex-1 bg-transparent border-none outline-none resize-none text-xl leading-relaxed placeholder:text-slate-700"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Start typing..."
      />
    </div>
  );
}