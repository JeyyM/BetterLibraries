
import React from 'react';
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  AlertCircle, 
  Search, 
  Filter, 
  ChevronRight, 
  Trophy, 
  Activity, 
  Eye, 
  Zap, 
  ArrowUpRight,
  MoreVertical,
  Calendar
} from 'lucide-react';
import QuizStudio from './QuizStudio';

const TeacherDashboard: React.FC = () => {
  const [view, setView] = React.useState<'overview' | 'studio'>('overview');
  const [liveActivities, setLiveActivities] = React.useState([
    { id: 1, student: 'Alex Johnson', action: 'Answered Q3', detail: 'Correctly', time: 'Just now', type: 'positive' },
    { id: 2, student: 'Maya Smith', action: 'Completed Chapter 2', detail: 'Reading Session', time: '2m ago', type: 'info' },
    { id: 3, student: 'Liam Brown', action: 'Failed Quiz', detail: 'Score: 40%', time: '15m ago', type: 'alert' },
  ]);

  // Simulate "Live" updates locally
  React.useEffect(() => {
    if (view !== 'overview') return;
    const names = ['Sophia', 'Lucas', 'Emma', 'Oliver'];
    const actions = ['Started Reading', 'Completed Quiz', 'Bookmarked Page', 'Opened Dictionary'];
    const interval = setInterval(() => {
      const newAct = {
        id: Date.now(),
        student: names[Math.floor(Math.random() * names.length)],
        action: actions[Math.floor(Math.random() * actions.length)],
        detail: 'Simulated interaction',
        time: 'Just now',
        type: 'info'
      };
      setLiveActivities(prev => [newAct, ...prev.slice(0, 4)]);
    }, 15000);
    return () => clearInterval(interval);
  }, [view]);

  if (view === 'studio') {
    return <QuizStudio onBack={() => setView('overview')} />;
  }

  const students = [
    { name: 'Maya Smith', level: '720L', progress: '+45L', lastBook: 'Echoes', status: 'Excelling', score: 98, avatar: 'M' },
    { name: 'Alex Johnson', level: '550L', progress: '+15L', lastBook: 'Sparky', status: 'On Track', score: 88, avatar: 'A' },
    { name: 'Sophia Davis', level: '600L', progress: '+10L', lastBook: 'Sparky', status: 'On Track', score: 92, avatar: 'S' },
    { name: 'Liam Brown', level: '410L', progress: '-5L', lastBook: 'Physics', status: 'Needs Review', score: 65, avatar: 'L' },
    { name: 'Ethan Hunt', level: '580L', progress: '+20L', lastBook: 'Echoes', status: 'On Track', score: 85, avatar: 'E' },
  ];

  const classStats = [
    { label: 'Class Average', value: '570L', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Weekly Books', value: '42', icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Participation', value: '94%', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'At Risk', value: '3', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">Grade 7B Hub</h1>
          <p className="text-slate-600 mt-2 font-medium text-lg">You have <span className="text-indigo-600 font-bold">3 students</span> currently struggling with retention.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-slate-200 px-6 py-4 rounded-2xl text-sm font-black text-slate-600 hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2 uppercase tracking-widest">
            <Calendar size={18} />
            Reports
          </button>
          <button 
            onClick={() => setView('studio')}
            className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-sm font-black shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center gap-3 uppercase tracking-widest"
          >
            <Zap size={18} className="text-amber-400 fill-amber-400" />
            Quiz Studio
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {classStats.map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group">
            <div className={`${stat.bg} ${stat.color} w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <stat.icon size={32} />
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-10">
          <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-10 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-8">
              <div>
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                  <Users className="text-indigo-600" />
                  Class Monitoring
                </h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2">Active Student Roster</p>
              </div>
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" placeholder="Search roster..." className="pl-12 pr-6 py-3.5 bg-slate-50 border-none rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-indigo-50 font-bold w-full sm:w-64" />
                </div>
                <button className="p-3.5 bg-slate-50 text-slate-400 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                  <Filter size={22} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                    <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Growth</th>
                    <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Comprehension</th>
                    <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-10 py-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {students.map((student, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 min-w-[3rem] rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-base shadow-lg shadow-indigo-100">
                            {student.avatar}
                          </div>
                          <div className="min-w-0">
                            <span className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors block leading-none truncate">{student.name}</span>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 block">{student.level}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-black flex items-center gap-1 ${student.progress.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {student.progress}
                            <ArrowUpRight size={14} className={student.progress.startsWith('+') ? '' : 'rotate-90'} />
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${student.score >= 90 ? 'bg-emerald-500' : student.score >= 80 ? 'bg-indigo-500' : 'bg-rose-500'}`} 
                              style={{ width: `${student.score}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-black text-slate-700">{student.score}%</span>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <span className={`inline-block px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap
                          ${student.status === 'Excelling' ? 'bg-emerald-100 text-emerald-600' : 
                            student.status === 'Needs Review' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-50 text-indigo-600'}
                        `}>
                          {student.status}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                          <MoreVertical size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
              <button className="text-indigo-600 font-black text-xs uppercase tracking-widest hover:underline flex items-center justify-center gap-2 mx-auto">
                Expand Roster
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-12">
          <div className="bg-slate-900 text-white p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-indigo-500/20 transition-all"></div>
            <h2 className="text-2xl font-black mb-10 flex items-center gap-3">
              <Trophy className="text-amber-400 fill-amber-400" />
              Leaderboard
            </h2>
            <div className="space-y-8">
              {students.sort((a, b) => b.score - a.score).slice(0, 3).map((student, i) => (
                <div key={i} className="flex items-center gap-5">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-lg
                    ${i === 0 ? 'bg-amber-400 text-amber-900' : i === 1 ? 'bg-slate-300 text-slate-700' : 'bg-orange-400 text-orange-900'}
                  `}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black truncate text-base leading-none text-white">{student.name}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">{student.lastBook}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-indigo-400 text-lg block leading-none">{student.score}</span>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 block">Points</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-12 py-4 bg-white/5 hover:bg-white/10 transition-all rounded-2xl text-xs font-black uppercase tracking-widest border border-white/10">
              Full Standings
            </button>
          </div>

          <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-10">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <Activity className="text-indigo-600" />
              Live Feed
            </h2>
            <div className="space-y-8">
              {liveActivities.map((act) => (
                <div key={act.id} className="flex gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 shadow-sm
                    ${act.type === 'alert' ? 'bg-rose-500 animate-pulse' : 
                      act.type === 'positive' ? 'bg-emerald-500' : 'bg-indigo-500'}
                  `}></div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-900 leading-tight">
                      {act.student} <span className="text-slate-500 font-bold ml-1 uppercase text-[10px] tracking-widest">· {act.time}</span>
                    </p>
                    <p className="text-xs text-slate-600 mt-2 font-medium">
                      {act.action}: <span className="font-black text-indigo-600">{act.detail}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
