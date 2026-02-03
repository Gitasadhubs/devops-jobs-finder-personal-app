
import React, { useState } from 'react';
import { Job } from '../types';
// Added Loader2 to the lucide-react import list
import { Mail, Link, Building2, MapPin, CheckCircle2, Copy, ExternalLink, ChevronDown, ChevronUp, FileText, CalendarDays, Clock, Timer, FileDown, Send, UserCircle, Loader2 } from 'lucide-react';

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
      // Access jsPDF from global window object injected via index.html
      const { jsPDF } = (window as any).jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const margin = 20;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const contentWidth = pageWidth - (margin * 2);
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(22);
      pdf.setTextColor(79, 70, 229);
      pdf.text(job.company, margin, 25);
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Subject: Application for ${job.title}`, margin, 32);
      
      pdf.setDrawColor(226, 232, 240);
      pdf.line(margin, 38, pageWidth - margin, 38);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(30, 41, 59);
      
      const splitText = pdf.splitTextToSize(job.coverLetter, contentWidth);
      pdf.text(splitText, margin, 50);
      
      pdf.save(`Asad_Ashraf_CL_${job.company.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error("PDF Export failed:", error);
      alert("PDF library is still loading or failed. Try again in a moment.");
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
    <div className={`bg-white rounded-[2rem] shadow-sm border-2 transition-all ${job.isNew ? 'border-indigo-100 bg-indigo-50/10' : 'border-slate-100'} hover:shadow-xl hover:border-indigo-200 group`}>
      <div className="p-8">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">{job.title}</h3>
              {job.isNew && (
                <span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">New</span>
              )}
            </div>
            <div className="flex flex-wrap gap-6 text-[13px] font-bold text-slate-400">
              <span className="flex items-center gap-2"><Building2 size={16} className="text-indigo-400" /> {job.company}</span>
              <span className="flex items-center gap-2"><MapPin size={16} className="text-indigo-400" /> {job.location || 'Lahore'}</span>
              <span className="flex items-center gap-2 text-indigo-500 bg-indigo-50 px-3 py-1 rounded-lg">
                <Link size={14} /> {job.source}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] ${
              job.status === 'Applied' ? 'bg-green-100 text-green-700' : 
              job.status === 'Scheduled' ? 'bg-purple-100 text-purple-700' :
              job.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}>
              {job.status}
            </span>
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-3 rounded-2xl transition-all ${isExpanded ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-100'}`}
            >
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm text-slate-500 font-medium leading-relaxed border-l-4 border-slate-100 pl-6 italic">
            "{job.jdSummary}"
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <a 
            href={job.jobLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
          >
            <ExternalLink size={18} /> View Origin
          </a>
          
          {job.status !== 'Applied' && (
            <>
              <button 
                onClick={() => setIsScheduling(!isScheduling)}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest bg-white border-2 border-slate-100 text-slate-600 hover:border-indigo-200 hover:text-indigo-600 transition-all"
              >
                <CalendarDays size={18} /> Schedule
              </button>

              <button 
                onClick={composeEmail}
                className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 ring-4 ring-indigo-50"
              >
                <Send size={18} /> Apply
              </button>
            </>
          )}

          {job.status === 'Applied' && (
            <div className="flex items-center justify-center gap-3 text-green-600 font-black text-xs uppercase tracking-[0.2em] bg-green-50 px-10 py-4 rounded-2xl border-2 border-green-100">
              <CheckCircle2 size={18} /> Task Completed
            </div>
          )}
        </div>

        {isScheduling && (
          <div className="mt-8 p-6 bg-slate-50 rounded-[2rem] border border-slate-200 animate-in slide-in-from-top-4 duration-300">
            <div className="flex gap-4">
              <input 
                type="datetime-local" 
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="flex-1 bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-500 transition-all"
              />
              <button onClick={handleConfirmSchedule} className="bg-slate-900 text-white px-10 py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-800">Confirm</button>
            </div>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="border-t-2 border-slate-50 bg-slate-50/50 rounded-b-[2rem] overflow-hidden">
          <div className="flex border-b border-slate-100 bg-white">
            <button 
              onClick={() => setActiveSubTab('email')}
              className={`flex-1 py-5 text-[10px] font-black uppercase tracking-[0.3em] transition-all ${activeSubTab === 'email' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Application Data
            </button>
            <button 
              onClick={() => setActiveSubTab('coverLetter')}
              className={`flex-1 py-5 text-[10px] font-black uppercase tracking-[0.3em] transition-all ${activeSubTab === 'coverLetter' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Document Output
            </button>
          </div>

          <div className="p-10 space-y-8">
            {activeSubTab === 'email' ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Recruiter Email</label>
                    <div className="p-5 bg-white border-2 border-slate-100 rounded-3xl text-sm font-bold text-slate-700 flex justify-between items-center group">
                      <span className="truncate">{job.contactEmail || "Contact not discovered"}</span>
                      <div className="flex gap-2">
                        <button onClick={() => copyToClipboard(job.contactEmail || '')} className="p-2 hover:bg-slate-50 rounded-lg text-indigo-600"><Copy size={16}/></button>
                        <button onClick={composeEmail} className="p-2 hover:bg-slate-50 rounded-lg text-indigo-600"><Send size={16}/></button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Subject Header</label>
                    <div className="p-5 bg-white border-2 border-slate-100 rounded-3xl text-sm font-bold text-slate-700 truncate">
                      {job.emailSubject}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Email Content</label>
                  <div className="whitespace-pre-wrap p-8 bg-white border-2 border-slate-100 rounded-[2.5rem] text-[13px] font-medium text-slate-600 leading-relaxed max-h-80 overflow-y-auto shadow-inner">
                    {job.emailBody}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">A4 Tailored Resume Addendum</label>
                  <button 
                    onClick={downloadCoverLetterPDF} 
                    disabled={isDownloading}
                    className="flex items-center gap-3 text-white bg-indigo-600 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg"
                  >
                    {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
                    {isDownloading ? 'Building PDF...' : 'Export to PDF'}
                  </button>
                </div>
                <div className="whitespace-pre-wrap p-12 bg-white border-2 border-slate-100 rounded-[3rem] text-sm text-slate-800 leading-loose font-serif max-h-[500px] overflow-y-auto shadow-2xl shadow-indigo-50/50">
                  {job.coverLetter}
                </div>
              </div>
            )}
            {copied && <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest z-50 animate-in fade-in zoom-in duration-300">✓ Metadata Copied</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobCard;
