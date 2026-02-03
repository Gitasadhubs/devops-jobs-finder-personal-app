
import React, { useState, useEffect } from 'react';
import { Search, Loader2, Briefcase, RefreshCcw, LayoutGrid, List, CheckCircle, Database, Clock, ShieldCheck, Globe, FileText, CheckCircle2, CalendarDays, Zap, Timer, AlertTriangle, ExternalLink, Settings, Terminal, Activity } from 'lucide-react';
import { Job } from './types';
import { searchJobs, parseAndTailorJobs, USER_CONTEXT } from './services/geminiService';
import JobCard from './components/JobCard';
import CVPreview from './components/CVPreview';

const STORAGE_KEY = 'devops-job-pilot-data-v5';
const MAX_DAILY_CREDITS = 5;
const RESET_INTERVAL_MS = 24 * 60 * 60 * 1000;

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'cv'>('jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchStatus, setSearchStatus] = useState<string>('');
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Applied' | 'Scheduled'>('All');
  const [view, setView] = useState<'grid' | 'list'>('list');
  
  const [credits, setCredits] = useState<number>(MAX_DAILY_CREDITS);
  const [lastReset, setLastReset] = useState<number>(Date.now());
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [configMissing, setConfigMissing] = useState<boolean>(false);

  // Safe API Key retrieval to prevent browser crash
  const getSafeApiKey = () => {
    try {
      return (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : null;
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    const apiKey = getSafeApiKey();
    if (!apiKey) {
      setConfigMissing(true);
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setJobs(parsed.jobs || []);
        const now = Date.now();
        const savedReset = parsed.lastReset || now;
        if (now - savedReset >= RESET_INTERVAL_MS) {
          setCredits(MAX_DAILY_CREDITS);
          setLastReset(now);
        } else {
          setCredits(parsed.credits ?? MAX_DAILY_CREDITS);
          setLastReset(savedReset);
        }
      } catch (e) { console.error("Cache load failed", e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ jobs, credits, lastReset }));
  }, [jobs, credits, lastReset]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = (lastReset + RESET_INTERVAL_MS) - now;
      if (diff <= 0) {
        setCredits(MAX_DAILY_CREDITS);
        setLastReset(now);
      } else {
        const hours = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${hours}h ${mins}m ${secs}s`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lastReset]);

  const handleSearch = async () => {
    if (credits <= 0) return alert(`Daily credit limit reached. Resetting in ${timeLeft}`);
    setIsLoading(true);
    setSearchStatus('Establishing connection to Google Search Grounding...');
    try {
      const { text, sources } = await searchJobs();
      setSearchStatus('Parsing LinkedIn/Rozee listings for Lahore...');
      const newJobs = await parseAndTailorJobs(text, sources);
      
      setJobs(prev => {
        const existingKeys = new Set(prev.map(j => `${j.title}-${j.company}`.toLowerCase()));
        const uniqueNew = newJobs.filter(j => !existingKeys.has(`${j.title}-${j.company}`.toLowerCase()));
        return [...uniqueNew, ...prev.map(j => ({ ...j, isNew: false }))];
      });
      
      setCredits(c => c - 1);
      setSearchStatus('');
    } catch (error: any) {
      console.error(error);
      setSearchStatus(`Search Exception: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job => filter === 'All' || job.status === filter);

  if (configMissing) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 font-mono">
        <div className="max-w-xl w-full bg-[#1e293b] p-10 rounded-[2rem] border border-slate-700 shadow-2xl text-center space-y-8 animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto border border-amber-500/20">
            <AlertTriangle size={40} className="text-amber-500" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-white tracking-tight">Deployment Blocked</h2>
            <p className="text-slate-400 font-medium">
              The application cannot initialize because <code className="bg-slate-900 text-indigo-400 px-2 py-0.5 rounded">API_KEY</code> is missing from the environment.
            </p>
          </div>
          
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 text-left space-y-4">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Terminal size={12} /> Vercel Setup Guide
            </h3>
            <div className="text-sm text-slate-300 space-y-2">
              <p>1. Open <strong>Vercel Settings</strong></p>
              <p>2. Go to <strong>Environment Variables</strong></p>
              <p>3. Add Key: <code className="text-indigo-400">API_KEY</code></p>
              <p>4. <strong>Redeploy</strong> your project</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all"
            >
              Restart Application
            </button>
            <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-xs text-slate-500 hover:text-indigo-400 transition-colors flex items-center justify-center gap-2">
              Generate new key on Google AI Studio <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="flex items-center gap-5">
          <div className="bg-indigo-600 text-white p-4 rounded-[1.5rem] shadow-2xl shadow-indigo-200/50 ring-4 ring-indigo-50">
            <Activity size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Pilot Console</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Asad Ashraf // Lahore Ops</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex-1 md:flex-none bg-white border border-slate-200 p-4 rounded-3xl flex items-center gap-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-amber-50 p-2 rounded-xl text-amber-600"><Zap size={20} fill="currentColor" /></div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Credits</p>
                <p className="text-xl font-black text-slate-900 leading-none">{credits}/5</p>
              </div>
            </div>
            <div className="border-l border-slate-100 pl-6">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Refill In</p>
              <p className="text-xs font-bold text-indigo-600 tabular-nums flex items-center gap-1.5">
                <Timer size={14} /> {timeLeft}
              </p>
            </div>
          </div>
          
          <button 
            onClick={handleSearch} 
            disabled={isLoading || credits <= 0}
            className="group relative overflow-hidden bg-slate-900 text-white px-10 py-5 rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl transition-all hover:bg-slate-800 disabled:opacity-50 active:scale-95"
          >
            <span className="relative z-10 flex items-center gap-3">
              {isLoading ? <Loader2 size={18} className="animate-spin text-indigo-400" /> : <Search size={18} />}
              {isLoading ? 'Scanning...' : 'Scan Jobs'}
            </span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8">
        {/* Navigation Sidebar */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <nav className="flex flex-col gap-2">
            <button 
              onClick={() => setActiveTab('jobs')} 
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'jobs' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-500 hover:bg-white hover:text-indigo-600 border border-transparent hover:border-slate-100'}`}
            >
              <LayoutGrid size={20} /> Recruitment Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('cv')} 
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'cv' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-500 hover:bg-white hover:text-indigo-600 border border-transparent hover:border-slate-100'}`}
            >
              <FileText size={20} /> Talent Profile
            </button>
          </nav>

          <div className="bg-slate-900 p-6 rounded-[2rem] text-white space-y-4 shadow-xl">
             <div className="flex items-center gap-2 text-indigo-400">
                <Terminal size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">System Monitor</span>
             </div>
             <div className="space-y-2">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Node Status</span>
                  <span className="text-green-400 font-bold">READY</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Grounding</span>
                  <span className="text-indigo-400 font-bold">ACTIVE</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Lahore JDs</span>
                  <span className="text-slate-300 font-bold">{jobs.length}</span>
                </div>
             </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-12 lg:col-span-9 space-y-8">
          {activeTab === 'jobs' ? (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-white/50 backdrop-blur-md p-3 rounded-[1.5rem] border border-slate-200 sticky top-4 z-50 shadow-sm">
                <div className="flex gap-1.5">
                  {(['All', 'Pending', 'Scheduled', 'Applied'] as const).map(f => (
                    <button 
                      key={f} 
                      onClick={() => setFilter(f)} 
                      className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                {searchStatus && (
                  <div className="text-[11px] font-bold text-indigo-600 flex items-center gap-3 px-4 py-2 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                    <Loader2 size={12} className="animate-spin" /> {searchStatus}
                  </div>
                )}
              </div>

              {/* Jobs Stream */}
              <div className="space-y-6">
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
                  <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 shadow-inner group">
                    <div className="relative inline-block mb-6">
                      <Globe size={64} className="text-slate-100 group-hover:text-indigo-50 transition-colors" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Search size={24} className="text-slate-300" />
                      </div>
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2">No active hunts detected</h3>
                    <p className="text-slate-400 font-medium max-w-xs mx-auto leading-relaxed">
                      Initialize a scan to discover junior DevOps roles in the Lahore tech hub.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="animate-in slide-in-from-right-8 duration-500">
              <CVPreview />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
