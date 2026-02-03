
import React, { useState, useEffect } from 'react';
import { Search, Loader2, Briefcase, RefreshCcw, LayoutGrid, List, CheckCircle, Database, Clock, ShieldCheck, Globe, FileText, CheckCircle2, CalendarDays } from 'lucide-react';
import { Job } from './types';
import { searchJobs, parseAndTailorJobs, USER_CONTEXT } from './services/geminiService';
import JobCard from './components/JobCard';
import CVPreview from './components/CVPreview';

const STORAGE_KEY = 'devops-job-pilot-data-v2';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'cv'>('jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchStatus, setSearchStatus] = useState<string>('');
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Applied' | 'Scheduled'>('All');
  const [view, setView] = useState<'grid' | 'list'>('list');
  const [searchSources, setSearchSources] = useState<any[]>([]);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setJobs(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved jobs", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  }, [jobs]);

  const handleSearch = async () => {
    setIsLoading(true);
    setSearchStatus('Scouring LinkedIn, Career Pages & Portals...');
    
    try {
      const { text, sources } = await searchJobs();
      setSearchSources(sources);
      setSearchStatus('AI analyzing JDs & tailoring applications...');
      
      const newJobs = await parseAndTailorJobs(text, sources);
      
      setJobs(prev => {
        const existingIdentifiers = new Set(prev.map(j => `${j.company}-${j.title}`.toLowerCase()));
        const uniqueNewJobs = newJobs.filter(j => !existingIdentifiers.has(`${j.company}-${j.title}`.toLowerCase()));
        const updatedPrev = prev.map(j => ({ ...j, isNew: false }));
        return [...uniqueNewJobs, ...updatedPrev];
      });
      
      setSearchStatus('');
    } catch (error) {
      console.error(error);
      setSearchStatus('Search encountered an error. Check API configuration.');
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
    if (confirm('Are you sure you want to clear all tracked jobs? This cannot be undone.')) {
      setJobs([]);
      setSearchSources([]);
      localStorage.removeItem(STORAGE_KEY);
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
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Search System</span>
              </div>
            </div>
          </div>
          <p className="text-slate-500 font-medium flex items-center gap-2 pl-14">
            <ShieldCheck size={18} className="text-indigo-500" />
            Verified Profile: <strong className="text-slate-800 underline decoration-indigo-200 decoration-2 underline-offset-4">{USER_CONTEXT.name}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3 pl-14 lg:pl-0">
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold shadow-2xl transition-all active:scale-[0.97] ${
              isLoading 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-0.5 shadow-indigo-200 ring-4 ring-indigo-50'
            }`}
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
            {isLoading ? 'Scanning Job Boards...' : 'Hunt Fresh Roles'}
          </button>
          
          <button
            onClick={clearData}
            title="Clear Data Cache"
            className="p-4 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100"
          >
            <RefreshCcw size={22} />
          </button>
        </div>
      </header>

      {/* Tabs Navigation */}
      <nav className="flex items-center gap-1 bg-slate-100/50 p-1.5 rounded-2xl mb-10 w-fit mx-auto lg:mx-0">
        <button 
          onClick={() => setActiveTab('jobs')}
          className={`px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all ${activeTab === 'jobs' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Briefcase size={18} /> Recruitment Dashboard
        </button>
        <button 
          onClick={() => setActiveTab('cv')}
          className={`px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all ${activeTab === 'cv' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <FileText size={18} /> Professional Resume
        </button>
      </nav>

      {activeTab === 'jobs' ? (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { label: 'Tracking', val: stats.total, color: 'text-slate-900', bg: 'bg-white', icon: <Database size={16}/>, desc: 'Jobs in local cache' },
              { label: 'Fresh Roles', val: stats.new, color: 'text-indigo-600', bg: 'bg-indigo-50/50', icon: <Clock size={16}/>, desc: 'Found in last 24h' },
              { label: 'Pending', val: stats.pending, color: 'text-orange-600', bg: 'bg-orange-50/50', icon: <CheckCircle size={16}/>, desc: 'Applications to send' },
              { label: 'Scheduled', val: stats.scheduled, color: 'text-purple-600', bg: 'bg-purple-50/50', icon: <CalendarDays size={16}/>, desc: 'Queued actions' },
              { label: 'Applied', val: stats.applied, color: 'text-green-600', bg: 'bg-green-50/50', icon: <CheckCircle2 size={16}/>, desc: 'Successfully tracked' },
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
                  The pilot is currently monitoring Lahore's top job boards. Click the button above to start a fresh scan.
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
          &copy; 2024 DevOps Career Pilot | High Reliability Search Agent
        </p>
        <p className="mt-4 text-slate-400 text-[10px] font-medium max-w-xl mx-auto italic">
          Optimized for Asad Ashraf (Cloud & DevOps Specialist). This system utilizes the Gemini-3-Pro engine for real-time career intelligence and automated tailoring.
        </p>
      </footer>
    </div>
  );
};

export default App;
