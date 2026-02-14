import React from 'react';
import { Routes, Route, Navigate, useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { UserRole, Book, QuizAttempt, Assignment } from './types';
import Layout from './components/Layout';
import Login from './components/Login';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import TeacherLibrary from './components/TeacherLibrary';
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
import AddBook from './components/AddBook';
import QuizStudio from './components/QuizStudio';
import { TrendingUp, Trophy, MessageSquare } from 'lucide-react';
import { supabase } from './src/lib/supabase';

const getCoverImageUrl = (bookId: string): string => {
  const { data } = supabase.storage.from('book-covers').getPublicUrl(bookId + '.jpg');
  return data.publicUrl || 'https://placehold.co/300x400/6366f1/white?text=Book';
};

const fetchAndTransformBooks = async (): Promise<Book[]> => {
  const { data, error } = await supabase.from('books').select('*').eq('is_active', true).order('title');
  if (error) throw error;
  return (data || []).map((book: any) => ({
    id: book.id,
    title: book.title,
    author: book.author,
    coverImage: getCoverImageUrl(book.id),
    description: book.description || '',
    fullDescription: book.full_description || book.description || '',
    level: book.lexile_level,
    genre: book.genre || 'Fiction',
    pages: book.pages || 0,
    estimatedTime: Math.ceil((book.pages || 100) / 30) + ' min',
    content: book.description || ''
  }));
};

const loadAssignment = async (id: string): Promise<Assignment | null> => {
  const { data } = await supabase.from('assignments').select('*').eq('id', id).single();
  if (!data) return null;
  return {
    id: data.id,
    bookId: data.book_id,
    classId: data.class_id,
    title: data.title,
    instructions: data.instructions,
    status: data.status,
    deadline: data.deadline?.split('T')[0] || '',
    createdAt: data.created_at,
    assignedStudentIds: [],
    questions: data.questions || [],
    totalPoints: data.total_points || 0,
    enableAutoAIGrading: data.enable_auto_ai_grading || false,
    hasDiscussion: data.has_discussion,
    discussionMaxScore: data.discussion_max_score,
    submissions: []
  };
};

const useBookFromParam = (books: Book[]) => {
  const { bookId } = useParams<{ bookId: string }>();
  return books.find(b => b.id === bookId) || null;
};
/* Page Components */

const ReadingPage: React.FC<{ books: Book[]; userEmail: string }> = ({ books, userEmail }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const book = useBookFromParam(books);
  const assignmentId = searchParams.get('assignment');
  if (!book) return <Navigate to="/library" replace />;
  return (
    <ReadingView
      book={book}
      userEmail={userEmail}
      onFinish={() => {
        const q = assignmentId ? '?assignment=' + assignmentId : '';
        navigate('/books/' + book.id + '/quiz' + q);
      }}
      onBack={() => navigate('/dashboard')}
    />
  );
};

const QuizPage: React.FC<{ books: Book[]; userEmail: string }> = ({ books, userEmail }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const book = useBookFromParam(books);
  const assignmentId = searchParams.get('assignment');
  const [assignment, setAssignment] = React.useState<Assignment | null>(null);
  React.useEffect(() => {
    if (assignmentId) loadAssignment(assignmentId).then(setAssignment);
  }, [assignmentId]);
  if (!book) return <Navigate to="/library" replace />;
  return (
    <QuizView
      book={book}
      assignment={assignment}
      userEmail={userEmail}
      onComplete={(attempt) => {
        const q = assignmentId ? '?assignment=' + assignmentId : '';
        navigate('/books/' + book.id + '/results/' + attempt.id + q, { state: { attempt } });
      }}
      onBack={() => navigate(-1)}
    />
  );
};

const ResultsPage: React.FC<{ books: Book[] }> = ({ books }) => {
  const navigate = useNavigate();
  const { bookId, attemptId } = useParams<{ bookId: string; attemptId: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const book = books.find(b => b.id === bookId);
  const assignmentId = searchParams.get('assignment');
  const [attempt, setAttempt] = React.useState<QuizAttempt | null>((location.state as any)?.attempt || null);
  const [assignment, setAssignment] = React.useState<Assignment | null>(null);
  const [loading, setLoading] = React.useState(!attempt);

  React.useEffect(() => {
    if (assignmentId) loadAssignment(assignmentId).then(setAssignment);
  }, [assignmentId]);

  React.useEffect(() => {
    if (attempt || !attemptId) return;
    const load = async () => {
      setLoading(true);
      const { data: row } = await supabase.from('quiz_attempts').select('*').eq('id', attemptId).single();
      if (!row) { setLoading(false); return; }
      const { data: answersData } = await supabase.from('quiz_answers').select('*').eq('attempt_id', attemptId).order('created_at', { ascending: true });
      const studentAnswers = (answersData || []).map((ans: any) => {
        if (ans.selected_option_index !== null && ans.selected_option_index !== undefined) return ans.selected_option_index;
        if (ans.answer_text) return ans.answer_text;
        return '';
      });
      let questions: any[] = [];
      if (assignmentId) {
        const { data: asgn } = await supabase.from('assignments').select('questions').eq('id', assignmentId).single();
        questions = asgn?.questions || [];
      }
      setAttempt({
        id: row.id, studentId: row.student_id, quizId: row.quiz_id || 'assignment',
        score: row.score || 0, date: row.completed_at,
        aiFeedback: row.ai_feedback || { summary: '', strengths: [], weaknesses: [], suggestions: [] },
        questions, studentAnswers
      });
      setLoading(false);
    };
    load();
  }, [attemptId, attempt, assignmentId]);

  if (!book) return <Navigate to="/library" replace />;
  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" /></div>;
  if (!attempt) return <Navigate to="/dashboard" replace />;
  return <ResultsView book={book} attempt={attempt} assignment={assignment} onClose={() => navigate('/dashboard')} />;
};

const DiscussionPage: React.FC<{ books: Book[]; role: UserRole }> = ({ books, role }) => {
  const navigate = useNavigate();
  const book = useBookFromParam(books);
  if (!book) return <Navigate to="/discussions" replace />;
  return <DiscussionBoard book={book} role={role} onBack={() => navigate('/discussions')} />;
};

const DiscussionHubPage: React.FC<{ books: Book[]; role: UserRole }> = ({ books, role }) => {
  const navigate = useNavigate();
  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Discussion Hub</h1>
        <p className="text-slate-600 font-medium mt-1">
          {role === 'teacher' ? 'Moderate active book threads and grade participation.' : 'Talk about your latest reads with your classmates.'}
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {books.map(book => (
          <button key={book.id} onClick={() => navigate('/books/' + book.id + '/discussion')}
            className="bg-white p-6 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group text-left">
            <div className="aspect-[3/4] rounded-[2rem] overflow-hidden mb-6">
              <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <h3 className="font-black text-xl text-slate-900 group-hover:text-indigo-600 transition-colors">{book.title}</h3>
            <div className="flex items-center gap-2 mt-2">
              <MessageSquare size={14} className="text-indigo-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {role === 'teacher' ? 'Moderate Thread' : 'Join Conversation'}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

const QuizStudioPage: React.FC<{ books: Book[] }> = ({ books }) => {
  const navigate = useNavigate();
  const book = useBookFromParam(books);
  if (!book) return <Navigate to="/library/manage" replace />;
  return <QuizStudio book={book} onBack={() => navigate('/library/manage')} />;
};

const AddBookPage: React.FC<{ refreshBooks: () => void }> = ({ refreshBooks }) => {
  const navigate = useNavigate();
  return <AddBook onBack={() => navigate('/library/manage')} onBookAdded={refreshBooks} />;
};

const TeacherLibraryPage: React.FC = () => {
  const navigate = useNavigate();
  return <TeacherLibrary onReadBook={(book) => navigate('/books/' + book.id + '/read')} onViewQuiz={(book) => navigate('/books/' + book.id + '/quiz-studio')} onAddBook={() => navigate('/library/add')} />;
};

const StudentLibraryPage: React.FC = () => {
  const navigate = useNavigate();
  return <Library onReadBook={(book) => navigate('/books/' + book.id + '/read')} />;
};

const StudentDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  return <StudentDashboard onReadBook={(book) => navigate('/books/' + book.id + '/read')} onNavigateToBadges={() => navigate('/achievements')} />;
};

const StudentAssignmentsPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <StudentAssignments
      onReadBook={(book, assignment) => {
        const q = assignment ? '?assignment=' + assignment.id : '';
        navigate('/books/' + book.id + '/read' + q);
      }}
      onTakeQuiz={(book, assignment) => {
        const q = assignment ? '?assignment=' + assignment.id : '';
        navigate('/books/' + book.id + '/quiz' + q);
      }}
      onViewResults={async (book, assignment) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: sub } = await supabase.from('assignment_submissions').select('quiz_attempt_id').eq('assignment_id', assignment.id).eq('student_id', user.id).single();
        if (!sub?.quiz_attempt_id) { alert('No quiz attempt found.'); return; }
        navigate('/books/' + book.id + '/results/' + sub.quiz_attempt_id + '?assignment=' + assignment.id);
      }}
      onNavigateToLibrary={() => navigate('/library')}
    />
  );
};

const AnalyticsPage: React.FC = () => (
  <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">Growth Insights</h1>
    <div className="bg-white p-16 rounded-[4rem] border border-slate-100 shadow-sm text-center">
      <div className="max-w-lg mx-auto space-y-8">
        <div className="bg-indigo-50 w-28 h-28 rounded-[2.5rem] flex items-center justify-center mx-auto text-indigo-600 shadow-inner shadow-indigo-100/50">
          <TrendingUp size={48} />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Your Reading Journey</h2>
        <p className="text-slate-500 font-medium leading-relaxed">Your Lexile level has increased by 15% since the start of the semester!</p>
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

const LeaderboardPage: React.FC = () => (
  <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">Mastery Board</h1>
    <div className="bg-white p-16 rounded-[4rem] border border-slate-100 shadow-sm text-center">
      <div className="bg-amber-50 w-28 h-28 rounded-[2.5rem] flex items-center justify-center mx-auto text-amber-500 mb-8 shadow-inner shadow-amber-100/50">
        <Trophy size={48} />
      </div>
      <h2 className="text-2xl font-black text-slate-900">Gamified Growth</h2>
      <p className="text-slate-500 max-w-sm mx-auto mt-4 font-medium leading-relaxed">Set team challenges, distribute digital badges, and celebrate reading consistency.</p>
    </div>
  </div>
);

/* Main App */
const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [role, setRole] = React.useState<UserRole>('student');
  const [userEmail, setUserEmail] = React.useState('');
  const [userName, setUserName] = React.useState('');
  const [books, setBooks] = React.useState<Book[]>([]);

  const refreshBooks = async () => {
    try { setBooks(await fetchAndTransformBooks()); } catch (e) { console.error('Error fetching books:', e); }
  };

  const fetchUserName = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('name')
        .eq('email', email)
        .single();
      
      if (error) {
        console.error('Error fetching user name:', error);
        setUserName(email.split('@')[0]); // Fallback to email username
      } else {
        setUserName(data?.name || email.split('@')[0]);
      }
    } catch (e) {
      console.error('Error:', e);
      setUserName(email.split('@')[0]); // Fallback to email username
    }
  };

  React.useEffect(() => { if (isAuthenticated) refreshBooks(); }, [isAuthenticated]);

  React.useEffect(() => { 
    if (isAuthenticated && userEmail) {
      fetchUserName(userEmail);
    }
  }, [isAuthenticated, userEmail]);

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={(r, e) => { setRole(r); setUserEmail(e); setIsAuthenticated(true); }} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {/* Full-screen views */}
      <Route path="/books/:bookId/read" element={<ReadingPage books={books} userEmail={userEmail} />} />
      <Route path="/books/:bookId/quiz" element={<QuizPage books={books} userEmail={userEmail} />} />
      <Route path="/books/:bookId/results/:attemptId" element={<ResultsPage books={books} />} />

      {/* Layout-wrapped pages */}
      <Route element={<Layout role={role} userName={userName} onLogout={() => setIsAuthenticated(false)} />}>
        {role === 'teacher' ? (
          <>
            <Route path="/dashboard" element={<TeacherDashboard userEmail={userEmail} />} />
            <Route path="/roster" element={<StudentRoster />} />
            <Route path="/library/manage" element={<TeacherLibraryPage />} />
            <Route path="/library/add" element={<AddBookPage refreshBooks={refreshBooks} />} />
            <Route path="/books/:bookId/quiz-studio" element={<QuizStudioPage books={books} />} />
            <Route path="/assignments" element={<AssignmentManager />} />
            <Route path="/rewards" element={<BadgeManager />} />
            <Route path="/discussions" element={<DiscussionHubPage books={books} role={role} />} />
            <Route path="/books/:bookId/discussion" element={<DiscussionPage books={books} role={role} />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
          </>
        ) : (
          <>
            <Route path="/dashboard" element={<StudentDashboardPage />} />
            <Route path="/library" element={<StudentLibraryPage />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/assignments" element={<StudentAssignmentsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/history" element={<ReadingHistory />} />
            <Route path="/discussions" element={<DiscussionHubPage books={books} role={role} />} />
            <Route path="/books/:bookId/discussion" element={<DiscussionPage books={books} role={role} />} />
          </>
        )}
      </Route>

      <Route path="/login" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
