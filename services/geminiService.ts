
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Job, UserProfile } from "../types";

// Helper to initialize AI inside the request context
const getAI = () => {
  // Access process.env.API_KEY safely
  const key = typeof process !== 'undefined' ? process.env.API_KEY : undefined;
  if (!key || key === "undefined" || key === "") {
    throw new Error("API_KEY_NOT_FOUND: Please configure your Gemini API Key in Vercel.");
  }
  return new GoogleGenAI({ apiKey: key });
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
  skills: ["Linux", "Docker", "Kubernetes", "Jenkins", "Git", "GitHub Actions", "CI/CD", "Bash", "Python", "Terraform", "Ansible", "Prometheus", "Grafana", "Azure Fundamentals"],
  certifications: [
    "AZ-400: Microsoft Certified DevOps Engineer",
    "Docker Associate Engineer - Corvit Lahore"
  ],
  projects: [
    { 
      name: "AutoFlow – GitHub Actions Dashboard", 
      description: "Web-based dashboard for CI/CD workflow management with Python and REST APIs.",
      highlights: ["Automated workflow discovery", "Live log streaming", "Responsive UI"]
    },
    {
      name: "CI/CD Pipeline Automation",
      description: "Automated build and deploy pipeline using Jenkins and Kubernetes.",
      highlights: ["Dockerized builds", "Slack integration", "Real-time alerts"]
    }
  ],
  summary: "Aspiring Cloud & DevOps Engineer, AZ-400 certified. Specialized in building robust CI/CD pipelines and workflow automation."
};

export const searchJobs = async (): Promise<{ text: string; sources: any[] }> => {
  const ai = getAI();
  const prompt = `SEARCH PROTOCOL: [Lahore, Pakistan]
  Targeting: Junior DevOps Engineer, Associate SRE, DevOps Intern, Cloud Associate.
  Timeline: LAST 24 HOURS ONLY.
  Focus: LinkedIn, Rozee.pk, Careers at Systems Ltd, NetSol, Arbisoft, Devsinc.
  Task: Identify exactly matching job titles, company names, and application URLs. Search specifically for HR emails in the snippets.`;

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
    if (error.message?.includes('401') || error.message?.includes('API_KEY')) {
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

  const tailoringPrompt = `Analyze these jobs in Lahore: ${searchText}. 
  Tailor a professional application for Asad Ashraf. 
  Emphasize his AZ-400 cert and AutoFlow project. 
  If no HR email is found, provide a placeholder recruitment@company.com based on the domain.`;

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
    source: 'Verified Hub'
  }));
};
