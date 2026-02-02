
import React, { useRef, useState } from 'react';
import { USER_CONTEXT } from '../services/geminiService';
import { FileDown, Mail, Phone, Linkedin, MapPin, Award, Loader2 } from 'lucide-react';

const CVPreview: React.FC = () => {
  const cvRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const downloadPDF = async () => {
    if (!cvRef.current) return;
    setIsExporting(true);
    try {
      const { jsPDF } = (window as any).jspdf;
      const html2canvas = (window as any).html2canvas;

      const canvas = await html2canvas(cvRef.current, { 
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${USER_CONTEXT.name.replace(/\s+/g, '_')}_CV.pdf`);
    } catch (error) {
      console.error("PDF Export failed:", error);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Award className="text-indigo-600" /> Professional Resume
          </h2>
          <p className="text-sm text-slate-500">Preview and export your CV as a high-quality PDF.</p>
        </div>
        <button 
          onClick={downloadPDF}
          disabled={isExporting}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50"
        >
          {isExporting ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
          {isExporting ? 'Generating...' : 'Download PDF'}
        </button>
      </div>

      <div className="bg-white border shadow-2xl rounded-sm overflow-hidden mx-auto max-w-[850px] transition-all hover:shadow-indigo-100 mb-20">
        {/* Printable Area */}
        <div ref={cvRef} className="p-10 bg-white text-slate-800 leading-relaxed text-[11.5px]">
          {/* Header */}
          <div className="border-b-4 border-indigo-600 pb-5 mb-6 flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase leading-none">{USER_CONTEXT.name}</h1>
              <p className="text-indigo-600 font-bold text-lg mt-2 tracking-[0.1em] uppercase">Cloud & DevOps Engineer</p>
            </div>
            <div className="text-right space-y-1 text-slate-500 font-medium text-[10.5px]">
              <p className="flex items-center justify-end gap-2"><Mail size={12} className="text-indigo-400" /> {USER_CONTEXT.email}</p>
              <p className="flex items-center justify-end gap-2"><Phone size={12} className="text-indigo-400" /> {USER_CONTEXT.phone}</p>
              <a href={USER_CONTEXT.linkedIn} target="_blank" rel="noopener noreferrer" className="flex items-center justify-end gap-2 text-indigo-600 hover:underline">
                <Linkedin size={12} /> asadkhan-dev
              </a>
              <p className="flex items-center justify-end gap-2"><MapPin size={12} className="text-indigo-400" /> {USER_CONTEXT.location}</p>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-8">
            {/* Left Column */}
            <div className="col-span-4 space-y-6">
              {/* Summary */}
              <section>
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-1 mb-2.5">Profile</h3>
                <p className="text-slate-600 leading-normal italic text-[11px]">
                  "{USER_CONTEXT.summary}"
                </p>
              </section>

              {/* Skills */}
              <section>
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-1 mb-2.5">Technical Toolkit</h3>
                <div className="flex flex-wrap gap-1">
                  {USER_CONTEXT.skills.map(skill => (
                    <span key={skill} className="bg-slate-50 px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-700 border border-slate-100 uppercase tracking-tighter">{skill}</span>
                  ))}
                </div>
              </section>

              {/* Certifications */}
              <section>
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-1 mb-2.5">Certifications</h3>
                {USER_CONTEXT.certifications.map(cert => (
                  <div key={cert} className="flex gap-2 items-start mb-2.5">
                    <Award className="text-indigo-600 shrink-0 mt-0.5" size={13} />
                    <p className="font-bold text-slate-800 leading-tight text-[10.5px]">{cert}</p>
                  </div>
                ))}
              </section>

              {/* Education */}
              <section>
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-1 mb-2.5">Education</h3>
                {USER_CONTEXT.education.map(edu => (
                  <div key={edu.degree} className="mb-2.5">
                    <p className="font-bold text-slate-900 text-[11px]">{edu.degree}</p>
                    <p className="text-slate-500 font-semibold text-[10.5px]">{edu.institution}</p>
                    <p className="text-[9.5px] text-indigo-600 font-black tracking-wide">{edu.period}</p>
                  </div>
                ))}
              </section>
            </div>

            {/* Right Column */}
            <div className="col-span-8 space-y-5">
              {/* Projects */}
              <section>
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-1 mb-3">Professional Projects</h3>
                <div className="space-y-4">
                  {USER_CONTEXT.projects.map(project => (
                    <div key={project.name} className="group">
                      <p className="text-[11.5px] font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{project.name}</p>
                      <p className="text-slate-700 mb-1.5 font-semibold text-[10.5px] leading-snug">{project.description}</p>
                      <ul className="space-y-0.5 text-slate-500 text-[10.5px]">
                        {project.highlights.map((h, i) => (
                          <li key={i} className="flex gap-2 items-start">
                            <span className="w-1 h-1 rounded-full bg-indigo-300 mt-1.5 shrink-0"></span>
                            <span className="leading-normal">{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
              
              <section>
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-1 mb-2">Core Competency</h3>
                <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
                  <p className="text-slate-700 leading-relaxed text-[10.5px] font-medium">
                    Strong focus on architecting scalable infrastructure with <strong>GitHub Actions</strong> and <strong>Jenkins</strong>. Expertly managing <strong>Dockerized</strong> microservices and automating multi-stage <strong>Azure/AWS pipelines</strong> using Infrastructure as Code (<strong>Terraform/Ansible</strong>) to ensure high-frequency, reliable deployments and robust monitoring via <strong>Prometheus & Grafana</strong>.
                  </p>
                </div>
              </section>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-8 pt-4 border-t border-slate-100 text-center text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">
            References available upon request
          </div>
        </div>
      </div>
    </div>
  );
};

export default CVPreview;
