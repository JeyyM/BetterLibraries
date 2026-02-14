
import React from 'react';
import { Book, QuizQuestion, QuizAttempt, Assignment } from '../types';
import { Brain, ArrowRight, Loader2, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { supabase } from '../src/lib/supabase';
import { batchGradeAnswers } from '../services/geminiService';

interface QuizViewProps {
  book: Book;
  assignment?: Assignment | null;
  userEmail: string;
  onComplete: (attempt: QuizAttempt) => void;
  onBack: () => void;
}

const QuizView: React.FC<QuizViewProps> = ({ book, assignment, userEmail, onComplete, onBack }) => {
  const [questions, setQuestions] = React.useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<number[]>([]); // For multiple choice
  const [textAnswers, setTextAnswers] = React.useState<string[]>([]); // For short-answer and essay
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string>('');

  // Fetch quiz from database on mount or use assignment questions
  React.useEffect(() => {
    const fetchQuiz = async () => {
      try {
        console.log('📚 Fetching quiz for book:', book.id);
        setLoading(true);
        setError('');

        // If assignment is provided and has questions, use those instead
        if (assignment && assignment.questions && assignment.questions.length > 0) {
          console.log('✅ Using assignment questions:', assignment.questions.length);
          setQuestions(assignment.questions);
          setAnswers(new Array(assignment.questions.length).fill(-1));
          setTextAnswers(new Array(assignment.questions.length).fill(''));
          setLoading(false);
          return;
        }

        // Otherwise, fetch the most recent published quiz for this book
        const { data, error: fetchError } = await supabase
          .from('quiz_items')
          .select('*')
          .eq('book_id', book.id)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (fetchError) {
          console.error('❌ Error fetching quiz:', fetchError);
          setError('No quiz found for this book. Ask your teacher to create one!');
          setLoading(false);
          return;
        }

        if (data && data.questions && Array.isArray(data.questions)) {
          console.log('✅ Quiz loaded:', data.questions.length, 'questions');
          setQuestions(data.questions);
        } else {
          setError('Quiz data is invalid. Please contact your teacher.');
        }
      } catch (err) {
        console.error('❌ Unexpected error:', err);
        setError('Failed to load quiz. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [book.id, assignment]);

  const handleSelect = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleTextAnswer = (text: string) => {
    const newTextAnswers = [...textAnswers];
    newTextAnswers[currentQuestionIndex] = text;
    setTextAnswers(newTextAnswers);
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
    
    // Combine answers from both arrays
    const combinedAnswers: (number | string)[] = questions.map((q, idx) => {
      if (q.type === 'multiple-choice') {
        return answers[idx] ?? -1;
      } else {
        return textAnswers[idx] || '';
      }
    });

    // Count questions that need teacher grading
    const needsGrading = questions.filter(q => q.type !== 'multiple-choice').length;
    const hasEssayOrShortAnswer = needsGrading > 0;

    // Only count multiple choice questions for auto-scoring
    const multipleChoiceCount = questions.filter(q => q.type === 'multiple-choice').length;
    questions.forEach((q, idx) => {
      if (q.type === 'multiple-choice' && answers[idx] === q.correctAnswer) {
        correctCount++;
      }
    });

    // Calculate score based only on multiple choice if there are essay/short answer questions
    const score = multipleChoiceCount > 0 
      ? Math.round((correctCount / multipleChoiceCount) * 100)
      : 0;
    
    // Count question types for smarter feedback
    const hasShortAnswer = questions.some(q => q.type === 'short-answer');
    const hasEssay = questions.some(q => q.type === 'essay');
    const onlyMultipleChoice = multipleChoiceCount === questions.length;
    
    // Generate context-aware feedback
    let feedback = {
      summary: '',
      strengths: [] as string[],
      weaknesses: [] as string[],
      suggestions: [] as string[]
    };

    // Build summary based on score and pending grading
    let summary = '';
    if (hasEssayOrShortAnswer) {
      if (score === 100) {
        summary = `Outstanding! You achieved a perfect score on all ${multipleChoiceCount} multiple-choice questions for ${book.title}. `;
        summary += hasEssay 
          ? `Your essay responses are under review - keep up the excellent analytical thinking!`
          : `Your written answers are being reviewed by your teacher.`;
      } else if (score >= 90) {
        summary = `Excellent work! You scored ${score}% on the multiple-choice questions for ${book.title}. `;
        summary += `Your written responses will be graded by your teacher to complete your assessment.`;
      } else if (score >= 70) {
        summary = `Good job! You scored ${score}% on the multiple-choice questions. `;
        summary += hasEssay
          ? `Your essay answers may help improve your final score - make sure you expressed your ideas clearly!`
          : `Your written responses are being reviewed and may boost your final grade.`;
      } else {
        summary = `You scored ${score}% on the multiple-choice portion. `;
        summary += `Your teacher will review your written responses - thoughtful answers there can significantly improve your final score.`;
      }
    } else {
      if (score >= 90) {
        summary = `Excellent work! You scored ${score}% on ${book.title}, demonstrating strong comprehension.`;
      } else if (score >= 70) {
        summary = `Good job! You scored ${score}% on ${book.title}, showing solid understanding.`;
      } else if (score >= 50) {
        summary = `You scored ${score}% on ${book.title}. You understand the basics but can improve.`;
      } else {
        summary = `You scored ${score}% on ${book.title}. This book may be challenging for your current level.`;
      }
    }
    feedback.summary = summary;

    // Build strengths based on score and question types
    const strengths: string[] = [];
    if (score >= 90) {
      strengths.push('Excellent comprehension of the reading material');
      if (multipleChoiceCount > 0) strengths.push(`Strong performance on factual recall questions`);
    } else if (score >= 70) {
      strengths.push('Good understanding of main plot and characters');
      if (score >= 80) strengths.push('Solid grasp of key story details');
    } else if (score >= 50) {
      strengths.push('Basic understanding of the story');
      strengths.push('Completed all questions - good effort!');
    } else {
      strengths.push('You completed the quiz - that takes courage!');
      if (hasEssayOrShortAnswer) strengths.push('Your written responses may show deeper understanding');
    }
    feedback.strengths = strengths;

    // Build suggestions based on score, question types, and what they need
    const suggestions: string[] = [];
    
    if (hasEssayOrShortAnswer && score === 100) {
      // Perfect MC score with pending essays
      suggestions.push('While you wait for grading, consider what made this book engaging for you');
      if (hasEssay) {
        suggestions.push('Review your essay responses - did you support your ideas with specific examples?');
        suggestions.push('Practice connecting themes to real-world situations for deeper analysis');
      }
      suggestions.push('Challenge yourself with books at the next Lexile level');
    } else if (score >= 90) {
      // High score - encourage advancement
      if (hasEssay) {
        suggestions.push('Continue developing your analytical writing skills');
      }
      if (hasShortAnswer && !hasEssay) {
        suggestions.push('Try answering practice questions in more detail to build essay skills');
      }
      suggestions.push('Look for books that explore similar themes at higher complexity');
    } else if (score >= 70) {
      // Good score - targeted improvement
      if (hasEssay) {
        suggestions.push('When writing essays, use specific quotes and examples from the text');
        suggestions.push('Practice organizing your thoughts before writing responses');
      } else if (hasShortAnswer) {
        suggestions.push('For short answers, focus on being concise but complete');
      }
      suggestions.push('Re-read sections where you felt less confident');
      suggestions.push('Discuss the book with classmates to gain new perspectives');
    } else if (score >= 50) {
      // Struggling - needs support
      suggestions.push('Try reading the book again at a slower pace, taking notes');
      if (hasEssay || hasShortAnswer) {
        suggestions.push('For written questions, first write down key points, then expand them');
      }
      suggestions.push('Ask your teacher for additional support materials');
      suggestions.push('Consider books at a slightly lower Lexile level to build confidence');
    } else {
      // Low score - significant support needed
      suggestions.push('This book may be above your current level - that\'s okay!');
      suggestions.push('Try shorter books or those with lower Lexile ratings first');
      suggestions.push('Take notes while reading to track important details');
      suggestions.push('Ask your teacher or reading specialist for one-on-one support');
      if (hasEssayOrShortAnswer) {
        suggestions.push('Focus on answering "who, what, when, where" before tackling "why" questions');
      }
    }
    
    feedback.suggestions = suggestions;

    try {
      // Get the current user's ID from their email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', userEmail)
        .single();

      if (userError) {
        console.error('Error fetching user:', userError);
        throw new Error('Failed to get user information');
      }

      const studentId = userData.id;

      // Create quiz attempt record
      const { data: attemptData, error: attemptError } = await supabase
        .from('quiz_attempts')
        .insert({
          quiz_id: null, // We don't have a quiz_id for assignment questions
          student_id: studentId,
          assignment_id: assignment?.id || null,
          completed_at: new Date().toISOString(),
          score: score,
          total_possible_points: questions.reduce((sum, q) => sum + (q.points || 0), 0),
          ai_feedback_summary: feedback.summary,
          status: 'completed'
        })
        .select()
        .single();

      if (attemptError) {
        console.error('Error creating quiz attempt:', attemptError);
        throw new Error('Failed to save quiz attempt');
      }

      console.log('✅ Quiz attempt saved:', attemptData.id);

      // Save individual answers
      const answerInserts = questions.map((q, idx) => {
        const selectedIndex = answers[idx];
        const answerText = textAnswers[idx];
        
        console.log(`Saving answer ${idx + 1}:`, {
          type: q.type,
          selectedIndex: selectedIndex,
          answerText: answerText,
          isCorrect: q.type === 'multiple-choice' ? selectedIndex === q.correctAnswer : null
        });
        
        return {
          attempt_id: attemptData.id,
          question_id: null, // No question_id for assignment questions stored inline
          selected_option_index: q.type === 'multiple-choice' && selectedIndex >= 0 ? selectedIndex : null,
          answer_text: q.type !== 'multiple-choice' ? answerText : null,
          is_correct: q.type === 'multiple-choice' ? selectedIndex === q.correctAnswer : null,
          points_earned: q.type === 'multiple-choice' && selectedIndex === q.correctAnswer ? (q.points || 0) : null,
        };
      });

      console.log('📤 Inserting answers:', answerInserts);

      const { error: answersError } = await supabase
        .from('quiz_answers')
        .insert(answerInserts);

      if (answersError) {
        console.error('Error saving answers:', answersError);
        // Don't throw - attempt is saved, just log the error
      } else {
        console.log('✅ Quiz answers saved');
      }

      // If this is an assignment, create/update assignment submission
      if (assignment) {
        const totalPossibleScore = questions.reduce((sum, q) => sum + (q.points || 0), 0);
        const deadline = new Date(assignment.deadline);
        const isLate = new Date() > deadline;

        const { error: submissionError } = await supabase
          .from('assignment_submissions')
          .upsert({
            assignment_id: assignment.id,
            student_id: studentId,
            quiz_attempt_id: attemptData.id,
            submitted_at: new Date().toISOString(),
            total_score: score,
            total_possible_score: totalPossibleScore,
            is_late: isLate,
            is_reviewed: false
          }, {
            onConflict: 'assignment_id,student_id'
          });

        if (submissionError) {
          console.error('Error saving assignment submission:', submissionError);
        } else {
          console.log('✅ Assignment submission saved');
          
          // Auto-grade essay/short-answer questions if enabled
          console.log('🔍 Checking auto-grading settings:', {
            hasAssignment: !!assignment,
            enableAutoAIGrading: assignment?.enableAutoAIGrading,
            assignmentData: assignment
          });
          
          if (assignment.enableAutoAIGrading) {
            console.log('🤖 Auto AI Grading enabled - grading essay/short-answer questions...');
            
            try {
              // Get the answer IDs that were just inserted
              const { data: insertedAnswers, error: fetchError } = await supabase
                .from('quiz_answers')
                .select('id, answer_text')
                .eq('attempt_id', attemptData.id)
                .order('created_at', { ascending: true });

              if (fetchError) {
                console.error('Error fetching inserted answers:', fetchError);
              } else {
                console.log('📝 Inserted answers:', insertedAnswers);
                
                // Collect essay/short-answer questions for grading
                const questionsToGrade = questions
                  .map((q, idx) => ({
                    index: idx,
                    question: q,
                    answerText: textAnswers[idx],
                    answerId: insertedAnswers[idx]?.id
                  }))
                  .filter(item => 
                    item.question.type !== 'multiple-choice' && 
                    item.answerText && 
                    item.answerText.trim() !== ''
                  );

                console.log('📊 Questions to grade:', {
                  total: questions.length,
                  essayShortAnswer: questionsToGrade.length,
                  questions: questionsToGrade
                });

                if (questionsToGrade.length > 0) {
                  console.log(`🎯 Auto-grading ${questionsToGrade.length} questions...`);

                  // Prepare batch grading request
                  const gradingRequest = questionsToGrade.map(item => ({
                    questionText: item.question.text || 'Question text missing',
                    studentAnswer: item.answerText,
                    maxPoints: item.question.points || 10,
                    questionType: item.question.type as 'short-answer' | 'essay'
                  }));

                  // Use book content for context
                  const bookContent = book.content || book.fullDescription || book.description || '';

                  // Call batch grading API
                  const gradingResults = await batchGradeAnswers(
                    book.title,
                    bookContent,
                    gradingRequest
                  );

                  console.log('✅ AI Grading complete:', gradingResults);

                  // Save grades to database
                  for (let i = 0; i < questionsToGrade.length; i++) {
                    const item = questionsToGrade[i];
                    const result = gradingResults[i];
                    
                    if (result && item.answerId) {
                      const { error: updateError } = await supabase
                        .from('quiz_answers')
                        .update({
                          teacher_score: result.score,
                          teacher_feedback: result.feedback,
                          points_earned: result.score
                        })
                        .eq('id', item.answerId);
                      
                      if (updateError) {
                        console.error('Error saving AI grade:', updateError);
                      }
                    }
                  }

                  // Calculate total score including AI-graded questions
                  const aiGradedScore = gradingResults.reduce((sum, r) => sum + r.score, 0);
                  const mcScore = questions.reduce((sum, q, idx) => {
                    if (q.type === 'multiple-choice' && answers[idx] === q.correctAnswer) {
                      return sum + (q.points || 0);
                    }
                    return sum;
                  }, 0);
                  const totalScore = mcScore + aiGradedScore;

                  // Update submission with AI-graded total score
                  await supabase
                    .from('assignment_submissions')
                    .update({
                      total_score: totalScore,
                      grading_status: 'ai-graded'
                    })
                    .eq('assignment_id', assignment.id)
                    .eq('student_id', studentId);

                  console.log(`✅ Total score updated: ${totalScore} (MC: ${mcScore} + AI: ${aiGradedScore})`);
                } else {
                  console.log('⚠️ No questions to auto-grade');
                }
              }
            } catch (aiError) {
              console.error('❌ Auto AI grading failed:', aiError);
              // Don't block submission if AI grading fails
            }
          } else {
            console.log('ℹ️ Auto AI Grading not enabled for this assignment');
          }
        }
      }

      // Create the attempt object for local display
      const attempt: QuizAttempt = {
        id: attemptData.id,
        studentId: studentId,
        quizId: attemptData.quiz_id || 'assignment',
        score,
        date: attemptData.completed_at,
        aiFeedback: feedback,
        questions: questions,
        studentAnswers: combinedAnswers
      };

      setTimeout(() => {
        onComplete(attempt);
      }, 1000);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Failed to submit quiz. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-400/20 blur-xl rounded-full animate-pulse"></div>
          <Brain className="text-indigo-600 animate-bounce relative" size={64} />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">Loading Your Quiz...</h2>
          <p className="text-slate-500 mt-2">Fetching questions from the database.</p>
        </div>
        <div className="flex gap-1.5 mt-4">
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-8 max-w-md">
          <XCircle className="text-red-600 mx-auto mb-4" size={64} />
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">Quiz Not Available</h2>
          <p className="text-slate-600 text-center mb-6">{error}</p>
          <button 
            onClick={onBack}
            className="w-full bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-3xl p-8 max-w-md">
          <Sparkles className="text-yellow-600 mx-auto mb-4" size={64} />
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">No Questions Found</h2>
          <p className="text-slate-600 text-center mb-6">This quiz doesn't have any questions yet. Please ask your teacher to create questions for this book.</p>
          <button 
            onClick={onBack}
            className="w-full bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 animate-in fade-in duration-500">
      {/* AI Grading Banner */}
      {assignment?.enableAutoAIGrading && (
        <div className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-3xl p-6 animate-in slide-in-from-top duration-500">
          <div className="flex items-start gap-4">
            <div className="bg-purple-600 p-2 rounded-xl">
              <Sparkles size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black text-slate-900 mb-2 flex items-center gap-2">
                <Sparkles size={16} className="text-purple-600" />
                AI Instant Grading Enabled
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                Your written responses will be automatically graded by AI when you submit! You'll receive instant feedback and scores. Your teacher can review and adjust grades if needed.
              </p>
            </div>
          </div>
        </div>
      )}
      
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
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight flex-1">
              {currentQuestion.text}
            </h3>
            {currentQuestion.points && (
              <div className="bg-amber-50 border-2 border-amber-200 px-4 py-2 rounded-xl flex-shrink-0">
                <span className="text-amber-900 font-bold text-sm">{currentQuestion.points} pts</span>
              </div>
            )}
          </div>

          {currentQuestion.type === 'multiple-choice' ? (
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
          ) : currentQuestion.type === 'short-answer' ? (
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700">Your Answer:</label>
              <input
                type="text"
                value={textAnswers[currentQuestionIndex] || ''}
                onChange={(e) => handleTextAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 focus:outline-none text-slate-900 placeholder:text-slate-400 font-medium transition-all"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700">Your Essay:</label>
              <textarea
                value={textAnswers[currentQuestionIndex] || ''}
                onChange={(e) => handleTextAnswer(e.target.value)}
                placeholder="Write your detailed answer here..."
                rows={8}
                className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 focus:outline-none text-slate-900 placeholder:text-slate-400 font-medium transition-all resize-none"
              />
            </div>
          )}
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
            disabled={
              submitting || 
              (currentQuestion.type === 'multiple-choice' && answers[currentQuestionIndex] === undefined) ||
              (currentQuestion.type !== 'multiple-choice' && !textAnswers[currentQuestionIndex]?.trim())
            }
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
