
export interface Education {
  degree: string;
  institution: string;
  period: string;
}

export interface Project {
  name: string;
  description: string;
  highlights: string[];
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  linkedIn: string;
  location: string;
  education: Education[];
  skills: string[];
  certifications: string[];
  projects: Project[];
  summary: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  jdSummary: string;
  emailSubject: string;
  emailBody: string;
  contactEmail: string;
  jobLink: string;
  source: string;
  foundDate: string;
  isNew: boolean;
  status: 'Pending' | 'Applied' | 'Rejected';
}
