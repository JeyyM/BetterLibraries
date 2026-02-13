
import React from 'react';
import { MOCK_BOOKS, MOCK_ASSIGNMENTS, CURRENT_USER } from '../constants';
import { Book, Assignment } from '../types';
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
  Bookmark
} from 'lucide-react';

interface StudentAssignmentsProps {
  onReadBook: (book: Book) => void;
  onNavigateToLibrary: () => void;
}

const StudentAssignments: React.FC<StudentAssignmentsProps> = ({ onReadBook, onNavigateToLibrary }) => {
  const [filter, setFilter] = React.useState<'all' | 'todo' | 'completed'>('all');

  const assignmentsWithBooks = MOCK_ASSIGNMENTS
    .filter(asgn => asgn.assignedStudentIds.includes(CURRENT_USER.id))
    .map(asgn => ({
      ...asgn,
      book: MOCK_BOOKS.find(b => b.id === asgn.bookId)
    }))
    .filter(item => {
      if (filter === 'todo') return item.status === 'not-started' || item.status === 'in-progress';
      if (filter === 'completed') return item.status === 'published' || item.status === 'closed';
      return true;
    });

  const isLate = (deadline: string) => new Date(deadline) < new Date();

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
            const book = item.book!;
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
                  <img src={book.coverImage} className="w-full h-full object-cover" alt={book.title} />
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
                  onClick={() => onReadBook(book)}
                  className={`w-full md:w-auto px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 hover:scale-105 active:scale-95
                    ${assignment.status === 'not-started' ? 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700' : 
                      assignment.status === 'in-progress' ? 'bg-slate-900 text-white shadow-slate-200 hover:bg-slate-800' : 
                      'bg-slate-100 text-slate-500 cursor-not-allowed shadow-none'}
                  `}
                  disabled={assignment.status === 'published' || assignment.status === 'closed'}
                >
                  {assignment.status === 'not-started' ? 'Start Mission' : 
                   assignment.status === 'in-progress' ? 'Continue' : 'Finished'}
                  <ArrowRight size={20} />
                </button>
              </div>
            );
          })
        ) : (
          <div className="bg-white p-20 rounded-[4rem] border border-slate-100 shadow-sm text-center">
            <div className="max-w-lg mx-auto space-y-8">
              <div className="bg-emerald-50 w-28 h-28 rounded-[2.5rem] flex items-center justify-center mx-auto text-emerald-600 shadow-inner shadow-emerald-100/50">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="text-2xl font-black text-slate-900">All caught up!</h2>
              <p className="text-slate-600 font-medium leading-relaxed">You've finished all assigned readings from your teacher. Check the library for something new or revisit your history!</p>
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
