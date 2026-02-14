
import React from 'react';
import { Book, QuizAttempt, Assignment } from '../types';
import { PartyPopper, ArrowLeft, BarChart3, Star, Zap, Info, ThumbsUp, CheckCircle2, AlertCircle, Sparkles, ExternalLink } from 'lucide-react';
import { supabase } from '../src/lib/supabase';
import { openBoardInNewTab } from '../services/miroService';

interface ResultsViewProps {
  book: Book;
  attempt: QuizAttempt;
  assignment?: Assignment | null;
  onClose: () => void;
}

interface GradedAnswer {
  id: string;
  teacher_score: number | null;
  teacher_feedback: string | null;
  points_earned: number | null;
  miro_board_id: string | null;
}

const ResultsView: React.FC<ResultsViewProps> = ({ book, attempt, assignment, onClose }) => {
  const [gradedAnswers, setGradedAnswers] = React.useState<GradedAnswer[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Fetch graded answers from database
  React.useEffect(() => {
    const fetchGradedAnswers = async () => {
      try {
        const { data, error } = await supabase
          .from('quiz_answers')
          .select('id, teacher_score, teacher_feedback, points_earned, miro_board_id')
          .eq('attempt_id', attempt.id)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching graded answers:', error);
        } else {
          setGradedAnswers(data || []);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGradedAnswers();
  }, [attempt.id]);
  // Calculate how many questions need grading
  const questionsNeedingGrading = attempt.questions?.filter(
    q => q.type === 'short-answer' || q.type === 'essay'
  ).length || 0;
  
  const hasQuestionsToGrade = questionsNeedingGrading > 0;
  const hasAutoAIGrading = assignment?.enableAutoAIGrading || false;

  // Calculate actual total score including AI-graded answers
  const calculateTotalScore = () => {
    if (!attempt.questions || loading) return attempt.score;

    let totalPoints = 0;
    let earnedPoints = 0;

    attempt.questions.forEach((q, idx) => {
      totalPoints += q.points || 0;

      if (q.type === 'multiple-choice') {
        // Multiple choice - check if correct
        const studentAnswer = attempt.studentAnswers?.[idx];
        if (studentAnswer === q.correctAnswer) {
          earnedPoints += q.points || 0;
        }
      } else {
        // Essay/Short answer - use graded score if available
        const gradedAnswer = gradedAnswers[idx];
        if (gradedAnswer && (gradedAnswer.teacher_score !== null || gradedAnswer.points_earned !== null)) {
          earnedPoints += gradedAnswer.teacher_score ?? gradedAnswer.points_earned ?? 0;
        }
      }
    });

    return totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  };

  const actualScore = calculateTotalScore();
  const hasAllGrades = gradedAnswers.length > 0 && gradedAnswers.every((ga, idx) => {
    const question = attempt.questions?.[idx];
    return question?.type === 'multiple-choice' || ga.teacher_score !== null || ga.points_earned !== null;
  });
  
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-in slide-in-from-bottom-8 duration-700">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onClose} className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow">
          <ArrowLeft size={24} className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900">Quiz Results</h1>
          <p className="text-slate-500 font-medium">Way to go! Here's how you performed.</p>
        </div>
      </div>

      {/* Pending Grading Notice */}
      {hasQuestionsToGrade && !hasAutoAIGrading && (
        <div className="mb-8 bg-amber-50 border-2 border-amber-200 p-6 rounded-[2rem] flex items-start gap-4">
          <Info size={24} className="text-amber-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-amber-900 text-lg mb-1">Grading in Progress</h3>
            <p className="text-amber-800 text-sm">
              You have <span className="font-bold">{questionsNeedingGrading} {questionsNeedingGrading === 1 ? 'question' : 'questions'}</span> that {questionsNeedingGrading === 1 ? 'requires' : 'require'} teacher review. 
              Your final score will be updated once your teacher grades your written responses.
            </p>
          </div>
        </div>
      )}

      {/* AI Grading Notice */}
      {hasQuestionsToGrade && hasAutoAIGrading && (
        <div className="mb-8 bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 p-6 rounded-[2rem] flex items-start gap-4">
          <Sparkles size={24} className="text-purple-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-purple-900 text-lg mb-1">AI Instant Grading ✨</h3>
            <p className="text-purple-800 text-sm">
              Your <span className="font-bold">{questionsNeedingGrading} written {questionsNeedingGrading === 1 ? 'response has' : 'responses have'}</span> been automatically graded by AI! 
              Your teacher may review and adjust scores if needed.
            </p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {/* Score Card */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 text-center flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <PartyPopper className="text-amber-400 rotate-12" size={32} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            {hasAutoAIGrading && hasAllGrades ? 'Auto-Graded Score' : hasQuestionsToGrade && !hasAllGrades ? 'Preliminary Score' : 'Overall Score'}
          </p>
          <div className="relative">
            <svg className="w-40 h-40 transform -rotate-90">
              <circle cx="80" cy="80" r="70" className="stroke-slate-100" strokeWidth="12" fill="none" />
              <circle 
                cx="80" cy="80" r="70" 
                className="stroke-indigo-500 transition-all duration-1000" 
                strokeWidth="12" 
                strokeDasharray={440} 
                strokeDashoffset={440 - (440 * actualScore) / 100} 
                strokeLinecap="round" 
                fill="none" 
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-4xl font-black text-slate-900">{actualScore}%</span>
              {hasAutoAIGrading && hasAllGrades && (
                <span className="text-[8px] font-bold text-purple-600 uppercase tracking-wide mt-1">Auto-Graded</span>
              )}
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {hasQuestionsToGrade ? 'Auto-Graded' : 'Mastery'}
              </span>
            </div>
          </div>
          <div className={`mt-8 px-6 py-2 rounded-2xl text-sm font-bold ${
            hasQuestionsToGrade 
              ? 'bg-amber-50 text-amber-700' 
              : 'bg-indigo-50 text-indigo-700'
          }`}>
            {hasQuestionsToGrade 
              ? 'Pending Teacher Review' 
              : (attempt.score >= 80 ? 'Mastery Achieved' : attempt.score >= 60 ? 'Good Progress' : 'Needs Review')
            }
          </div>
        </div>

        {/* AI Insight Card */}
        <div className="md:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
          <div className="flex items-center gap-3 text-indigo-600">
            <Zap size={24} className="fill-indigo-100" />
            <h3 className="text-xl font-black uppercase tracking-tight">AI Reading Insights</h3>
          </div>
          
          <div className="space-y-6">
            {hasQuestionsToGrade && (
              <div className="bg-indigo-50 border-2 border-indigo-200 p-4 rounded-2xl">
                <p className="text-indigo-900 text-sm font-semibold">
                  📝 Note: This analysis is based on your multiple-choice responses. 
                  Your written answers are being reviewed by your teacher for a complete assessment.
                </p>
              </div>
            )}
            
            <div className="bg-slate-50 p-6 rounded-[2rem]">
              <p className="text-slate-700 leading-relaxed font-medium italic">
                "{attempt.aiFeedback.summary}"
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 text-emerald-600 font-bold text-sm uppercase tracking-wider">
                  <ThumbsUp size={16} />
                  Strengths
                </h4>
                <ul className="space-y-2">
                  {attempt.aiFeedback.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></div>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 text-indigo-600 font-bold text-sm uppercase tracking-wider">
                  <Star size={16} />
                  Growth Tips
                </h4>
                <ul className="space-y-2">
                  {attempt.aiFeedback.suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0"></div>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Review Section - Show questions and student answers */}
      {attempt.questions && attempt.studentAnswers && (
        <div className="mt-8 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50">
          <div className="flex items-center gap-3 text-slate-900 mb-6">
            <BarChart3 size={24} className="text-indigo-600" />
            <h3 className="text-xl font-black uppercase tracking-tight">Your Answers</h3>
          </div>

          <div className="space-y-6">
            {attempt.questions.map((question, idx) => {
              const studentAnswer = attempt.studentAnswers![idx];
              const isMultipleChoice = question.type === 'multiple-choice';
              const isCorrect = isMultipleChoice && studentAnswer === question.correctAnswer;
              const needsGrading = !isMultipleChoice;
              const gradedAnswer = gradedAnswers[idx];
              const hasScore = gradedAnswer && (gradedAnswer.teacher_score !== null || gradedAnswer.points_earned !== null);
              const earnedPoints = gradedAnswer?.teacher_score ?? gradedAnswer?.points_earned ?? 0;
              
              return (
                <div key={question.id} className={`p-6 rounded-[2rem] space-y-4 ${
                  needsGrading ? 'bg-amber-50 border-2 border-amber-200' : 'bg-slate-50'
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg text-xs font-bold">
                          Question {idx + 1}
                        </span>
                        {question.points && (
                          <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-xs font-bold">
                            {question.points} pts
                          </span>
                        )}
                        {needsGrading && hasScore && (
                          <span className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs font-bold">
                            {earnedPoints} / {question.points} pts
                          </span>
                        )}
                        <span className="bg-slate-200 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold capitalize">
                          {question.type}
                        </span>
                        {needsGrading && !hasScore && (
                          <span className={`${hasAutoAIGrading ? 'bg-purple-600' : 'bg-amber-600'} text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1`}>
                            {hasAutoAIGrading ? <Sparkles size={12} /> : <Info size={12} />}
                            {hasAutoAIGrading ? 'AI Graded' : 'Pending Grading'}
                          </span>
                        )}
                        {needsGrading && hasScore && (
                          <span className="bg-purple-600 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                            <Sparkles size={12} />
                            {hasAutoAIGrading ? 'AI Graded' : 'Graded'}
                          </span>
                        )}
                      </div>
                      <h4 className="text-slate-900 font-bold text-lg">{question.text}</h4>
                    </div>
                    {isMultipleChoice && (
                      <div className={`flex-shrink-0 ${isCorrect ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {isCorrect ? (
                          <CheckCircle2 size={28} className="fill-emerald-50" />
                        ) : (
                          <AlertCircle size={28} className="fill-slate-50" />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    <p className="text-sm font-semibold text-slate-600 mb-2">Your Answer:</p>
                    {question.type === 'miro' ? (
                      // Miro Board Display
                      gradedAnswer?.miro_board_id ? (
                        <div className="space-y-3">
                          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-2xl text-white">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <Sparkles size={20} />
                                <h3 className="font-black text-sm uppercase tracking-widest">Student's Miro Board</h3>
                              </div>
                              <button
                                onClick={() => openBoardInNewTab(gradedAnswer.miro_board_id!)}
                                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl font-bold text-xs transition-all"
                              >
                                <ExternalLink size={16} />
                                Open in New Tab
                              </button>
                            </div>
                            <iframe
                              src={`https://miro.com/app/live-embed/${gradedAnswer.miro_board_id}/?moveToWidget=auto`}
                              className="w-full h-[500px] border-2 border-white/20 rounded-b-2xl bg-white"
                              title="Student Miro Board"
                              allow="clipboard-read; clipboard-write"
                              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                              allowFullScreen
                            />
                          </div>
                          <p className="text-xs text-slate-500 italic">
                            📋 Task: {question.miroTitle || 'Digital Task'}
                          </p>
                          {question.miroDescription && (
                            <p className="text-xs text-slate-500">
                              {question.miroDescription}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="bg-amber-50 p-4 rounded-xl border-2 border-amber-200">
                          <p className="text-amber-900 font-medium">⚠️ Student has not created a Miro board yet</p>
                        </div>
                      )
                    ) : isMultipleChoice ? (
                      <div className="bg-white p-4 rounded-xl border-2 border-slate-200">
                        <p className="text-slate-900 font-medium">
                          {typeof studentAnswer === 'number' && studentAnswer >= 0
                            ? question.options[studentAnswer]
                            : 'No answer provided'}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-white p-4 rounded-xl border-2 border-slate-200">
                        <p className="text-slate-900 font-medium whitespace-pre-wrap">
                          {studentAnswer || 'No answer provided'}
                        </p>
                      </div>
                    )}
                    
                    {/* Show feedback if available */}
                    {gradedAnswer?.teacher_feedback && (
                      <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-xl">
                        <p className="text-xs font-bold text-purple-700 mb-1">Feedback:</p>
                        <p className="text-sm text-purple-900">{gradedAnswer.teacher_feedback}</p>
                      </div>
                    )}
                    
                    {question.type !== 'multiple-choice' && !hasScore && (
                      <p className="text-xs text-slate-500 mt-2 italic">
                        {hasAutoAIGrading 
                          ? '✨ AI-graded automatically. Your teacher may adjust the score.'
                          : 'Your teacher will review and grade this answer.'}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommended Next Step */}
      <div className="mt-8 bg-slate-900 text-white p-8 sm:p-12 rounded-[3.5rem] relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full -mr-20 -mt-20 blur-3xl transition-all group-hover:bg-indigo-600/30"></div>
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="text-center sm:text-left">
            <h3 className="text-2xl font-black mb-2">Ready for the next challenge?</h3>
            {attempt.lexileChange ? (
              <p className="text-slate-400 font-medium">
                Your level {attempt.lexileChange.change >= 0 ? 'increased' : 'changed'} to{' '}
                <span className={`font-black ${attempt.lexileChange.change >= 0 ? 'text-indigo-400' : 'text-orange-400'}`}>
                  {attempt.lexileChange.newLexile}L
                </span>
                {' '}({attempt.lexileChange.change >= 0 ? '+' : ''}{attempt.lexileChange.change}L) after this reading!
              </p>
            ) : (
              <p className="text-slate-400 font-medium">Keep reading to improve your level!</p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-[1.5rem] font-black shadow-2xl shadow-indigo-500/20 transition-all flex items-center gap-3"
          >
            Find Next Book
            <ArrowLeft size={20} className="rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsView;
