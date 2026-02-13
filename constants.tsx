
import { Book, User, Assignment, Badge, QuizAttempt } from './types';

export const MOCK_BADGES: Badge[] = [
  { id: 'b1', name: '7-Day Streak', description: 'Read every day for a week!', icon: 'Flame', color: 'text-orange-500', dateEarned: '2024-05-01' },
  { id: 'b2', name: 'Quiz Master', description: 'Scored 100% on 5 quizzes', icon: 'Award', color: 'text-indigo-500', dateEarned: '2024-05-10' },
  { id: 'b3', name: 'Genre Explorer', description: 'Read 3 different genres', icon: 'Compass', color: 'text-emerald-500', progress: 66 },
  { id: 'b4', name: 'Word Smith', description: 'Looked up 20 new words', icon: 'BookMarked', color: 'text-amber-500', progress: 45 },
];

export const MOCK_BOOKS: Book[] = [
  {
    id: '1',
    title: 'The Great Adventures of Sparky',
    author: 'Eleanor Vance',
    coverImage: 'https://picsum.photos/seed/sparky/400/600',
    description: 'A heartwarming story about a robot dog learning about friendship.',
    fullDescription: 'Sparky isn\'t your average dog. Made of silicon and steel, he navigates a world designed for flesh and fur. When he meets a young girl named Maya, his programming begins to evolve in ways his creators never expected.',
    level: 450,
    genre: 'Science Fiction',
    pages: 120,
    estimatedTime: '2 hours',
    content: 'Sparky wagged his metallic tail. The gears whirred softly, a sound Maya had grown to love. "Do you like the park, Sparky?" she asked. Sparky processed the question, his blue optical sensors blinking. "The park has 42 trees and 12 dogs," he replied. "But I like being near you most of all."'
  },
  {
    id: '2',
    title: 'Echoes in the Valley',
    author: 'Julian Thorne',
    coverImage: 'https://picsum.photos/seed/valley/400/600',
    description: 'A mystery set in the quiet mountains of the Appalachians.',
    fullDescription: 'When Sarah moves to a small town in the valley, she notices the echoes don\'t always match the voices that make them. With her new friend Leo, she investigates a century-old secret hidden in the local mines.',
    level: 780,
    genre: 'Mystery',
    pages: 245,
    estimatedTime: '5 hours',
    content: 'The valley was silent, except for the wind. Sarah shouted "Hello!" into the darkness. The echo came back a few seconds later: "Help." Her heart skipped a beat. That wasn\'t her voice. That wasn\'t even her word.'
  },
  {
    id: '3',
    title: 'Physics for Young Explorers',
    author: 'Dr. Aris Thorne',
    coverImage: 'https://picsum.photos/seed/physics/400/600',
    description: 'Understanding the fundamental forces of the universe.',
    fullDescription: 'Why do things fall down? Why is the sky blue? Dr. Thorne breaks down complex concepts like gravity, light, and electromagnetism into simple, engaging experiments for curious minds.',
    level: 600,
    genre: 'Educational',
    pages: 80,
    estimatedTime: '1.5 hours',
    content: 'Gravity is the invisible force that pulls objects toward each other. Earth\'s gravity is what keeps you on the ground and what makes objects fall. The more mass an object has, the stronger its gravitational pull.'
  }
];

export const MOCK_HISTORY: QuizAttempt[] = [
  {
    id: 'h1',
    studentId: 'u1',
    quizId: 'q-sparky',
    score: 85,
    date: '2024-05-12',
    aiFeedback: {
      summary: "Excellent understanding of Sparky's character arc and the theme of empathy.",
      strengths: ["Character analysis", "Identifying key plot points"],
      weaknesses: ["Technical vocabulary recall"],
      suggestions: ["Try focusing on the secondary characters in your next reading."]
    }
  },
  {
    id: 'h2',
    studentId: 'u1',
    quizId: 'q-physics',
    score: 92,
    date: '2024-05-08',
    aiFeedback: {
      summary: "You have a strong grasp of the fundamental forces, especially gravity.",
      strengths: ["Scientific reasoning", "Practical application"],
      weaknesses: ["Terminology specific to electromagnetism"],
      suggestions: ["Re-read the chapter on magnets to solidify those concepts."]
    }
  }
];

export const CURRENT_USER: User = {
  id: 'u1',
  name: 'Alex Johnson',
  email: 'alex@school.edu',
  role: 'student',
  currentLevel: 550,
  school: 'Greenwood Middle School',
  interests: ['Science Fiction', 'Adventure', 'Nature'],
  badges: MOCK_BADGES,
  rank: 4,
  stats: {
    booksRead: 12,
    quizzesCompleted: 10,
    averageScore: 88,
    levelGrowth: 45,
    streakDays: 5
  }
};

export const MOCK_ASSIGNMENTS: Assignment[] = [
  { id: 'a1', bookId: '1', assignedStudentIds: ['u1'], title: 'Chapter 1: Sparky\'s Origin', status: 'in-progress', deadline: '2024-05-20', createdAt: '2024-05-01' },
  { id: 'a2', bookId: '3', assignedStudentIds: ['u1'], title: 'Forces of Nature: Gravity', status: 'not-started', deadline: '2024-05-25', createdAt: '2024-05-01' }
];
