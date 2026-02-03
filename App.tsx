
import React, { useState, useEffect } from 'react';
import { Search, Loader2, LayoutGrid, Globe, FileText, Zap, Timer, Activity, ShieldCheck, ShieldAlert, Terminal, ExternalLink, ChevronRight, Server, AlertCircle } from 'lucide-react';
import { Job } from './types';
import { searchJobs, parseAndTailorJobs } from './services/geminiService';
import JobCard from './components/JobCard';
import CVPreview from './components/CVPreview';

const STORAGE_KEY = 'devops-career-pilot-v8';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'cv'>('jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchStatus, setSearchStatus] = useState<string>('');
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Applied' | 'Scheduled'>('All');
  const [credits, setCredits] = useState<number>(5);
  const [systemAlert, setSystemAlert] = useState<{ type: 'ERROR' | 'INFO'; message: string } | null>(null);

  // Safe check for the key
  const getSafeKey = () => {
    try {
      return (typeof process !== 'undefined' && process.env && process.env.API_KEY) ? process.env.API_KEY : null;
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
      } catch (e) { console.error("Cache corrupted"); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ jobs, credits }));
  }, [jobs, credits]);

  const handleSearch = async () => {
    if (!hasKey) {
      setSystemAlert({ type: 'ERROR', message: "Deployment Blocked: API_KEY environment variable missing. See sidebar for fix." });
      return;
    }
    if (credits <= 0) return;

    setIsLoading(true);
    setSystemAlert(null);
    setSearchStatus('Initiating Search Grounding...');

    try {
      const { text, sources } = await searchJobs();
      setSearchStatus('Processing Lahore Job Market...');
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-12 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-100 transform -rotate-3">
              <Activity size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Pilot Console</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-2 h-2 rounded-full ${hasKey ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asad Ashraf // Lahore Hub</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="bg-white border border-slate-200 p-4 rounded-3xl flex items-center gap-6 shadow-sm flex-1 lg:flex-none">
              <div className="flex items-center gap-3">
                <Zap size={20} className="text-amber-500" fill="currentColor" />
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Energy</p>
                  <p className="text-xl font-black text-slate-900 leading-none">{credits}/5</p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleSearch} 
              disabled={isLoading || !hasKey}
              className={`flex-1 lg:flex-none px-10 py-5 rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl transition-all flex items-center justify-center gap-3 ${
                !hasKey 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : (hasKey ? <Search size={18} /> : <AlertCircle size={18} />)}
              {isLoading ? 'Scanning...' : (hasKey ? 'Scan Jobs' : 'API Missing')}
            </button>
          </div>
        </header>

        {systemAlert && (
          <div className={`mb-8 p-6 rounded-3xl border-2 flex items-center justify-between ${systemAlert.type === 'ERROR' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-indigo-50 border-indigo-100 text-indigo-700'}`}>
            <div className="flex items-center gap-4">
              <ShieldAlert size={24} />
              <p className="text-sm font-bold">{systemAlert.message}</p>
            </div>
            <button onClick={() => setSystemAlert(null)} className="text-xs font-black uppercase tracking-widest opacity-50 hover:opacity-100">Dismiss</button>
          </div>
        )}

        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar */}
          <aside className="col-span-12 lg:col-span-3 space-y-6">
            <nav className="flex flex-col gap-2">
              <button 
                onClick={() => setActiveTab('jobs')} 
                className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'jobs' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-500 hover:bg-white'}`}
              >
                <LayoutGrid size={20} /> Dashboard
              </button>
              <button 
                onClick={() => setActiveTab('cv')} 
                className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'cv' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-500 hover:bg-white'}`}
              >
                <FileText size={20} /> Talent Profile
              </button>
            </nav>

            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-6 shadow-xl">
              <div className="flex items-center gap-3 text-indigo-400">
                <Terminal size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">System Internals</span>
              </div>
              
              <div className="space-y-4 font-mono text-[11px]">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-slate-500">API_KEY</span>
                  <span className={hasKey ? "text-green-400" : "text-red-400 font-bold"}>
                    {hasKey ? "CONFIGURED" : "MISSING"}
                  </span>
                </div>
                {!hasKey && (
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                    <p className="text-slate-400 leading-relaxed">AI engine is inactive. Please set <code className="text-indigo-400">API_KEY</code> in Vercel settings and redeploy.</p>
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" className="flex items-center gap-2 text-indigo-400 hover:text-white transition-colors">
                      Get Free Key <ExternalLink size={10} />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="col-span-12 lg:col-span-9">
            {activeTab === 'jobs' ? (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex items-center justify-between bg-white/50 backdrop-blur-md p-3 rounded-3xl border border-slate-200 sticky top-4 z-50">
                  <div className="flex gap-1.5">
                    {(['All', 'Pending', 'Applied'] as const).map(f => (
                      <button key={f} onClick={() => setFilter(f as any)} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-slate-200' : 'text-slate-400'}`}>{f}</button>
                    ))}
                  </div>
                  {searchStatus && (
                    <div className="text-[11px] font-bold text-indigo-600 flex items-center gap-3 px-4 py-2 bg-indigo-50 rounded-xl">
                      <Loader2 size={12} className="animate-spin" /> {searchStatus}
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {filteredJobs.length > 0 ? filteredJobs.map(j => (
                    <JobCard key={j.id} job={j} onApply={(id) => setJobs(prev => prev.map(job => job.id === id ? { ...job, status: 'Applied' } : job))} onSchedule={(id, date) => setJobs(prev => prev.map(job => job.id === id ? { ...job, status: 'Scheduled', scheduledAt: date } : job))} />
                  )) : (
                    <div className="text-center py-40 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 shadow-inner">
                      <Globe size={48} className="mx-auto text-slate-100 mb-6" />
                      <h3 className="text-2xl font-black text-slate-800">Operational Ready</h3>
                      <p className="text-slate-400 mt-2 max-w-xs mx-auto">Click "Scan Jobs" to find the latest DevOps openings in Lahore.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : <CVPreview />}
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;
