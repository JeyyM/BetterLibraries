
import React from 'react';
import { MOCK_BOOKS, MOCK_ASSIGNMENTS, CURRENT_USER } from '../constants';
import { Book, Assignment } from '../types';
import { 
  TrendingUp, 
  BookOpen, 
  CheckCircle, 
  Award, 
  ArrowRight, 
  Star, 
  PieChart, 
  Clock, 
  Target, 
  Bookmark, 
  Sparkles, 
  Activity,
  Medal,
  Flame,
  Zap,
  ChevronRight
} from 'lucide-react';

interface StudentDashboardProps {
  onReadBook: (book: Book) => void;
  onNavigateToBadges: () => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ onReadBook, onNavigateToBadges }) => {
  const stats = [
    { label: 'Books Read', value: '12', icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Avg Score', value: '88%', icon: Award, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Growth', value: '+45L', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Streak', value: '5d', icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  const currentAssignments = MOCK_ASSIGNMENTS.map(a => ({
    ...a,
    book: MOCK_BOOKS.find(b => b.id === a.bookId)
  })).filter(a => a.book) as (Assignment & { book: Book })[];

  const recentBadges = CURRENT_USER.badges.filter(b => b.dateEarned).slice(0, 3);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-600 w-fit rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100 animate-pulse">
            <Flame size={12} fill="currentColor" />
            5 Day Streak! You're on Fire
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">Hello, Alex! 👋</h1>
          <p className="text-slate-600 text-lg font-medium">You're just <span className="text-indigo-600 font-bold">2 books away</span> from your May goal!</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
           <div className="flex -space-x-3">
             {[1, 2, 3].map(i => (
               <div key={i} className={`w-10 h-10 rounded-full border-2 border-white flex items-center justify-center bg-indigo-${100 * i} text-indigo-600 font-black text-xs`}>
                 {['M', 'S', 'L'][i-1]}
               </div>
             ))}
             <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-600">
               +12
             </div>
           </div>
           <p className="text-xs font-bold text-slate-700">Your class is reading now</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-default">
            <div className={`${stat.bg} ${stat.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
              <stat.icon size={28} />
            </div>
            <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <div className="w-1 h-8 bg-indigo-600 rounded-full"></div>
              Your Reading List
            </h2>
            <button className="text-indigo-600 text-sm font-black uppercase tracking-widest hover:underline">View All</button>
          </div>
          
          <div className="grid gap-6">
            {currentAssignments.map((assignment) => (
              <div key={assignment.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center gap-8 hover:shadow-2xl hover:border-indigo-100 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Bookmark className="text-indigo-100" size={32} />
                </div>
                
                <div className="relative shrink-0 w-full sm:w-auto flex justify-center">
                  <img 
                    src={assignment.book.coverImage} 
                    alt={assignment.book.title} 
                    className="w-28 h-40 object-cover rounded-2xl shadow-xl group-hover:scale-105 group-hover:rotate-2 transition-all duration-500"
                  />
                  <div className="absolute -top-3 -right-3 bg-white px-3 py-1.5 rounded-xl text-[11px] font-black text-indigo-600 shadow-xl border border-slate-50">
                    {assignment.book.level}L
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-4 w-full">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {assignment.book.title}
                    </h3>
                    <p className="text-slate-600 font-bold text-sm uppercase tracking-wider mt-1">By {assignment.book.author}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-600">
                      <span>Reading Progress</span>
                      <span>{assignment.status === 'in-progress' ? '65%' : '0%'}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full rounded-full transition-all duration-1000" 
                        style={{ width: assignment.status === 'in-progress' ? '65%' : '0%' }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg">
                      <Clock size={14} />
                      {assignment.book.estimatedTime}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg">
                      <Target size={14} />
                      {assignment.book.genre}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => onReadBook(assignment.book)}
                  className="w-full sm:w-auto bg-slate-900 text-white px-8 py-5 rounded-[1.5rem] hover:bg-indigo-600 transition-all shadow-xl hover:shadow-indigo-200 flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest"
                >
                  Continue
                  <ArrowRight size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>

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
              {recentBadges.map((badge) => (
                <div key={badge.id} className="flex flex-col items-center gap-2 group/badge cursor-help" title={badge.description}>
                  <div className={`w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-2xl group-hover/badge:scale-110 transition-transform duration-300`}>
                    {badge.icon === 'Flame' && <Flame className="text-orange-500" fill="currentColor" />}
                    {badge.icon === 'Award' && <Award className="text-indigo-400" />}
                    {badge.icon === 'Compass' && <Zap className="text-emerald-400" />}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 text-center line-clamp-1">{badge.name}</span>
                </div>
              ))}
              <div className="flex flex-col items-center gap-2 opacity-40">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-dashed border-white/20 flex items-center justify-center">
                  <Star size={20} className="text-slate-500" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Locked</span>
              </div>
            </div>
            <button 
              onClick={onNavigateToBadges}
              className="mt-8 w-full py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              View Achievement Hall
            </button>
          </div>

          {/* Class Standings */}
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <Trophy className="text-indigo-600" />
              Class Standings
            </h2>
            <div className="space-y-4">
               {[
                 { name: 'Maya S.', score: 2450, rank: 1, current: false },
                 { name: 'Lucas P.', score: 2100, rank: 2, current: false },
                 { name: 'Emma W.', score: 1980, rank: 3, current: false },
                 { name: 'You (Alex)', score: 1850, rank: 4, current: true },
                 { name: 'Oliver D.', score: 1720, rank: 5, current: false },
               ].map((item, i) => (
                 <div key={i} className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${item.current ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-105' : 'hover:bg-slate-50'}`}>
                   <span className={`w-6 text-xs font-black ${item.current ? 'text-white' : 'text-slate-600'}`}>{item.rank}</span>
                   <span className={`flex-1 text-sm font-bold ${item.current ? 'text-white' : 'text-slate-900'}`}>{item.name}</span>
                   <span className={`text-xs font-black ${item.current ? 'text-indigo-200' : 'text-slate-600'}`}>{item.score} pts</span>
                 </div>
               ))}
            </div>
            <p className="text-[10px] text-center text-slate-600 font-bold uppercase tracking-widest">
              Top 5 readers this week
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Trophy = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

export default StudentDashboard;
