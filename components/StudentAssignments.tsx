import React from 'react';
import { Book, Assignment } from '../types';
import { supabase } from '../src/lib/supabase';
import { 
  ClipboardList, 
  Clock, 
  Calendar, 
  ArrowRight, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle,
  Search,
  Filter,
  Bookmark,
  Loader2,
  Eye
} from 'lucide-react';

interface StudentAssignmentsProps {
  onReadBook: (book: Book, assignment?: Assignment) => void;
  onTakeQuiz: (book: Book, assignment?: Assignment) => void;
  onViewResults: (book: Book, assignment: Assignment) => void;
  onNavigateToLibrary: () => void;
}

const StudentAssignments: React.FC<StudentAssignmentsProps> = ({ onReadBook, onTakeQuiz, onViewResults, onNavigateToLibrary }) => {
  const [filter, setFilter] = React.useState<'all' | 'todo' | 'completed'>('all');
  const [assignments, setAssignments] = React.useState<Assignment[]>([]);
  const [books, setBooks] = React.useState<Book[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [selectedBook, setSelectedBook] = React.useState<Book | null>(null);
  const [viewMode, setViewMode] = React.useState<'list' | 'assignment-select'>('list');

  // Get current user
  React.useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getCurrentUser();
  }, []);

  // Fetch assignments assigned to current student
  React.useEffect(() => {
    if (!currentUserId) return;

    const fetchAssignments = async () => {
      try {
        setLoading(true);

        // Fetch assignments where student is assigned
        const { data: assignmentStudents, error: asError } = await supabase
          .from('assignment_students')
          .select('assignment_id')
          .eq('student_id', currentUserId);

        if (asError) throw asError;

        const assignmentIds = assignmentStudents?.map(as => as.assignment_id) || [];

        if (assignmentIds.length === 0) {
          setAssignments([]);
          setLoading(false);
          return;
        }

        // Fetch the actual assignments
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('assignments')
          .select('*')
          .in('id', assignmentIds)
          .eq('status', 'published')
          .order('deadline', { ascending: true });

        if (assignmentsError) throw assignmentsError;

        // Fetch books
        const bookIds = assignmentsData?.map(a => a.book_id) || [];
        const { data: booksData, error: booksError } = await supabase
          .from('books')
          .select('*')
          .in('id', bookIds);

        if (booksError) throw booksError;

        console.log('📚 Fetched books data:', booksData);
        console.log('📚 Book IDs:', bookIds);

        // Fetch submissions for these assignments by the current student
        const { data: submissionsData, error: submissionsError } = await supabase
          .from('assignment_submissions')
          .select('id, assignment_id, student_id')
          .in('assignment_id', assignmentIds)
          .eq('student_id', currentUserId);
        if (submissionsError) throw submissionsError;

        // Transform assignments with per-student status
        const transformedAssignments: Assignment[] = assignmentsData?.map(asgn => {
          const hasSubmission = submissionsData?.some(sub => sub.assignment_id === asgn.id);
          let status: Assignment['status'] = 'not-started';
          if (hasSubmission) {
            status = 'closed'; // Use 'closed' to represent completed for student
          }
          return {
            id: asgn.id,
            bookId: asgn.book_id,
            classId: asgn.class_id,
            title: asgn.title,
            instructions: asgn.instructions,
            status,
            deadline: asgn.deadline?.split('T')[0] || '',
            createdAt: asgn.created_at,
            assignedStudentIds: [],
            hasDiscussion: asgn.has_discussion,
            discussionMaxScore: asgn.discussion_max_score,
            enableAutoAIGrading: asgn.enable_auto_ai_grading || false,
            questions: asgn.questions || [],
            totalPoints: asgn.total_points || 0,
            submissions: []
          };
        }) || [];


        // Helper function to get book cover URL from Supabase Storage (copied from Library.tsx)
        const getCoverImageUrl = (bookId: string): string => {
          const { data } = supabase.storage
            .from('book-covers')
            .getPublicUrl(`${bookId}.jpg`);
          // Fallback to placeholder if image doesn't exist
          return data.publicUrl || `https://placehold.co/300x400/6366f1/white?text=${bookId}`;
        };

        // Transform books
        const transformedBooks: Book[] = booksData?.map(book => {
          console.log('🔍 Transforming book:', book.id, 'cover_image_path:', book.cover_image_path);
          return {
            id: book.id,
            title: book.title,
            author: book.author,
            coverImage: getCoverImageUrl(book.id),
            publicationYear: book.publication_year,
            content: book.content || '',
            summary: book.summary || '',
            description: book.summary || '',
            fullDescription: book.summary || '',
            genre: book.genre || '',
            level: 5,
            pageCount: book.pages || 100,
            pages: book.pages || 100,
            isbn: book.isbn || '',
            estimatedTime: `${Math.ceil((book.pages || 100) / 30)} min`
          };
        }) || [];

        console.log('✅ Transformed books:', transformedBooks);

        setAssignments(transformedAssignments);
        setBooks(transformedBooks);
      } catch (error) {
        console.error('Error fetching assignments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [currentUserId]);

  const assignmentsWithBooks = assignments
    .map(asgn => ({
      ...asgn,
      book: books.find(b => b.id === asgn.bookId)
    }))
    .filter(item => {
      if (filter === 'todo') return item.status === 'not-started' || item.status === 'in-progress';
      if (filter === 'completed') return item.status === 'published' || item.status === 'closed';
      return true;
    });

  const isLate = (deadline: string) => new Date(deadline) < new Date();

  // Handle showing assignment selection for a book
  const handleStartMission = (book: Book) => {
    setSelectedBook(book);
    setViewMode('assignment-select');
  };

  // Handle going back to assignment list
  const handleBackToList = () => {
    setSelectedBook(null);
    setViewMode('list');
  };

  // Handle selecting a specific assignment to work on
  const handleSelectAssignment = (assignment: Assignment, book: Book) => {
    onTakeQuiz(book, assignment);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={48} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  // Show assignment selection view
  if (viewMode === 'assignment-select' && selectedBook) {
    const bookAssignments = assignmentsWithBooks.filter(item => item.book?.id === selectedBook.id);
    
    return (
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleBackToList}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowRight size={24} className="rotate-180" />
          </button>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Select Assignment</h1>
            <p className="text-slate-600 font-medium mt-1">Choose which assignment to complete for {selectedBook.title}</p>
          </div>
        </div>

        <div className="grid gap-6">
          {bookAssignments.map(item => {
            const assignment = item;
            const late = isLate(assignment.deadline) && (assignment.status === 'not-started' || assignment.status === 'in-progress');

            return (
              <div 
                key={assignment.id}
                className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
                onClick={() => handleSelectAssignment(assignment, selectedBook)}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {assignment.title}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest
                        ${late ? 'bg-rose-50 text-rose-600' : 
                          assignment.status === 'in-progress' ? 'bg-indigo-50 text-indigo-600' : 
                          assignment.status === 'not-started' ? 'bg-slate-50 text-slate-500' : 'bg-emerald-50 text-emerald-600'}
                      `}>
                        {late ? 'Overdue' : 
                          assignment.status === 'in-progress' ? 'In Progress' : 
                          assignment.status === 'not-started' ? 'Not Started' : 'Completed'}
                      </span>
                    </div>

                    {assignment.instructions && (
                      <p className="text-slate-600 mb-4">{assignment.instructions}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 px-3 py-2 rounded-xl">
                        <Calendar size={14} className={late ? 'text-rose-500' : 'text-slate-500'} />
                        Due {assignment.deadline}
                      </div>
                      {assignment.questions && assignment.questions.length > 0 && (
                        <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-2 rounded-xl">
                          <ClipboardList size={14} />
                          {assignment.questions.length} Questions
                        </div>
                      )}
                      {assignment.totalPoints && assignment.totalPoints > 0 && (
                        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-2 rounded-xl">
                          <CheckCircle2 size={14} />
                          {assignment.totalPoints} Points
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <ArrowRight size={24} className="text-indigo-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}

          {bookAssignments.length === 0 && (
            <div className="bg-white p-20 rounded-[4rem] border border-slate-100 shadow-sm text-center">
              <p className="text-slate-600">No assignments found for this book.</p>
              <button 
                onClick={handleBackToList}
                className="mt-6 bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all"
              >
                Back to Assignments
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Classwork</h1>
          <p className="text-slate-600 font-medium mt-1">Active reading missions assigned by your teacher.</p>
        </div>
        
        <div className="bg-slate-100 p-1.5 rounded-2xl flex">
          {[
            { id: 'all', label: 'All' },
            { id: 'todo', label: 'To Do' },
            { id: 'completed', label: 'Done' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6">
        {assignmentsWithBooks.length > 0 ? (
          assignmentsWithBooks.map((item) => {
            const assignment = item;
            const book = item.book;
            
            // Skip if book data is missing
            if (!book) {
              console.warn('Missing book data for assignment:', assignment.id);
              return null;
            }
            
            const late = isLate(assignment.deadline) && (assignment.status === 'not-started' || assignment.status === 'in-progress');

            return (
              <div 
                key={assignment.id} 
                className="bg-white p-6 sm:p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-10 hover:shadow-2xl hover:border-indigo-100 transition-all group relative overflow-hidden"
              >
                {late && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
                )}
                
                <div className="shrink-0 w-32 h-44 bg-slate-50 rounded-3xl overflow-hidden shadow-xl group-hover:scale-105 group-hover:rotate-2 transition-all duration-500">
                  <img 
                    src={book.coverImage || 'https://via.placeholder.com/200x300?text=No+Cover'} 
                    className="w-full h-full object-cover" 
                    alt={book.title}
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      // Only set placeholder once to avoid infinite loop
                      if (!img.src.includes('placeholder')) {
                        console.error('Image failed to load:', book.coverImage);
                        img.src = 'https://via.placeholder.com/200x300?text=No+Cover';
                      }
                    }}
                  />
                </div>

                <div className="flex-1 space-y-4 w-full text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 justify-center md:justify-start">
                    <h3 className="text-2xl font-black text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {assignment.title}
                    </h3>
                    <span className={`w-fit mx-auto md:mx-0 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5
                      ${late ? 'bg-rose-50 text-rose-600' : 
                        assignment.status === 'in-progress' ? 'bg-indigo-50 text-indigo-600' : 
                        assignment.status === 'not-started' ? 'bg-slate-50 text-slate-500' : 'bg-emerald-50 text-emerald-600'}
                    `}>
                      {late && <AlertCircle size={12} />}
                      {late ? 'Overdue' : 
                        assignment.status === 'in-progress' ? 'In Progress' : 
                        assignment.status === 'not-started' ? 'Not Started' : 'Completed'}
                    </span>
                  </div>

                  <p className="text-slate-600 font-bold text-sm uppercase tracking-wider">Book: {book.title} · {book.author}</p>

                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 px-3 py-2 rounded-xl border border-slate-100/50">
                      <Calendar size={14} className={late ? 'text-rose-500' : 'text-slate-500'} />
                      Due {assignment.deadline}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 px-3 py-2 rounded-xl border border-slate-100/50">
                      <Clock size={14} />
                      {book.estimatedTime} read
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    if (assignment.status === 'closed') {
                      onViewResults(book, assignment);
                    } else {
                      handleStartMission(book);
                    }
                  }}
                  className={`w-full md:w-auto px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 hover:scale-105 active:scale-95
                    ${assignment.status === 'not-started' ? 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700' : 
                      assignment.status === 'in-progress' ? 'bg-slate-900 text-white shadow-slate-200 hover:bg-slate-800' : 
                      'bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700'}
                  `}
                >
                  {assignment.status === 'not-started' ? (
                    <>Start Mission <ArrowRight size={20} /></>
                  ) : assignment.status === 'in-progress' ? (
                    <>Continue <ArrowRight size={20} /></>
                  ) : (
                    <>View Results <Eye size={20} /></>
                  )}
                </button>
              </div>
            );
          })
        ) : (
          <div className="bg-white p-20 rounded-[4rem] border border-slate-100 shadow-sm text-center">
            <div className="max-w-lg mx-auto space-y-8">
              <div className="bg-slate-50 w-28 h-28 rounded-[2.5rem] flex items-center justify-center mx-auto text-slate-400 shadow-inner shadow-slate-100/50">
                <ClipboardList size={48} />
              </div>
              <h2 className="text-2xl font-black text-slate-900">No Assignments Yet</h2>
              <p className="text-slate-600 font-medium leading-relaxed">Your teacher hasn't assigned any reading missions yet. Check the library for something to read in the meantime!</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={onNavigateToLibrary}
                  className="bg-indigo-600 text-white px-10 py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
                >
                  Explore Library
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {assignmentsWithBooks.length > 0 && (
        <div className="bg-indigo-600 p-10 rounded-[3.5rem] text-white flex flex-col md:flex-row items-center gap-10 shadow-2xl shadow-indigo-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="bg-white/20 p-6 rounded-[2rem] backdrop-blur-md border border-white/10">
            <Bookmark size={40} className="text-white" />
          </div>
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-black">Reading Streak Challenge</h3>
            <p className="text-indigo-100 mt-2 font-medium">Complete any assignment 2 days before the deadline to earn the "Early Bird" badge!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAssignments;
