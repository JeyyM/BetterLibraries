
import React from 'react';
import { Book, QuizAttempt } from '../types';
import { PartyPopper, ArrowLeft, BarChart3, Star, Zap, Info, ThumbsUp } from 'lucide-react';

interface ResultsViewProps {
  book: Book;
  attempt: QuizAttempt;
  onClose: () => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({ book, attempt, onClose }) => {
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

      <div className="grid md:grid-cols-3 gap-8">
        {/* Score Card */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 text-center flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <PartyPopper className="text-amber-400 rotate-12" size={32} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Overall Score</p>
          <div className="relative">
            <svg className="w-40 h-40 transform -rotate-90">
              <circle cx="80" cy="80" r="70" className="stroke-slate-100" strokeWidth="12" fill="none" />
              <circle 
                cx="80" cy="80" r="70" 
                className="stroke-indigo-500 transition-all duration-1000" 
                strokeWidth="12" 
                strokeDasharray={440} 
                strokeDashoffset={440 - (440 * attempt.score) / 100} 
                strokeLinecap="round" 
                fill="none" 
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-4xl font-black text-slate-900">{attempt.score}%</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mastery</span>
            </div>
          </div>
          <div className="mt-8 bg-indigo-50 text-indigo-700 px-6 py-2 rounded-2xl text-sm font-bold">
            {attempt.score >= 80 ? 'Mastery Achieved' : attempt.score >= 60 ? 'Good Progress' : 'Needs Review'}
          </div>
        </div>

        {/* AI Insight Card */}
        <div className="md:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
          <div className="flex items-center gap-3 text-indigo-600">
            <Zap size={24} className="fill-indigo-100" />
            <h3 className="text-xl font-black uppercase tracking-tight">AI Reading Insights</h3>
          </div>
          
          <div className="space-y-6">
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

      {/* Recommended Next Step */}
      <div className="mt-8 bg-slate-900 text-white p-8 sm:p-12 rounded-[3.5rem] relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full -mr-20 -mt-20 blur-3xl transition-all group-hover:bg-indigo-600/30"></div>
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="text-center sm:text-left">
            <h3 className="text-2xl font-black mb-2">Ready for the next challenge?</h3>
            <p className="text-slate-400 font-medium">Your level has increased to <span className="text-indigo-400 font-black">565L</span> after this reading!</p>
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
