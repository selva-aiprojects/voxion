'use client';

import React, { useState } from 'react';
import Link from 'next/link';

type Step = 1 | 2 | 3;

export default function Register() {
  const [step, setStep] = useState<Step>(1);
  const [catalog, setCatalog] = useState<'PERSONAL' | 'ORG' | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    otp: ''
  });
  const [loading, setLoading] = useState(false);

  const handleNextStep = (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setStep((prev) => (prev + 1) as Step);
      setLoading(false);
    }, 1200);
  };

  const handleVerify = (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setStep(3);
      setLoading(false);
    }, 1200);
  };

  const catalogs = [
    { id: 'PERSONAL', key: 'Individual', desc: 'AI call screening and personal follow-ups.' },
    { id: 'ORG', key: 'Enterprise', desc: 'CRM sync, team routing, and knowledge search.' }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Brand Header */}
      <div className="absolute top-12 flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center text-white font-black text-lg">V</div>
        <span className="text-[#0f172a] font-bold text-xl tracking-tight uppercase italic">Voxion.io</span>
      </div>

      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl p-10 relative z-10">
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-12 relative px-4">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-[-1]"></div>
            {[1, 2, 3].map(i => (
                <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${step >= i ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white border border-slate-200 text-slate-400'}`}>
                    {i}
                </div>
            ))}
        </div>

        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-extrabold text-[#0f172a] mb-2 tracking-tight">Get Started</h2>
            <p className="text-slate-500 mb-8 font-medium">Create your Voxion account to deploy AI voice logic.</p>
            
            <form onSubmit={handleNextStep} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Full Name</label>
                <input 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-sm text-slate-800 focus:border-indigo-500 outline-none transition" 
                  type="text" placeholder="Alex Rivera" required 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Phone Number</label>
                <input 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-sm text-slate-800 focus:border-indigo-500 outline-none transition" 
                  type="tel" placeholder="+1 (212) 555-0123" required 
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Account Type</label>
                <div className="grid grid-cols-2 gap-4">
                    {catalogs.map((c) => (
                    <div 
                        key={c.id} 
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${catalog === c.id ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-slate-300'}`}
                        onClick={() => setCatalog(c.id as any)}
                    >
                        <h4 className={`text-sm font-bold mb-1 ${catalog === c.id ? 'text-indigo-600' : 'text-slate-800'}`}>{c.key}</h4>
                        <p className="text-[10px] text-slate-500 font-medium leading-tight">{c.desc}</p>
                    </div>
                    ))}
                </div>
              </div>

              <button 
                className={`w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-indigo-700 transition active:scale-95 flex items-center justify-center ${(!catalog || loading) ? 'opacity-50 cursor-not-allowed' : ''}`} 
                type="submit" disabled={!catalog || loading}
              >
                {loading ? 'Processing...' : 'Verify Identity'}
              </button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
            <h2 className="text-3xl font-extrabold text-[#0f172a] mb-2 tracking-tight">Secure Access</h2>
            <p className="text-slate-500 mb-10 font-medium">Enter the 6-digit code sent to your device.</p>
            
            <div className="flex justify-between gap-3 mb-10">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <input key={i} className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-xl text-center text-xl font-bold text-indigo-600 focus:border-indigo-600 outline-none transition" type="text" maxLength={1} />
              ))}
            </div>

            <button 
              className={`w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-indigo-700 transition active:scale-95 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`} 
              onClick={handleVerify} disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Complete Registration'}
            </button>
            <p className="mt-8 text-xs text-slate-400 font-bold uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition">Resend Code</p>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in zoom-in duration-700 text-center py-6">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-green-500/20">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-4xl font-extrabold text-[#0f172a] mb-4 tracking-tight">Welcome, {formData.name.split(' ')[0]}!</h2>
            <p className="text-slate-500 mb-10 font-medium max-w-sm mx-auto leading-relaxed">
              Your **Voxion {catalog?.toLowerCase()}** profile is live. You can now build and test real-time voice workflows.
            </p>
            <Link href="/dashboard">
                <button className="w-full py-4 bg-[#0f172a] text-white rounded-xl font-bold text-sm hover:bg-[#1a253a] transition shadow-xl">Go to Dashboard</button>
            </Link>
          </div>
        )}
      </div>

      <div className="mt-12 text-slate-400 text-xs font-bold uppercase tracking-widest">
        Step {step} of 3 &bull; Licensed to Enterprise Engine
      </div>
    </div>
  );
}
