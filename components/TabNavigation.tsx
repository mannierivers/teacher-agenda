'use client';

const CLASSES = [
  { id: 'p1', name: 'P1' }, { id: 'p2', name: 'P2' },
  { id: 'p3', name: 'P3' }, { id: 'p4', name: 'P4' },
  { id: 'p5', name: 'P5' }, { id: 'p6', name: 'P6' },
  { id: 'p7', name: 'P7' }, { id: 'ap', name: 'AP' },
];

export default function TabNavigation({ currentClass, setClass }: any) {
  return (
    <div className="flex items-center justify-center gap-1 bg-black/20 p-1 rounded-2xl border border-white/5">
      {CLASSES.map((c) => (
        <button
          key={c.id}
          onClick={() => setClass(c.id)}
          className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all duration-300 border ${
            currentClass === c.id 
            ? 'bg-[#FCD450] text-[#8a2529] border-[#FCD450] shadow-lg scale-105' 
            : 'text-white/30 border-transparent hover:text-white hover:bg-white/5'
          }`}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}