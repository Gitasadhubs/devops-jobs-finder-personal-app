
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Job, UserProfile } from "../types";

// Safe wrapper to prevent browser crashes
const getApiKey = () => {
  try {
    // In this specific environment, process.env.API_KEY is injected
    return (typeof process !== 'undefined' && process.env && process.env.API_KEY) ? process.env.API_KEY : null;
  } catch (e) {
    return null;
  }
};

const getAI = () => {
  const apiKey = getApiKey();
  if (!apiKey || apiKey === "undefined") {
    throw new Error("API_KEY_NOT_FOUND");
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
    }
  ],
  summary: "Aspiring Cloud & DevOps Engineer, AZ-400 certified and Docker Associate Engineer. Specialized in building robust CI/CD pipelines and Infrastructure as Code."
};

export const searchJobs = async (): Promise<{ text: string; sources: any[] }> => {
  const ai = getAI();
  const prompt = `SEARCH GROUNDING: Latest Junior DevOps and DevOps Internship roles in Lahore, Pakistan posted in last 48 hours. Focus on Systems Ltd, NetSol, and LinkedIn. Extract company, title, apply link, and HR email if visible.`;

  try {
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
  } catch (error: any) {
    if (error.message?.includes('401') || error.message?.includes('API_KEY_INVALID')) {
      throw new Error("API_KEY_INVALID");
    }
    throw error;
  }
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
        contactEmail: { type: Type.STRING },
        jobLink: { type: Type.STRING },
      },
      required: ["title", "company", "jdSummary", "emailSubject", "emailBody", "coverLetter", "jobLink"]
    }
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Tailor applications for Asad Ashraf based on these jobs: ${searchText}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });

  const parsedJobs = JSON.parse(response.text || "[]");
  return parsedJobs.map((job: any, index: number) => ({
    ...job,
    id: `job-${Date.now()}-${index}`,
    foundDate: new Date().toISOString(),
    isNew: true,
    status: 'Pending',
    source: 'Verified Hunt'
  }));
};
