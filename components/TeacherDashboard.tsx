
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
  Calendar,
  Loader2
} from 'lucide-react';
import QuizStudio from './QuizStudio';
import { supabase } from '../src/lib/supabase';

interface TeacherDashboardProps {
  userEmail: string;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ userEmail }) => {
  const [view, setView] = React.useState<'overview' | 'studio'>('overview');
  const [loading, setLoading] = React.useState(true);
  const [teacherName, setTeacherName] = React.useState('');
  const [className, setClassName] = React.useState('');
  
  // Stats
  const [avgLexile, setAvgLexile] = React.useState(0);
  const [weeklyBooks, setWeeklyBooks] = React.useState(0);
  const [participation, setParticipation] = React.useState(0);
  
  // Students data
  const [students, setStudents] = React.useState<any[]>([]);
  const [leaderboard, setLeaderboard] = React.useState<any[]>([]);
  
  // Search
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    loadDashboardData();
  }, [userEmail]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Get teacher info
      const { data: teacherData, error: teacherError } = await supabase
        .from('users')
        .select('name, id')
        .eq('email', userEmail)
        .eq('role', 'teacher')
        .single();

      if (teacherError) {
        console.error('❌ Teacher error:', teacherError);
        return;
      }

      if (teacherData) {
        setTeacherName(teacherData.name || userEmail);

        // Get teacher's classes (they might have multiple, just get the first one)
        const { data: classesData, error: classError } = await supabase
          .from('classes')
          .select('name, id')
          .eq('teacher_id', teacherData.id)
          .limit(1);

        const classData = classesData?.[0];

        if (classError) {
          console.error('❌ Class error:', classError);
          return;
        }

        if (classData) {
          setClassName(classData.name || 'My Class');

          // Get students in this class
          const { data: enrollments } = await supabase
            .from('class_enrollments')
            .select('student_id')
            .eq('class_id', classData.id)
            .eq('status', 'active');

          const studentIds = enrollments?.map(e => e.student_id) || [];

          if (studentIds.length > 0) {
            // Get student details
            const { data: studentsData } = await supabase
              .from('users')
              .select('id, name, email, current_lexile_level')
              .in('id', studentIds);

            // Calculate average lexile
            const lexileLevels = studentsData?.map(s => s.current_lexile_level || 0).filter(l => l > 0) || [];
            const avgLex = lexileLevels.length > 0 
              ? Math.round(lexileLevels.reduce((sum, l) => sum + l, 0) / lexileLevels.length)
              : 0;
            setAvgLexile(avgLex);

            // Get quiz attempts from last 7 days
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const { data: recentAttempts } = await supabase
              .from('quiz_attempts')
              .select('student_id, completed_at')
              .in('student_id', studentIds)
              .gte('completed_at', sevenDaysAgo.toISOString())
              .not('completed_at', 'is', null);

            setWeeklyBooks(recentAttempts?.length || 0);

            // Calculate participation
            const activeStudents = new Set(recentAttempts?.map(a => a.student_id) || []);
            const participationRate = studentIds.length > 0 
              ? Math.round((activeStudents.size / studentIds.length) * 100)
              : 0;
            setParticipation(participationRate);

            // Get all quiz attempts for books read count
            const { data: allAttempts } = await supabase
              .from('quiz_attempts')
              .select('student_id, id')
              .in('student_id', studentIds)
              .not('completed_at', 'is', null);

            // Build student stats
            const studentStats = studentsData?.map(student => {
              const attempts = allAttempts?.filter(a => a.student_id === student.id) || [];
              const booksRead = attempts.length;
              const lexile = student.current_lexile_level || 400;
              
              // Calculate growth (mock for now, could be from student_stats table)
              const growth = Math.floor(Math.random() * 40) - 10; // -10 to +30
              
              return {
                id: student.id,
                name: student.name || student.email || 'Unknown',
                email: student.email || '',
                lexile,
                booksRead,
                avatar: (student.name || student.email || 'U')[0].toUpperCase(),
                level: `${lexile}L`,
                progress: `${growth >= 0 ? '+' : ''}${growth}L`,
                comprehension: `${Math.floor(70 + Math.random() * 25)}%`, // Mock
                status: growth > 15 ? 'Excelling' : growth < 0 ? 'Needs Support' : 'On Track'
              };
            }) || [];

            // Sort by books read for leaderboard
            const sorted = [...studentStats].sort((a, b) => b.booksRead - a.booksRead);
            setLeaderboard(sorted.slice(0, 5));

            // For class monitoring, sort by lexile level
            const byLexile = [...studentStats].sort((a, b) => a.lexile - b.lexile);
            setStudents(byLexile);
          } else {
            setStudents([]);
            setLeaderboard([]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };


  if (view === 'studio') {
    return <QuizStudio onBack={() => setView('overview')} />;
  }

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const classStats = [
    { label: 'Avg Lexile', value: `${avgLexile}L`, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Weekly Books', value: weeklyBooks, icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Participation', value: `${participation}%`, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'At Risk', value: '—', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Welcome, {teacherName}
          </h1>
          <p className="text-slate-600 mt-2 font-medium text-lg">
            {className} • {students.length} Students
          </p>
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
              {leaderboard.length > 0 ? (
                leaderboard.map((student, i) => (
                  <div key={student.id} className="flex items-center gap-5">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-lg
                      ${i === 0 ? 'bg-amber-400 text-amber-900' : i === 1 ? 'bg-slate-300 text-slate-700' : 'bg-orange-400 text-orange-900'}
                    `}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black truncate text-base leading-none text-white">{student.name}</p>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">
                        {student.lexile}L • {student.avgScore}% Avg
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-indigo-400 text-lg block leading-none">{student.booksRead}</span>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 block">Books</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-sm font-bold">No quiz data yet</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-6">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <Activity className="text-indigo-600" />
              Class Stats
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <span className="text-sm font-black text-slate-600">Total Students</span>
                <span className="text-xl font-black text-slate-900">{students.length}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <span className="text-sm font-black text-slate-600">Active This Week</span>
                <span className="text-xl font-black text-emerald-600">{Math.round(students.length * participation / 100)}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <span className="text-sm font-black text-slate-600">Total Books Read</span>
                <span className="text-xl font-black text-indigo-600">{leaderboard.reduce((sum, s) => sum + s.booksRead, 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
