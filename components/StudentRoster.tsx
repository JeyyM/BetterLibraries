
import React from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  MoreVertical, 
  TrendingUp, 
  TrendingDown, 
  BookOpen, 
  Award, 
  ChevronRight, 
  X,
  UserPlus,
  Mail,
  GraduationCap,
  Calendar,
  BarChart3,
  CheckCircle2,
  Clock,
  History
} from 'lucide-react';

interface StudentPerformance {
  id: string;
  name: string;
  email: string;
  lexile: number;
  growth: number;
  avgScore: number;
  booksRead: number;
  status: 'Excelling' | 'On Track' | 'Struggling';
  lastActive: string;
  recentBooks: { title: string; score: number; date: string }[];
}

const INITIAL_STUDENTS: StudentPerformance[] = [
  { 
    id: '1', name: 'Maya Smith', email: 'maya.s@school.edu', lexile: 720, growth: 45, avgScore: 94, booksRead: 18, status: 'Excelling', lastActive: '2h ago',
    recentBooks: [
      { title: 'Echoes in the Valley', score: 95, date: 'May 12' },
      { title: 'The Silent Mine', score: 100, date: 'May 08' }
    ]
  },
  { 
    id: '2', name: 'Alex Johnson', email: 'alex.j@school.edu', lexile: 550, growth: 15, avgScore: 88, booksRead: 12, status: 'On Track', lastActive: '5m ago',
    recentBooks: [
      { title: 'Sparky Adventures', score: 85, date: 'May 14' },
      { title: 'Physics Basics', score: 92, date: 'May 10' }
    ]
  },
  { 
    id: '3', name: 'Liam Brown', email: 'liam.b@school.edu', lexile: 410, growth: -5, avgScore: 68, booksRead: 6, status: 'Struggling', lastActive: '1d ago',
    recentBooks: [
      { title: 'Space Race', score: 60, date: 'May 05' },
      { title: 'Robots 101', score: 75, date: 'Apr 28' }
    ]
  },
];

