
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
      const { jsPDF } = (window as any).jspdf.umd;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const margin = 20;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const contentWidth = pageWidth - (margin * 2);
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(20);
      pdf.setTextColor(79, 70, 229);
      pdf.text(job.company, margin, 25);
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Cover Letter: ${job.title}`, margin, 32);
      
      pdf.setDrawColor(226, 232, 240);
      pdf.line(margin, 38, pageWidth - margin, 38);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(30, 41, 59);
      
      const splitText = pdf.splitTextToSize(job.coverLetter, contentWidth);
      pdf.text(splitText, margin, 50);
      
      pdf.save(`Cover_Letter_${job.company.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error("PDF Export failed:", error);
      alert("Failed to export PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  const composeEmail = () => {
    const subject = encodeURIComponent(job.emailSubject);
    const body = encodeURIComponent(job.emailBody);
    const recipient = job.contactEmail || "";
    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
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
            className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3.5 rounded-2xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg"
          >
            <ExternalLink size={18} /> View Listing
          </a>
          
          {job.status !== 'Applied' && (
            <>
              <button 
                onClick={() => setIsScheduling(!isScheduling)}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold bg-white border-2 border-slate-100 text-slate-600 hover:border-indigo-200 transition-all"
              >
                <CalendarDays size={18} /> Schedule
              </button>

              <button 
                onClick={composeEmail}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3.5 rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 group"
              >
                <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> Compose Mail
              </button>
            </>
          )}

          {job.status === 'Applied' && (
            <div className="flex items-center gap-2 text-green-600 font-bold text-sm bg-green-50 px-6 py-3.5 rounded-2xl border border-green-100">
              <CheckCircle2 size={18} /> Application Tracked
            </div>
          )}
        </div>

        {isScheduling && (
          <div className="mt-6 p-5 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex gap-3">
              <input 
                type="datetime-local" 
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm"
              />
              <button onClick={handleConfirmSchedule} className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-bold">Confirm</button>
            </div>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="border-t border-slate-100 bg-slate-50 rounded-b-[2rem] overflow-hidden">
          <div className="flex border-b border-slate-200 bg-slate-100/30">
            <button 
              onClick={() => setActiveSubTab('email')}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeSubTab === 'email' ? 'bg-white text-indigo-600' : 'text-slate-400'}`}
            >
              Email Draft
            </button>
            <button 
              onClick={() => setActiveSubTab('coverLetter')}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeSubTab === 'coverLetter' ? 'bg-white text-indigo-600' : 'text-slate-400'}`}
            >
              Cover Letter
            </button>
          </div>

          <div className="p-8 space-y-6">
            {activeSubTab === 'email' ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">HR Recruiter Email</label>
                  <button onClick={() => copyToClipboard(job.contactEmail || '')} className="text-indigo-600 text-[10px] font-bold">Copy</button>
                </div>
                <div className="p-4 bg-white border rounded-2xl text-sm font-bold text-slate-700 flex justify-between items-center">
                  {job.contactEmail || "Recruiter email not found"}
                  <button onClick={composeEmail} className="text-indigo-600"><Send size={16} /></button>
                </div>
                <div className="whitespace-pre-wrap p-6 bg-white border rounded-3xl text-xs font-mono text-slate-600 leading-relaxed max-h-64 overflow-y-auto">
                  {job.emailBody}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tailored Document</label>
                  <button 
                    onClick={downloadCoverLetterPDF} 
                    disabled={isDownloading}
                    className="flex items-center gap-2 text-indigo-600 text-[10px] font-bold border border-indigo-100 px-3 py-1.5 rounded-lg hover:bg-indigo-50"
                  >
                    <FileDown size={14} /> {isDownloading ? 'Downloading...' : 'Download PDF'}
                  </button>
                </div>
                <div className="whitespace-pre-wrap p-8 bg-white border rounded-[2rem] text-sm text-slate-700 leading-loose font-serif max-h-96 overflow-y-auto shadow-inner">
                  {job.coverLetter}
                </div>
              </div>
            )}
            {copied && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full text-xs font-bold">Copied!</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobCard;
