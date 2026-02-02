
import React, { useState } from 'react';
import { Job } from '../types';
import { Mail, Link, Building2, MapPin, CheckCircle2, Copy, ExternalLink, ChevronDown, ChevronUp, FileText } from 'lucide-react';

interface JobCardProps {
  job: Job;
  onApply: (id: string) => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onApply }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'email' | 'coverLetter'>('email');
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border transition-all ${job.isNew ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200'}`}>
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-slate-800">{job.title}</h3>
              {job.isNew && (
                <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">New</span>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1"><Building2 size={16} /> {job.company}</span>
              <span className="flex items-center gap-1"><MapPin size={16} /> {job.location || 'Lahore'}</span>
              <span className="flex items-center gap-1 text-blue-600 font-medium">
                <Link size={16} /> {job.source}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              job.status === 'Applied' ? 'bg-green-100 text-green-700' : 
              job.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {job.status}
            </span>
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm text-slate-600 line-clamp-2 italic border-l-2 border-slate-200 pl-3">
            {job.jdSummary}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <a 
            href={job.jobLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors"
          >
            <ExternalLink size={16} /> View Job
          </a>
          {job.status !== 'Applied' && (
            <button 
              onClick={() => onApply(job.id)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              <CheckCircle2 size={16} /> Mark Applied
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-slate-100 bg-slate-50 rounded-b-xl animate-in fade-in slide-in-from-top-2 duration-300 overflow-hidden">
          {/* Sub-tabs for Email vs Cover Letter */}
          <div className="flex border-b border-slate-200 bg-slate-100/50">
            <button 
              onClick={() => setActiveSubTab('email')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${activeSubTab === 'email' ? 'bg-white text-indigo-600 border-r border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Mail size={14} /> Application Email
            </button>
            <button 
              onClick={() => setActiveSubTab('coverLetter')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${activeSubTab === 'coverLetter' ? 'bg-white text-indigo-600 border-l border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <FileText size={14} /> Full Cover Letter
            </button>
          </div>

          <div className="p-5 space-y-4">
            {activeSubTab === 'email' ? (
              <>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Email</label>
                    <button 
                      onClick={() => copyToClipboard(job.contactEmail || 'N/A')}
                      className="text-blue-600 text-xs flex items-center gap-1 hover:underline"
                    >
                      <Copy size={12} /> Copy
                    </button>
                  </div>
                  <p className="text-sm font-medium text-slate-700 bg-white p-2 rounded border border-slate-200">
                    {job.contactEmail || "Contact not found (Refer to Job Link)"}
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subject Line</label>
                    <button 
                      onClick={() => copyToClipboard(job.emailSubject)}
                      className="text-blue-600 text-xs flex items-center gap-1 hover:underline"
                    >
                      <Copy size={12} /> Copy
                    </button>
                  </div>
                  <p className="text-sm font-medium text-slate-700 bg-white p-2 rounded border border-slate-200">
                    {job.emailSubject}
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Body</label>
                    <button 
                      onClick={() => copyToClipboard(job.emailBody)}
                      className="text-blue-600 text-xs flex items-center gap-1 hover:underline"
                    >
                      <Copy size={12} /> Copy
                    </button>
                  </div>
                  <div className="text-sm text-slate-700 bg-white p-4 rounded border border-slate-200 whitespace-pre-wrap leading-relaxed shadow-inner max-h-[300px] overflow-y-auto font-mono text-[13px]">
                    {job.emailBody}
                  </div>
                </div>
              </>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tailored Cover Letter</label>
                  <button 
                    onClick={() => copyToClipboard(job.coverLetter)}
                    className="text-blue-600 text-xs flex items-center gap-1 hover:underline"
                  >
                    <Copy size={12} /> Copy Letter
                  </button>
                </div>
                <div className="text-sm text-slate-700 bg-white p-6 rounded border border-slate-200 whitespace-pre-wrap leading-relaxed shadow-inner max-h-[500px] overflow-y-auto font-serif text-[14px]">
                  {job.coverLetter}
                </div>
              </div>
            )}
            
            {copied && (
              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-2 bg-indigo-600 text-white rounded-full text-xs font-bold shadow-xl animate-bounce z-50">
                ✓ Copied to clipboard!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobCard;
