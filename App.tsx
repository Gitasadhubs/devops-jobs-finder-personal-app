
import React, { useState, useEffect } from 'react';
import { Search, Loader2, LayoutGrid, Globe, FileText, Zap, Timer, Activity, ShieldAlert, Terminal, ExternalLink, ChevronRight, Server, AlertCircle, Info } from 'lucide-react';
import { Job } from './types';
import { searchJobs, parseAndTailorJobs } from './services/geminiService';
import JobCard from './components/JobCard';
import CVPreview from './components/CVPreview';

const STORAGE_KEY = 'devops-career-pilot-v9';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'cv'>('jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchStatus, setSearchStatus] = useState<string>('');
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Applied' | 'Scheduled'>('All');
  const [credits, setCredits] = useState<number>(5);
  const [systemAlert, setSystemAlert] = useState<{ type: 'ERROR' | 'INFO'; message: string } | null>(null);

  // Safe check for the key that doesn't crash the render
  const getSafeKey = () => {
    try {
      const key = (typeof process !== 'undefined' && process.env && process.env.API_KEY) ? process.env.API_KEY : null;
      return (key && key !== "undefined") ? key : null;
    } catch (e) { return null; }
  };
  
  const hasKey = !!getSafeKey();

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setJobs(parsed.jobs || []);
        setCredits(parsed.credits ?? 5);
      } catch (e) { console.error("Cache load failed"); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ jobs, credits }));
  }, [jobs, credits]);

  const handleSearch = async () => {
    if (!hasKey) {
      setSystemAlert({ 
        type: 'ERROR', 
        message: "Action Blocked: No API_KEY found in Environment. Please follow the Vercel Setup Guide in the sidebar." 
      });
      return;
    }
    if (credits <= 0) return;

    setIsLoading(true);
    setSystemAlert(null);
    setSearchStatus('Connecting to Gemini Hub...');

    try {
      const { text, sources } = await searchJobs();
      setSearchStatus('Analyzing Lahore Markets...');
      const newJobs = await parseAndTailorJobs(text, sources);
      
      setJobs(prev => {
        const existing = new Set(prev.map(j => `${j.title}-${j.company}`.toLowerCase()));
        const unique = newJobs.filter(j => !existing.has(`${j.title}-${j.company}`.toLowerCase()));
        return [...unique, ...prev.map(j => ({ ...j, isNew: false }))];
      });
      
      setCredits(c => Math.max(0, c - 1));
      setSearchStatus('');
    } catch (error: any) {
      console.error(error);
      setSystemAlert({ type: 'ERROR', message: `Engine Fault: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job => filter === 'All' || job.status === filter);

  return (
    <div className="min-h-screen bg-[#fcfdfe] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Navigation Header */}
        <header className="mb-12 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-indigo-600 rounded-[1.75rem] flex items-center justify-center shadow-2xl shadow-indigo-200 transform hover:scale-105 transition-transform">
              <Activity size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Pilot Hub <span className="text-indigo-600">v2</span></h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-2 h-2 rounded-full ${hasKey ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Asad Ashraf // Lahore, PK</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            <div className="bg-white border border-slate-200 px-6 py-4 rounded-[2rem] flex items-center gap-8 shadow-sm">
              <div className="flex items-center gap-3">
                <Zap size={20} className="text-amber-500" fill="currentColor" />
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">AI Credits</p>
                  <p className="text-xl font-black text-slate-900 leading-none">{credits}/5</p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleSearch} 
              disabled={isLoading}
              className={`flex-1 lg:flex-none px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl transition-all flex items-center justify-center gap-3 ${
                !hasKey 
                  ? 'bg-slate-100 text-slate-400 cursor-help border border-slate-200' 
                  : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200'
              }`}
              title={!hasKey ? "Configure API_KEY in Vercel to enable" : ""}
            >
              {isLoading ? <Loader2 size={18} className="animate-spin text-indigo-400" /> : (!hasKey ? <AlertCircle size={18} /> : <Search size={18} />)}
              {isLoading ? 'Scanning...' : (!hasKey ? 'Setup Required' : 'Scan Jobs')}
            </button>
          </div>
        </header>

        {/* Global System Alerts */}
        {systemAlert && (
          <div className={`mb-10 p-6 rounded-[2rem] border-2 flex items-center justify-between animate-in slide-in-from-top-4 duration-500 ${systemAlert.type === 'ERROR' ? 'bg-red-50 border-red-100 text-red-700 shadow-xl shadow-red-100/50' : 'bg-indigo-50 border-indigo-100 text-indigo-700 shadow-xl shadow-indigo-100/50'}`}>
            <div className="flex items-center gap-4">
              <ShieldAlert size={24} />
              <p className="text-sm font-bold leading-tight">{systemAlert.message}</p>
            </div>
            <button onClick={() => setSystemAlert(null)} className="text-[10px] font-black uppercase tracking-widest opacity-60 hover:opacity-100 underline decoration-2">Dismiss</button>
          </div>
        )}

        <div className="grid grid-cols-12 gap-8">
          {/* Dashboard Sidebar */}
          <aside className="col-span-12 lg:col-span-3 space-y-6">
            <nav className="flex flex-col gap-2 p-2 bg-slate-100/40 rounded-[2.5rem] border border-slate-100">
              <button 
                onClick={() => setActiveTab('jobs')} 
                className={`flex items-center justify-between px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'jobs' ? 'bg-white shadow-xl text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <div className="flex items-center gap-3"><LayoutGrid size={20} /> Dashboard</div>
                <ChevronRight size={14} className={activeTab === 'jobs' ? 'opacity-100' : 'opacity-0'} />
              </button>
              <button 
                onClick={() => setActiveTab('cv')} 
                className={`flex items-center justify-between px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'cv' ? 'bg-white shadow-xl text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <div className="flex items-center gap-3"><FileText size={20} /> My Profile</div>
                <ChevronRight size={14} className={activeTab === 'cv' ? 'opacity-100' : 'opacity-0'} />
              </button>
            </nav>

            {/* Setup Info Box */}
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center gap-3 text-indigo-400 mb-6">
                  <Terminal size={18} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Deployment Log</span>
                </div>
                
                <div className="space-y-5 font-mono text-[11px]">
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-slate-500">API Config</span>
                    <span className={hasKey ? "text-green-400" : "text-red-500 font-black"}>
                      {hasKey ? "READY" : "MISSING"}
                    </span>
                  </div>

                  {!hasKey ? (
                    <div className="mt-6 space-y-4">
                      <p className="text-slate-400 leading-relaxed text-[10px]">The AI engine is currently disabled. Follow these steps to activate:</p>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3">
                        <div className="flex gap-3">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold">1</span>
                          <span className="text-slate-300">Add <code className="text-white">API_KEY</code> to Vercel</span>
                        </div>
                        <div className="flex gap-3">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold">2</span>
                          <span className="text-slate-300">Click <b>Redeploy</b> project</span>
                        </div>
                      </div>
                      <a href="https://aistudio.google.com/app/apikey" target="_blank" className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600/10 border border-indigo-600/30 text-indigo-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest">
                        Get Key <ExternalLink size={10} />
                      </a>
                    </div>
                  ) : (
                    <div className="p-4 bg-green-500/5 border border-green-500/10 rounded-2xl text-[10px] text-green-400/80 leading-relaxed">
                      AI System Fully Operational. Grounding search active for Lahore Region.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Workspace */}
          <main className="col-span-12 lg:col-span-9">
            {activeTab === 'jobs' ? (
              <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
                {/* Search Bar / Filter Area */}
                <div className="flex items-center justify-between bg-white/70 backdrop-blur-xl p-3 rounded-[2rem] border border-slate-200 sticky top-6 z-50 shadow-sm shadow-slate-100">
                  <div className="flex gap-1.5">
                    {(['All', 'Pending', 'Applied'] as const).map(f => (
                      <button 
                        key={f} 
                        onClick={() => setFilter(f as any)} 
                        className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  {searchStatus && (
                    <div className="text-[11px] font-bold text-indigo-600 flex items-center gap-3 px-5 py-2.5 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                      <Loader2 size={14} className="animate-spin" /> {searchStatus}
                    </div>
                  )}
                </div>

                {/* Job Cards */}
                <div className="space-y-6 min-h-[500px]">
                  {filteredJobs.length > 0 ? (
                    filteredJobs.map(j => (
                      <JobCard 
                        key={j.id} 
                        job={j} 
                        onApply={(id) => setJobs(prev => prev.map(job => job.id === id ? { ...job, status: 'Applied' } : job))} 
                        onSchedule={(id, date) => setJobs(prev => prev.map(job => job.id === id ? { ...job, status: 'Scheduled', scheduledAt: date } : job))} 
                      />
                    ))
                  ) : (
                    <div className="text-center py-40 bg-white rounded-[4rem] border-2 border-dashed border-slate-100 flex flex-col items-center group">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-indigo-50 transition-colors">
                        <Globe size={32} className="text-slate-200 group-hover:text-indigo-200 transition-colors" />
                      </div>
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight">System Ready</h3>
                      <p className="text-slate-400 mt-2 font-medium max-w-xs mx-auto text-sm leading-relaxed">
                        Ready to scan for DevOps internships and junior roles across Lahore's tech ecosystem.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="animate-in slide-in-from-right-12 duration-1000">
                <CVPreview />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;
