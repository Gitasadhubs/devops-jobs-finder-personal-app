
import React, { useState, useEffect } from 'react';
import { Search, Loader2, Briefcase, RefreshCcw, LayoutGrid, List, CheckCircle, Database, Clock, ShieldCheck, Globe, FileText, CheckCircle2, CalendarDays, Zap, Timer } from 'lucide-react';
import { Job } from './types';
import { searchJobs, parseAndTailorJobs, USER_CONTEXT } from './services/geminiService';
import JobCard from './components/JobCard';
import CVPreview from './components/CVPreview';

const STORAGE_KEY = 'devops-job-pilot-data-v4';
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

  useEffect(() => {
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
      } catch (e) { console.error(e); }
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
    if (credits <= 0) return alert(`Credits exhausted. Refill in ${timeLeft}`);
    setIsLoading(true);
    setSearchStatus('Searching Lahore job boards...');
    try {
      const { text, sources } = await searchJobs();
      setSearchStatus('AI analyzing roles & HR contacts...');
      const newJobs = await parseAndTailorJobs(text, sources);
      setJobs(prev => [...newJobs, ...prev.map(j => ({ ...j, isNew: false }))]);
      setCredits(c => c - 1);
      setSearchStatus('');
    } catch (error: any) {
      console.error(error);
      setSearchStatus(error.message || 'Error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job => filter === 'All' || job.status === filter);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 text-white p-3 rounded-2xl shadow-xl"><Briefcase size={32} /></div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Career Pilot</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">DevOps Lahore Unit</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-white border p-4 rounded-2xl flex items-center gap-4 shadow-sm">
            <div className="text-orange-500"><Zap size={20} fill="currentColor" /></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Credits</p>
              <p className="text-xl font-black text-slate-900">{credits}/5</p>
            </div>
            <div className="border-l pl-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Reset In</p>
              <p className="text-xs font-bold text-indigo-600 flex items-center gap-1"><Timer size={12} /> {timeLeft}</p>
            </div>
          </div>
          <button 
            onClick={handleSearch} 
            disabled={isLoading || credits <= 0}
            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50 transition-all"
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
            Hunt Fresh Roles
          </button>
        </div>
      </header>

      <nav className="flex gap-2 mb-10">
        <button onClick={() => setActiveTab('jobs')} className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'jobs' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>Dashboard</button>
        <button onClick={() => setActiveTab('cv')} className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'cv' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>My Resume</button>
      </nav>

      {activeTab === 'jobs' ? (
        <div className="space-y-8">
          <div className="flex justify-between items-center glass p-4 rounded-3xl sticky top-4 z-50">
            <div className="flex gap-2">
              {(['All', 'Pending', 'Scheduled', 'Applied'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase ${filter === f ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>{f}</button>
              ))}
            </div>
            {searchStatus && <div className="text-xs font-bold text-indigo-600 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> {searchStatus}</div>}
          </div>

          <div className="grid grid-cols-1 gap-6">
            {filteredJobs.length > 0 ? filteredJobs.map(j => (
              <JobCard key={j.id} job={j} onApply={(id) => setJobs(prev => prev.map(job => job.id === id ? { ...job, status: 'Applied' } : job))} onSchedule={(id, date) => setJobs(prev => prev.map(job => job.id === id ? { ...job, status: 'Scheduled', scheduledAt: date } : job))} />
            )) : (
              <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
                <Globe size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-bold">No active hunts. Click "Hunt Fresh Roles" to start.</p>
              </div>
            )}
          </div>
        </div>
      ) : <CVPreview />}
    </div>
  );
};

export default App;
