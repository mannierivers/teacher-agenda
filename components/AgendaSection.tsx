'use client';
import { useState } from 'react';
import { Sparkles, Loader2, Image as ImageIcon, Presentation, Link as LinkIcon, GraduationCap, X } from 'lucide-react';

export default function AgendaSection({ title, value, theme, onChange, aiPrompt, media, onMediaChange, onOpenAssignmentPicker }: any) {
  const [isGenerating, setIsGenerating] = useState(false);

  // Helper to extract Google Slides ID from a URL
  const extractSlidesId = (url: string) => {
    const match = url.match(/[-\w]{25,}/);
    return match ? match[0] : null;
  };

  const handleAddMedia = (type: 'image' | 'slides' | 'link') => {
    const url = prompt(`Paste the ${type} URL here:`);
    if (!url) return;

    if (type === 'slides') {
      const id = extractSlidesId(url);
      if (id) onMediaChange({ type: 'slides', url: id, title: 'Google Slides' });
      else alert("Invalid Google Slides URL");
    } else {
      onMediaChange({ type, url, title: type === 'image' ? 'Image' : 'External Link' });
    }
  };

  const generateWithAI = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!aiPrompt) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      
      if (response.ok) {
        const data = await response.json();
        onChange(data.content);
      }
    } catch (error) {
      console.error('AI generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`${theme.card} border-l-4 ${theme.accent} rounded-[2rem] p-5 flex flex-col transition-all duration-500 shadow-xl group relative overflow-hidden`}>
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-3">
        <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme.secondaryText} opacity-70`}>{title}</h3>
        <div className="flex gap-1">
          <button onClick={generateWithAI} className="p-2 bg-white/5 rounded-lg text-white/20 hover:text-white transition">
            {isGenerating ? <Loader2 className="animate-spin" size={14}/> : <Sparkles size={14} />}
          </button>
        </div>
      </div>

      {/* CONTENT AREA: Toggle between Media and Text */}
      <div className="flex-1 flex flex-col min-h-0">
        {media ? (
          <div className="relative h-full w-full rounded-xl overflow-hidden bg-black/20 border border-white/5">
            <button onClick={() => onMediaChange(null)} className="absolute top-2 right-2 z-10 p-1 bg-red-500 text-white rounded-full hover:scale-110 transition">
              <X size={14} />
            </button>
            
            {media.type === 'image' && <img src={media.url} className="h-full w-full object-contain" alt="media" />}
            
            {media.type === 'slides' && (
              <iframe 
                src={`https://docs.google.com/presentation/d/${media.url}/embed?start=false&loop=false&delayms=3000`}
                className="w-full h-full border-0"
                allowFullScreen
              />
            )}
            
            {(media.type === 'link' || media.type === 'assignment') && (
              <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <LinkIcon size={32} className="mb-2 opacity-20" />
                <span className="font-bold text-sm block mb-2">{media.title}</span>
                <a href={media.url} target="_blank" className="text-[10px] px-4 py-2 bg-white/10 rounded-full hover:bg-white/20 transition">Open Link</a>
              </div>
            )}
          </div>
        ) : (
          <textarea
            className={`flex-1 bg-transparent border-none outline-none resize-none text-lg lg:text-xl font-sans leading-relaxed transition-colors ${theme.text} placeholder:text-white/5`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type content..."
          />
        )}
      </div>

      {/* MEDIA DOCK: Small icons at bottom */}
      <div className="mt-3 pt-3 border-t border-white/5 flex gap-3 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => handleAddMedia('image')} className="text-white/30 hover:text-white transition" title="Add Image"><ImageIcon size={16}/></button>
        <button onClick={() => handleAddMedia('slides')} className="text-white/30 hover:text-white transition" title="Embed Slides"><Presentation size={16}/></button>
        <button onClick={() => handleAddMedia('link')} className="text-white/30 hover:text-white transition" title="Add Link"><LinkIcon size={16}/></button>
        <button onClick={onOpenAssignmentPicker} className="text-white/30 hover:text-white transition" title="Link Classroom Assignment"><GraduationCap size={16}/></button>
      </div>
    </div>
  );
}