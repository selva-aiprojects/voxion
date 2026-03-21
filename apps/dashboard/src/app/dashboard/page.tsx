'use client';

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

type ViewType = 'assistants' | 'calls' | 'actions';

export default function Dashboard() {
  const [activeView, setActiveView] = useState<ViewType>('assistants');
  const [isCalling, setIsCalling] = useState(false);
  const [transcription, setTranscription] = useState<any[]>([]);
  const [callStatus, setCallStatus] = useState('Standby');
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [insight, setInsight] = useState<any>(null);
  const [selectedVoice, setSelectedVoice] = useState('alloy');
  const [latency, setLatency] = useState('0ms');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [logs, setLogs] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_VOXION_API_URL || 'http://localhost:3001';
    socketRef.current = io(`${apiUrl}/call`, { transports: ['websocket'] });
    socketRef.current.on('connect', () => setCallStatus('Node Online'));

    socketRef.current.on('call-ready', (data) => {
      setCallStatus('Session Active');
      setTranscription([{ role: 'assistant', content: "Voxion Engine Initialized. I'm ready to assist in your preferred Indian-English style. How can I help today?", latency: '120ms' }]);
      setInsight(null);
    });

    socketRef.current.on('transcription-result', (data) => {
      setTranscription(prev => [...prev, { role: data.role || 'user', content: data.text, latency: data.latency || '450ms' }]);
      setLatency(data.latency || '450ms');
      setCallStatus('Processing...');
    });

    socketRef.current.on('call-summary', (data) => {
      setInsight(data);
      setCallStatus('Session Analyzed');
      fetchLogs();
      fetchActions();
    });

    socketRef.current.on('audio-response', (buffer: ArrayBuffer) => {
      const blob = new Blob([buffer], { type: 'audio/mpeg' });
      const audio = new Audio(URL.createObjectURL(blob));
      audio.play();
    });

    fetchLogs();
    fetchActions();
    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [transcription]);

  const fetchLogs = async () => { try { const apiUrl = process.env.NEXT_PUBLIC_VOXION_API_URL || 'http://localhost:3001'; const res = await fetch(`${apiUrl}/call/logs`); setLogs(await res.json()); } catch (e) { console.error(e); } };
  const fetchActions = async () => { try { const apiUrl = process.env.NEXT_PUBLIC_VOXION_API_URL || 'http://localhost:3001'; const res = await fetch(`${apiUrl}/call/actions`); setActions(await res.json()); } catch (e) { console.error(e); } };
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0 && socketRef.current) socketRef.current.emit('audio-data', e.data); };
      mediaRecorder.start(1000);
      setIsRecording(true);
      setCallStatus('Streaming Voice');
    } catch (err) { alert('Mic access required for live simulation.'); }
  };

  const stopRecording = () => { mediaRecorderRef.current?.stop(); setIsRecording(false); setCallStatus('Session Active'); };
  const simulateChat = (text: string) => { if (!text.trim()) return; setTranscription(prev => [...prev, { role: 'user', content: text }]); socketRef.current?.emit('audio-data', text); };
  const deployCall = () => { setIsCalling(true); setCallStatus('Connecting...'); setTranscription([]); socketRef.current?.emit('start-call', { voice: selectedVoice }); };
  const terminateCall = () => { socketRef.current?.emit('end-call'); if (transcription.length === 0) setIsCalling(false); setCallStatus('Terminating...'); };

  return (
    <div className="flex h-screen bg-[#f1f5f9] text-slate-900 font-sans antialiased overflow-hidden selection:bg-indigo-100">
      {/* Sidebar */}
      <div className="w-64 border-r border-slate-200 bg-[#0f172a] text-slate-400 flex flex-col pt-8 z-20">
        <div className="px-8 mb-12 flex items-center gap-3">
            <img src="/logo.png" alt="Voxion Logo" className="w-8 h-8 rounded-lg shadow-lg shadow-indigo-500/20" />
            <span className="text-white font-bold tracking-tight text-xl italic uppercase font-sans">Voxion</span>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {[
            { id: 'assistants', name: 'Workflows' },
            { id: 'calls', name: 'Call History' },
            { id: 'actions', name: 'Follow-ups' }
          ].map(item => (
            <div key={item.id} onClick={() => setActiveView(item.id as ViewType)} className={`px-4 py-3 rounded-xl cursor-pointer flex items-center gap-3 transition-all duration-200 ${activeView === item.id ? 'text-white bg-slate-800 shadow-sm' : 'hover:text-slate-200 hover:bg-slate-800/40'}`}>
              <span className="text-sm font-semibold">{item.name}</span>
            </div>
          ))}
        </nav>
      </div>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col bg-slate-50">
        <header className="h-20 border-b border-slate-200 bg-white/80 backdrop-blur-sm px-10 flex items-center justify-between z-10">
            <div>
                <h1 className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{activeView.replace('-', ' ')} Control</h1>
                <p className="text-lg font-bold text-slate-900">Voxion Assistant_v1.4</p>
            </div>
            <div className="flex gap-4">
                <button onClick={fetchLogs} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 shadow-sm transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                <button className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">Publish Logic</button>
            </div>
        </header>

        <main className="p-10 flex-1 overflow-y-auto no-scrollbar scroll-smooth">
            {activeView === 'assistants' && (
              <div className="flex gap-10 h-full">
                <div className="flex-1 flex flex-col gap-10">
                  <section className="bg-white border border-slate-200 rounded-[32px] p-10 shadow-sm">
                    <h3 className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-6 underline underline-offset-8">Behavior Instructions</h3>
                    <textarea 
                        className="w-full h-56 bg-slate-50 border border-slate-200 rounded-2xl p-6 text-sm text-slate-700 leading-relaxed outline-none focus:ring-4 ring-indigo-500/5 transition shadow-inner"
                        defaultValue="Speak as a top-tier Indian support professional from Voxion.io. Be friendly, accurate, and helpful. Guide users with clarity."
                    />
                  </section>
                  
                  <div className="grid grid-cols-2 gap-10 font-sans">
                      <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase mb-5 tracking-widest">Active Voice Profile</h4>
                          <select 
                            value={selectedVoice} 
                            onChange={(e) => setSelectedVoice(e.target.value)} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-5 text-sm font-bold text-indigo-600 outline-none cursor-pointer hover:bg-slate-100 transition shadow-sm"
                           >
                              <option value="alloy">Voxion Alloy (Professional Indian)</option>
                              <option value="nova">Voxion Aria (Warm & Supportive)</option>
                              <option value="onyx">Voxion Indigo (Authoritative)</option>
                              <option value="shimmer">Voxion Maya (Expressive Soft)</option>
                          </select>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm flex flex-col justify-center">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Inference Protocol</h4>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-black text-slate-800">VOXION_O1_MODEL</span>
                            <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-black rounded border border-green-100">FAST</span>
                          </div>
                      </div>
                  </div>
                </div>

                {/* Console Sidebar */}
                <div className="w-[480px] flex flex-col bg-[#0f172a] rounded-[40px] overflow-hidden shadow-2xl relative border-8 border-white/5">
                    {!isCalling ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-14 text-center">
                        <div className="w-24 h-24 rounded-3xl bg-indigo-600 flex items-center justify-center mb-10 shadow-2xl shadow-indigo-600/40 text-white font-black text-3xl">V</div>
                        <h3 className="text-2xl font-black text-white mb-4 tracking-tight">Voxion Simulation Live</h3>
                        <p className="text-sm text-slate-400 mb-10 leading-relaxed font-medium">Initialize real-time conversation stream with sub-second latency.</p>
                        <button onClick={deployCall} className="w-full py-5 bg-indigo-600 rounded-2xl text-white font-black text-sm hover:bg-indigo-500 active:scale-95 shadow-xl transition-all uppercase tracking-widest">Begin Test Session</button>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col p-8 h-full relative">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">{callStatus}</span>
                            <span className="text-[10px] font-black text-indigo-400">RTT: {latency}</span>
                          </div>
                          <button onClick={terminateCall} className="px-4 py-2 bg-red-500/10 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all">Terminate</button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-6 mb-8 pr-1 no-scrollbar scroll-smooth">
                          {insight ? (
                            <div className="p-8 bg-slate-800 rounded-3xl border border-indigo-500/30 shadow-2xl animate-in slide-in-from-bottom duration-700">
                              <h4 className="text-[9px] font-black text-indigo-400 uppercase mb-4 tracking-widest flex items-center gap-2 underline underline-offset-4 decoration-2 decoration-indigo-500">Processing Complete</h4>
                              <p className="text-sm text-slate-300 italic mb-8 leading-relaxed font-medium">"{insight.summary}"</p>
                              <div className="p-5 bg-slate-900/60 rounded-2xl border border-white/5 flex items-center justify-between mb-8">
                                <span className="text-xs font-bold text-slate-500 capitalize">Identified Persona</span>
                                <span className="text-sm font-black text-cyan-400">{insight.caller_name || 'Rahul'}</span>
                              </div>
                              <button onClick={() => setIsCalling(false)} className="w-full py-4 bg-white text-slate-900 rounded-xl text-xs font-black uppercase hover:bg-slate-200 shadow-xl transition active:scale-95">Reset Session</button>
                            </div>
                          ) : (
                            transcription.map((t, i) => (
                              <div key={i} className={`flex flex-col ${t.role === 'assistant' ? 'items-start text-left' : 'items-end text-right'}`}>
                                <div className={`max-w-[85%] p-5 rounded-[28px] text-sm leading-relaxed shadow-lg font-medium transition-all duration-300 ${t.role === 'assistant' ? 'bg-[#1e293b] text-slate-200 border border-slate-700/50' : 'bg-indigo-600 text-white'}`}>{t.content}</div>
                                <span className="text-[9px] font-black text-slate-600 mt-2 uppercase tracking-widest">{t.role === 'assistant' ? `Voxion • ${t.latency}` : 'Diagnostic Log'}</span>
                              </div>
                            ))
                          )}
                          <div ref={chatEndRef} />
                        </div>
                        {!insight && (
                          <div className="mt-auto space-y-5">
                            <div className="flex gap-4 relative items-center">
                                <input className="flex-1 bg-slate-800 border-2 border-transparent rounded-[24px] px-6 py-5 text-white text-sm focus:border-indigo-500 outline-none transition shadow-2xl" placeholder="Simulate customer query..." value={inputMessage} onChange={e => setInputMessage(e.target.value)} onKeyPress={e => e.key === 'Enter' && (simulateChat(inputMessage), setInputMessage(''))}/>
                                <button onClick={isRecording ? stopRecording : startRecording} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-2xl ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-500'}`}>🎙️</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </div>
            )}

            {activeView === 'calls' && (
              <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                    <tr><th className="px-10 py-6">Ref ID</th><th className="px-10 py-6">Customer</th><th className="px-10 py-6">Sentiment</th><th className="px-10 py-6">Intelligence Summary</th><th className="px-10 py-6">Recording</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm font-medium">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition group"><td className="px-10 py-6 font-mono text-xs text-slate-400">VX_{log.id.slice(-6)}</td><td className="px-10 py-6 font-bold text-slate-800">{log.caller_name || 'RAHUL'}</td><td className="px-10 py-6"><span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${log.sentiment === 'positive' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{log.sentiment || 'Neutral'}</span></td><td className="px-10 py-6 text-slate-500 truncate max-w-sm">{log.summary}</td><td className="px-10 py-6"><a href={log.recordingUrl} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[10px] hover:bg-indigo-600 hover:text-white transition-all uppercase tracking-widest">Review Audio</a></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeView === 'actions' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {actions.map((action) => (
                  <div key={action.id} className="bg-white border border-slate-200 rounded-[32px] p-10 shadow-sm hover:shadow-2xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-8">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${action.priority === 'High' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{action.priority} Task</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    </div>
                    <p className="text-sm font-bold text-slate-900 mb-10 h-10 overflow-hidden leading-relaxed">{action.description}</p>
                    <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-8 flex justify-between font-black uppercase tracking-widest">
                        <span>Ref • {action.callId.slice(-4)}</span>
                        <span>{new Date(action.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </main>
      </div>
    </div>
  );
}
