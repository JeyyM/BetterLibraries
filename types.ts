
export type UserRole = 'student' | 'teacher' | 'admin';

export interface Badge {
  id: string;
  name: string;
  description: string;
  instructions?: string; // Specific steps to earn the badge
  icon: string; // Icon name from lucide
  color: string; // Tailwind color class
  dateEarned?: string;
  progress?: number; // 0-100
  createdBy?: 'system' | 'teacher';
}

export interface DiscussionPost {
  id: string;
  bookId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  content: string;
  timestamp: string;
  score?: number; // Teacher-assigned score
  maxScore?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  currentLevel: number; // Lexile equivalent
  school?: string;
  classId?: string;
  interests?: string[];
  badges: Badge[];
  rank?: number;
  stats?: {
    booksRead: number;
    quizzesCompleted: number;
    averageScore: number;
    levelGrowth: number;
    streakDays: number;
  };
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  description: string;
  fullDescription: string;
  level: number;
  genre: string;
  pages: number;
  estimatedTime: string;
  content: string; // Sample text for quiz generation
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer?: number; // Optional for short-answer, essay, and miro types
  type: 'multiple-choice' | 'short-answer' | 'essay' | 'miro';
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'recall' | 'inference' | 'analysis';
  points?: number; // Point value for this specific question
  miroTitle?: string; // Title for Miro board (e.g., "Compare and Contrast")
  miroDescription?: string; // Instructions for the Miro task
}

export interface Quiz {
  id: string;
  bookId: string;
  questions: QuizQuestion[];
  status: 'draft' | 'approved' | 'published';
}

export interface Assignment {
  id: string;
  bookId: string;
  classId?: string; // Class/section this assignment is for
  title: string;
  status: 'published' | 'closed' | 'archived' | 'in-progress' | 'not-started';
  deadline: string;
  createdAt: string;
  assignedStudentIds: string[];
  instructions?: string;
  questions?: QuizQuestion[]; // Add questions to assignments
  submissions?: Submission[];
  hasDiscussion?: boolean;
  discussionMaxScore?: number;
  enableAutoAIGrading?: boolean; // Auto-grade submissions with AI
  totalPoints?: number; // Total points for the assignment
}

export interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  submittedAt: string;
  answers: { 
    questionId: string; 
    studentAnswer: string; 
    studentSelectedIndex?: number | null;
    score?: number; 
    feedback?: string;
    id?: string;
    miro_board_id?: string; // For Miro question type
  }[];
  totalScore?: number;
  score?: number;
  isReviewed: boolean;
  isLate?: boolean;
  teacherComments?: string;
  gradingStatus?: 'ai-graded' | 'teacher-graded' | 'not-graded' | 'manual-review'; // Miro needs manual review
}

export interface QuizAttempt {
  id: string;
  studentId: string;
  quizId: string;
  score: number;
  date: string;
  aiFeedback: {
    summary: string;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  };
  questions?: QuizQuestion[]; // The quiz questions
  studentAnswers?: (number | string)[]; // Student's answers (index for MC, text for short/essay)
  lexileChange?: {
    oldLexile: number;
    newLexile: number;
    change: number;
    reason: string;
  };
}

export interface ReadingProgress {
  id: string;
  user_email: string;
  book_id: string;
  current_page: number;
  total_pages: number;
  last_read_at: string;
  created_at: string;
  updated_at: string;
}
