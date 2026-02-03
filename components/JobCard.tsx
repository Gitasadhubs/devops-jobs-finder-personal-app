
import React, { useState, useRef } from 'react';
import { Job } from '../types';
import { Mail, Link, Building2, MapPin, CheckCircle2, Copy, ExternalLink, ChevronDown, ChevronUp, FileText, CalendarDays, Clock, Timer, FileDown, Send, UserCircle } from 'lucide-react';

interface JobCardProps {
  job: Job;
  onApply: (id: string) => void;
  onSchedule: (id: string, date: string) => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onApply, onSchedule }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'email' | 'coverLetter'>('email');
  const [copied, setCopied] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const coverLetterRef = useRef<HTMLDivElement>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmSchedule = () => {
    if (!scheduleDate) return;
    onSchedule(job.id, scheduleDate);
    setIsScheduling(false);
  };

  const downloadCoverLetterPDF = async () => {
    setIsDownloading(true);
    try {
      const { jsPDF } = (window as any).jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const margin = 20;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const contentWidth = pageWidth - (margin * 2);
      
      // Header
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(22);
      pdf.setTextColor(79, 70, 229); // Indigo-600
      pdf.text(job.company, margin, 25);
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139); // Slate-500
      pdf.text(`Cover Letter for: ${job.title}`, margin, 32);
      
      pdf.setDrawColor(226, 232, 240); // Slate-200
      pdf.line(margin, 38, pageWidth - margin, 38);
      
      // Content
      pdf.setFont('times', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(30, 41, 59); // Slate-800
      
      const splitText = pdf.splitTextToSize(job.coverLetter, contentWidth);
      pdf.text(splitText, margin, 50);
      
      pdf.save(`Cover_Letter_${job.company.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error("PDF Export failed:", error);
      alert("PDF Generation failed. Check if jspdf is loaded correctly.");
    } finally {
      setIsDownloading(false);
    }
  };

  const composeEmail = () => {
    const subject = encodeURIComponent(job.emailSubject);
    const body = encodeURIComponent(job.emailBody);
    const recipient = job.contactEmail || "";
    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
    // Mark as applied automatically when they click compose
    onApply(job.id);
  };

  return (
    <div className={`bg-white rounded-3xl shadow-sm border transition-all ${job.isNew ? 'border-indigo-200 bg-indigo-50/20' : 'border-slate-200'} hover:shadow-xl hover:shadow-indigo-50`}>
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">{job.title}</h3>
              {job.isNew && (
                <span className="bg-indigo-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">Fresh Match</span>
              )}
            </div>
            <div className="flex flex-wrap gap-5 text-sm font-semibold text-slate-400">
              <span className="flex items-center gap-1.5"><Building2 size={16} className="text-indigo-400" /> {job.company}</span>
              <span className="flex items-center gap-1.5"><MapPin size={16} className="text-indigo-400" /> {job.location || 'Lahore'}</span>
              <span className="flex items-center gap-1.5 text-indigo-600">
                <Link size={16} /> {job.source}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <span className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest ${
              job.status === 'Applied' ? 'bg-green-100 text-green-700' : 
              job.status === 'Scheduled' ? 'bg-purple-100 text-purple-700' :
              job.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {job.status}
            </span>
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-2 rounded-xl transition-all ${isExpanded ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
        </div>

        {job.status === 'Scheduled' && job.scheduledAt && (
          <div className="mt-4 flex items-center gap-2 bg-purple-50 text-purple-700 p-3 rounded-2xl text-xs font-bold border border-purple-100 ring-4 ring-purple-50/50">
            <Timer size={14} className="animate-pulse" />
            Queued for: {new Date(job.scheduledAt).toLocaleString()}
          </div>
        )}

        <div className="mt-5">
          <p className="text-sm text-slate-500 font-medium line-clamp-2 leading-relaxed italic border-l-4 border-slate-200 pl-4">
            {job.jdSummary}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <a 
            href={job.jobLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3.5 rounded-2xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
          >
            <ExternalLink size={18} /> View Listing
          </a>
          
          {job.status !== 'Applied' && (
            <>
              <button 
                onClick={() => setIsScheduling(!isScheduling)}
                className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold transition-all border-2 ${
                  isScheduling ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-white border-slate-100 text-slate-600 hover:border-purple-200 hover:text-purple-600'
                }`}
              >
                <CalendarDays size={18} /> {job.status === 'Scheduled' ? 'Reschedule' : 'Schedule'}
              </button>

              <button 
                onClick={composeEmail}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3.5 rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 ring-4 ring-indigo-50 group"
              >
                <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> Compose Mail
              </button>
            </>
          )}

          {job.status === 'Applied' && (
            <div className="flex items-center gap-2 text-green-600 font-bold text-sm bg-green-50 px-4 py-3.5 rounded-2xl border border-green-100">
              <CheckCircle2 size={18} /> Application Tracked
            </div>
          )}
        </div>

        {/* Scheduling Form */}
        {isScheduling && (
          <div className="mt-6 p-5 bg-slate-50 rounded-2xl border border-slate-200 animate-in slide-in-from-top-4 duration-300">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Clock size={12} /> Set Send Date & Time
            </label>
            <div className="flex gap-3">
              <input 
                type="datetime-local" 
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
              />
              <button 
                onClick={handleConfirmSchedule}
                disabled={!scheduleDate}
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Confirm
              </button>
            </div>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="border-t border-slate-100 bg-slate-50 rounded-b-[2rem] animate-in fade-in slide-in-from-top-2 duration-300 overflow-hidden">
          {/* Sub-tabs */}
          <div className="flex border-b border-slate-200 bg-slate-100/30">
            <button 
              onClick={() => setActiveSubTab('email')}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all ${activeSubTab === 'email' ? 'bg-white text-indigo-600 border-r border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Mail size={14} /> Application Draft
            </button>
            <button 
              onClick={() => setActiveSubTab('coverLetter')}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all ${activeSubTab === 'coverLetter' ? 'bg-white text-indigo-600 border-l border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <FileText size={14} /> Tailored Cover Letter
            </button>
          </div>

          <div className="p-8 space-y-6">
            {activeSubTab === 'email' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><UserCircle size={12}/> Recruiter Contact</label>
                      <button 
                        onClick={() => copyToClipboard(job.contactEmail || 'N/A')}
                        className="text-indigo-600 text-[10px] font-bold flex items-center gap-1.5 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-all"
                      >
                        <Copy size={12} /> Copy Email
                      </button>
                    </div>
                    <p className="text-sm font-bold text-slate-700 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group">
                      <span className="truncate">{job.contactEmail || "Searching for HR email..."}</span>
                      {job.contactEmail && (
                        <button onClick={composeEmail} title="Compose to this HR email" className="opacity-0 group-hover:opacity-100 text-indigo-600 p-1 hover:bg-indigo-50 rounded transition-all">
                          <Send size={14} />
                        </button>
                      )}
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject Line</label>
                      <button 
                        onClick={() => copyToClipboard(job.emailSubject)}
                        className="text-indigo-600 text-[10px] font-bold flex items-center gap-1.5 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-all"
                      >
                        <Copy size={12} /> Copy Subject
                      </button>
                    </div>
                    <p className="text-sm font-bold text-slate-700 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm truncate">
                      {job.emailSubject}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Body</label>
                    <div className="flex gap-2">
                       <button 
                        onClick={composeEmail}
                        className="text-white bg-indigo-600 text-[10px] font-bold flex items-center gap-1.5 hover:bg-indigo-700 px-3 py-1 rounded-lg transition-all shadow-md"
                      >
                        <Send size={12} /> Direct Mail
                      </button>
                      <button 
                        onClick={() => copyToClipboard(job.emailBody)}
                        className="text-indigo-600 text-[10px] font-bold flex items-center gap-1.5 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-all border border-indigo-100"
                      >
                        <Copy size={12} /> Copy Text
                      </button>
                    </div>
                  </div>
                  <div className="text-[13px] text-slate-600 bg-white p-6 rounded-3xl border border-slate-200 whitespace-pre-wrap leading-relaxed shadow-sm max-h-[400px] overflow-y-auto font-mono">
                    {job.emailBody}
                  </div>
                </div>
              </>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Document</label>
                  <div className="flex gap-2">
                    <button 
                      onClick={downloadCoverLetterPDF}
                      disabled={isDownloading}
                      className="text-indigo-600 text-[10px] font-bold flex items-center gap-1.5 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-all border border-indigo-100"
                    >
                      <FileDown size={14} /> {isDownloading ? 'Generating...' : 'Download PDF'}
                    </button>
                    <button 
                      onClick={() => copyToClipboard(job.coverLetter)}
                      className="text-indigo-600 text-[10px] font-bold flex items-center gap-1.5 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-all border border-indigo-100"
                    >
                      <Copy size={14} /> Copy Content
                    </button>
                  </div>
                </div>
                <div className="text-[14px] text-slate-700 bg-white p-8 rounded-[2rem] border border-slate-200 whitespace-pre-wrap leading-loose shadow-sm max-h-[600px] overflow-y-auto font-serif">
                  {job.coverLetter}
                </div>
              </div>
            )}
            
            {copied && (
              <div className="fixed bottom-12 left-1/2 -translate-x-1/2 px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl animate-in fade-in zoom-in duration-300 z-50 ring-4 ring-indigo-500/20">
                ✓ Copied to clipboard
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobCard;
