import './globals.css';

export const metadata = {
  title: 'Lancer Agenda.OS',
  description: 'Salpointe Catholic High School Teacher Dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black h-screen w-screen overflow-hidden antialiased font-sans">
        {children}
      </body>
    </html>
  );
}