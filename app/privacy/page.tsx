export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 p-8 lg:p-24 font-sans leading-relaxed">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-black text-white mb-8 tracking-tighter">Privacy Policy</h1>
        <p className="mb-4">Last Updated: January 2026</p>
        
        <section className="mb-8">
          <h2 className="text-xl font-bold text-blue-400 mb-4 uppercase tracking-widest">1. Information We Collect</h2>
          <p>ClassDeck ("the App") collects information necessary to provide a daily teacher agenda service:</p>
          <ul className="list-disc ml-6 mt-2 space-y-2">
            <li><strong>Google Account Information:</strong> We collect your name, email address, and unique Google ID to manage authentication.</li>
            <li><strong>Google Classroom Data:</strong> With your permission, we access your course list and the ability to post announcements to your Classroom stream.</li>
            <li><strong>Agenda Content:</strong> Any text you enter into the agenda sections (Objective, Activity, etc.) is stored securely in Firebase.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-blue-400 mb-4 uppercase tracking-widest">2. How We Use Data</h2>
          <p>We use your data strictly to facilitate classroom management:</p>
          <ul className="list-disc ml-6 mt-2 space-y-2">
            <li>To display your saved agendas across different devices.</li>
            <li>To post links to your daily agenda directly to your Google Classroom stream.</li>
            <li>To process AI-generated suggestions via the Groq API (prompts are sent to Groq but are not used to train their models per their enterprise policy).</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-blue-400 mb-4 uppercase tracking-widest">3. Student Privacy (FERPA)</h2>
          <p>ClassDeck is designed for teacher use. We do not store student records, grades, or personal student identifiers. The "Student View" is a read-only mirror of the teacher's lesson plan and does not collect data from visiting students.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-blue-400 mb-4 uppercase tracking-widest">4. Data Third Parties</h2>
          <p>We rely on the following sub-processors:</p>
          <ul className="list-disc ml-6 mt-2 space-y-2">
            <li><strong>Google Cloud/Firebase:</strong> Secure database storage and authentication.</li>
            <li><strong>Groq:</strong> Real-time AI processing for lesson planning.</li>
          </ul>
        </section>

        <footer className="mt-12 pt-8 border-t border-slate-800">
          <a href="/" className="text-blue-500 hover:underline">← Back to Dashboard</a>
        </footer>
      </div>
    </div>
  );
}