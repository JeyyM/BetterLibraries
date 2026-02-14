import { Book, QuizQuestion, QuizAttempt } from "../types";
import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const callGemini = async (prompt: string) => {
  const result = await genAI.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: prompt
  });
  return result.text || "";
};

export const generateQuizForBook = async (book: { title: string, author?: string, content: string, level?: number }): Promise<QuizQuestion[]> => {
  console.log('📚 Starting quiz generation for:', book.title);
  console.log('📝 Content length:', book.content.length, 'characters');
  console.log('📖 Content preview:', book.content.substring(0, 200));
  
  const prompt = `Generate 8 educational quiz questions for "${book.title}"${book.author ? ` by ${book.author}` : ''}.

Content: ${book.content.substring(0, 10000)}

Create a mix of:
- 4-5 Multiple choice questions with 4 options each
- 2 Short answer questions  
- 1-2 Essay questions

Return ONLY a valid JSON array (no markdown, no extra text):
[
  {
    "text": "question text here",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": 0,
    "type": "multiple-choice",
    "difficulty": "easy",
    "category": "recall",
    "points": 5
  }
]

For short-answer and essay, use empty options array and omit correctAnswer.`;

  try {
    console.log('🤖 Calling Gemini API...');
    const text = await callGemini(prompt);
    console.log('✅ Gemini response received:', text);
    
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('❌ No JSON found in response:', text);
      return [];
    }
    
    console.log('📋 JSON extracted:', jsonMatch[0]);
    const questions = JSON.parse(jsonMatch[0]);
    console.log('🎯 Parsed questions:', questions);
    
    const finalQuestions = questions.map((q: any, idx: number) => ({
      ...q,
      id: `q-${Date.now()}-${idx}`
    }));
    
    console.log('✨ Final questions with IDs:', finalQuestions);
    console.log('📊 Total questions generated:', finalQuestions.length);
    
    return finalQuestions;
  } catch (e) {
    console.error("❌ Failed to generate quiz", e);
    return [];
  }
};

export const evaluateAnswer = async (question: string, studentAnswer: string, context: string): Promise<{ score: number, feedback: string }> => {
  try {
    const prompt = `Evaluate: "${question}". Answer: "${studentAnswer}". Return JSON: {"score": 85, "feedback": "explanation"}`;
    const text = await callGemini(prompt);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { score: 0, feedback: "Error" };
  } catch (e) {
    return { score: 0, feedback: "Error evaluating." };
  }
};

export const refineQuestion = async (question: QuizQuestion, instruction: string, context: string): Promise<QuizQuestion> => {
  try {
    const prompt = `You are refining a quiz question based on the teacher's instruction.

CURRENT QUESTION:
Text: "${question.text}"
Type: ${question.type}
Difficulty: ${question.difficulty}
Category: ${question.category}
Points: ${question.points}
${question.type === 'multiple-choice' ? `Options: ${JSON.stringify(question.options)}
Correct Answer Index: ${question.correctAnswer}` : ''}

BOOK CONTEXT:
${context.substring(0, 3000)}

TEACHER'S INSTRUCTION:
"${instruction}"

Refine the question based on the instruction. You can:
- Change the question text to be clearer, harder, easier, or more specific
- Adjust difficulty level (easy/medium/hard)
- Change category (recall/analysis/inference)
- Modify points value
- Change question type (multiple-choice/short-answer/essay/miro)
- For multiple-choice: improve options or change correct answer
- Make the question more engaging and educational

Return ONLY a valid JSON object (no markdown, no extra text):
{
  "text": "refined question text",
  "type": "${question.type}",
  "difficulty": "easy",
  "category": "recall",
  "points": 10,
  "options": ["A", "B", "C", "D"],
  "correctAnswer": 0
}

For short-answer, essay, or miro types, use empty options array and omit correctAnswer.`;

    console.log('🤖 Refining question with Gemini...');
    const text = await callGemini(prompt);
    console.log('✅ Refinement response received:', text);

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in refinement response:', text);
      return question;
    }

    const refined = JSON.parse(jsonMatch[0]);
    console.log('✨ Question refined:', refined);

    // Preserve the ID and merge with refined data
    return {
      ...question,
      ...refined,
      id: question.id // Keep original ID
    };
  } catch (e) {
    console.error('Failed to refine question:', e);
    return question; // Return original on error
  }
};

export const getAIFeedback = async (book: Book, score: number, answers: any[]): Promise<QuizAttempt['aiFeedback']> => {
  return {
    summary: "Great effort!",
    strengths: ["Completed the quiz"],
    weaknesses: ["Some areas need improvement"],
    suggestions: ["Review the material"]
  };
};

export const getWordExplanation = async (word: string, context: string, level: number): Promise<string> => {
  try {
    const prompt = `Explain "${word}" simply for reading level ${level}L. Keep it under 50 words.`;
    return await callGemini(prompt);
  } catch (e) {
    return "Definition unavailable.";
  }
};

