
import React from 'react';
import { Book, DiscussionPost, UserRole } from '../types';
import { 
  MessageSquare, 
  Send, 
  Trash2, 
  Star, 
  MoreVertical, 
  User, 
  Clock, 
  ShieldCheck, 
  Sparkles,
  ArrowLeft,
  Filter
} from 'lucide-react';

interface DiscussionBoardProps {
  book: Book;
  role: UserRole;
  onBack: () => void;
  maxScore?: number;
}

const DiscussionBoard: React.FC<DiscussionBoardProps> = ({ book, role, onBack, maxScore = 0 }) => {
  const [posts, setPosts] = React.useState<DiscussionPost[]>([
    {
      id: 'p1',
      bookId: book.id,
      userId: 'u1',
      userName: 'Alex Johnson',
      userRole: 'student',
      content: "I think Sparky's sensors represent how we process emotions. Even though it's code, it feels real to him.",
      timestamp: '1h ago',
      score: 8,
      maxScore: 10
    },
    {
      id: 'p2',
      bookId: book.id,
      userId: 'u-teacher',
      userName: 'Ms. Thompson',
      userRole: 'teacher',
      content: "Excellent observation, Alex. How does this compare to the girl's perspective in chapter 2?",
      timestamp: '45m ago'
    }
  ]);

  const [newPost, setNewPost] = React.useState('');
  const [isPosting, setIsPosting] = React.useState(false);

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    
    setIsPosting(true);
    const post: DiscussionPost = {
      id: Date.now().toString(),
      bookId: book.id,
      userId: role === 'teacher' ? 'u-teacher' : 'u1',
      userName: role === 'teacher' ? 'Ms. Thompson' : 'Alex Johnson',
      userRole: role,
      content: newPost,
      timestamp: 'Just now'
    };

    setTimeout(() => {
      setPosts([post, ...posts]);
      setNewPost('');
      setIsPosting(false);
    }, 500);
  };

  const handleDelete = (postId: string) => {
    setPosts(posts.filter(p => p.id !== postId));
  };

  const handleScore = (postId: string, score: number) => {
    setPosts(posts.map(p => p.id === postId ? { ...p, score, maxScore: 10 } : p));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Discussion: {book.title}</h1>
            <p className="text-slate-500 font-medium text-xs uppercase tracking-widest mt-1">
              {posts.length} entries · {maxScore > 0 ? `Graded (${maxScore} pts max)` : 'Open Discussion'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          {/* Post Creator */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
            <form onSubmit={handlePost} className="space-y-4">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black shrink-0 ${role === 'teacher' ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
                  {role === 'teacher' ? 'T' : 'A'}
                </div>
                <textarea 
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="Share your thoughts or ask a question..."
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-50 transition-all resize-none min-h-[100px]"
                />
              </div>
              <div className="flex justify-end">
                <button 
                  type="submit"
                  disabled={isPosting || !newPost.trim()}
                  className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-indigo-600 transition-all disabled:opacity-50"
                >
                  {isPosting ? 'Posting...' : 'Post Entry'}
                  <Send size={16} />
                </button>
              </div>
            </form>
          </div>

          {/* Posts List */}
          <div className="space-y-6">
            {posts.map((post) => (
              <div key={post.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative group hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black shadow-lg ${post.userRole === 'teacher' ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
                      {post.userName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900">{post.userName}</span>
                        {post.userRole === 'teacher' && (
                          <span className="bg-emerald-50 text-emerald-600 text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-widest flex items-center gap-1">
                            <ShieldCheck size={10} />
                            Teacher
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                        <Clock size={12} />
                        {post.timestamp}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {role === 'teacher' && (
                      <button 
                        onClick={() => handleDelete(post.id)}
                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                        title="Delete Post"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                    <button className="p-2 text-slate-300 hover:text-slate-600">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </div>

                <p className="text-slate-700 font-medium leading-relaxed pl-16 pr-4">
                  {post.content}
                </p>

                <div className="mt-6 pl-16 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {post.score !== undefined ? (
                      <div className="bg-indigo-50 px-4 py-2 rounded-xl flex items-center gap-2">
                        <Star size={14} className="text-amber-500 fill-amber-500" />
                        <span className="text-xs font-black text-indigo-700">{post.score} / {post.maxScore} pts</span>
                      </div>
                    ) : (
                      role === 'teacher' && post.userRole === 'student' && (
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            placeholder="Score"
                            className="w-20 bg-slate-50 border-none rounded-xl py-2 px-3 text-xs font-black text-slate-900 focus:ring-2 focus:ring-indigo-500"
                            onChange={(e) => handleScore(post.id, parseInt(e.target.value))}
                          />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">/ 10</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-slate-900 text-white p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
            <div className="flex items-center gap-3 mb-8">
              <Sparkles className="text-indigo-400" />
              <h3 className="text-xl font-black">AI Insights</h3>
            </div>
            <p className="text-sm font-medium leading-relaxed text-slate-300">
              This discussion is showing high engagement with the theme of <span className="text-indigo-400">artificial intelligence vs human emotion</span>. 
            </p>
            <div className="mt-8 space-y-4">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Top Keywords</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-white/10 rounded-lg text-[10px] font-black text-indigo-300">Empathy</span>
                  <span className="px-2 py-1 bg-white/10 rounded-lg text-[10px] font-black text-indigo-300">Silicon</span>
                  <span className="px-2 py-1 bg-white/10 rounded-lg text-[10px] font-black text-indigo-300">Humanity</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <Star className="text-amber-500" />
              Community Guidelines
            </h3>
            <ul className="space-y-4">
              {[
                "Be respectful of others' interpretations.",
                "Back up your claims with text evidence.",
                "Encourage your classmates with helpful replies."
              ].map((rule, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-600 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0"></div>
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscussionBoard;
