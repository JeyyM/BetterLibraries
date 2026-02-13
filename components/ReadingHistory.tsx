
import React from 'react';
import { MOCK_BOOKS, MOCK_HISTORY } from '../constants';
import { QuizAttempt, Book } from '../types';
import { Search, Calendar, ChevronRight, BarChart3, Clock, Sparkles, BookOpen, Trash2, ArrowLeft } from 'lucide-react';
import ResultsView from './ResultsView';

const ReadingHistory: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedAttempt, setSelectedAttempt] = React.useState<{ book: Book, attempt: QuizAttempt } | null>(null);

  const historyWithBooks = MOCK_HISTORY.map(attempt => {
    // Note: In a real app, you'd match by bookId. Here we'll simulate based on the quizId suffix
    const book = MOCK_BOOKS.find(b => attempt.quizId.includes(b.title.toLowerCase().split(' ')[0])) || MOCK_BOOKS[0];
    return { attempt, book };
  }).filter(item => item.book.title.toLowerCase().includes(searchTerm.toLowerCase()));

  if (selectedAttempt) {
    return (
      <ResultsView 
        book={selectedAttempt.book} 
        attempt={selectedAttempt.attempt} 
        onClose={() => setSelectedAttempt(null)} 
      />
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
        {historyWithBooks.length > 0 ? historyWithBooks.map(({ attempt, book }) => (
          <div 
            key={attempt.id}
            onClick={() => setSelectedAttempt({ book, attempt })}
            className="bg-white p-6 sm:p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col sm:flex-row items-center gap-8 cursor-pointer relative overflow-hidden"
          >
            {/* Visual indicator of score */}
            <div className={`absolute left-0 top-0 bottom-0 w-2 ${attempt.score >= 85 ? 'bg-emerald-500' : attempt.score >= 70 ? 'bg-indigo-500' : 'bg-rose-500'}`} />
            
            <div className="shrink-0 w-24 h-32 bg-slate-50 rounded-2xl overflow-hidden shadow-md">
              <img src={book.coverImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={book.title} />
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
                  AI Report Ready
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
            <p className="text-slate-600 mt-2 font-medium">Complete your first quiz to see your history here!</p>
          </div>
        )}
      </div>

      {historyWithBooks.length > 0 && (
        <div className="bg-slate-900 p-10 rounded-[4rem] text-white relative overflow-hidden group shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="bg-white/10 p-6 rounded-[2.5rem] backdrop-blur-md border border-white/5">
              <BarChart3 size={48} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black">Growth Analytics</h2>
              <p className="text-slate-400 mt-2 leading-relaxed">Your average comprehension score is <span className="text-indigo-400 font-black">88.5%</span> across {MOCK_HISTORY.length} books. You're showing strong aptitude for Science Fiction texts!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReadingHistory;
