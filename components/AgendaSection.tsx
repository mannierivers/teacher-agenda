'use client';

import { 
  Sparkles, Loader2, Image as ImageIcon, Presentation, 
  Link as LinkIcon, GraduationCap, X, ExternalLink, Maximize2 
} from 'lucide-react';

export default function AgendaSection({ title, data, theme, onChange, onOpenAssignmentPicker, onMaximize, onOpenAI }: any) {

  const addMedia = (type: 'image' | 'slides' | 'link') => {
    const url = prompt(`Paste your ${type === 'slides' ? 'Google Slides' : type} URL here:`);
    if (!url) return;
    const extractId = (u: string) => { const m = u.match(/[-\w]{25,}/); return m ? m[0] : null; };
    if (type === 'slides') {
      const id = extractId(url);
      if (!id) return alert("Invalid URL");
      onChange({ ...data, media: { type, url: id, title: 'Google Slides Deck' } });
    } else {
      onChange({ ...data, media: { type, url, title: type === 'image' ? 'Visual Aid' : 'Web Link' } });
    }
  };

  return (
    <div className={`group relative flex flex-col p-6 rounded-[2.5rem] border-l-[6px] transition-all duration-700 shadow-2xl overflow-hidden ${theme.card} ${theme.accent}`}>
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-[11px] font-black uppercase tracking-[0.25em] ${theme.secondaryText}`}>{title}</h3>
        <div className="flex items-center gap-1.5">
          {data.media && (
            <button onClick={() => onChange({...data, media: null})} className="p-1.5 text-white/20 hover:text-red-400 transition" title="Delete Media"><X size={14}/></button>
          )}
          <button onClick={onMaximize} className="p-2 bg-white/5 text-white/30 hover:text-[#FCD450] transition rounded-xl" title="Expand View"><Maximize2 size={16} /></button>
          <button onClick={onOpenAI} className="p-2 bg-white/5 text-white/30 hover:bg-white hover:text-black transition rounded-xl" title="Lancer AI Assistant">
            <Sparkles size={16} />
          </button>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {data.media ? (
          <div className="h-full w-full rounded-3xl overflow-hidden bg-black/40 border border-white/10 relative shadow-inner">
            {data.media.type === 'slides' && <iframe src={`https://docs.google.com/presentation/d/${data.media.url}/embed`} className="w-full h-full border-0" allowFullScreen />}
            {data.media.type === 'image' && <img src={data.media.url} className="h-full w-full object-contain p-4" />}
            {(data.media.type === 'link' || data.media.type === 'assignment') && (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                {data.media.type === 'assignment' ? <GraduationCap size={48} className="mb-4 text-emerald-400" /> : <LinkIcon size={48} className="mb-4 opacity-20" />}
                <p className="font-bold text-white mb-4 text-sm max-w-[200px] truncate">{data.media.title}</p>
                <a href={data.media.url} target="_blank" className="px-6 py-2 bg-white text-black rounded-full font-black text-[10px] uppercase hover:scale-105 transition flex items-center gap-2"><ExternalLink size={12}/> Resource</a>
              </div>
            )}
          </div>
        ) : (
          <textarea
            className={`flex-1 bg-transparent border-none outline-none resize-none text-xl lg:text-2xl font-sans leading-relaxed placeholder:opacity-5 ${theme.text}`}
            value={data.text}
            onChange={(e) => onChange({ ...data, text: e.target.value })}
            placeholder="Type lesson details..."
          />
        )}
      </div>

      {/* MEDIA DOCK */}
      <div className="mt-4 pt-4 border-t border-white/5 flex gap-6 items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
        <button onClick={() => addMedia('image')} className="text-white/20 hover:text-white transition flex flex-col items-center gap-1"><ImageIcon size={18}/><span className="text-[7px] font-black uppercase tracking-tighter">Image</span></button>
        <button onClick={() => addMedia('slides')} className="text-white/20 hover:text-white transition flex flex-col items-center gap-1"><Presentation size={18}/><span className="text-[7px] font-black uppercase tracking-tighter">Slides</span></button>
        <button onClick={() => addMedia('link')} className="text-white/20 hover:text-white transition flex flex-col items-center gap-1"><LinkIcon size={18}/><span className="text-[7px] font-black uppercase tracking-tighter">Link</span></button>
        <button onClick={onOpenAssignmentPicker} className="text-white/20 hover:text-emerald-400 transition flex flex-col items-center gap-1"><GraduationCap size={18}/><span className="text-[7px] font-black uppercase tracking-tighter">Task</span></button>
      </div>
    </div>
  );
}