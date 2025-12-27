// components/TabNavigation.tsx
'use client';

const CLASSES = [
  { id: 'p1', name: 'Period 1' },
  { id: 'p2', name: 'Period 2' },
  { id: 'p4', name: 'Period 4' },
  { id: 'apush', name: 'AP History' }
];

export default function TabNavigation({ currentClass, setClass }: any) {
  return (
    <div className="flex bg-slate-800 p-1 rounded-lg">
      {CLASSES.map((c) => (
        <button
          key={c.id}
          onClick={() => setClass(c.id)}
          className={`px-6 py-2 rounded-md font-bold transition-all ${
            currentClass === c.id 
            ? 'bg-blue-600 text-white shadow-lg' 
            : 'text-slate-400 hover:text-white'
          }`}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}