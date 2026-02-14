
import React from 'react';
import { UserRole } from '../types';
import { supabase } from '../src/lib/supabase';
import { 
  BookOpen, 
  GraduationCap, 
  School, 
  ArrowRight, 
  Sparkles, 
  Rocket, 
  ShieldCheck, 
  ChevronLeft,
  Mail,
  Lock,
  Globe
} from 'lucide-react';

interface LoginProps {
  onLogin: (role: UserRole, email: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = React.useState<UserRole | null>(null);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');

  // Demo accounts for easy access
  const demoAccounts = {
    student: [
      'john.doe@email.com',
      'jane.smith@email.com',
      'michael.johnson@email.com',
      'emily.williams@email.com',
      'david.brown@email.com',
      'sarah.jones@email.com',
      'william.anderson@email.com',
      'patricia.taylor@email.com'
    ],
    teacher: [
      'jerrysmith@email.com'
    ]
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const userEmail = email || (selectedRole === 'teacher' ? 'jerrysmith@email.com' : 'john.doe@email.com');
      const userPassword = password || '123'; // Default password is "123"

      console.log('🔐 Attempting login with:', userEmail);

      // Try to sign in with Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: userPassword,
      });

      if (signInError) {
        console.error('❌ Login error:', signInError);
        
        // For demo purposes: If user doesn't exist, just proceed anyway
        console.warn('⚠️ User not found in auth, proceeding with demo mode');
        alert(`Note: User ${userEmail} not found in database. Create this user in Supabase Dashboard > Authentication > Users with password "123"`);
        
        // Continue to app anyway for demo
        onLogin(selectedRole!, userEmail);
        return;
      }

      console.log('✅ Login successful:', data.user?.email);
      onLogin(selectedRole!, userEmail);
    } catch (err: any) {
      console.error('❌ Unexpected error:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoEmailClick = (demoEmail: string) => {
    setEmail(demoEmail);
  };

  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-50 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-100 rounded-full blur-[120px] opacity-50 animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="max-w-5xl w-full relative z-10 space-y-12">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-3 bg-white p-3 rounded-3xl shadow-xl shadow-indigo-100/50 border border-indigo-50 mb-4 animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="bg-indigo-600 p-2 rounded-2xl rotate-[-6deg] shadow-lg">
                <BookOpen className="text-white" size={28} />
              </div>
              <span className="text-2xl font-black text-slate-900 tracking-tighter">BetterLibraries</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight animate-in fade-in slide-in-from-top-6 duration-700 delay-100">
              Where Every Word <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-500">Unlocks a World</span>
            </h1>
            <p className="text-slate-600 font-medium text-lg animate-in fade-in slide-in-from-top-8 duration-700 delay-200">Select your portal to begin your journey.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Student Card */}
            <button 
              onClick={() => setSelectedRole('student')}
              className="group bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-indigo-200 transition-all duration-500 text-left relative overflow-hidden animate-in fade-in slide-in-from-left-8 duration-700 delay-300"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-indigo-100 transition-all"></div>
              <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-600 mb-8 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                <Rocket size={40} />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-3">Student Portal</h3>
              <p className="text-slate-600 font-medium mb-8">Embark on reading missions, earn rare badges, and level up your Lexile rank.</p>
              <div className="flex items-center gap-2 text-indigo-600 font-black uppercase text-xs tracking-widest group-hover:gap-4 transition-all">
                Enter Mission Control
                <ArrowRight size={18} />
              </div>
            </button>

            {/* Teacher Card */}
            <button 
              onClick={() => setSelectedRole('teacher')}
              className="group bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-emerald-200 transition-all duration-500 text-left relative overflow-hidden animate-in fade-in slide-in-from-right-8 duration-700 delay-300"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-emerald-100 transition-all"></div>
              <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-emerald-600 mb-8 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500">
                <School size={40} />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-3">Teacher Lounge</h3>
              <p className="text-slate-600 font-medium mb-8">Access AI reading insights, manage rosters, and track class-wide mastery.</p>
              <div className="flex items-center gap-2 text-emerald-600 font-black uppercase text-xs tracking-widest group-hover:gap-4 transition-all">
                Access Teacher Hub
                <ArrowRight size={18} />
              </div>
            </button>
          </div>
          
          <div className="flex items-center justify-center gap-8 opacity-60 transition-all duration-700">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              <Globe size={14} /> Global Reading Standards
            </div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              <Sparkles size={14} /> Powered by Gemini AI
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 relative">
      <div className="max-w-6xl w-full grid md:grid-cols-[1fr_300px] gap-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
        <div>
          <button 
            onClick={() => setSelectedRole(null)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-8 font-black uppercase text-[10px] tracking-widest transition-all"
          >
            <ChevronLeft size={16} />
            Go Back
          </button>

          <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-2 ${selectedRole === 'student' ? 'bg-indigo-600' : 'bg-emerald-500'}`}></div>
            
            <div className="text-center mb-10">
              <div className={`w-20 h-20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-xl ${selectedRole === 'student' ? 'bg-indigo-50 text-indigo-600 shadow-indigo-100' : 'bg-emerald-50 text-emerald-600 shadow-emerald-100'}`}>
                {selectedRole === 'student' ? <GraduationCap size={40} /> : <ShieldCheck size={40} />}
              </div>
              <h2 className="text-3xl font-black text-slate-900">Welcome Back</h2>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-2">
                Logging into {selectedRole} portal
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm font-medium">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={selectedRole === 'teacher' ? 'jerrysmith@email.com' : 'john.doe@email.com'}
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-indigo-50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="123 (default)"
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-indigo-50 transition-all"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95
                  ${selectedRole === 'student' ? 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700' : 'bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700'}
                  ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    Let's Go!
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Trouble logging in? Contact IT Support
              </p>
            </div>
          </div>
        </div>

        {/* Demo Accounts Panel */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-lg h-fit">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Quick Login</h3>
          <p className="text-xs text-slate-400 mb-4 font-medium">Click to autofill</p>
          <div className="space-y-2">
            {demoAccounts[selectedRole || 'student'].map((demoEmail) => (
              <button
                key={demoEmail}
                type="button"
                onClick={() => handleDemoEmailClick(demoEmail)}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  email === demoEmail
                    ? selectedRole === 'student' 
                      ? 'bg-indigo-50 text-indigo-700 border-2 border-indigo-200'
                      : 'bg-emerald-50 text-emerald-700 border-2 border-emerald-200'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-2 border-transparent'
                }`}
              >
                {demoEmail}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
