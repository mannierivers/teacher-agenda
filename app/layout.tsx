import './globals.css';
import { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Lancer Agenda.OS',
  description: 'Salpointe Catholic High School Classroom Dashboard',
  generator: 'Next.js',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Lancer Agenda.OS',
  },
  // 👈 THIS ASSIGNS THE FAVICON
  icons: {
    icon: [
      { url: '/lancer-seal.png' },
      { url: '/lancer-seal.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/lancer-seal.png',
    apple: '/lancer-seal.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#8a2529', // Salpointe Maroon
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Fallback for older browsers */}
        <link rel="icon" href="/lancer-seal.png" />
      </head>
      <body className="bg-black h-screen w-screen overflow-hidden antialiased font-sans select-none">
        {children}
      </body>
    </html>
  );
}