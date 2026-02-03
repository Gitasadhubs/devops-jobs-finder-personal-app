
import React, { useState, useEffect } from 'react';
import { Search, Loader2, Briefcase, LayoutGrid, Globe, FileText, Zap, Timer, AlertTriangle, ExternalLink, Terminal, Activity, ShieldAlert, CheckCircle } from 'lucide-react';
import { Job } from './types';
import { searchJobs, parseAndTailorJobs } from './services/geminiService';
import JobCard from './components/JobCard';
import CVPreview from './components/CVPreview';

const STORAGE_KEY = 'devops-job-pilot-v6';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'cv'>('jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchStatus, setSearchStatus] = useState<string>('');
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Applied' | 'Scheduled'>('All');
  
  const [credits, setCredits] = useState<number>(5);
  const [apiError, setApiError] = useState<'MISSING' | 'INVALID' | null>(null);

  useEffect(() => {
    // 1. Safe API Key Check
    const checkApiKey = () => {
      try {
        const key = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : null;
        if (!key || key === "undefined" || key === "") {
          setApiError('MISSING');
        }
      } catch (e) {
        setApiError('MISSING');
      }
    };
    checkApiKey();

    // 2. Load cached data
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setJobs(parsed.jobs || []);
        setCredits(parsed.credits ?? 5);
      } catch (e) { console.error("Cache corrupted"); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ jobs, credits }));
  }, [jobs, credits]);

  const handleSearch = async () => {
    if (credits <= 0) return alert("Out of daily credits.");
    setIsLoading(true);
    setSearchStatus('Connecting to Google Gemini...');
    try {
      const { text, sources } = await searchJobs();
      setSearchStatus('AI analyzing Lahore tech hub...');
      const newJobs = await parseAndTailorJobs(text, sources);
      
      setJobs(prev => {
        const existing = new Set(prev.map(j => `${j.title}-${j.company}`.toLowerCase()));
        const unique = newJobs.filter(j => !existing.has(`${j.title}-${j.company}`.toLowerCase()));
        return [...unique, ...prev.map(j => ({ ...j, isNew: false }))];
      });
      
      setCredits(c => Math.max(0, c - 1));
      setSearchStatus('');
    } catch (error: any) {
      if (error.message === 'API_KEY_INVALID') {
        setApiError('INVALID');
      } else {
        setSearchStatus(`Error: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job => filter === 'All' || job.status === filter);

  // --- ERROR SCREEN ---
  if (apiError) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 font-mono text-slate-300">
        <div className="max-w-2xl w-full bg-[#0f172a] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="bg-slate-900 px-6 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">System Kernel // Error_Log</span>
          </div>
          
          <div className="p-10 space-y-8">
            <div className="flex items-center gap-6">
              <div className="bg-red-500/10 p-4 rounded-2xl border border-red-500/20">
                <ShieldAlert size={48} className="text-red-500" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  {apiError === 'MISSING' ? 'Environment Variable Missing' : 'Invalid API Credentials'}
                </h2>
                <p className="text-slate-400 mt-1">The application cannot reach the Google GenAI nodes.</p>
              </div>
            </div>

            <div className="bg-black/40 rounded-2xl p-6 border border-slate-800 space-y-4">
              <div className="flex items-start gap-3">
                <Terminal size={18} className="text-indigo-400 mt-1" />
                <div className="space-y-2 text-sm">
                  <p className="text-indigo-300 font-bold">$ diagnostics --check-env</p>
                  <p className="text-slate-500">
                    {apiError === 'MISSING' 
                      ? "Status: CRITICAL - Variable 'API_KEY' is undefined." 
                      : "Status: CRITICAL - Provided key was rejected by Google (401 Unauthorized)."}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">How to fix this:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  <p className="text-xs font-bold text-white mb-2">1. Get a Key</p>
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-[10px] text-indigo-400 hover:underline flex items-center gap-1">
                    Google AI Studio <ExternalLink size={10} />
                  </a>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  <p className="text-xs font-bold text-white mb-2">2. Set Vercel Env</p>
                  <p className="text-[10px] text-slate-400">Settings > Environment Variables > API_KEY</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-indigo-900/20"
            >
              RECHECK CONNECTION
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN APP ---
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="flex items-center gap-5">
          <div className="bg-indigo-600 text-white p-4 rounded-[1.5rem] shadow-2xl">
            <Activity size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Career Pilot</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Lahore Ops Center</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-white border border-slate-200 p-4 rounded-3xl flex items-center gap-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Zap size={20} className="text-amber-500" fill="currentColor" />
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Power</p>
                <p className="text-xl font-black text-slate-900 leading-none mt-1">{credits}/5</p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleSearch} 
            disabled={isLoading}
            className="bg-slate-900 text-white px-10 py-5 rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-95"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            <span className="ml-3">{isLoading ? 'Scanning...' : 'Scan Jobs'}</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8">
        <aside className="col-span-12 lg:col-span-3 space-y-4">
          <nav className="flex flex-col gap-2">
            <button onClick={() => setActiveTab('jobs')} className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'jobs' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:bg-white'}`}>
              <LayoutGrid size={20} /> Dashboard
            </button>
            <button onClick={() => setActiveTab('cv')} className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'cv' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:bg-white'}`}>
              <FileText size={20} /> Resume
            </button>
          </nav>
        </aside>

        <main className="col-span-12 lg:col-span-9 space-y-8">
          {activeTab === 'jobs' ? (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex items-center justify-between bg-white/50 backdrop-blur-md p-3 rounded-[1.5rem] border border-slate-200 sticky top-4 z-50">
                <div className="flex gap-1.5">
                  {(['All', 'Pending', 'Applied'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f as any)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${filter === f ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-slate-200' : 'text-slate-400'}`}>{f}</button>
                  ))}
                </div>
                {searchStatus && <div className="text-[11px] font-bold text-indigo-600 flex items-center gap-2"><Loader2 size={12} className="animate-spin" /> {searchStatus}</div>}
              </div>

              <div className="space-y-6">
                {filteredJobs.length > 0 ? filteredJobs.map(j => (
                  <JobCard key={j.id} job={j} onApply={(id) => setJobs(prev => prev.map(job => job.id === id ? { ...job, status: 'Applied' } : job))} onSchedule={(id, date) => setJobs(prev => prev.map(job => job.id === id ? { ...job, status: 'Scheduled', scheduledAt: date } : job))} />
                )) : (
                  <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 shadow-inner">
                    <Globe size={48} className="mx-auto text-slate-100 mb-4" />
                    <h3 className="text-xl font-black text-slate-800">No active deployments</h3>
                    <p className="text-slate-400 mt-1">Initiate a Scan to find roles in Lahore.</p>
                  </div>
                )}
              </div>
            </div>
          ) : <CVPreview />}
        </main>
      </div>
    </div>
  );
};

export default App;
