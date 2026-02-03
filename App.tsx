
import React, { useState, useEffect } from 'react';
import { Search, Loader2, Briefcase, RefreshCcw, LayoutGrid, List, CheckCircle, Database, Clock, ShieldCheck, Globe, FileText, CheckCircle2, CalendarDays, Zap, Timer } from 'lucide-react';
import { Job } from './types';
import { searchJobs, parseAndTailorJobs, USER_CONTEXT } from './services/geminiService';
import JobCard from './components/JobCard';
import CVPreview from './components/CVPreview';

const STORAGE_KEY = 'devops-job-pilot-data-v3';
const MAX_DAILY_CREDITS = 5;
const RESET_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'cv'>('jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchStatus, setSearchStatus] = useState<string>('');
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Applied' | 'Scheduled'>('All');
  const [view, setView] = useState<'grid' | 'list'>('list');
  
  // Credit System State
  const [credits, setCredits] = useState<number>(MAX_DAILY_CREDITS);
  const [lastReset, setLastReset] = useState<number>(Date.now());
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Persistence and Credit Reset Logic
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setJobs(parsed.jobs || []);
        
        const now = Date.now();
        const savedReset = parsed.lastReset || now;
        
        // Check if 24 hours have passed since last reset
        if (now - savedReset >= RESET_INTERVAL_MS) {
          setCredits(MAX_DAILY_CREDITS);
          setLastReset(now);
        } else {
          setCredits(parsed.credits !== undefined ? parsed.credits : MAX_DAILY_CREDITS);
          setLastReset(savedReset);
        }
      } catch (e) {
        console.error("Failed to load saved state", e);
      }
    }
  }, []);

  // Save state on change
  useEffect(() => {
    const state = {
      jobs,
      credits,
      lastReset
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [jobs, credits, lastReset]);

  // Countdown Timer Effect
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const nextReset = lastReset + RESET_INTERVAL_MS;
      const diff = nextReset - now;

      if (diff <= 0) {
        setCredits(MAX_DAILY_CREDITS);
        setLastReset(now);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [lastReset]);

  const handleSearch = async () => {
    if (credits <= 0) {
      alert(`Search quota reached! Your daily credits will reset in ${timeLeft}.`);
      return;
    }

    setIsLoading(true);
    setSearchStatus('Connecting to Gemini Search Grounding...');
    
    try {
      const { text, sources } = await searchJobs();
      setSearchStatus('AI analyzing JDs & discovering HR emails...');
      
      const newJobs = await parseAndTailorJobs(text, sources);
      
      setJobs(prev => {
        const existingIdentifiers = new Set(prev.map(j => `${j.company}-${j.title}`.toLowerCase()));
        const uniqueNewJobs = newJobs.filter(j => !existingIdentifiers.has(`${j.company}-${j.title}`.toLowerCase()));
        const updatedPrev = prev.map(j => ({ ...j, isNew: false }));
        return [...uniqueNewJobs, ...updatedPrev];
      });
      
      setCredits(prev => prev - 1);
      setSearchStatus('');
    } catch (error: any) {
      console.error(error);
      if (error.message?.includes('quota')) {
        setSearchStatus('Global API Quota Exceeded. Please try again later.');
      } else {
        setSearchStatus('Search failed. Check your API Key in Vercel settings.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = (id: string) => {
    setJobs(prev => prev.map(job => 
      job.id === id ? { ...job, status: 'Applied', isNew: false, scheduledAt: undefined } : job
    ));
  };

  const handleSchedule = (id: string, date: string) => {
    setJobs(prev => prev.map(job => 
      job.id === id ? { ...job, status: 'Scheduled', scheduledAt: date, isNew: false } : job
    ));
  };

  const clearData = () => {
    if (confirm('Are you sure you want to clear all tracked jobs? Credits will not reset.')) {
      setJobs([]);
    }
  };

  const filteredJobs = jobs.filter(job => {
    if (filter === 'All') return true;
    return job.status === filter;
  });

  const stats = {
    total: jobs.length,
    pending: jobs.filter(j => j.status === 'Pending').length,
    applied: jobs.filter(j => j.status === 'Applied').length,
    scheduled: jobs.filter(j => j.status === 'Scheduled').length,
    new: jobs.filter(j => j.isNew).length
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header */}
      <header className="mb-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-3 rounded-2xl shadow-xl shadow-indigo-100 ring-4 ring-indigo-50">
              <Briefcase size={32} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-[900] text-slate-900 tracking-tight leading-tight">
                DevOps Career Pilot
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Lahore Recruitment Unit</span>
              </div>
            </div>
          </div>
          <p className="text-slate-500 font-medium flex items-center gap-2 pl-14">
            <ShieldCheck size={18} className="text-indigo-500" />
            Active Session: <strong className="text-slate-800 underline decoration-indigo-200 decoration-2 underline-offset-4">{USER_CONTEXT.name}</strong>
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-4 pl-14 lg:pl-0">
          {/* Credit Tracker */}
          <div className="flex items-center gap-3 bg-white px-5 py-4 rounded-2xl shadow-sm border border-slate-200">
            <div className="bg-orange-50 p-2 rounded-lg text-orange-600">
              <Zap size={20} fill="currentColor" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Search Credits</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-slate-900">{credits}</span>
                <span className="text-xs text-slate-400 font-bold">/ {MAX_DAILY_CREDITS}</span>
              </div>
            </div>
            <div className="ml-4 pl-4 border-l border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Reset In</p>
              <p className="text-xs font-bold text-indigo-600 tabular-nums flex items-center gap-1">
                <Timer size={12} /> {timeLeft}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSearch}
              disabled={isLoading || credits <= 0}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold shadow-2xl transition-all active:scale-[0.97] ${
                isLoading 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                  : credits <= 0
                    ? 'bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100 shadow-none'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-0.5 shadow-indigo-200 ring-4 ring-indigo-50'
              }`}
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
              {isLoading ? 'Scanning...' : 'Hunt Fresh Roles'}
            </button>
            
            <button
              onClick={clearData}
              title="Reset Cache"
              className="p-4 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100"
            >
              <RefreshCcw size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <nav className="flex items-center gap-1 bg-slate-100/50 p-1.5 rounded-2xl mb-10 w-fit mx-auto lg:mx-0">
        <button 
          onClick={() => setActiveTab('jobs')}
          className={`px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all ${activeTab === 'jobs' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Briefcase size={18} /> Dashboard
        </button>
        <button 
          onClick={() => setActiveTab('cv')}
          className={`px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all ${activeTab === 'cv' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <FileText size={18} /> My Resume
        </button>
      </nav>

      {activeTab === 'jobs' ? (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { label: 'Tracking', val: stats.total, color: 'text-slate-900', bg: 'bg-white', icon: <Database size={16}/>, desc: 'Jobs found' },
              { label: 'Fresh', val: stats.new, color: 'text-indigo-600', bg: 'bg-indigo-50/50', icon: <Clock size={16}/>, desc: 'New today' },
              { label: 'Pending', val: stats.pending, color: 'text-orange-600', bg: 'bg-orange-50/50', icon: <CheckCircle size={16}/>, desc: 'To apply' },
              { label: 'Scheduled', val: stats.scheduled, color: 'text-purple-600', bg: 'bg-purple-50/50', icon: <CalendarDays size={16}/>, desc: 'Queued' },
              { label: 'Applied', val: stats.applied, color: 'text-green-600', bg: 'bg-green-50/50', icon: <CheckCircle2 size={16}/>, desc: 'Success' },
            ].map((s, idx) => (
              <div key={idx} className={`${s.bg} p-6 rounded-3xl border border-white/50 shadow-sm flex flex-col group hover:shadow-md transition-all`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`${s.color} bg-white p-2 rounded-lg shadow-sm`}>{s.icon}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{s.label}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-[900] ${s.color}`}>{s.val}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{s.desc}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="space-y-6">
            {/* Toolbar */}
            <div className="glass sticky top-4 z-40 p-4 rounded-3xl flex flex-wrap items-center justify-between gap-4 shadow-2xl shadow-indigo-100/50 border-indigo-50">
              <div className="flex p-1.5 bg-slate-100/80 rounded-xl gap-1.5">
                {(['All', 'Pending', 'Scheduled', 'Applied'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                      filter === f ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-6">
                {searchStatus && (
                  <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-100">
                    <Loader2 size={16} className="animate-spin text-indigo-600" />
                    <span className="text-xs font-bold text-indigo-700 tracking-tight">{searchStatus}</span>
                  </div>
                )}
                <div className="hidden sm:flex gap-1 bg-slate-100/80 p-1 rounded-xl">
                  <button onClick={() => setView('list')} className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}><List size={18} /></button>
                  <button onClick={() => setView('grid')} className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}><LayoutGrid size={18} /></button>
                </div>
              </div>
            </div>

            {/* Jobs List */}
            {filteredJobs.length > 0 ? (
              <div className={view === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-8' : 'flex flex-col gap-6'}>
                {filteredJobs.map((job) => (
                  <JobCard key={job.id} job={job} onApply={handleApply} onSchedule={handleSchedule} />
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-white rounded-[40px] border-2 border-dashed border-slate-200 shadow-inner">
                <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-300 ring-8 ring-slate-50/50">
                  {isLoading ? <Loader2 size={48} className="animate-spin text-indigo-200" /> : <Globe size={48} />}
                </div>
                <h3 className="text-2xl font-[900] text-slate-800 mb-3">{isLoading ? 'Deploying Search Agents...' : 'No Roles Found'}</h3>
                <p className="text-slate-400 max-w-sm mx-auto font-medium leading-relaxed">
                  The pilot is currently monitoring Lahore's top job boards. Click the search button above (requires credits).
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="animate-in slide-in-from-bottom-8 duration-700">
          <CVPreview />
        </div>
      )}

      <footer className="mt-24 py-12 border-t border-slate-200 text-center">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em]">
          &copy; 2024 DevOps Career Pilot | Asad Ashraf
        </p>
      </footer>
    </div>
  );
};

export default App;
