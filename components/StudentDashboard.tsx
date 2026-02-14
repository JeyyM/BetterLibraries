
import React, { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';
import { Book } from '../types';
import { 
  TrendingUp, 
  BookOpen, 
  Award, 
  ArrowRight, 
  Star, 
  Clock, 
  Target, 
  Bookmark, 
  Medal,
  Flame,
  Zap,
  ChevronRight,
  Loader2
} from 'lucide-react';

interface StudentDashboardProps {
  onReadBook: (book: Book) => void;
  onNavigateToBadges: () => void;
}

interface BookInProgress {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  level: number;
  genre: string;
  pages: number;
  estimatedTime: string;
  currentPage: number;
  progressPercentage: number;
  lastReadAt: string;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ onReadBook, onNavigateToBadges }) => {
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState('Student');
  const [currentLexile, setCurrentLexile] = useState(0);
  const [stats, setStats] = useState({
    booksRead: 0,
    avgScore: 0,
    lexileGrowth: 0,
    streak: 0
  });
  const [booksInProgress, setBooksInProgress] = useState<BookInProgress[]>([]);

  useEffect(() => {
    loadStudentData();
  }, []);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ No user found');
        return;
      }

      console.log('👤 Loading data for user:', user.email);

      // Get student info
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('name, current_lexile_level')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('❌ Error fetching user data:', userError);
      } else if (userData) {
        setStudentName(userData.name || 'Student');
        setCurrentLexile(userData.current_lexile_level || 0);
        console.log('✅ User data loaded:', userData.name, userData.current_lexile_level + 'L');
      }

      // Get books read count (completed quizzes with book_id)
      const { data: completedQuizzes, error: quizError } = await supabase
        .from('quiz_attempts')
        .select('book_id')
        .eq('student_id', user.id)
        .not('book_id', 'is', null);

      if (quizError) {
        console.error('❌ Error fetching quiz attempts:', quizError);
      }

      const booksReadCount = completedQuizzes ? completedQuizzes.length : 0;
      console.log('📚 Books read:', booksReadCount);

      // Get average quiz score
      const { data: quizAttempts, error: avgError } = await supabase
        .from('quiz_attempts')
        .select('score, total_possible_points')
        .eq('student_id', user.id);

      if (avgError) {
        console.error('❌ Error fetching avg scores:', avgError);
      }

      let avgScore = 0;
      if (quizAttempts && quizAttempts.length > 0) {
        const totalPercentage = quizAttempts.reduce((sum, attempt) => {
          const percentage = attempt.total_possible_points > 0 
            ? (attempt.score / attempt.total_possible_points) * 100 
            : 0;
          return sum + percentage;
        }, 0);
        avgScore = Math.round(totalPercentage / quizAttempts.length);
      }
      console.log('📊 Average score:', avgScore + '%');

      // Get lexile growth (simplified - compare current to starting 400L)
      const lexileGrowth = (userData?.current_lexile_level || 0) - 400;

      // Get streak (simplified - check if read in last 24 hours)
      const { data: recentReads, error: streakError } = await supabase
        .from('reading_progress')
        .select('last_read_at')
        .eq('user_email', user.email)
        .order('last_read_at', { ascending: false })
        .limit(7);

      if (streakError) {
        console.error('❌ Error fetching reading streak:', streakError);
      }

      let streak = 0;
      if (recentReads && recentReads.length > 0) {
        // Simple streak calculation - count consecutive days
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < recentReads.length; i++) {
          const readDate = new Date(recentReads[i].last_read_at);
          readDate.setHours(0, 0, 0, 0);
          
          const daysDiff = Math.floor((today.getTime() - readDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff === i) {
            streak++;
          } else {
            break;
          }
        }
      }
      console.log('🔥 Streak:', streak + ' days');

      setStats({
        booksRead: booksReadCount || 0,
        avgScore,
        lexileGrowth,
        streak
      });

      // Get books in progress with book details
      const { data: progressData, error: progressError } = await supabase
        .from('reading_progress')
        .select('book_id, current_page, last_read_at')
        .eq('user_email', user.email)
        .order('last_read_at', { ascending: false })
        .limit(5);

      if (progressError) {
        console.error('❌ Error fetching reading progress:', progressError);
      } else {
        console.log('📖 Progress records found:', progressData?.length || 0);
      }

      if (progressData && progressData.length > 0) {
        // Get the book details for these books
        const bookIds = progressData.map(p => p.book_id);
        const { data: booksData, error: booksError } = await supabase
          .from('books')
          .select('id, title, author, cover_image_path, lexile_level, genre, pages, estimated_time_minutes')
          .in('id', bookIds);

        if (booksError) {
          console.error('❌ Error fetching books data:', booksError);
        } else {
          console.log('📚 Books details fetched:', booksData?.length || 0);
        }

        if (booksData) {
          // Combine progress data with book data
          const inProgressBooks: BookInProgress[] = progressData
            .map(p => {
              const book = booksData.find(b => b.id === p.book_id);
              if (!book) return null;

              // Only include if not completed (current_page < total_pages)
              if (p.current_page >= book.pages) return null;

              // Get the actual cover image URL from Supabase Storage
              const { data: coverData } = supabase.storage
                .from('book-covers')
                .getPublicUrl(book.id + '.jpg');

              return {
                id: book.id,
                title: book.title,
                author: book.author,
                coverImage: coverData.publicUrl || 'https://placehold.co/300x400/6366f1/white?text=Book',
                level: book.lexile_level,
                genre: book.genre,
                pages: book.pages,
                estimatedTime: book.estimated_time_minutes ? `${book.estimated_time_minutes} min` : '30 min',
                currentPage: p.current_page,
                progressPercentage: Math.round((p.current_page / book.pages) * 100),
                lastReadAt: p.last_read_at
              };
            })
            .filter((b): b is BookInProgress => b !== null);
          
          setBooksInProgress(inProgressBooks);
          console.log('✅ In-progress books:', inProgressBooks.length);
        }
      }


    } catch (error) {
      console.error('Error loading student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Books Read', value: stats.booksRead.toString(), icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Avg Score', value: stats.avgScore > 0 ? `${stats.avgScore}%` : 'N/A', icon: Award, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Growth', value: stats.lexileGrowth >= 0 ? `+${stats.lexileGrowth}L` : `${stats.lexileGrowth}L`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Streak', value: `${stats.streak}d`, icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          {stats.streak > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-600 w-fit rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100 animate-pulse">
              <Flame size={12} fill="currentColor" />
              {stats.streak} Day Streak! You're on Fire
            </div>
          )}
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Hello, {studentName}! 👋
          </h1>
          <p className="text-slate-600 text-lg font-medium">
            Current Lexile Level: <span className="text-indigo-600 font-bold">{currentLexile}L</span>
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-default">
            <div className={`${stat.bg} ${stat.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
              <stat.icon size={28} />
            </div>
            <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Books in Progress */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <div className="w-1 h-8 bg-indigo-600 rounded-full"></div>
            Books in Progress
          </h2>
        </div>
        
        {booksInProgress.length === 0 ? (
          <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
            <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-black text-slate-900 mb-2">No books in progress</h3>
            <p className="text-slate-600 font-medium">Start reading a book to see it here!</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {booksInProgress.map((book) => (
              <div key={book.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center gap-8 hover:shadow-2xl hover:border-indigo-100 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Bookmark className="text-indigo-100" size={32} />
                </div>
                
                <div className="relative shrink-0 w-full sm:w-auto flex justify-center">
                  <img 
                    src={book.coverImage} 
                    alt={book.title} 
                    className="w-28 h-40 object-cover rounded-2xl shadow-xl group-hover:scale-105 group-hover:rotate-2 transition-all duration-500"
                    onError={(e) => {
                      // Fallback to Supabase storage URL
                      const img = e.target as HTMLImageElement;
                      const { data } = supabase.storage.from('book-covers').getPublicUrl(book.id + '.jpg');
                      img.src = data.publicUrl;
                    }}
                  />
                  <div className="absolute -top-3 -right-3 bg-white px-3 py-1.5 rounded-xl text-[11px] font-black text-indigo-600 shadow-xl border border-slate-50">
                    {book.level}L
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-4 w-full">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-slate-600 font-bold text-sm uppercase tracking-wider mt-1">By {book.author}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-600">
                      <span>Reading Progress</span>
                      <span>{book.progressPercentage}% • Page {book.currentPage} of {book.pages}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${book.progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg">
                      <Clock size={14} />
                      {book.estimatedTime}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg">
                      <Target size={14} />
                      {book.genre}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    // Convert BookInProgress to Book type for onReadBook
                    const fullBook: Book = {
                      id: book.id,
                      title: book.title,
                      author: book.author,
                      coverImage: book.coverImage,
                      level: book.level,
                      genre: book.genre,
                      pages: book.pages,
                      estimatedTime: book.estimatedTime,
                      description: '',
                      fullDescription: '',
                      content: ''
                    };
                    onReadBook(fullBook);
                  }}
                  className="w-full sm:w-auto bg-slate-900 text-white px-8 py-5 rounded-[1.5rem] hover:bg-indigo-600 transition-all shadow-xl hover:shadow-indigo-200 flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest"
                >
                  Continue
                  <ArrowRight size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar - Badges Section (Simplified for now) */}
      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2"></div>
        <div className="space-y-10">
          {/* My Badges Section */}
          <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-amber-500/20 transition-all"></div>
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-2xl font-black flex items-center gap-3">
                <Medal className="text-amber-400" />
                My Badges
              </h2>
              <button onClick={onNavigateToBadges} className="text-slate-400 hover:text-white">
                <ChevronRight size={24} />
              </button>
            </div>
            
            <div className="flex justify-between gap-2">
              {/* Sample badges - will be populated from database later */}
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center gap-2 opacity-40">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-dashed border-white/20 flex items-center justify-center">
                    <Star size={20} className="text-slate-500" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Locked</span>
                </div>
              ))}
            </div>
            <button 
              onClick={onNavigateToBadges}
              className="mt-8 w-full py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              View Achievement Hall
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
