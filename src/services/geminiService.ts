import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function parseQuizContent(content: string): Promise<QuizQuestion[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Parse the following text into a structured quiz format. 
    The text may contain multiple questions, each with several choices and a rationale for the correct answer.
    Identify the question text, the list of options, the index of the correct option (0-based), and the rationale.
    
    Content to parse:
    ${content}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            question: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            correctAnswerIndex: { type: Type.INTEGER },
            rationale: { type: Type.STRING }
          },
          required: ["id", "question", "options", "correctAnswerIndex", "rationale"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse quiz content", e);
    return [];
  }
}
