
import { GoogleGenAI } from "@google/genai";
import { Habit, Completion } from "../types";

export const getHabitAdvice = async (
  habits: Habit[],
  completions: Completion[],
  userPrompt: string
) => {
  // Always use new GoogleGenAI({ apiKey: process.env.API_KEY }) as per guidelines.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const habitsSummary = habits.map(h => {
    const count = completions.filter(c => c.habitId === h.id).length;
    return `- ${h.name} (${h.frequency}): ${count} total completions`;
  }).join('\n');

  const systemInstruction = `
    You are an expert Habit Coach inspired by "Atomic Habits" by James Clear.
    The user is tracking their habits in an app. 
    Current user habits:
    ${habitsSummary}

    Provide concise, actionable, and encouraging advice. 
    Focus on small wins, environment design, and habit stacking.
    Keep responses brief and formatted in Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    // response.text is a property, used correctly.
    return response.text || "I'm sorry, I couldn't generate advice right now.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The AI Coach is taking a break. Please try again later.";
  }
};
