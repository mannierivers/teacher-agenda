import './globals.css';
import Clock from '@/components/Clock';
import TabNavigation from '@/components/TabNavigation';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 h-screen w-screen overflow-hidden flex flex-col">
        {/* Header: Fixed Height */}
        <header className="h-20 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/50">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-black tracking-tighter text-blue-500">AGENDA.OS</h1>
            <TabNavigation />
          </div>
          <Clock />
        </header>

        {/* Main Content: Takes remaining height */}
        <main className="flex-1 p-6 overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}