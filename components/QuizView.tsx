
import React from 'react';
import { Book, QuizQuestion, QuizAttempt } from '../types';
import { Brain, ArrowRight, Loader2, CheckCircle2, XCircle, Sparkles } from 'lucide-react';

interface QuizViewProps {
  book: Book;
  onComplete: (attempt: QuizAttempt) => void;
  onBack: () => void;
}

const QuizView: React.FC<QuizViewProps> = ({ book, onComplete, onBack }) => {
  // Mock quiz questions for demo
  const mockQuestions: QuizQuestion[] = [
    {
      id: '1',
      text: `What is the main theme of "${book.title}"?`,
      type: 'multiple-choice',
      difficulty: 'medium',
      category: 'analysis',
      options: [
        'Friendship and loyalty',
        'Overcoming challenges',
        'The power of imagination',
        'Good versus evil'
      ],
      correctAnswer: 1,
      points: 10
    },
    {
      id: '2',
      text: `Who is the main character in ${book.title}?`,
      type: 'multiple-choice',
      difficulty: 'easy',
      category: 'recall',
      options: [
        'The protagonist',
        'The narrator',
        'A young hero',
        'An unlikely champion'
      ],
      correctAnswer: 0,
      points: 5
    },
    {
      id: '3',
      text: 'What setting does most of the story take place in?',
      type: 'multiple-choice',
      difficulty: 'easy',
      category: 'recall',
      options: [
        'A bustling city',
        'A quiet village',
        'A magical forest',
        'A mysterious castle'
      ],
      correctAnswer: 2,
      points: 5
    },
    {
      id: '4',
      text: 'What is the central conflict in the story?',
      type: 'multiple-choice',
      difficulty: 'medium',
      category: 'inference',
      options: [
        'Character vs. nature',
        'Character vs. self',
        'Character vs. society',
        'Character vs. fate'
      ],
      correctAnswer: 1,
      points: 10
    },
    {
      id: '5',
      text: 'Which literary device is used most prominently?',
      type: 'multiple-choice',
      difficulty: 'hard',
      category: 'analysis',
      options: [
        'Metaphor',
        'Foreshadowing',
        'Symbolism',
        'Irony'
      ],
      correctAnswer: 2,
      points: 15
    }
  ];

  const [questions, setQuestions] = React.useState<QuizQuestion[]>(mockQuestions);
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<number[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const handleSelect = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) correctCount++;
    });

    const score = Math.round((correctCount / questions.length) * 100);
    
    // Mock AI feedback based on score
    let feedback = {
      summary: '',
      strengths: [] as string[],
      weaknesses: [] as string[],
      suggestions: [] as string[]
    };
    
    if (score >= 90) {
      feedback = {
        summary: `Excellent work! You scored ${score}% on ${book.title}. You demonstrate exceptional comprehension and analytical skills.`,
        strengths: [
          'Strong understanding of main themes',
          'Excellent recall of story details',
          'Good grasp of literary analysis concepts'
        ],
        weaknesses: [],
        suggestions: [
          'Continue challenging yourself with books at higher Lexile levels',
          'Try writing your own analysis essays to deepen your skills'
        ]
      };
    } else if (score >= 70) {
      feedback = {
        summary: `Good job! You scored ${score}% on ${book.title}. You show solid reading comprehension with room for growth.`,
        strengths: [
          'Good understanding of plot and characters',
          'Solid recall of key events'
        ],
        weaknesses: [
          'Could improve on deeper thematic analysis',
          'Some difficulty with literary devices'
        ],
        suggestions: [
          'Re-read sections about symbolism and themes',
          'Practice identifying literary devices while reading',
          'Discuss the book with classmates to gain new perspectives'
        ]
      };
    } else if (score >= 50) {
      feedback = {
        summary: `You scored ${score}% on ${book.title}. You grasp the basics but need to work on deeper comprehension.`,
        strengths: [
          'Basic understanding of plot structure',
          'Identified main characters correctly'
        ],
        weaknesses: [
          'Difficulty with inference questions',
          'Struggled with thematic analysis',
          'Need to focus more on details while reading'
        ],
        suggestions: [
          'Try reading the book again more slowly',
          'Take notes while reading to track important details',
          'Ask your teacher for additional support materials',
          'Practice with books at a slightly lower Lexile level'
        ]
      };
    } else {
      feedback = {
        summary: `You scored ${score}% on ${book.title}. This book may be challenging for your current level.`,
        strengths: [
          'You completed the quiz - great effort!'
        ],
        weaknesses: [
          'This book may be above your current reading level',
          'Need more practice with comprehension strategies',
          'Difficulty with both recall and analysis questions'
        ],
        suggestions: [
          'Try books at a lower Lexile level to build confidence',
          'Read in shorter sessions and take notes',
          'Ask for help from your teacher or reading specialist',
          'Practice with guided reading exercises',
          'Don\'t give up - every reader improves with practice!'
        ]
      };
    }

    const attempt: QuizAttempt = {
      id: Math.random().toString(36).substr(2, 9),
      studentId: 'u1',
      quizId: 'q1',
      score,
      date: new Date().toISOString(),
      aiFeedback: feedback
    };

    setTimeout(() => {
      onComplete(attempt);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-400/20 blur-xl rounded-full animate-pulse"></div>
          <Brain className="text-indigo-600 animate-bounce relative" size={64} />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">Generating Your Quiz...</h2>
          <p className="text-slate-500 mt-2">Gemini is analyzing the book to create custom questions.</p>
        </div>
        <div className="flex gap-1.5 mt-4">
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 animate-in fade-in duration-500">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
                <Brain size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question {currentQuestionIndex + 1} of {questions.length}</p>
                <h2 className="text-sm font-bold text-slate-900">{book.title}</h2>
              </div>
            </div>
            <div className="bg-indigo-50 px-3 py-1.5 rounded-xl text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
              {currentQuestion.difficulty}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {/* Question Area */}
        <div className="p-8 sm:p-12 space-y-8">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
            {currentQuestion.text}
          </h3>

          <div className="grid gap-3">
            {currentQuestion.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                className={`
                  w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center justify-between group
                  ${answers[currentQuestionIndex] === idx 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                    : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50 text-slate-600'}
                `}
              >
                <span className="font-semibold">{option}</span>
                <div className={`
                  w-6 h-6 rounded-full border-2 flex items-center justify-center
                  ${answers[currentQuestionIndex] === idx ? 'border-indigo-600 bg-indigo-600' : 'border-slate-200'}
                `}>
                  {answers[currentQuestionIndex] === idx && <CheckCircle2 size={16} className="text-white" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <button 
            disabled={currentQuestionIndex === 0}
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            className="text-slate-400 font-bold text-sm hover:text-slate-900 disabled:opacity-0 transition-all"
          >
            Previous
          </button>
          
          <button
            disabled={answers[currentQuestionIndex] === undefined || submitting}
            onClick={handleNext}
            className={`
              flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all
              disabled:bg-slate-300 disabled:shadow-none
            `}
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Submitting...
              </>
            ) : (
              <>
                {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizView;
