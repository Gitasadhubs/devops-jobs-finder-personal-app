
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Job, UserProfile } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
  const prompt = `SEARCH PROTOCOL: ACTIVE DEVOPS/CLOUD JOBS IN LAHORE (PAST 24 HOURS ONLY).
  
  Target Platforms:
  1. LinkedIn (Job listings posted 'Past 24 hours')
  2. Rozee.pk / Mustakbil (Local Pakistan job boards)
  3. Direct Career Pages of: Systems Ltd, NetSol, Folio3, Northbay, 10Pearls, Arbisoft, Devsinc.
  
  STRICT ACCURACY REQUIREMENTS:
  - Role: DevOps Internship, Junior DevOps Engineer, Associate Cloud/SRE Engineer.
  - Location: MUST BE Lahore, Pakistan (or Remote if company is based in Lahore).
  - Date: MUST be posted within the last 24 hours.
  
  HR EMAIL DISCOVERY MISSION:
  - Scan the job description snippets for ANY email patterns.
  - Specifically look for phrases like "Send your CV to", "Email us at", or "Contact HR at".
  - If a specific recruiter name is mentioned, note it.
  - Prioritize findings that include an @company.com or @company.pk address.

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
        contactEmail: { type: Type.STRING, description: "The specific HR or recruitment email discovered. If not explicitly found, use high-confidence company career emails (e.g. hr@systems.ltd for Systems Ltd)." },
        jobLink: { type: Type.STRING },
      },
      required: ["title", "company", "jdSummary", "emailSubject", "emailBody", "coverLetter", "jobLink"]
    }
  };

  const tailoringPrompt = `
    TASK: ANALYZE SEARCH RESULTS AND GENERATE HIGHLY ACCURATE, TAILORED APPLICATIONS FOR ${USER_CONTEXT.name}.
    
    ACCURACY CHECK:
    1. Verify if the job is truly in Lahore, Pakistan.
    2. Ensure the level is Junior, Entry-level, or Internship.
    
    CONTACT DISCOVERY:
    - Search deep into the search snippets for contact emails.
    - If the company is one of the "Lahore Tech Giants" (Systems, NetSol, etc.), you know their common recruitment emails (e.g., recruitment@systemsltd.com, careers@netsolpk.com). Use them if the JD doesn't provide one.
    - Otherwise, mark as null if unknown.

    TAILORING LOGIC:
    - Cover Letter: Approx 350 words. Professional, persuasive, and technically deep.
    - Mention AZ-400 Certification specifically.
    - Reference bachelors at Institute of Management Sciences (IMS Lahore).
    - Mention "AutoFlow" project as his flagship FYP.
    - Email Body: Concise, punchy, designed to get an attachment opened.

    Content to Parse:
    ${searchText}

    Search Sources Metadata:
    ${JSON.stringify(searchSources)}
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
