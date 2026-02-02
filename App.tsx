
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, Briefcase, RefreshCcw, LayoutGrid, List, CheckCircle, Database, Clock, ShieldCheck, Globe, User, FileText } from 'lucide-react';
import { Job } from './types';
import { searchJobs, parseAndTailorJobs, USER_CONTEXT } from './services/geminiService';
import JobCard from './components/JobCard';
import CVPreview from './components/CVPreview';

const STORAGE_KEY = 'devops-job-pilot-data';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'cv'>('jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchStatus, setSearchStatus] = useState<string>('');
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Applied'>('All');
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
    setSearchStatus('Scanning for fresh Cloud/DevOps roles in Lahore...');
    
    try {
      const { text, sources } = await searchJobs();
      setSearchSources(sources);
      setSearchStatus('Generating tailored application strategies...');
      
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
      setSearchStatus('Search failed. Ensure your API key is active.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = (id: string) => {
    setJobs(prev => prev.map(job => 
      job.id === id ? { ...job, status: 'Applied', isNew: false } : job
    ));
  };

  const clearData = () => {
    if (confirm('Are you sure you want to clear all tracked jobs?')) {
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
    new: jobs.filter(j => j.isNew).length
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="bg-indigo-600 text-white p-2 rounded-xl shadow-lg shadow-indigo-200">
              <Briefcase size={28} />
            </span>
            DevOps Career Pilot
          </h1>
          <p className="mt-2 text-slate-500 max-w-xl flex items-center gap-2">
            <ShieldCheck size={18} className="text-green-600" />
            Verified search for <strong>{USER_CONTEXT.name}</strong> (Cloud & DevOps Engineer)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold shadow-lg transition-all ${
              isLoading 
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
            {isLoading ? 'Scanning...' : 'Find New Jobs'}
          </button>
          
          <button
            onClick={clearData}
            title="Clear Cache"
            className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
          >
            <RefreshCcw size={20} />
          </button>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 mb-8 gap-8">
        <button 
          onClick={() => setActiveTab('jobs')}
          className={`pb-4 text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'jobs' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Briefcase size={18} /> Recruitment Dashboard
        </button>
        <button 
          onClick={() => setActiveTab('cv')}
          className={`pb-4 text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'cv' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <FileText size={18} /> Professional Resume
        </button>
      </div>

      {activeTab === 'jobs' ? (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Tracking', val: stats.total, color: 'text-slate-900', bg: 'bg-white', icon: <Database size={14}/> },
              { label: 'Fresh (24h)', val: stats.new, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: <Clock size={14}/> },
              { label: 'To Apply', val: stats.pending, color: 'text-orange-600', bg: 'bg-orange-50', icon: <CheckCircle size={14}/> },
              { label: 'Done', val: stats.applied, color: 'text-green-600', bg: 'bg-green-50', icon: <CheckCircle size={14}/> },
            ].map((s, idx) => (
              <div key={idx} className={`${s.bg} p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col`}>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   {s.icon} {s.label}
                </span>
                <span className={`text-2xl font-black mt-1 ${s.color}`}>{s.val}</span>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div className="glass sticky top-4 z-10 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl shadow-slate-200/50">
            <div className="flex p-1 bg-slate-100 rounded-lg gap-1">
              {(['All', 'Pending', 'Applied'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              {searchStatus && (
                <span className="text-sm font-medium text-indigo-600 animate-pulse flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> {searchStatus}
                </span>
              )}
              <div className="h-6 w-px bg-slate-200"></div>
              <div className="flex gap-1">
                <button onClick={() => setView('list')} className={`p-1.5 rounded ${view === 'list' ? 'bg-slate-200 text-slate-900' : 'text-slate-400'}`}><List size={20} /></button>
                <button onClick={() => setView('grid')} className={`p-1.5 rounded ${view === 'grid' ? 'bg-slate-200 text-slate-900' : 'text-slate-400'}`}><LayoutGrid size={20} /></button>
              </div>
            </div>
          </div>

          {/* Jobs List */}
          {filteredJobs.length > 0 ? (
            <div className={view === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'flex flex-col gap-6'}>
              {filteredJobs.map((job) => (
                <JobCard key={job.id} job={job} onApply={handleApply} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
              <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                {isLoading ? <Loader2 size={40} className="animate-spin" /> : <Globe size={40} />}
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">{isLoading ? 'Validating Active Jobs...' : 'No fresh roles detected'}</h3>
              <p className="text-slate-400 max-w-sm mx-auto">Gemini is searching for DevOps and Cloud roles in Lahore posted today.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <CVPreview />
        </div>
      )}

      <footer className="mt-20 py-8 border-t border-slate-200 text-center text-slate-400 text-xs">
        <p>&copy; 2024 DevOps Career Pilot | Tracking: Lahore, Pakistan | User: {USER_CONTEXT.name} (Cloud & DevOps Specialist)</p>
      </footer>
    </div>
  );
};

export default App;
