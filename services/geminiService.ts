
import { GoogleGenAI, Type } from "@google/genai";
import { Book, QuizQuestion, QuizAttempt } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export const generateQuizForBook = async (book: { title: string, author?: string, content: string, level?: number }): Promise<QuizQuestion[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate 8 high-quality educational questions for the following text: "${book.title}".
               Content: ${book.content}. 
               Reading Level: ${book.level || 600} Lexile.
               
               Please provide a mix of:
               1. Multiple Choice (MCQ)
               2. Short Answer (1-2 sentences)
               3. Paragraph/Long Answer (Comprehension/Analysis)
               
               Assign a 'points' value to each question (e.g., 5 for easy, 10 for medium, 20 for hard/essay).
               Ensure the questions cover recall, inference, and thematic analysis.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Only for multiple-choice' },
            correctAnswer: { type: Type.INTEGER, description: 'Index of the correct option for MCQ (0-3)' },
            type: { type: Type.STRING, enum: ['multiple-choice', 'short-answer', 'essay'] },
            difficulty: { type: Type.STRING, enum: ['easy', 'medium', 'hard'] },
            category: { type: Type.STRING, enum: ['recall', 'inference', 'analysis'] },
            points: { type: Type.INTEGER }
          },
          required: ['text', 'type', 'difficulty', 'category', 'points']
        }
      }
    }
  });

  try {
    const questions = JSON.parse(response.text || '[]');
    return questions.map((q: any, idx: number) => ({
      ...q,
      id: `q-${Date.now()}-${idx}`
    }));
  } catch (e) {
    console.error("Failed to parse quiz response", e);
    return [];
  }
};

export const evaluateAnswer = async (question: string, studentAnswer: string, context: string): Promise<{ score: number, feedback: string }> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Evaluate this student's answer for the question: "${question}".
               Student's Answer: "${studentAnswer}"
               Book Content Context: "${context.substring(0, 1000)}..."
               
               Provide a score from 0 to 100 and a brief explanation of why this score was given.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          feedback: { type: Type.STRING }
        },
        required: ['score', 'feedback']
      }
    }
  });

  try {
    return JSON.parse(response.text || '{"score": 0, "feedback": "Evaluation failed."}');
  } catch (e) {
    return { score: 0, feedback: "Error evaluating." };
  }
};

export const refineQuestion = async (question: QuizQuestion, instruction: string, context: string): Promise<QuizQuestion> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Refine this educational question based on the instruction: "${instruction}".
               Original Question: ${JSON.stringify(question)}
               Context of the book: ${context.substring(0, 1000)}...`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correctAnswer: { type: Type.INTEGER },
          type: { type: Type.STRING, enum: ['multiple-choice', 'short-answer', 'essay'] },
          difficulty: { type: Type.STRING, enum: ['easy', 'medium', 'hard'] },
          category: { type: Type.STRING, enum: ['recall', 'inference', 'analysis'] },
          points: { type: Type.INTEGER }
        },
        required: ['text', 'type', 'difficulty', 'category', 'points']
      }
    }
  });

  try {
    const refined = JSON.parse(response.text || '{}');
    return { ...refined, id: question.id };
  } catch (e) {
    return question;
  }
};

export const getAIFeedback = async (book: Book, score: number, answers: any[]): Promise<QuizAttempt['aiFeedback']> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `The student just completed a quiz for "${book.title}". 
               Score: ${score}/100. 
               Analyze the performance and provide structured feedback for a student.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['summary', 'strengths', 'weaknesses', 'suggestions']
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return {
      summary: "Great effort on the quiz!",
      strengths: ["Completing the reading material"],
      weaknesses: ["Some detail retention"],
      suggestions: ["Try re-reading the complex chapters."]
    };
  }
};

export const getWordExplanation = async (word: string, context: string, level: number): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Explain the word "${word}" found in this context: "${context}". 
               The student's reading level is ${level}L Lexile. 
               Provide a simple, engaging definition and one example sentence. Keep it under 50 words.`,
  });
  return response.text || "I couldn't find a definition for that word right now.";
};
