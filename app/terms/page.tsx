export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 p-8 lg:p-24 font-sans leading-relaxed">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-black text-white mb-8 tracking-tighter">Terms of Service</h1>
        
        <section className="mb-8">
          <h2 className="text-xl font-bold text-emerald-400 mb-4 uppercase tracking-widest">1. Acceptance of Terms</h2>
          <p>By using ClassDeck, you agree to these terms. If you are using this on behalf of a school or district, you represent that you have the authority to bind that institution.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-emerald-400 mb-4 uppercase tracking-widest">2. Use of AI (Groq Integration)</h2>
          <p>The App provides AI-assisted lesson planning. You acknowledge that AI-generated content can contain errors, biases, or "hallucinations." Teachers are solely responsible for reviewing and vetting all AI-generated content before presenting it to students.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-emerald-400 mb-4 uppercase tracking-widest">3. Account Responsibility</h2>
          <p>You are responsible for maintaining the security of your Google account login. The "Share Day" feature generates a public link; you are responsible for the distribution of this link.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-emerald-400 mb-4 uppercase tracking-widest">4. Limitation of Liability</h2>
          <p>ClassDeck is provided "as is." We are not liable for any disruptions in service, loss of data stored in Firebase, or issues arising from the Google Classroom API.</p>
        </section>

        <footer className="mt-12 pt-8 border-t border-slate-800">
          <a href="/" className="text-blue-500 hover:underline">← Back to Dashboard</a>
        </footer>
      </div>
    </div>
  );
}