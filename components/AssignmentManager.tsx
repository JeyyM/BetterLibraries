
import React from 'react';
import { Book, Assignment, Submission } from '../types';
import { MOCK_BOOKS } from '../constants';
import { evaluateAnswer } from '../services/geminiService';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  ArrowLeft,
  BookOpen,
  User,
  Star,
  Sparkles,
  Send,
  Wand2,
  Bell,
  MoreVertical,
  Filter,
  Users,
  MessageSquare,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

const MOCK_ASSIGNMENTS_DETAILED: Assignment[] = [
  {
    id: 'asgn-1',
    bookId: '1',
    title: 'Character Analysis: Sparky',
    status: 'published',
    deadline: '2024-05-15',
    createdAt: '2024-05-01',
    assignedStudentIds: ['1', '2', '3', '4', '5'],
    hasDiscussion: true,
    discussionMaxScore: 10,
    submissions: [
      {
        id: 'sub-1',
        studentId: '1',
        studentName: 'Maya Smith',
        submittedAt: '2024-05-12 10:00',
        isReviewed: true,
        totalScore: 95,
        answers: []
      },
      {
        id: 'sub-2',
        studentId: '2',
        studentName: 'Alex Johnson',
        submittedAt: '2024-05-16 14:30',
        isReviewed: false,
        isLate: true,
        answers: [
          { 
            questionId: 'q-1', 
            studentAnswer: 'Sparky felt a sense of belonging because Maya treated him like a real dog, showing that friendship transcends physical forms.' 
          }
        ]
      }
    ]
  },
  {
    id: 'asgn-2',
    bookId: '3',
    title: 'Physics & Gravity Basics',
    status: 'published',
    deadline: '2024-05-25',
    createdAt: '2024-05-10',
    assignedStudentIds: ['1', '2', '3', '4', '5'],
    submissions: []
  }
];

const ROSTER = [
  { id: '1', name: 'Maya Smith' },
  { id: '2', name: 'Alex Johnson' },
  { id: '3', name: 'Liam Brown' },
  { id: '4', name: 'Sophia Davis' },
  { id: '5', name: 'Ethan Hunt' },
];

