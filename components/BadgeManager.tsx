
import React from 'react';
import { Badge } from '../types';
import { 
  Plus, 
  Sparkles, 
  Award, 
  Flame, 
  Zap, 
  Star, 
  Compass, 
  BookMarked, 
  Trophy, 
  Search, 
  ChevronRight,
  MoreVertical,
  X,
  Palette,
  LayoutGrid,
  Info
} from 'lucide-react';

const ICONS = [
  { name: 'Award', icon: Award },
  { name: 'Flame', icon: Flame },
  { name: 'Zap', icon: Zap },
  { name: 'Star', icon: Star },
  { name: 'Compass', icon: Compass },
  { name: 'BookMarked', icon: BookMarked },
  { name: 'Trophy', icon: Trophy }
];

const COLORS = [
  'text-indigo-500', 'text-amber-500', 'text-emerald-500', 'text-rose-500', 'text-orange-500', 'text-sky-500', 'text-purple-500'
];

const BadgeManager: React.FC = () => {
  const [showCreate, setShowCreate] = React.useState(false);
  const [newBadge, setNewBadge] = React.useState<Partial<Badge>>({
    name: '',
    description: '',
    instructions: '',
    icon: 'Award',
    color: 'text-indigo-500'
  });

  const teacherBadges: Badge[] = [
    { id: 'tb-1', name: 'Creative Writer', description: 'Exceptional detail in essay answers.', instructions: 'Submit 3 essay responses that score 95% or higher on the depth scale.', icon: 'Star', color: 'text-purple-500', createdBy: 'teacher' },
    { id: 'tb-2', name: 'Peer Support', description: 'Helping others in the discussion forum.', instructions: 'Receive 5 positive peer endorsements for helpful reading annotations.', icon: 'Compass', color: 'text-sky-500', createdBy: 'teacher' }
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Reward Studio</h1>
          <p className="text-slate-600 mt-2 font-medium">Create custom achievements to motivate your unique classroom culture.</p>
        </div>
        <button 
          onClick={() => setShowCreate(true)}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center gap-3 hover:scale-105 transition-all"
        >
          <Plus size={20} />
          New Badge
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          <section className="space-y-6">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <LayoutGrid className="text-indigo-600" />
              Classroom Rewards
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {teacherBadges.map(badge => (
                <div key={badge.id} className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col gap-6">
                  <div className="flex items-start gap-6">
                    <div className={`w-16 h-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center ${badge.color} group-hover:scale-110 transition-transform`}>
                       <Award size={32} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-black text-slate-900 text-lg leading-tight">{badge.name}</h3>
                        <button className="text-slate-300 hover:text-slate-600">
                          <MoreVertical size={18} />
                        </button>
                      </div>
                      <p className="text-sm text-slate-600 mt-2 font-medium">{badge.description}</p>
                    </div>
                  </div>

                  {badge.instructions && (
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Info size={14} className="text-indigo-500" />
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">How to earn</p>
                      </div>
                      <p className="text-xs font-bold text-slate-700 leading-relaxed">{badge.instructions}</p>
                    </div>
                  )}

                  <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Awarded to 4 students</span>
                    <button className="text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:underline">Award Now</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="lg:col-span-4 space-y-8">
           <div className="bg-slate-900 text-white p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
             <h2 className="text-2xl font-black mb-8 flex items-center gap-3 text-white">
               <Trophy className="text-amber-400" />
               Recent Laureates
             </h2>
             <div className="space-y-6">
                {[
                  { name: 'Alex Johnson', badge: 'Creative Writer', time: '2h ago' },
                  { name: 'Maya Smith', badge: 'Reading streak', time: 'Yesterday' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-black text-xs text-indigo-400">
                      {item.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-100">{item.name}</p>
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Earned {item.badge}</p>
                    </div>
                  </div>
                ))}
             </div>
           </div>
        </aside>
      </div>

      {/* Create Badge Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => setShowCreate(false)}></div>
          <div className="bg-white w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[3.5rem] shadow-2xl relative animate-in zoom-in-95 duration-300">
            <div className="p-8 sm:p-12">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black text-slate-900">Craft New Badge</h2>
                <button onClick={() => setShowCreate(false)} className="p-2 text-slate-400 hover:text-slate-900">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-8">
                <div className="flex justify-center mb-10">
                  <div className={`w-32 h-32 rounded-[2.5rem] bg-slate-50 border-4 border-slate-100 flex items-center justify-center ${newBadge.color} shadow-inner`}>
                    <Award size={64} />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Badge Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Science Star"
                      value={newBadge.name}
                      onChange={e => setNewBadge({...newBadge, name: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-indigo-50" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Quick Goal</label>
                    <select className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-black text-slate-900">
                      <option>Manual Award</option>
                      <option>Complete Assignment</option>
                      <option>Score 90%+</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Brief Tagline</label>
                   <input 
                     type="text"
                     placeholder="Awarded for demonstrating keen insight..."
                     value={newBadge.description}
                     onChange={e => setNewBadge({...newBadge, description: e.target.value})}
                     className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-indigo-50" 
                   />
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Detailed Instructions (Visible to Students)</label>
                   <textarea 
                     placeholder="To earn this badge, students must..."
                     value={newBadge.instructions}
                     onChange={e => setNewBadge({...newBadge, instructions: e.target.value})}
                     className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-slate-900 placeholder-slate-400 resize-none focus:ring-4 focus:ring-indigo-50" rows={3} 
                   />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-4 flex items-center gap-2">
                    <Palette size={14} /> Color Scheme
                  </label>
                  <div className="flex gap-3">
                    {COLORS.map(c => (
                      <button 
                        key={c} 
                        onClick={() => setNewBadge({...newBadge, color: c})}
                        className={`w-8 h-8 rounded-full ${c.replace('text', 'bg')} transition-transform ${newBadge.color === c ? 'scale-125 ring-4 ring-slate-100' : 'hover:scale-110'}`} 
                      />
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => setShowCreate(false)}
                  className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
                >
                  <Sparkles size={20} />
                  Create Reward
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BadgeManager;
