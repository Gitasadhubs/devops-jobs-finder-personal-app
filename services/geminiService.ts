
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
    { degree: "Bachelors", institution: "Pak Aims University", period: "2022-2026" },
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
  const prompt = `SEARCH PROTOCOL: ACTIVE DEVOPS/CLOUD JOBS LAHORE (PAST 24 HOURS ONLY).
  
  Target Platforms:
  1. Official Company Career Pages (Direct)
  2. LinkedIn Jobs (Filter: Past 24 Hours)
  3. Rozee.pk, Mustakbil, BrightSpyre
  4. Local Lahore Tech Hubs (e.g., Arfa Tower companies, NetSol, Systems Ltd, Folio3, etc.)

  STRICT CRITERIA:
  - Role: DevOps Internship, Junior DevOps Engineer, Associate Cloud Engineer.
  - Location: Lahore (or Remote for Lahore-based companies).
  - Date: Must be posted TODAY or within the last 24 hours.
  - Link Quality: PRIORITIZE direct 'apply' links. Avoid third-party 'ad' links.

  Return a raw list of matches found with their snippets.`;

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
        contactEmail: { type: Type.STRING },
        jobLink: { type: Type.STRING },
      },
      required: ["title", "company", "jdSummary", "emailSubject", "emailBody", "coverLetter", "jobLink"]
    }
  };

  const tailoringPrompt = `
    TASK: VERIFY AND TAILOR DEVOPS JOB APPLICATIONS FOR ${USER_CONTEXT.name}.
    
    Candidate Profile:
    - Name: ${USER_CONTEXT.name}
    - Professional Title: Cloud & DevOps Engineer
    - Certifications: ${USER_CONTEXT.certifications.join(", ")}
    - Education: ${USER_CONTEXT.education.map(e => `${e.degree} from ${e.institution} (${e.period})`).join(", ")}
    - Core Skills: ${USER_CONTEXT.skills.join(", ")}
    - Key Projects: ${USER_CONTEXT.projects.map(p => p.name).join(", ")}
    - LinkedIn: ${USER_CONTEXT.linkedIn}

    Tailoring Instructions:
    1. Filter: ONLY jobs in Lahore or Remote (Lahore companies) posted in the last 24 hours.
    2. Email Tone: Professional, eager junior engineer.
    3. Cover Letter: Generate a full, highly professional cover letter (approx 300 words). 
       - It should be specifically addressed to the hiring manager at the company.
       - Highlight how his AZ-400 certification and projects (like AutoFlow) directly solve problems mentioned in the JD.
       - Focus on "Infrastructure as Code", "CI/CD Automation", and "Cloud Reliability".
    4. Signature MUST include: ${USER_CONTEXT.name} | ${USER_CONTEXT.email} | ${USER_CONTEXT.phone} | LinkedIn: ${USER_CONTEXT.linkedIn}.

    Content to Parse:
    ${searchText}

    Search Sources:
    ${JSON.stringify(searchSources)}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: tailoringPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
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