const AssignmentManager: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<'create' | 'track'>('track');
  const [step, setStep] = React.useState<'list' | 'form' | 'tracking-view' | 'grading-detail'>('list');
  const [selectedBook, setSelectedBook] = React.useState<Book | null>(null);
  const [selectedAssignment, setSelectedAssignment] = React.useState<Assignment | null>(null);
  const [selectedSubmission, setSelectedSubmission] = React.useState<Submission | null>(null);
  const [gradingFeedback, setGradingFeedback] = React.useState<Record<string, { score: number, feedback: string }>>({});
  const [isEvaluating, setIsEvaluating] = React.useState<string | null>(null);
  const [remindedStudents, setRemindedStudents] = React.useState<Set<string>>(new Set());
  
  // New Mission State
  const [enableDiscussion, setEnableDiscussion] = React.useState(false);
  const [discussionMaxScore, setDiscussionMaxScore] = React.useState(10);

  const handleAutoGrade = async (qId: string, question: string, answer: string) => {
    setIsEvaluating(qId);
    try {
      const result = await evaluateAnswer(question, answer, selectedBook?.content || "");
      setGradingFeedback(prev => ({ ...prev, [qId]: result }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsEvaluating(null);
    }
  };

  const handleRemind = (studentId: string) => {
    setRemindedStudents(prev => new Set([...prev, studentId]));
  };

  const getStudentStatus = (studentId: string, assignment: Assignment) => {
    const submission = assignment.submissions?.find(s => s.studentId === studentId);
    if (submission) {
      if (submission.isReviewed) return { label: 'Graded', color: 'bg-emerald-50 text-emerald-600', score: submission.totalScore };
      if (submission.isLate) return { label: 'Late', color: 'bg-orange-50 text-orange-600' };
      return { label: 'Submitted', color: 'bg-indigo-50 text-indigo-600' };
    }
    const isPastDeadline = new Date().toISOString().split('T')[0] > assignment.deadline;
    return isPastDeadline 
      ? { label: 'Missing', color: 'bg-rose-50 text-rose-600' }
      : { label: 'Pending', color: 'bg-slate-50 text-slate-500' };
  };

  const renderCreate = () => {
    if (step === 'form') {
      return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
          <div className="flex items-center gap-4">
            <button onClick={() => setStep('list')} className="p-2 hover:bg-slate-100 rounded-full">
              <ArrowLeft size={24} />
            </button>
            <h2 className="text-3xl font-black">Create Mission</h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-10">
            <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                <img src={selectedBook?.coverImage} className="w-16 h-24 rounded-2xl object-cover shadow-lg" />
                <div>
                  <p className="font-black text-slate-900">{selectedBook?.title}</p>
                  <p className="text-xs text-slate-500 font-bold uppercase">{selectedBook?.author}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-4 tracking-widest">Mission Title</label>
                  <input type="text" placeholder="e.g. Deep Comprehension - Ch. 1-3" className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-indigo-50 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-4 tracking-widest">Deadline</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input type="date" className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-slate-900" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-4 tracking-widest">Class</label>
                    <select className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-black text-slate-900">
                      <option>Grade 7B</option>
                      <option>Grade 7A</option>
                    </select>
                  </div>
                </div>

                {/* Discussion Board Settings */}
                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${enableDiscussion ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                        <MessageSquare size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">Enable Discussion Board</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Collaborative reading thread</p>
                      </div>
                    </div>
                    <button onClick={() => setEnableDiscussion(!enableDiscussion)} className="text-indigo-600 transition-all">
                      {enableDiscussion ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-slate-300" />}
                    </button>
                  </div>

                  {enableDiscussion && (
                    <div className="pt-4 border-t border-slate-200 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Graded Participation Max Points</label>
                        <input 
                          type="number" 
                          value={discussionMaxScore}
                          onChange={(e) => setDiscussionMaxScore(parseInt(e.target.value))}
                          className="w-20 bg-white border-none rounded-xl py-2 px-3 text-xs font-black text-slate-900 focus:ring-2 focus:ring-indigo-500" 
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-4 tracking-widest">Assignment Type</label>
                  <div className="flex gap-2">
                    {['Individual', 'Group', 'Full Class'].map(type => (
                      <button key={type} className={`px-4 py-2 rounded-xl text-xs font-black uppercase border-2 transition-all ${type === 'Full Class' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-100 text-slate-500'}`}>
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 transition-all">
                Publish Mission
              </button>
            </div>

            <div className="bg-slate-900 text-white p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
               <div className="flex items-center gap-3 mb-8">
                 <Sparkles className="text-indigo-400" />
                 <h3 className="text-xl font-black">Gemini Assistant</h3>
               </div>
               <div className="space-y-6">
                 <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10">
                   <p className="text-sm font-medium leading-relaxed">I've analyzed the complexity of <span className="text-indigo-400">"{selectedBook?.title}"</span>. {enableDiscussion ? 'Discussion boards improve retention by 25% for this genre.' : 'Consider adding a discussion board to boost class engagement.'}</p>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                     <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Target Skill</p>
                     <p className="text-sm font-bold text-white">Inference</p>
                   </div>
                   <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                     <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Difficulty</p>
                     <p className="text-sm font-bold text-white">Adaptive</p>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-black text-slate-900">Select Reading Source</h2>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Search books..." className="bg-white border border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-sm w-64 shadow-sm text-slate-900 font-bold" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_BOOKS.map(book => (
            <button 
              key={book.id} 
              onClick={() => { setSelectedBook(book); setStep('form'); }}
              className="bg-white p-6 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group text-left"
            >
              <div className="aspect-[3/4] rounded-[2rem] overflow-hidden mb-6 relative">
                <img src={book.coverImage} className="w-full h-full object-cover" />
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl text-[10px] font-black text-indigo-600 shadow-sm">
                  {book.level}L
                </div>
              </div>
              <h3 className="font-black text-xl text-slate-900 group-hover:text-indigo-600 transition-colors">{book.title}</h3>
              <p className="text-xs text-slate-500 font-bold uppercase mt-1 tracking-wider">{book.genre}</p>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderTrack = () => {
    if (step === 'grading-detail' && selectedSubmission) {
      return (
        <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500 pb-24">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setStep('tracking-view')} className="p-2 hover:bg-slate-100 rounded-full">
                <ArrowLeft size={24} className="text-slate-600" />
              </button>
              <div>
                <h2 className="text-3xl font-black text-slate-900">{selectedSubmission.studentName}</h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                  Submission for: {selectedAssignment?.title}
                </p>
              </div>
            </div>
            <button className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2">
              <CheckCircle2 size={18} />
              Publish Grade
            </button>
          </div>
          
          <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
             <div className="flex items-center gap-3 mb-8">
               <div className={`p-3 rounded-2xl bg-indigo-50 text-indigo-600`}>
                 <ClipboardList size={24} />
               </div>
               <h3 className="text-xl font-black text-slate-900">Student Response</h3>
             </div>
             {selectedSubmission.answers.map((ans, i) => (
               <div key={i} className="space-y-6">
                 <p className="text-lg font-bold text-slate-900">Explain the main conflict in the story.</p>
                 <div className="bg-slate-50 p-6 rounded-2xl text-slate-700 font-medium italic">"{ans.studentAnswer}"</div>
                 <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-500 ml-4 tracking-widest">Grade</label>
                      <input type="number" className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-black text-slate-900 placeholder-slate-400" placeholder="Score 0-100" />
                    </div>
                    <div className="flex items-end">
                      <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2">
                        <Wand2 size={18} />
                        Auto-Grade
                      </button>
                    </div>
                 </div>
               </div>
             ))}
          </div>
        </div>
      );
    }

    if (step === 'tracking-view' && selectedAssignment) {
      const book = MOCK_BOOKS.find(b => b.id === selectedAssignment.bookId);
      const submissionCount = selectedAssignment.submissions?.length || 0;
      const totalCount = selectedAssignment.assignedStudentIds.length;
      const progress = (submissionCount / totalCount) * 100;

      return (
        <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <button onClick={() => setStep('list')} className="p-2 hover:bg-slate-100 rounded-full">
                <ArrowLeft size={24} className="text-slate-600" />
              </button>
              <div>
                <h2 className="text-3xl font-black text-slate-900">{selectedAssignment.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Target: {book?.title}</span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <span className="text-xs font-bold text-rose-500 uppercase tracking-widest">Deadline: {selectedAssignment.deadline}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
               <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                 <Users className="text-indigo-600" size={18} />
                 <span className="text-sm font-black text-slate-700">{submissionCount}/{totalCount} Completed</span>
               </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-4">
             <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
               <span>Submission Progress</span>
               <span className="text-indigo-600 font-bold">{Math.round(progress)}%</span>
             </div>
             <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
               <div className="bg-indigo-600 h-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
             </div>
          </div>

          <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                    <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Submitted At</th>
                    <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Grade</th>
                    <th className="px-10 py-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {ROSTER.map(student => {
                    const status = getStudentStatus(student.id, selectedAssignment);
                    const submission = selectedAssignment.submissions?.find(s => s.studentId === student.id);
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-indigo-600 font-black text-xs">
                              {student.name.charAt(0)}
                            </div>
                            <span className="font-black text-slate-900">{student.name}</span>
                          </div>
                        </td>
                        <td className="px-10 py-6">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-10 py-6">
                          <span className="text-sm font-bold text-slate-500">
                            {submission?.submittedAt || (status.label === 'Missing' ? 'Never' : '—')}
                          </span>
                        </td>
                        <td className="px-10 py-6">
                           <span className="font-black text-slate-900 text-lg">
                             {status.score !== undefined ? `${status.score}%` : '—'}
                           </span>
                        </td>
                        <td className="px-10 py-6 text-right">
                          <div className="flex justify-end gap-2">
                             {(status.label === 'Missing' || status.label === 'Late' || status.label === 'Pending') && (
                               <button 
                                onClick={() => handleRemind(student.id)}
                                className={`p-2 rounded-xl transition-all ${remindedStudents.has(student.id) ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                                title="Send Reminder"
                               >
                                 {remindedStudents.has(student.id) ? <CheckCircle2 size={18} /> : <Bell size={18} />}
                               </button>
                             )}
                             {(status.label === 'Submitted' || status.label === 'Late') && submission && (
                               <button 
                                onClick={() => { setSelectedSubmission(submission); setStep('grading-detail'); }}
                                className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all"
                               >
                                 Review
                               </button>
                             )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <h2 className="text-3xl font-black text-slate-900">Active Missions</h2>
          <div className="flex gap-3">
             <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Filter missions..." className="bg-white border border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-sm w-64 shadow-sm text-slate-900 font-bold" />
             </div>
             <button className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 shadow-sm transition-all">
               <Filter size={18} />
             </button>
          </div>
        </div>

        <div className="grid gap-6">
          {MOCK_ASSIGNMENTS_DETAILED.map(asgn => {
            const book = MOCK_BOOKS.find(b => b.id === asgn.bookId);
            const subCount = asgn.submissions?.length || 0;
            const totalCount = asgn.assignedStudentIds.length;
            const progress = (subCount / totalCount) * 100;
            const isPastDeadline = new Date().toISOString().split('T')[0] > asgn.deadline;

            return (
              <button 
                key={asgn.id}
                onClick={() => { setSelectedAssignment(asgn); setStep('tracking-view'); }}
                className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col md:flex-row md:items-center gap-8 text-left"
              >
                <div className="w-16 h-20 bg-slate-50 rounded-2xl overflow-hidden shrink-0 shadow-sm">
                  <img src={book?.coverImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-black text-xl text-slate-900 group-hover:text-indigo-600 transition-colors">{asgn.title}</h3>
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isPastDeadline ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {isPastDeadline ? 'Deadline Passed' : 'Active'}
                      </span>
                      {asgn.hasDiscussion && (
                        <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 flex items-center gap-1">
                          <MessageSquare size={10} />
                          Discussion
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><Calendar size={14} /> Due {asgn.deadline}</span>
                    <span className="flex items-center gap-1.5"><Users size={14} /> Grade 7B</span>
                  </div>
                </div>

                <div className="w-full md:w-48 space-y-2">
                  <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase">
                    <span>{subCount}/{totalCount} Done</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="p-2 text-slate-300 group-hover:text-indigo-600 transition-colors hidden md:block">
                  <ChevronRight size={24} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Assignment Lab</h1>
          <p className="text-slate-600 font-medium mt-1">Design reading missions and track class-wide breakthroughs.</p>
        </div>
        <div className="bg-slate-100 p-1.5 rounded-2xl flex">
          <button 
            onClick={() => { setActiveTab('create'); setStep('list'); }}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'create' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Create
          </button>
          <button 
            onClick={() => { setActiveTab('track'); setStep('list'); }}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'track' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Track & Grade
          </button>
        </div>
      </div>

      {activeTab === 'create' ? renderCreate() : renderTrack()}
    </div>
  );
};

export default AssignmentManager;
