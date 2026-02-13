
import React from 'react';
import { UserRole, Book, QuizAttempt } from './types';
import Layout from './components/Layout';
import Login from './components/Login';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import StudentRoster from './components/StudentRoster';
import AssignmentManager from './components/AssignmentManager';
import BadgeManager from './components/BadgeManager';
import Library from './components/Library';
import ReadingView from './components/ReadingView';
import QuizView from './components/QuizView';
import ResultsView from './components/ResultsView';
import Achievements from './components/Achievements';
import ReadingHistory from './components/ReadingHistory';
import StudentAssignments from './components/StudentAssignments';
import DiscussionBoard from './components/DiscussionBoard';
import { TrendingUp, Users, Trophy, Activity, ClipboardList, History, Search, Medal, MessageSquare } from 'lucide-react';
import { supabase } from './src/lib/supabase';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [role, setRole] = React.useState<UserRole>('student');
  const [activeSection, setActiveSection] = React.useState('dashboard');
  const [selectedBook, setSelectedBook] = React.useState<Book | null>(null);
  const [viewState, setViewState] = React.useState<'normal' | 'reading' | 'quiz' | 'results' | 'discussion'>('normal');
  const [lastAttempt, setLastAttempt] = React.useState<QuizAttempt | null>(null);
  const [books, setBooks] = React.useState<Book[]>([]);

  // Fetch books from Supabase
  React.useEffect(() => {
    const fetchBooks = async () => {
      try {
        const { data, error } = await supabase
          .from('books')
          .select('*')
          .eq('is_active', true)
          .order('title');

        if (error) throw error;

        if (data) {
          const transformedBooks: Book[] = data.map(book => ({
            id: book.id,
            title: book.title,
            author: book.author,
            coverImage: getCoverImageUrl(book.id),
            description: book.description || '',
            fullDescription: book.full_description || book.description || '',
            level: book.lexile_level,
            genre: book.genre || 'Fiction',
            pages: book.page_count || 0,
            estimatedTime: `${Math.ceil((book.page_count || 100) / 30)} min`,
            content: book.description || ''
          }));

          setBooks(transformedBooks);
        }
      } catch (error) {
        console.error('Error fetching books:', error);
      }
    };

    if (isAuthenticated) {
      fetchBooks();
    }
  }, [isAuthenticated]);

  const getCoverImageUrl = (bookId: string): string => {
    const { data } = supabase.storage
      .from('book-covers')
      .getPublicUrl(`${bookId}.jpg`);
    
    return data.publicUrl || `https://placehold.co/300x400/6366f1/white?text=Book`;
  };

  const handleLogin = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setIsAuthenticated(true);
    setActiveSection('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setViewState('normal');
    setSelectedBook(null);
  };

  const handleReadBook = (book: Book) => {
    setSelectedBook(book);
    setViewState('reading');
  };

  const handleOpenDiscussion = (book: Book) => {
    setSelectedBook(book);
    setViewState('discussion');
  };

  const handleFinishReading = () => {
    setViewState('quiz');
  };

  const handleQuizComplete = (attempt: QuizAttempt) => {
    setLastAttempt(attempt);
    setViewState('results');
  };

  const handleCloseFlow = () => {
    setSelectedBook(null);
    setViewState('normal');
    setActiveSection('dashboard');
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    // Priority full-screen views
    if (viewState === 'reading' && selectedBook) {
      return <ReadingView book={selectedBook} onFinish={handleFinishReading} onBack={() => setViewState('normal')} />;
    }
    if (viewState === 'quiz' && selectedBook) {
      return <QuizView book={selectedBook} onComplete={handleQuizComplete} onBack={() => setViewState('reading')} />;
    }
    if (viewState === 'results' && selectedBook && lastAttempt) {
      return <ResultsView book={selectedBook} attempt={lastAttempt} onClose={handleCloseFlow} />;
    }
    if (viewState === 'discussion' && selectedBook) {
      return <DiscussionBoard book={selectedBook} role={role} onBack={() => setViewState('normal')} />;
    }

    // Role-specific routing logic
    if (role === 'teacher') {
      switch (activeSection) {
        case 'dashboard': return <TeacherDashboard />;
        case 'roster':
          return <StudentRoster />;
        case 'teacher-assignments':
          return <AssignmentManager />;
        case 'activity':
          return <BadgeManager />;
        case 'discussions':
          return (
            <div className="space-y-10 animate-in fade-in duration-700">
               <div>
                 <h1 className="text-4xl font-black text-slate-900 tracking-tight">Discussion Hub</h1>
                 <p className="text-slate-600 font-medium mt-1">Moderate active book threads and grade participation.</p>
               </div>
               <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 {books.map(book => (
                   <div key={book.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                     <div className="aspect-[3/4] rounded-[2rem] overflow-hidden mb-6 relative">
                       <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                       <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                           onClick={() => handleOpenDiscussion(book)}
                           className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2"
                         >
                           <MessageSquare size={16} />
                           Open Thread
                         </button>
                       </div>
                     </div>
                     <h3 className="font-black text-xl text-slate-900 group-hover:text-indigo-600 transition-colors">{book.title}</h3>
                     <p className="text-xs text-slate-500 font-bold uppercase mt-1 tracking-wider">Active Moderation</p>
                   </div>
                 ))}
               </div>
            </div>
          );
        case 'leaderboard':
          return (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
               <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">Mastery Board</h1>
               <div className="bg-white p-16 rounded-[4rem] border border-slate-100 shadow-sm text-center">
                 <div className="bg-amber-50 w-28 h-28 rounded-[2.5rem] flex items-center justify-center mx-auto text-amber-500 mb-8 shadow-inner shadow-amber-100/50">
                   <Trophy size={48} />
                 </div>
                 <h2 className="text-2xl font-black text-slate-900">Gamified Growth</h2>
                 <p className="text-slate-500 max-w-sm mx-auto mt-4 font-medium leading-relaxed">Set team challenges, distribute digital badges, and celebrate reading consistency across your entire classroom.</p>
               </div>
            </div>
          );
        default: return <TeacherDashboard />;
      }
    }

    // Student specific routing
    switch (activeSection) {
      case 'dashboard': return <StudentDashboard onReadBook={handleReadBook} onNavigateToBadges={() => setActiveSection('achievements')} />;
      case 'library': return <Library onReadBook={handleReadBook} />;
      case 'discussions':
        return (
          <div className="space-y-10 animate-in fade-in duration-700">
             <h1 className="text-4xl font-black text-slate-900 tracking-tight">Discussion Hub</h1>
             <p className="text-slate-600 font-medium mt-1">Talk about your latest reads with your classmates.</p>
             <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {books.map(book => (
                  <button 
                    key={book.id} 
                    onClick={() => handleOpenDiscussion(book)}
                    className="bg-white p-6 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group text-left"
                  >
                    <div className="aspect-[3/4] rounded-[2rem] overflow-hidden mb-6">
                      <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <h3 className="font-black text-xl text-slate-900 group-hover:text-indigo-600 transition-colors">{book.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                       <MessageSquare size={14} className="text-indigo-500" />
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Join Conversation</span>
                    </div>
                  </button>
                ))}
             </div>
          </div>
        );
      case 'achievements': return <Achievements />;
      case 'analytics':
        return (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">Growth Insights</h1>
             <div className="bg-white p-16 rounded-[4rem] border border-slate-100 shadow-sm text-center">
               <div className="max-w-lg mx-auto space-y-8">
                 <div className="bg-indigo-50 w-28 h-28 rounded-[2.5rem] flex items-center justify-center mx-auto text-indigo-600 shadow-inner shadow-indigo-100/50">
                   <TrendingUp size={48} />
                 </div>
                 <h2 className="text-2xl font-black text-slate-900">Your Reading Journey</h2>
                 <p className="text-slate-500 font-medium leading-relaxed">Your Lexile level has increased by 15% since the start of the semester! We're processing your recent quiz data to generate next week's goals.</p>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Books Goal</p>
                     <p className="text-2xl font-black text-slate-900">8/10</p>
                   </div>
                   <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Comprehension</p>
                     <p className="text-2xl font-black text-indigo-600">88.4%</p>
                   </div>
                 </div>
               </div>
             </div>
          </div>
        );
      case 'history':
        return <ReadingHistory />;
      case 'assignments':
        return <StudentAssignments onReadBook={handleReadBook} onNavigateToLibrary={() => setActiveSection('library')} />;
      default: return <StudentDashboard onReadBook={handleReadBook} onNavigateToBadges={() => setActiveSection('achievements')} />;
    }
  };

  return (
    <Layout role={role} onLogout={handleLogout} activeSection={activeSection} setActiveSection={setActiveSection}>
      {renderContent()}
    </Layout>
  );
};

export default App;
