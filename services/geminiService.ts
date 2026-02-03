
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Job, UserProfile } from "../types";

// Helper to safely get the API Key without crashing the browser
const getApiKey = () => {
  try {
    return (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : null;
  } catch (e) {
    return null;
  }
};

const getAI = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API_KEY_MISSING: Application environment variables not initialized.");
  }
  return new GoogleGenAI({ apiKey });
};

export const USER_CONTEXT: UserProfile = {
  name: "Asad Ashraf",
  email: "gasadmail@gmail.com",
  phone: "03044463268",
  linkedIn: "https://www.linkedin.com/in/asadkhan-dev/",
  location: "Lahore, Pakistan",
  education: [
    { degree: "Bachelors", institution: "Institute of Management Sciences (IMS Lahore)", period: "2022-2026" },
    { degree: "ICS", institution: "Aspire College", period: "2018–2020" }
  ],
  skills: ["Linux (Ubuntu/Debian)", "Docker", "Kubernetes", "Jenkins", "Git", "GitHub Actions", "CI/CD pipelines", "Bash", "Python", "Basic C", "Azure Fundamentals", "Workflow Automation", "Terraform", "Ansible", "Prometheus", "Grafana", "ELK Stack"],
  certifications: [
    "AZ-400: Microsoft Certified DevOps Engineer / Cloud Engineer",
    "Docker Associate Engineer - Corvit Lahore"
  ],
  projects: [
    { 
      name: "AutoFlow – GitHub Actions Dashboard (FYP)", 
      description: "Web-based dashboard to manage GitHub Actions workflows with Python (Flask/Django), JavaScript, and REST APIs.",
      highlights: [
        "Repository management and automated workflow discovery",
        "Real-time execution and live log streaming",
        "Secure authentication with GitHub PATs",
        "Responsive UI with workflow templates for easy CI/CD setup"
      ]
    },
    {
      name: "CI/CD Pipeline Automation",
      description: "Automated build, test, and deployment pipeline for web applications using Jenkins and Kubernetes.",
      highlights: [
        "Dockerized applications and automated image builds",
        "Orchestrated deployments to Kubernetes clusters",
        "Integrated unit testing within the pipeline",
        "Slack/Email notifications for real-time success/failure alerts"
      ]
    },
    {
      name: "Infrastructure as Code (IaC) Project",
      description: "Cloud infrastructure provisioning using Terraform and Ansible on Azure/AWS platforms.",
      highlights: [
        "Provisioned VMs, networking, and storage using code",
        "Automated environment setup for various application stacks",
        "Enabled repeatable and version-controlled deployment environments",
        "Linux system hardening and automated configuration"
      ]
    },
    {
      name: "Dockerized Microservices Deployment",
      description: "Containerization of multi-service applications (Frontend, Backend, Database) using Docker Compose.",
      highlights: [
        "Local orchestration of microservices",
        "Tested and implemented container scaling strategies",
        "Optimized Docker images for speed and storage efficiency",
        "Implemented secure persistent storage for PostgreSQL"
      ]
    },
    {
      name: "Monitoring & Logging Setup",
      description: "Full-stack observability setup using Prometheus, Grafana, and ELK stack.",
      highlights: [
        "Centralized logging with Elasticsearch, Logstash, and Kibana",
        "Monitoring of CPU, Memory, and Container metrics",
        "Created custom dashboards for real-time system insights",
        "Configured intelligent alerting for system failures"
      ]
    }
  ],
  summary: "Aspiring Cloud & DevOps Engineer, AZ-400 certified and Docker Associate Engineer. Specialized in workflow automation, Infrastructure as Code (IaC), container orchestration (Kubernetes/Docker), and building robust CI/CD pipelines. Passionate about enhancing developer productivity and system reliability."
};

export const searchJobs = async (): Promise<{ text: string; sources: any[] }> => {
  const ai = getAI();
  const prompt = `SEARCH GROUNDING PROTOCOL: 
  Location: Lahore, Pakistan ONLY.
  Target Roles: Junior DevOps Engineer, Associate Cloud Engineer, SRE Intern, DevOps Intern.
  Freshness: MUST be posted within the last 24-48 hours.
  
  Targeting specifically:
  - LinkedIn Job Postings (filter by Lahore + Entry Level)
  - Career portals of: Systems Limited, NetSol, Arbisoft, Devsinc, 10Pearls, Northbay, Folio3.
  - Local boards: Rozee.pk, Mustakbil, Brightspyre.
  
  TASK:
  Find exactly matching jobs. For each, extract:
  1. Full Job Title
  2. Company Name
  3. Direct link to apply
  4. ANY recruiter email address or HR contact information mentioned in the snippet.
  
  Search thoroughly for email patterns like [name]@company.com or careers@company.pk.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  return {
    text: response.text || "",
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
  };
};

export const parseAndTailorJobs = async (searchText: string, searchSources: any[]): Promise<Job[]> => {
  const ai = getAI();
  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        company: { type: Type.STRING },
        location: { type: Type.STRING },
        jdSummary: { type: Type.STRING },
        emailSubject: { type: Type.STRING },
        emailBody: { type: Type.STRING },
        coverLetter: { type: Type.STRING },
        contactEmail: { type: Type.STRING, description: "Discovered HR email. If not found in JD, use recruitment@[domain] or hr@[domain] if high confidence." },
        jobLink: { type: Type.STRING },
      },
      required: ["title", "company", "jdSummary", "emailSubject", "emailBody", "coverLetter", "jobLink"]
    }
  };

  const tailoringPrompt = `
    ANALYZE AND TAILOR FOR ASAD ASHRAF (DevOps Specialist).
    
    CRITICAL FILTER:
    - If the job is NOT in Lahore, discard it.
    - If the job requires >2 years experience, discard it.
    
    TAILORING GUIDELINES:
    - Cover Letter: Emphasize AZ-400 certification and the 'AutoFlow' FYP project.
    - Style: Professional, eager, technically precise.
    - Context: Mention bachelors at IMS Lahore (Expected 2026).
    
    Data Source:
    ${searchText}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: tailoringPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      thinkingConfig: { thinkingBudget: 2000 }
    },
  });

  const parsedJobs = JSON.parse(response.text || "[]");
  
  return parsedJobs.map((job: any, index: number) => ({
    ...job,
    id: `job-${Date.now()}-${index}`,
    foundDate: new Date().toISOString(),
    isNew: true,
    status: 'Pending',
    source: job.jobLink.toLowerCase().includes('linkedin') ? 'LinkedIn' : 
            job.jobLink.toLowerCase().includes('rozee') ? 'Rozee.pk' : 
            job.jobLink.toLowerCase().includes('careers') ? 'Direct' : 'Portal'
  }));
};
