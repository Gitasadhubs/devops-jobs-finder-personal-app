
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Job, UserProfile } from "../types";

// Helper to initialize AI inside the request context safely
const getAI = () => {
  const key = typeof process !== 'undefined' ? process.env.API_KEY : undefined;
  if (!key || key === "undefined" || key === "") {
    throw new Error("API_KEY_NOT_FOUND: Please check your environment variables.");
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
  const prompt = `SEARCH GROUNDING: 
  Location: Lahore, Pakistan
  Keywords: Junior DevOps Engineer, DevOps Intern, Associate Site Reliability Engineer, Cloud Associate.
  Target Companies: Systems Ltd, NetSol, Arbisoft, Devsinc, 10Pearls, VentureDive, Creative Dots.
  Timeline: Posted in the last 48 hours.
  Goal: Find direct job links or HR contact emails.`;

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
      throw new Error("AUTHENTICATION_ERROR: The API key provided is invalid or expired.");
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

  const tailoringPrompt = `Analyze the following Lahore job listings: "${searchText}". 
  Create tailored applications for Asad Ashraf. Focus on his Azure AZ-400 certification and Docker skills. 
  Ensure the tone is highly professional and proactive. If a contact email isn't in the text, predict a generic HR email for that company.`;

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
    source: 'Intelligent Grounding'
  }));
};
