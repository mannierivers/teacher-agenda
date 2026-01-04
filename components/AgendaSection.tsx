'use client';
import { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import { 
  Sparkles, Maximize2, X, ExternalLink, GraduationCap, 
  Image as ImageIcon, Presentation, Link as LinkIcon,
  Bold, List, ListOrdered
} from 'lucide-react';

export default function AgendaSection({ title, data, theme, onChange, onOpenAssignmentPicker, onMaximize, onOpenAI }: any) {
  const editor = useEditor({
    extensions: [StarterKit, Underline, BulletList, OrderedList],
    content: data.text,
    immediatelyRender: false,
    editorProps: { attributes: { class: 'prose prose-invert focus:outline-none max-w-none text-xl lg:text-2xl min-h-[120px] font-sans' } },
    onUpdate: ({ editor }) => { onChange({ ...data, text: editor.getHTML() }); }
  });

  useEffect(() => {
    if (editor && data.text !== editor.getHTML()) { editor.commands.setContent(data.text); }
  }, [data.text, editor]);

  const addMedia = (type: string) => {
    const url = prompt(`Paste ${type} URL:`);
    if (!url) return;
    if (type === 'slides') {
      const id = url.match(/[-\w]{25,}/);
      if (id) onChange({ ...data, media: { type: 'slides', url: id[0], title: 'Google Slides' } });
    } else {
      onChange({ ...data, media: { type, url, title: type === 'image' ? 'Visual' : 'Link' } });
    }
  };

  return (
    <div className={`group relative flex flex-col p-5 rounded-[2.5rem] border-l-[6px] transition-all duration-700 shadow-2xl overflow-hidden ${theme.card} ${theme.accent}`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className={`text-[11px] font-black uppercase tracking-[0.25em] ${theme.secondaryText}`}>{title}</h3>
        <div className="flex items-center gap-1">
          {data.media && <button onClick={() => onChange({...data, media: null})} className="p-1.5 text-white/20 hover:text-red-400 transition"><X size={14}/></button>}
          <button onClick={onMaximize} className="p-2 bg-white/5 text-white/30 hover:text-[#FCD450] transition rounded-xl"><Maximize2 size={16}/></button>
          <button onClick={onOpenAI} className="p-2 bg-white/5 text-white/30 hover:bg-white hover:text-black transition rounded-xl"><Sparkles size={16}/></button>
        </div>
      </div>

      {!data.media && (
        <div className="flex gap-1 mb-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity bg-black/40 w-fit p-1 rounded-xl border border-white/5 shadow-lg">
          <button onClick={() => editor?.chain().focus().toggleBold().run()} className={`p-1.5 rounded ${editor?.isActive('bold') ? 'bg-[#FCD450] text-black' : ''}`}><Bold size={12}/></button>
          <button onClick={() => editor?.chain().focus().toggleBulletList().run()} className={`p-1.5 rounded ${editor?.isActive('bulletList') ? 'bg-[#FCD450] text-black' : ''}`}><List size={12}/></button>
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        {data.media ? (
          <div className="h-full w-full rounded-3xl overflow-hidden bg-black/40 border border-white/10 shadow-inner">
            {data.media.type === 'slides' && <iframe src={`https://docs.google.com/presentation/d/${data.media.url}/embed`} className="w-full h-full border-0" allowFullScreen />}
            {data.media.type === 'image' && <img src={data.media.url} className="h-full w-full object-contain p-4" />}
            {(data.media.type === 'link' || data.media.type === 'assignment') && (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center text-white">
                <LinkIcon size={40} className="mb-4 opacity-20" />
                <p className="font-bold mb-4 text-sm truncate w-full">{data.media.title}</p>
                <a href={data.media.url} target="_blank" className="px-6 py-2 bg-white text-black rounded-full font-black text-[10px] uppercase hover:scale-105 transition flex items-center gap-2 shadow-lg"><ExternalLink size={12}/> OPEN</a>
              </div>
            )}
          </div>
        ) : (
          <div className={`flex-1 overflow-y-auto custom-scrollbar ${theme.text}`}><EditorContent editor={editor} /></div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 flex gap-6 justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
        <button onClick={() => addMedia('image')} className="text-white/20 hover:text-white flex flex-col items-center gap-1 transition"><ImageIcon size={18}/><span className="text-[7px] font-black uppercase">Img</span></button>
        <button onClick={() => addMedia('slides')} className="text-white/20 hover:text-white flex flex-col items-center gap-1 transition"><Presentation size={18}/><span className="text-[7px] font-black uppercase">Slide</span></button>
        <button onClick={onOpenAssignmentPicker} className="text-white/20 hover:text-emerald-400 flex flex-col items-center gap-1 transition"><GraduationCap size={18}/><span className="text-[7px] font-black uppercase">Task</span></button>
      </div>
    </div>
  );
}