
import React from 'react';
import { CURRENT_USER } from '../constants';
import { Badge } from '../types';
import { Medal, Award, Star, Flame, Zap, Compass, BookMarked, ArrowLeft, Trophy, Users, ShieldCheck } from 'lucide-react';

const badgeIcons: Record<string, any> = {
  Medal, Award, Star, Flame, Zap, Compass, BookMarked
};

const Achievements: React.FC = () => {
  const earnedBadges = CURRENT_USER.badges.filter(b => b.dateEarned);
  const inProgressBadges = CURRENT_USER.badges.filter(b => !b.dateEarned);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">Achievements</h1>
          <p className="text-slate-600 mt-2 font-medium text-lg">Your collection of milestones and reading rewards.</p>
        </div>
        <div className="flex items-center gap-4 bg-indigo-600 text-white p-6 rounded-[2.5rem] shadow-xl shadow-indigo-100">
           <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
             <Trophy size={28} />
           </div>
           <div>
             <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Total Points</p>
             <p className="text-3xl font-black">1,850</p>
           </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          {/* Earned Badges */}
          <section className="space-y-6">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <ShieldCheck className="text-emerald-500" />
              Earned Badges
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {earnedBadges.map(badge => {
                const Icon = badgeIcons[badge.icon] || Star;
                return (
                  <div key={badge.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 hover:shadow-xl transition-all group">
                    <div className={`w-16 h-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className={badge.color} size={32} fill={badge.icon === 'Flame' ? 'currentColor' : 'none'} />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900">{badge.name}</h3>
                      <p className="text-xs text-slate-600 mt-1 font-medium">{badge.description}</p>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-2">Earned {badge.dateEarned}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* In Progress */}
          <section className="space-y-6">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <Zap className="text-amber-500" />
              In Progress
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {inProgressBadges.map(badge => {
                const Icon = badgeIcons[badge.icon] || Star;
                return (
                  <div key={badge.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 opacity-80">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center grayscale">
                      <Icon className="text-slate-300" size={32} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-black text-slate-900">{badge.name}</h3>
                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full bg-indigo-500 rounded-full`} style={{ width: `${badge.progress}%` }}></div>
                        </div>
                        <span className="text-[10px] font-black text-slate-500">{badge.progress}%</span>
                      </div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">{badge.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Full Leaderboard for Students */}
        <aside className="space-y-8">
          <div className="bg-slate-900 text-white p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
            <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
              <Users className="text-indigo-400" />
              Class Leaderboard
            </h2>
            <div className="space-y-6">
              {[
                { name: 'Maya Smith', pts: 2450, rank: 1 },
                { name: 'Lucas P.', pts: 2100, rank: 2 },
                { name: 'Emma W.', pts: 1980, rank: 3 },
                { name: 'You (Alex)', pts: 1850, rank: 4, active: true },
                { name: 'Oliver D.', pts: 1720, rank: 5 },
                { name: 'Sophia J.', pts: 1650, rank: 6 },
                { name: 'Liam B.', pts: 1590, rank: 7 },
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${item.active ? 'bg-indigo-600 shadow-xl' : 'hover:bg-white/5'}`}>
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${item.rank <= 3 ? 'bg-amber-400 text-amber-900' : 'bg-white/10 text-slate-300'}`}>
                    {item.rank}
                  </span>
                  <div className="flex-1">
                    <p className={`font-bold ${item.active ? 'text-white' : 'text-slate-300'}`}>{item.name}</p>
                  </div>
                  <span className={`font-black text-sm ${item.active ? 'text-indigo-200' : 'text-slate-400'}`}>{item.pts}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-indigo-600 p-8 rounded-[3rem] text-white shadow-xl shadow-indigo-100">
             <div className="flex items-center gap-3 mb-4">
                <Star className="text-amber-300 fill-amber-300" />
                <h3 className="text-xl font-black">Pro Tip</h3>
             </div>
             <p className="text-sm font-medium text-indigo-100 leading-relaxed">
               Earned 100% on your next quiz to jump into the Top 3! Consistency is the key to climbing the ranks.
             </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Achievements;
