
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Job, UserProfile } from "../types";

// We do not initialize at top-level to prevent app crash if key is missing during bundle load
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is not defined. Please set it in your environment variables.");
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
  const prompt = `SEARCH PROTOCOL: ACTIVE DEVOPS/CLOUD JOBS IN LAHORE, PAKISTAN (PAST 24 HOURS ONLY).
  
  Target Platforms:
  1. LinkedIn Jobs (Lahore + Past 24 Hours)
  2. Rozee.pk, Mustakbil, BrightSpyre
  3. Career pages of: Systems Ltd, NetSol, Folio3, Arbisoft, Devsinc, Northbay, 10Pearls.
  
  STRICT ACCURACY REQUIREMENTS:
  - Role: DevOps Internship, Junior DevOps Engineer, Associate Cloud/SRE.
  - Location: MUST BE Lahore, Pakistan (Strict).
  - Date: Must be posted TODAY or within the last 24 hours.
  
  HR EMAIL DISCOVERY:
  - Aggressively scan search results for HR email addresses (e.g., hr@company.com, careers@company.pk).
  - Look for "apply via email", "send resume to", etc.
  
  Return a raw list of matches found with their snippets and any visible contact info.`;

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
        contactEmail: { type: Type.STRING, description: "HR email address found. If not found, predict careers@[company_domain] if high confidence." },
        jobLink: { type: Type.STRING },
      },
      required: ["title", "company", "jdSummary", "emailSubject", "emailBody", "coverLetter", "jobLink"]
    }
  };

  const tailoringPrompt = `
    TASK: VERIFY ACCURACY AND TAILOR APPLICATIONS FOR ${USER_CONTEXT.name}.
    
    ACCURACY CHECK:
    1. Filter: ONLY Junior/Entry/Intern levels.
    2. Filter: ONLY Lahore, Pakistan.
    
    CONTACT DISCOVERY:
    - Extract HR emails from the provided snippets.
    
    TAILORING:
    - Cover Letter: Approx 350 words, mentioning AZ-400 and the AutoFlow project.
    - Reference IMS Lahore education.
    
    Content:
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
    id: `${Date.now()}-${index}`,
    foundDate: new Date().toISOString(),
    isNew: true,
    status: 'Pending',
    source: job.jobLink.toLowerCase().includes('linkedin') ? 'LinkedIn' : 
            job.jobLink.toLowerCase().includes('rozee') ? 'Rozee.pk' : 
            job.jobLink.toLowerCase().includes('.com/careers') ? 'Direct' : 'Portal'
  }));
};
