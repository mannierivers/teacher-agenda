'use client';

const CLASSES = [
  { id: 'p1', name: 'P1' },
  { id: 'p2', name: 'P2' },
  { id: 'p3', name: 'P3' },
  { id: 'p4', name: 'P4' },
  { id: 'p5', name: 'P5' },
  { id: 'p6', name: 'P6' },
  { id: 'p7', name: 'P7' },
];

export default function TabNavigation({ currentClass, setClass }: any) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {CLASSES.map((c) => (
        <button
          key={c.id}
          onClick={() => setClass(c.id)}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all duration-300 border ${
            currentClass === c.id 
            ? 'bg-[#FCD450] text-[#8a2529] border-[#FCD450] shadow-lg shadow-yellow-900/20 scale-105' 
            : 'text-white/40 border-white/5 hover:text-white hover:bg-white/5'
          }`}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}