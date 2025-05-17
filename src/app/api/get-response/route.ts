import { NextResponse } from "next/server";
import diseases from "../../diseaseQuestions.json";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface SeverityFormula {
  [key: string]: number;
}

interface DiseaseData {
  questions: { id: number; text: string; key: string; type: string }[];
  severityFormula: SeverityFormula;
}

interface Diseases {
  [key: string]: DiseaseData;
}

export async function POST(request: Request) {
  try {
    const { responses, diseases: selectedDiseases }: { responses: Record<string, any>; diseases: string[] } = await request.json();

    if (!selectedDiseases || selectedDiseases.length === 0) {
      return NextResponse.json({ message: "No diseases selected." }, { status: 400 });
    }

    const matchedDiseases = selectedDiseases
      .map((disease) => (diseases as Diseases)[disease])
      .filter(Boolean); // Filter out invalid diseases

    if (matchedDiseases.length === 0) {
      return NextResponse.json({ message: "Invalid disease(s) selected." }, { status: 400 });
    }

    // Calculate severity for all selected diseases
    const severityScores = matchedDiseases.map((diseaseData) => {
      const severityFormula = diseaseData?.severityFormula || {};
      return Object.keys(severityFormula).reduce((score, key) => {
        return score + (responses[key] ? responses[key] * severityFormula[key] : 0);
      }, 0);
    });

    const maxSeverityScore = Math.max(...severityScores);
    const severity = maxSeverityScore >= 0.7 ? "High" : maxSeverityScore >= 0.4 ? "Moderate" : "Low";

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) throw new Error("Missing Gemini API key.");

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-002" });

    const prompt = `
      Based on the details provided:
      Diseases: ${selectedDiseases.join(", ")}
      Symptoms and Responses: ${JSON.stringify(responses)}
      Severity: ${severity}
      Provide detailed precautions, basic medicines, diet, and measures to prevent recurrence.
    `;

    const geminiResponse = await model.generateContent(prompt);
    const rawText = geminiResponse?.response?.text?.() || "No response.";

    return NextResponse.json({ message: rawText });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}