export const extractBookMetadata = async (pdfText: string, currentTitle?: string): Promise<{
  title: string;
  author: string;
  description: string;
  genre: string;
  lexileLevel: number;
  estimatedPages: number;
}> => {
  const prompt = `Analyze this book excerpt and extract metadata. Return ONLY valid JSON (no markdown, no extra text):

${pdfText.substring(0, 5000)}

Return this exact format:
{
  "title": "detected title or ${currentTitle || 'Unknown'}",
  "author": "author name",
  "description": "2-3 sentence summary",
  "genre": "one of: Fiction, Non-Fiction, Science Fiction, Fantasy, Mystery, Historical, Biography, Adventure",
  "lexileLevel": 800,
  "estimatedPages": 200
}`;

  try {
    if (!GEMINI_API_KEY) {
      throw new Error('VITE_GEMINI_API_KEY is not set');
    }

    console.log('🔑 Calling Gemini API for metadata extraction...');
    
    const text = await callGemini(prompt);
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', text);
      throw new Error('Invalid API response format');
    }
    
    const metadata = JSON.parse(jsonMatch[0]);
    console.log('✨ AI extracted metadata:', metadata);
    return metadata;
  } catch (e) {
    console.error("Failed to extract metadata with AI:", e);
    // Fallback to safe defaults
    return {
      title: currentTitle || "Untitled",
      author: "Unknown Author",
      description: "No description available",
      genre: "Fiction",
      lexileLevel: 600,
      estimatedPages: 100
    };
  }
};

/**
 * Grade multiple essay/short-answer questions in batch with book context
 * This loads the book context once and grades all questions together to save tokens
 */
export const batchGradeAnswers = async (
  bookTitle: string,
  bookContent: string,
  questionsAndAnswers: Array<{
    questionText: string;
    studentAnswer: string;
    maxPoints: number;
    questionType: 'short-answer' | 'essay';
  }>
): Promise<Array<{
  score: number;
  feedback: string;
  maxPoints: number;
}>> => {
  console.log('📝 Batch grading', questionsAndAnswers.length, 'answers for', bookTitle);

  const prompt = `You are grading student responses for the book "${bookTitle}".

BOOK CONTEXT (use this to evaluate all answers):
${bookContent.substring(0, 8000)}

GRADING GUIDELINES:
- Be LENIENT and ENCOURAGING
- Reward good-faith efforts and partial understanding
- A student who shows ANY relevant understanding should get at least 60% of points
- Perfect answers get 100%, but good attempts should get 80-90%
- Only give very low scores (below 50%) if the answer is completely off-topic or nonsensical
- Focus on whether the student grasped the main idea, not perfect wording
- Short answers can be brief but accurate
- Essay answers should show deeper thinking but don't require perfection
- **CRITICAL**: Score must be between 0 and the maxPoints shown for each question. Do NOT exceed maxPoints!

Grade these ${questionsAndAnswers.length} student responses. Return ONLY a valid JSON array (no markdown, no extra text):

${questionsAndAnswers.map((qa, idx) => `
QUESTION ${idx + 1} (${qa.questionType}, max ${qa.maxPoints} points):
"${qa.questionText}"

STUDENT ANSWER:
"${qa.studentAnswer}"
`).join('\n---\n')}

Return this exact format:
[
  {
    "score": 8.5,
    "feedback": "Great understanding! You identified the key point about...",
    "maxPoints": 10
  }
]

Remember: Be encouraging and lenient. Reward effort and partial understanding generously.`;

  try {
    if (!GEMINI_API_KEY) {
      throw new Error('VITE_GEMINI_API_KEY is not set');
    }

    console.log('🤖 Calling Gemini for batch grading...');
    const text = await callGemini(prompt);
    console.log('✅ Grading response received');

    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('No JSON array found in response:', text);
      throw new Error('Invalid grading response format');
    }

    const grades = JSON.parse(jsonMatch[0]);
    console.log('✨ Graded', grades.length, 'answers');
    
    // Validate and ensure we have the right number of grades
    if (grades.length !== questionsAndAnswers.length) {
      console.warn('Grade count mismatch. Expected:', questionsAndAnswers.length, 'Got:', grades.length);
    }

    // Clamp scores to maxPoints and ensure consistency
    const clampedGrades = grades.map((grade: any, idx: number) => {
      const maxPoints = questionsAndAnswers[idx]?.maxPoints || 10;
      const clampedScore = Math.min(Math.max(0, grade.score || 0), maxPoints);
      
      if (grade.score > maxPoints) {
        console.warn(`⚠️ Score ${grade.score} exceeds max ${maxPoints} for question ${idx + 1}. Clamping to ${clampedScore}`);
      }
      
      return {
        score: clampedScore,
        feedback: grade.feedback || 'No feedback provided.',
        maxPoints: maxPoints
      };
    });

    return clampedGrades;
  } catch (e) {
    console.error('Failed to batch grade answers:', e);
    // Fallback: give partial credit to all answers
    return questionsAndAnswers.map(qa => ({
      score: qa.maxPoints * 0.7, // Give 70% credit as fallback
      feedback: 'Unable to auto-grade. Please review manually.',
      maxPoints: qa.maxPoints
    }));
  }
};
