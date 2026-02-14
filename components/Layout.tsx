
import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { UserRole } from '../types';
import { 
  BookOpen, 
  LayoutDashboard, 
  Library, 
  ClipboardList, 
  BarChart2, 
  Bell, 
  Menu,
  X,
  GraduationCap,
  Users,
  Trophy,
  Activity,
  History,
  Medal,
  Sparkles,
  LogOut,
  ChevronDown,
  MessageSquare
} from 'lucide-react';

interface LayoutProps {
  role: UserRole;
  userName?: string;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ role, userName, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const studentNav = [
    { name: 'My Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Achievements', icon: Medal, path: '/achievements' },
    { name: 'Discussion Hub', icon: MessageSquare, path: '/discussions' },
    { name: 'Book Library', icon: Library, path: '/library' },
    { name: 'Assignments', icon: ClipboardList, path: '/assignments' },
    { name: 'My Learning', icon: BarChart2, path: '/analytics' },
    { name: 'Reading History', icon: History, path: '/history' },
  ];

  const teacherNav = [
    { name: 'Class Overview', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Student Roster', icon: Users, path: '/roster' },
    { name: 'Library Management', icon: Library, path: '/library/manage' },
    { name: 'Discussion Hub', icon: MessageSquare, path: '/discussions' },
    { name: 'Assignment Lab', icon: ClipboardList, path: '/assignments' },
    { name: 'Reward Studio', icon: Sparkles, path: '/rewards' },
    { name: 'Leaderboard', icon: Trophy, path: '/leaderboard' },
  ];

  const navItems = role === 'teacher' ? teacherNav : studentNav;
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="min-h-screen bg-[#FDFDFF] flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-18 items-center py-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
              >
                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2 rounded-[1rem] shadow-lg shadow-indigo-100 rotate-[-4deg]">
                  <BookOpen className="text-white" size={24} />
                </div>
                <span className="text-xl font-black text-slate-900 tracking-tight hidden sm:block">BetterLibraries</span>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-6">
              <button className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
              </button>
              
              <div className="relative">
                <div 
                  className="flex items-center gap-3 group cursor-pointer"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                >
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-bold text-slate-900 leading-none group-hover:text-indigo-600 transition-colors">
                      {userName || (role === 'teacher' ? 'Teacher' : 'Student')}
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                       <p className={`text-[9px] px-1.5 py-0.5 rounded-md font-black tracking-widest uppercase ${role === 'teacher' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                        {role}
                       </p>
                       <ChevronDown size={10} className="text-slate-400" />
                    </div>
                  </div>
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black shadow-lg ring-4 ring-slate-50 ${role === 'teacher' ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
                    {userName ? userName.charAt(0).toUpperCase() : (role === 'teacher' ? 'T' : 'S')}
                  </div>
                </div>

                {/* Profile Dropdown */}
                {isProfileOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)}></div>
                    <div className="absolute right-0 mt-4 w-56 bg-white border border-slate-100 rounded-3xl shadow-2xl py-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                      <div className="px-4 py-3 border-b border-slate-50">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Account Settings</p>
                      </div>
                      <button 
                        onClick={() => { onLogout(); setIsProfileOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-4 text-sm font-bold text-rose-500 hover:bg-rose-50 transition-colors"
                      >
                        <LogOut size={18} />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className={`
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 transition-all duration-300 ease-out
          fixed lg:static inset-y-0 left-0 z-30
          w-64 bg-white border-r border-slate-100 flex flex-col shadow-xl lg:shadow-none
        `}>
          <nav className="flex-1 p-6 space-y-2 mt-2">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setIsSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all group
                  ${isActive(item.path) 
                    ? (role === 'teacher' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-100' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-100') + ' translate-x-1' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'}
                `}
              >
                <item.icon size={20} className={isActive(item.path) ? 'text-white' : 'group-hover:scale-110 transition-transform'} />
                {item.name}
              </button>
            ))}
          </nav>
          
          <div className="p-6">
            <div className="bg-slate-900 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/20 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-indigo-500/30 transition-all"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-indigo-400 mb-3">
                  <GraduationCap size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {role === 'teacher' ? 'Class Mastery' : 'Current Level'}
                  </span>
                </div>
                <p className="text-3xl font-black text-white leading-none">
                  {role === 'teacher' ? '92%' : '550L'}
                </p>
                <div className="mt-4 w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1000 ${role === 'teacher' ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: '65%' }}></div>
                </div>
                <p className="text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-wider">
                  {role === 'teacher' ? '3 goals met this week' : '125L to milestone'}
                </p>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-12">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
