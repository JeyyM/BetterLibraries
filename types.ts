
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
  correctAnswer?: number; // Optional for short-answer and essay types
  type: 'multiple-choice' | 'short-answer' | 'essay';
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'recall' | 'inference' | 'analysis';
  points?: number; // Point value for this specific question
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
  title: string;
  status: 'published' | 'closed' | 'archived' | 'in-progress' | 'not-started';
  deadline: string;
  createdAt: string;
  assignedStudentIds: string[];
  instructions?: string;
  submissions?: Submission[];
  hasDiscussion?: boolean;
  discussionMaxScore?: number;
}

export interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  answers: { questionId: string; studentAnswer: string; score?: number; feedback?: string }[];
  totalScore?: number;
  isReviewed: boolean;
  isLate?: boolean;
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
}
