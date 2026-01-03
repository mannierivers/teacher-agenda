import './globals.css';
import { Metadata, Viewport } from 'next';

/**
 * MODULE 1: APP METADATA
 * Configures the PWA and Browser Identity
 */
export const metadata: Metadata = {
  title: 'Lancer Agenda.OS',
  description: 'Salpointe Catholic High School Classroom Dashboard',
  generator: 'Next.js',
  manifest: '/manifest.json', // Points to your public/manifest.json
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Lancer Agenda.OS',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/lancer-seal.png', // Main Favicon
    shortcut: '/lancer-seal.png',
    apple: '/lancer-seal.png',
  },
};

/**
 * MODULE 2: VIEWPORT CONFIG
 * Essential for Promethean Boards to prevent accidental pinch-zooming
 */
export const viewport: Viewport = {
  themeColor: '#8a2529', // Salpointe Maroon
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Disables touch-zoom so the app stays fixed
};

/**
 * MODULE 3: ROOT LAYOUT
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Force the seal as the shortcut icon */}
        <link rel="icon" href="/lancer-seal.png" sizes="any" />
      </head>
      <body className="bg-black h-screen w-screen overflow-hidden antialiased font-sans select-none">
        {children}
      </body>
    </html>
  );
}