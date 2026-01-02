'use client';

import { useState } from 'react';
import { 
  Sparkles, 
  Loader2, 
  Image as ImageIcon, 
  Presentation, 
  Link as LinkIcon, 
  GraduationCap, 
  X, 
  ExternalLink 
} from 'lucide-react';

interface Media {
  type: 'image' | 'slides' | 'link' | 'assignment';
  url: string;
  title: string;
}

interface AgendaData {
  text: string;
  media: Media | null;
}

interface Props {
  title: string;
  data: AgendaData;
  theme: any;
  onChange: (newData: AgendaData) => void;
  onOpenAssignmentPicker: () => void;
  aiPrompt: string;
}

export default function AgendaSection({ 
  title, 
  data, 
  theme, 
  onChange, 
  onOpenAssignmentPicker, 
  aiPrompt 
}: Props) {
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * AI GENERATION (GROQ)
   */
  const handleAI = async () => {
    const topic = prompt(`Lancer AI: What is the specific topic for ${title}?`);
    if (!topic) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: `${aiPrompt} ${topic}. Keep it concise and bulleted for a high school board.` 
        }),
      });
      const result = await res.json();
      onChange({ ...data, text: result.content });
    } catch (err) {
      alert("AI Service currently unavailable.");
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * MEDIA HANDLERS
   */
  const extractSlidesId = (url: string) => {
    const match = url.match(/[-\w]{25,}/);
    return match ? match[0] : null;
  };

  const addMedia = (type: 'image' | 'slides' | 'link') => {
    const url = prompt(`Enter ${type === 'slides' ? 'Google Slides' : type} URL:`);
    if (!url) return;

    let finalUrl = url;
    let title = type === 'image' ? 'Image' : 'External Resource';

    if (type === 'slides') {
      const id = extractSlidesId(url);
      if (!id) return alert("Invalid Google Slides link.");
      finalUrl = id;
      title = "Google Slides Presentation";
    }

    onChange({
      ...data,
      media: { type, url: finalUrl, title }
    });
  };

  const removeMedia = () => {
    onChange({ ...data, media: null });
  };

  return (
    <div className={`group relative flex flex-col p-5 rounded-[2.5rem] border-l-4 transition-all duration-500 shadow-xl overflow-hidden ${theme.card} ${theme.accent}`}>
      
      {/* SECTION HEADER */}
      <div className="flex justify-between items-center mb-3">
        <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] font-sans opacity-70 ${theme.secondaryText}`}>
          {title}
        </h3>
        
        <div className="flex items-center gap-1">
          {data.media && (
            <button 
              onClick={removeMedia}
              className="p-1.5 text-white/20 hover:text-red-400 transition"
              title="Remove Media"
            >
              <X size={14} />
            </button>
          )}
          <button 
            onClick={handleAI}
            disabled={isGenerating}
            className={`p-2 rounded-xl transition ${isGenerating ? 'bg-white/5 text-white/10' : 'bg-white/5 text-white/30 hover:bg-white/20 hover:text-white'}`}
          >
            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          </button>
        </div>
      </div>

      {/* CONTENT AREA: Toggle Text vs Media */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {data.media ? (
          <div className="h-full w-full rounded-2xl overflow-hidden bg-black/30 border border-white/5 relative">
            
            {data.media.type === 'slides' && (
              <iframe 
                src={`https://docs.google.com/presentation/d/${data.media.url}/embed?start=false&loop=false&delayms=3000`}
                className="w-full h-full border-0"
                allowFullScreen
              />
            )}

            {data.media.type === 'image' && (
              <img 
                src={data.media.url} 
                className="h-full w-full object-contain p-2" 
                alt="Lesson Content" 
              />
            )}

            {(data.media.type === 'link' || data.media.type === 'assignment') && (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                {data.media.type === 'assignment' ? (
                  <GraduationCap size={40} className="mb-3 text-emerald-400" />
                ) : (
                  <LinkIcon size={40} className="mb-3 opacity-20" />
                )}
                <p className="text-sm font-bold text-white mb-4 line-clamp-2">{data.media.title}</p>
                <a 
                  href={data.media.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-6 py-2 bg-white text-black rounded-full font-bold text-xs hover:scale-105 transition active:scale-95 flex items-center gap-2"
                >
                  <ExternalLink size={12} /> View Resource
                </a>
              </div>
            )}

          </div>
        ) : (
          <textarea
            className={`flex-1 bg-transparent border-none outline-none resize-none text-xl lg:text-2xl font-sans leading-relaxed transition-colors placeholder:text-white/5 ${theme.text}`}
            value={data.text}
            onChange={(e) => onChange({ ...data, text: e.target.value })}
            placeholder="Start typing or add media..."
          />
        )}
      </div>

      {/* MEDIA DOCK: Appears on hover (Teacher only) */}
      <div className="mt-3 pt-3 border-t border-white/5 flex gap-4 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button 
          onClick={() => addMedia('image')} 
          className="text-white/30 hover:text-white transition" 
          title="Add Image"
        >
          <ImageIcon size={18}/>
        </button>
        <button 
          onClick={() => addMedia('slides')} 
          className="text-white/30 hover:text-white transition" 
          title="Embed Google Slides"
        >
          <Presentation size={18}/>
        </button>
        <button 
          onClick={() => addMedia('link')} 
          className="text-white/30 hover:text-white transition" 
          title="Add Web Link"
        >
          <LinkIcon size={18}/>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onOpenAssignmentPicker(); }} 
          className="text-white/30 hover:text-emerald-400 transition" 
          title="Link Google Classroom Assignment"
        >
          <GraduationCap size={18}/>
        </button>
      </div>

      {/* PROGRESS ACCENT: Subtle animated line at bottom */}
      <div className={`mt-1 h-1 w-8 rounded-full opacity-20 group-hover:w-full transition-all duration-1000 ${theme.accent.replace('border-', 'bg-')}`} />
    </div>
  );
}