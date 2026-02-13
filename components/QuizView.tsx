
import React from 'react';
import { Book, QuizQuestion, QuizAttempt } from '../types';
import { generateQuizForBook, getAIFeedback } from '../services/geminiService';
import { Brain, ArrowRight, Loader2, CheckCircle2, XCircle, Sparkles } from 'lucide-react';

interface QuizViewProps {
  book: Book;
  onComplete: (attempt: QuizAttempt) => void;
  onBack: () => void;
}

const QuizView: React.FC<QuizViewProps> = ({ book, onComplete, onBack }) => {
  const [questions, setQuestions] = React.useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<number[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    const loadQuiz = async () => {
      const q = await generateQuizForBook(book);
      setQuestions(q);
      setLoading(false);
    };
    loadQuiz();
  }, [book]);

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
    const feedback = await getAIFeedback(book, score, answers);

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
