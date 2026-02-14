
import React, { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';
import { QuizAttempt, Book } from '../types';
import { Search, Calendar, ChevronRight, BarChart3, BookOpen, Sparkles, Loader2 } from 'lucide-react';
import ResultsView from './ResultsView';

interface HistoryItem {
  attempt: QuizAttempt;
  book: Book;
}

const ReadingHistory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAttempt, setSelectedAttempt] = useState<{ book: Book, attempt: QuizAttempt } | null>(null);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [avgScore, setAvgScore] = useState(0);

  useEffect(() => {
    loadReadingHistory();
  }, []);

  const loadReadingHistory = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ No user found');
        return;
      }

      console.log('📚 Loading reading history for:', user.email);

      // Get quiz attempts for BOOK quizzes only (not assignments)
      const { data: attempts, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('student_id', user.id)
        .not('book_id', 'is', null) // Only book quizzes, not assignment quizzes
        .order('completed_at', { ascending: false });

      if (attemptsError) {
        console.error('❌ Error fetching quiz attempts:', attemptsError);
        return;
      }

      if (!attempts || attempts.length === 0) {
        console.log('📖 No quiz attempts found');
        setHistoryItems([]);
        setLoading(false);
        return;
      }

      console.log('✅ Found', attempts.length, 'quiz attempts');

      // Get unique book IDs
      const bookIds = [...new Set(attempts.map(a => a.book_id).filter(Boolean))];

      // Fetch book details
      const { data: booksData, error: booksError } = await supabase
        .from('books')
        .select('id, title, author, cover_image_path, lexile_level, genre, pages, estimated_time_minutes')
        .in('id', bookIds);

      if (booksError) {
        console.error('❌ Error fetching books:', booksError);
        return;
      }

      console.log('✅ Found', booksData?.length || 0, 'books');
      console.log('📊 Book data:', booksData);

      // Get quiz questions for each attempt
      const historyWithBooks: HistoryItem[] = [];

      for (const attempt of attempts) {
        console.log('🔍 Processing attempt:', {
          id: attempt.id,
          book_id: attempt.book_id,
          score: attempt.score,
          total_possible_points: attempt.total_possible_points,
          completed_at: attempt.completed_at
        });
        
        const bookData = booksData?.find(b => b.id === attempt.book_id);
        if (!bookData) {
          console.log('⚠️ No book data found for book_id:', attempt.book_id);
          continue;
        }
        
        console.log('📖 Book data for attempt:', {
          title: bookData.title,
          author: bookData.author,
          lexile_level: bookData.lexile_level
        });

        // Get cover image URL
        const { data: coverData } = supabase.storage
          .from('book-covers')
          .getPublicUrl(bookData.id + '.jpg');

        // Get quiz answers for this attempt
        const { data: answersData } = await supabase
          .from('quiz_answers')
          .select('*')
          .eq('attempt_id', attempt.id)
          .order('created_at', { ascending: true });

        // Get quiz questions
        const { data: quizData } = await supabase
          .from('quiz_items')
          .select('questions')
          .eq('book_id', attempt.book_id)
          .single();

        const questions = quizData?.questions || [];
        const studentAnswers = answersData?.map(a => a.answer_text || a.selected_option_index) || [];

        const book: Book = {
          id: bookData.id,
          title: bookData.title,
          author: bookData.author,
          coverImage: coverData.publicUrl || 'https://placehold.co/300x400/6366f1/white?text=Book',
          level: bookData.lexile_level,
          genre: bookData.genre,
          pages: bookData.pages,
          estimatedTime: bookData.estimated_time_minutes ? `${bookData.estimated_time_minutes} min` : '30 min',
          description: '',
          fullDescription: '',
          content: ''
        };

        const calculatedScore = Math.round(attempt.total_possible_points > 0 
            ? (attempt.score / attempt.total_possible_points) * 100 
            : 0);
        
        console.log('🧮 Score calculation:', {
          raw_score_from_db: attempt.score,
          total_possible_points: attempt.total_possible_points,
          calculation: `(${attempt.score} / ${attempt.total_possible_points}) * 100`,
          result_percentage: calculatedScore
        });

        const quizAttempt: QuizAttempt = {
          id: attempt.id,
          studentId: attempt.student_id,
          quizId: attempt.quiz_id || 'book-quiz',
          score: calculatedScore,
          date: new Date(attempt.completed_at || attempt.started_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          aiFeedback: attempt.ai_feedback_summary ? {
            summary: attempt.ai_feedback_summary,
            strengths: [],
            weaknesses: [],
            suggestions: []
          } : {
            summary: 'Great work on completing this quiz!',
            strengths: [],
            weaknesses: [],
            suggestions: []
          },
          questions: questions,
          studentAnswers: studentAnswers,
          lexileChange: undefined // We could fetch this from another table if we store history
        };

        historyWithBooks.push({ attempt: quizAttempt, book });
      }

      setHistoryItems(historyWithBooks);

      // Calculate average score
      if (historyWithBooks.length > 0) {
        const total = historyWithBooks.reduce((sum, item) => sum + item.attempt.score, 0);
        setAvgScore(Math.round(total / historyWithBooks.length));
      }

      console.log('✅ Reading history loaded:', historyWithBooks.length, 'items');

    } catch (error) {
      console.error('❌ Error loading reading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = historyItems.filter(item => 
    item.book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedAttempt) {
    return (
      <ResultsView 
        book={selectedAttempt.book} 
        attempt={selectedAttempt.attempt} 
        onClose={() => setSelectedAttempt(null)} 
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Reading Shelf</h1>
          <p className="text-slate-600 font-medium mt-1">Revisit your past adventures and see your progress.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search history..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white border border-slate-100 rounded-2xl py-3.5 pl-12 pr-6 text-sm w-full sm:w-72 shadow-sm focus:ring-4 focus:ring-indigo-50 transition-all text-slate-900 font-bold placeholder-slate-400"
          />
        </div>
      </div>

      <div className="grid gap-6">
        {filteredHistory.length > 0 ? filteredHistory.map(({ attempt, book }) => (
          <div 
            key={attempt.id}
            onClick={() => setSelectedAttempt({ book, attempt })}
            className="bg-white p-6 sm:p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col sm:flex-row items-center gap-8 cursor-pointer relative overflow-hidden"
          >
            {/* Visual indicator of score */}
            <div className={`absolute left-0 top-0 bottom-0 w-2 ${attempt.score >= 85 ? 'bg-emerald-500' : attempt.score >= 70 ? 'bg-indigo-500' : 'bg-rose-500'}`} />
            
            <div className="shrink-0 w-24 h-32 bg-slate-50 rounded-2xl overflow-hidden shadow-md">
              <img 
                src={book.coverImage} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                alt={book.title}
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.src = 'https://placehold.co/300x400/6366f1/white?text=Book';
                }}
              />
            </div>

            <div className="flex-1 min-w-0 space-y-3 w-full text-center sm:text-left">
              <div>
                <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{book.title}</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">{book.author}</p>
              </div>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-xl">
                  <Calendar size={14} />
                  {attempt.date}
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-xl">
                  <Sparkles size={14} />
                  {book.level}L
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center sm:items-end gap-2 shrink-0">
               <div className="text-right">
                  <p className={`text-4xl font-black ${attempt.score >= 85 ? 'text-emerald-500' : attempt.score >= 70 ? 'text-indigo-600' : 'text-rose-500'}`}>
                    {attempt.score}%
                  </p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center sm:text-right">Score</p>
               </div>
               <button className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline mt-2">
                 View Full Insights
                 <ChevronRight size={14} />
               </button>
            </div>
          </div>
        )) : (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
            <div className="bg-slate-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-slate-300">
              <BookOpen size={48} />
            </div>
            <h3 className="text-2xl font-black text-slate-900">Shelf is empty</h3>
            <p className="text-slate-600 mt-2 font-medium">
              {searchTerm ? 'No matching books found in your history.' : 'Complete your first book quiz to see your history here!'}
            </p>
          </div>
        )}
      </div>

      {historyItems.length > 0 && (
        <div className="bg-slate-900 p-10 rounded-[4rem] text-white relative overflow-hidden group shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="bg-white/10 p-6 rounded-[2.5rem] backdrop-blur-md border border-white/5">
              <BarChart3 size={48} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black">Growth Analytics</h2>
              <p className="text-slate-400 mt-2 leading-relaxed">
                Your average comprehension score is <span className="text-indigo-400 font-black">{avgScore}%</span> across {historyItems.length} {historyItems.length === 1 ? 'book' : 'books'}. Keep up the great work!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReadingHistory;
