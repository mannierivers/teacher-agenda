'use client';
import { useState, useEffect } from 'react';

export default function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-right">
      <div className="text-2xl font-mono font-bold text-blue-400">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="text-xs uppercase tracking-widest text-slate-500">
        {time.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
      </div>
    </div>
  );
}