const StudentRoster: React.FC = () => {
  const [students, setStudents] = React.useState<StudentPerformance[]>(INITIAL_STUDENTS);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedStudent, setSelectedStudent] = React.useState<StudentPerformance | null>(null);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [newStudent, setNewStudent] = React.useState({ name: '', email: '', lexile: '400' });

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const student: StudentPerformance = {
      id: Math.random().toString(36).substr(2, 9),
      name: newStudent.name,
      email: newStudent.email,
      lexile: parseInt(newStudent.lexile),
      growth: 0,
      avgScore: 0,
      booksRead: 0,
      status: 'On Track',
      lastActive: 'Never',
      recentBooks: []
    };
    setStudents([...students, student]);
    setShowAddModal(false);
    setNewStudent({ name: '', email: '', lexile: '400' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Manage Enrollment</h1>
          <p className="text-slate-500 font-medium mt-1">Review student performance and manage your class roster.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center gap-3 hover:bg-indigo-700 transition-all hover:scale-105"
        >
          <UserPlus size={20} />
          Add Student
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-slate-900 focus:ring-4 focus:ring-indigo-50 transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          <div className="bg-white border border-slate-100 rounded-2xl px-6 py-4 flex items-center gap-3 shadow-sm">
            <Users className="text-indigo-600" size={20} />
            <span className="text-sm font-black text-slate-700">{students.length} Students</span>
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Performance</th>
                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Growth</th>
                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-indigo-50/30 transition-colors group cursor-pointer" onClick={() => setSelectedStudent(student)}>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 min-w-[3rem] rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-100">
                        {student.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{student.name}</p>
                        <p className="text-xs text-slate-400 font-medium truncate">{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400">
                        <span>Avg Comprehension</span>
                        <span>{student.avgScore}%</span>
                      </div>
                      <div className="w-32 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${student.avgScore >= 90 ? 'bg-emerald-500' : student.avgScore >= 70 ? 'bg-indigo-500' : 'bg-rose-500'}`} 
                          style={{ width: `${student.avgScore}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      {student.growth >= 0 ? (
                        <TrendingUp size={16} className="text-emerald-500" />
                      ) : (
                        <TrendingDown size={16} className="text-rose-500" />
                      )}
                      <span className={`font-black text-sm ${student.growth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {student.growth >= 0 ? `+${student.growth}` : student.growth}L
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-block px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap
                      ${student.status === 'Excelling' ? 'bg-emerald-50 text-emerald-600' : 
                        student.status === 'Struggling' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}
                    `}>
                      {student.status === 'Struggling' ? 'Needs Review' : student.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                      <ChevronRight size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Detail Slide-over/Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedStudent(null)}></div>
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-8 sm:p-12 overflow-y-auto">
              <div className="flex justify-between items-start mb-10">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 min-w-[5rem] rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-indigo-100">
                    {selectedStudent.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-3xl font-black text-slate-900">{selectedStudent.name}</h2>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                        <Mail size={14} />
                        {selectedStudent.email}
                      </span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                        <Clock size={14} />
                        Active {selectedStudent.lastActive}
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedStudent(null)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="grid sm:grid-cols-3 gap-6 mb-12">
                <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100">
                  <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-2">Lexile Level</p>
                  <p className="text-3xl font-black text-indigo-600">{selectedStudent.lexile}L</p>
                  <div className="flex items-center gap-1.5 mt-2 text-xs font-black text-emerald-600 uppercase">
                    <TrendingUp size={14} />
                    +{selectedStudent.growth} Growth
                  </div>
                </div>
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Books Read</p>
                  <p className="text-3xl font-black text-slate-900">{selectedStudent.booksRead}</p>
                  <p className="text-xs font-bold text-slate-400 mt-2">Target: 20 per term</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Avg Score</p>
                  <p className="text-3xl font-black text-slate-900">{selectedStudent.avgScore}%</p>
                  <div className="flex items-center gap-1.5 mt-2 text-xs font-black text-indigo-600 uppercase">
                    <Award size={14} />
                    High Retention
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                    <History className="text-indigo-600" />
                    Recent Activity
                  </h3>
                  <div className="space-y-4">
                    {selectedStudent.recentBooks.length > 0 ? selectedStudent.recentBooks.map((book, i) => (
                      <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-indigo-600">
                            <BookOpen size={20} />
                          </div>
                          <div>
                            <p className="font-black text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{book.title}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{book.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-black text-lg ${book.score >= 90 ? 'text-emerald-500' : 'text-indigo-600'}`}>{book.score}%</p>
                          <p className="text-[10px] font-black text-slate-300 uppercase">Score</p>
                        </div>
                      </div>
                    )) : (
                      <div className="py-12 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-[2rem]">
                        <p className="font-bold">No recent reading sessions found.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                    <BarChart3 className="text-indigo-600" />
                    AI Pedagogical Insight
                  </h3>
                  <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <p className="text-sm font-medium leading-relaxed text-indigo-100">
                      {selectedStudent.status === 'Excelling' 
                        ? `${selectedStudent.name} is demonstrating exceptional semantic comprehension. We recommend moving to higher complexity texts (800L+) to maintain growth trajectory.` 
                        : selectedStudent.status === 'Struggling'
                        ? `${selectedStudent.name} is having difficulty with inference-based questions. Suggest assigned reading focus on "The Silent Mine" series with simplified syntax.`
                        : `${selectedStudent.name} is on track with class averages. Retention is high, but reading speed could be improved with more independent reading sessions.`
                      }
                    </p>
                    <div className="mt-6 flex items-center gap-4">
                       <button className="bg-white text-slate-900 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-400 hover:text-white transition-all">
                         Print Full Report
                       </button>
                    </div>
                  </div>
                  
                  <div className="bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-emerald-500 text-white rounded-xl">
                        <CheckCircle2 size={20} />
                      </div>
                      <h4 className="font-black text-emerald-900 text-sm">Action Items</h4>
                    </div>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3 text-xs font-bold text-emerald-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        Assign "Mystery in Space" (700L)
                      </li>
                      <li className="flex items-center gap-3 text-xs font-bold text-emerald-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        Review Inference Quiz #4 results together
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => setShowAddModal(false)}></div>
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 sm:p-12">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Enroll Student</h2>
                  <p className="text-sm text-slate-400 font-medium">Add a new learner to Grade 7B.</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-900">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddStudent} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Full Name</label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. Charlie Parker"
                      value={newStudent.name}
                      onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 text-slate-900 focus:ring-4 focus:ring-indigo-50 font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input 
                      required
                      type="email" 
                      placeholder="charlie.p@school.edu"
                      value={newStudent.email}
                      onChange={e => setNewStudent({...newStudent, email: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 text-slate-900 focus:ring-4 focus:ring-indigo-50 font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Starting Lexile</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <select 
                      value={newStudent.lexile}
                      onChange={e => setNewStudent({...newStudent, lexile: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 text-slate-900 focus:ring-4 focus:ring-indigo-50 font-black"
                    >
                      <option value="300">300L (Beginner)</option>
                      <option value="450">450L (Standard)</option>
                      <option value="600">600L (Intermediate)</option>
                      <option value="800">800L (Advanced)</option>
                    </select>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
                >
                  <Plus size={20} />
                  Complete Enrollment
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentRoster;
