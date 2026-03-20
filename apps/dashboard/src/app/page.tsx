'use client';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-8 overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl">
        <div className="mb-12 shadow-2xl animate-in zoom-in duration-1000">
            <div className="w-16 h-16 rounded-2xl bg-[#0f172a] flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-indigo-600/20">V</div>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-[#0f172a] mb-8 leading-[1.1] tracking-tight">
          Voxion. <br/> 
          <span className="text-indigo-600">Voice AI Infrastructure.</span>
        </h1>

        <p className="text-xl md:text-2xl text-slate-500 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
          The unified engine for real-time STT, Reasoning, and TTS orchestration. 
          Zero-latency Voice Intelligence for enterprise-grade applications.
        </p>

        <div className="flex flex-col sm:flex-row gap-5 mb-24">
            <Link href="/dashboard">
                <button className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/30">Go to Dashboard</button>
            </Link>
            <Link href="/register">
                <button className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-lg hover:bg-slate-50 transition shadow-sm">Create Account</button>
            </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left w-full border-t border-slate-200 pt-20">
            {[
                { title: 'Sub-second Latency', desc: 'Optimized WebSocket clustering for human-like response speeds.', color: 'indigo' },
                { title: 'Enterprise Privacy', desc: 'Compliant data storage with AES-256 encryption at rest.', color: 'indigo' },
                { title: 'Intelligent Actions', desc: 'Automated task extraction and registration during calls.', color: 'indigo' }
            ].map((f, i) => (
                <div key={i} className="group p-2">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold mb-4">0{i+1}</div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">{f.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">{f.desc}</p>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
