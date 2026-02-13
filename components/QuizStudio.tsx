
import React from 'react';
import { Book, QuizQuestion } from '../types';
import { supabase } from '../src/lib/supabase';
import { 
  Plus, 
  Upload, 
  FileText, 
  Sparkles, 
  ChevronRight, 
  ArrowLeft, 
  Save, 
  Trash2, 
  MessageSquare,
  Wand2,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
  Layers,
  BrainCircuit,
  BarChart,
  Target
} from 'lucide-react';

interface QuizStudioProps {
  onBack: () => void;
}

const QuizStudio: React.FC<QuizStudioProps> = ({ onBack }) => {
  const [step, setStep] = React.useState<'select' | 'generate' | 'edit'>('select');
  const [source, setSource] = React.useState<{ title: string, content: string } | null>(null);
  const [questions, setQuestions] = React.useState<QuizQuestion[]>([]);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [chatInput, setChatInput] = React.useState('');
  const [isRefining, setIsRefining] = React.useState(false);
  const [books, setBooks] = React.useState<Book[]>([]);
  const [loadingBooks, setLoadingBooks] = React.useState(true);

  // Fetch books from Supabase
  React.useEffect(() => {
    const fetchBooks = async () => {
      try {
        const { data, error } = await supabase
          .from('books')
          .select('*')
          .eq('is_active', true)
          .order('title')
          .limit(10); // Show first 10 books in quiz studio

        if (error) throw error;

        if (data) {
          const transformedBooks: Book[] = data.map(book => ({
            id: book.id,
            title: book.title,
            author: book.author,
            coverImage: getCoverImageUrl(book.id),
            description: book.description || '',
            fullDescription: book.full_description || book.description || '',
            level: book.lexile_level,
            genre: book.genre || 'Fiction',
            pages: book.page_count || 0,
            estimatedTime: `${Math.ceil((book.page_count || 100) / 30)} min`,
            content: book.description || '' // Use description as sample content
          }));

          setBooks(transformedBooks);
        }
      } catch (error) {
        console.error('Error fetching books:', error);
      } finally {
        setLoadingBooks(false);
      }
    };

    fetchBooks();
  }, []);

  const getCoverImageUrl = (bookId: string): string => {
    const { data } = supabase.storage
      .from('book-covers')
      .getPublicUrl(`${bookId}.jpg`);
    
    return data.publicUrl || `https://placehold.co/300x400/6366f1/white?text=Book`;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setSource({ title: file.name, content: text });
        setStep('generate');
      };
      reader.readAsText(file);
    }
  };

  const handleSelectBook = (book: Book) => {
    setSource({ title: book.title, content: book.content });
    setStep('generate');
  };

  const startGeneration = async () => {
    if (!source) return;
    setIsGenerating(true);
    
    // Simulate a brief loading for UX
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Hardcoded demo quiz data
    const demoQuestions: QuizQuestion[] = [
      {
        id: '1',
        text: 'What is the main theme of this story?',
        type: 'multiple-choice',
        difficulty: 'medium',
        category: 'analysis',
        options: [
          'Friendship and loyalty',
          'The dangers of greed',
          'The power of nature',
          'Coming of age'
        ],
        correctAnswer: 1,
        points: 10
      },
      {
        id: '2',
        text: 'Who is the protagonist of the story?',
        type: 'multiple-choice',
        difficulty: 'easy',
        category: 'recall',
        options: [
          'The narrator',
          'The old man',
          'The young boy',
          'The mysterious stranger'
        ],
        correctAnswer: 0,
        points: 5
      },
      {
        id: '3',
        text: 'Describe the setting of the story in your own words.',
        type: 'short-answer',
        difficulty: 'easy',
        category: 'recall',
        options: [],
        points: 10
      },
      {
        id: '4',
        text: 'What literary device does the author use most effectively?',
        type: 'multiple-choice',
        difficulty: 'hard',
        category: 'analysis',
        options: [
          'Metaphor',
          'Foreshadowing',
          'Personification',
          'Irony'
        ],
        correctAnswer: 3,
        points: 15
      },
      {
        id: '5',
        text: 'How does the protagonist change throughout the story? Provide specific examples.',
        type: 'essay',
        difficulty: 'hard',
        category: 'analysis',
        options: [],
        points: 20
      },
      {
        id: '6',
        text: 'What is the climax of the story?',
        type: 'short-answer',
        difficulty: 'medium',
        category: 'inference',
        options: [],
        points: 10
      },
      {
        id: '7',
        text: 'Which quote best represents the central conflict?',
        type: 'multiple-choice',
        difficulty: 'medium',
        category: 'inference',
        options: [
          '"It was the best of times, it was the worst of times"',
          '"All that glitters is not gold"',
          '"The road to hell is paved with good intentions"',
          '"Be careful what you wish for"'
        ],
        correctAnswer: 3,
        points: 10
      },
      {
        id: '8',
        text: 'Analyze how the author uses symbolism to develop the theme. Use evidence from the text.',
        type: 'essay',
        difficulty: 'hard',
        category: 'analysis',
        options: [],
        points: 25
      }
    ];
    
    setQuestions(demoQuestions);
    setStep('edit');
    setIsGenerating(false);
  };

  const updateQuestion = (index: number, updates: Partial<QuizQuestion>) => {
    const newQs = [...questions];
    // Special handling for type switches
    if (updates.type && updates.type !== newQs[index].type) {
      if (updates.type === 'multiple-choice') {
        updates.options = ['Option 1', 'Option 2', 'Option 3', 'Option 4'];
        updates.correctAnswer = 0;
      } else {
        updates.options = [];
        updates.correctAnswer = undefined;
      }
    }
    newQs[index] = { ...newQs[index], ...updates };
    setQuestions(newQs);
  };

  const handleRefine = async () => {
    if (editingIndex === null || !chatInput.trim() || !source) return;
    setIsRefining(true);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Demo: Apply some simple transformations based on input keywords
    const currentQ = questions[editingIndex];
    let refined: Partial<QuizQuestion> = {};
    
    const input = chatInput.toLowerCase();
    
    if (input.includes('easier') || input.includes('easy')) {
      refined.difficulty = 'easy';
      refined.points = (currentQ.points || 10) - 5;
    } else if (input.includes('harder') || input.includes('difficult')) {
      refined.difficulty = 'hard';
      refined.points = (currentQ.points || 10) + 5;
    }
    
    if (input.includes('analysis')) {
      refined.category = 'analysis';
    } else if (input.includes('recall')) {
      refined.category = 'recall';
    } else if (input.includes('inference')) {
      refined.category = 'inference';
    }
    
    if (input.includes('multiple choice') || input.includes('mcq')) {
      refined.type = 'multiple-choice';
      refined.options = ['Option A', 'Option B', 'Option C', 'Option D'];
      refined.correctAnswer = 0;
    } else if (input.includes('short answer')) {
      refined.type = 'short-answer';
      refined.options = [];
      refined.correctAnswer = undefined;
    } else if (input.includes('essay')) {
      refined.type = 'essay';
      refined.options = [];
      refined.correctAnswer = undefined;
    }
    
    // If no specific changes detected, just add a subtle modification
    if (Object.keys(refined).length === 0) {
      refined.text = currentQ.text + ' (refined)';
    }
    
    updateQuestion(editingIndex, refined);
    setChatInput('');
    setIsRefining(false);
  };

  if (step === 'select') {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full">
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Quiz Studio</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-10 rounded-[3rem] border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer relative group flex flex-col items-center justify-center text-center">
            <input type="file" accept=".txt,.pdf" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
            <div className="bg-indigo-600 text-white p-6 rounded-3xl mb-6 shadow-xl shadow-indigo-100 group-hover:scale-110 transition-transform">
              <Upload size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900">Upload Source Material</h3>
            <p className="text-slate-600 mt-2 font-medium">Upload a TXT or PDF file to generate a quiz from custom text.</p>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <FileText className="text-indigo-600" />
              Choose from Library
            </h3>
            {loadingBooks ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-slate-400 text-sm mt-4">Loading books...</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {books.map(book => (
                  <button 
                    key={book.id}
                    onClick={() => handleSelectBook(book)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all text-left"
                  >
                    <img src={book.coverImage} className="w-12 h-16 rounded-lg object-cover" alt={book.title} />
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{book.title}</p>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{book.level}L Lexile</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'generate') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full animate-pulse"></div>
          <div className="bg-white p-10 rounded-[4rem] shadow-2xl relative">
            <Sparkles className={`text-indigo-600 ${isGenerating ? 'animate-spin' : 'animate-bounce'}`} size={64} />
          </div>
        </div>
        
        <div className="text-center max-w-sm">
          <h2 className="text-3xl font-black text-slate-900">Ready to Analyze</h2>
          <p className="text-slate-600 mt-4 font-medium leading-relaxed">
            I've loaded <span className="text-indigo-600 font-bold">"{source?.title}"</span>. I'll generate a comprehensive quiz covering multiple cognitive domains.
          </p>
        </div>

        <button 
          onClick={startGeneration}
          disabled={isGenerating}
          className="bg-indigo-600 text-white px-10 py-5 rounded-[2rem] font-black shadow-2xl shadow-indigo-100 hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-50"
        >
          {isGenerating ? 'Analyzing Text...' : 'Generate Questions'}
          <Wand2 size={24} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setStep('select')} className="p-2 hover:bg-slate-100 rounded-full">
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Refine Your Quiz</h1>
            <p className="text-slate-500 font-medium uppercase text-[10px] tracking-widest mt-1">Source: {source?.title}</p>
          </div>
        </div>
        <button 
          onClick={onBack}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2"
        >
          <Save size={18} />
          Publish Quiz
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-6">
          {questions.map((q, i) => (
            <div 
              key={q.id}
              className={`bg-white p-8 rounded-[3rem] border-2 transition-all cursor-pointer relative group
                ${editingIndex === i ? 'border-indigo-600 ring-4 ring-indigo-50 shadow-2xl' : 'border-slate-100 hover:border-slate-200'}
              `}
              onClick={() => setEditingIndex(i)}
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center font-black text-xs text-white">
                    {i + 1}
                  </span>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Points Input */}
                    <div className="relative group/sel flex items-center bg-slate-50 rounded-full px-3 py-1.5 border border-slate-100">
                      <Target size={10} className="text-indigo-600 mr-2" />
                      <input 
                        type="number"
                        value={q.points || 0}
                        onChange={(e) => updateQuestion(i, { points: parseInt(e.target.value) || 0 })}
                        className="w-10 bg-transparent border-none p-0 text-[9px] font-black text-slate-900 focus:ring-0"
                        title="Points"
                      />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">pts</span>
                    </div>

                    {/* Question Type Selector */}
                    <div className="relative group/sel">
                      <select 
                        value={q.type}
                        onChange={(e) => updateQuestion(i, { type: e.target.value as any })}
                        className="appearance-none bg-slate-100 px-3 py-1.5 pr-8 rounded-full text-[9px] font-black uppercase tracking-wider text-slate-700 border-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="multiple-choice">MCQ</option>
                        <option value="short-answer">Short Answer</option>
                        <option value="essay">Essay</option>
                      </select>
                      <Layers size={10} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                    </div>

                    {/* Category Selector */}
                    <div className="relative group/sel">
                      <select 
                        value={q.category}
                        onChange={(e) => updateQuestion(i, { category: e.target.value as any })}
                        className="appearance-none bg-indigo-50 px-3 py-1.5 pr-8 rounded-full text-[9px] font-black uppercase tracking-wider text-indigo-600 border-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="recall">Recall</option>
                        <option value="inference">Inference</option>
                        <option value="analysis">Analysis</option>
                      </select>
                      <BrainCircuit size={10} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-300" />
                    </div>

                    {/* Difficulty Selector */}
                    <div className="relative group/sel">
                      <select 
                        value={q.difficulty}
                        onChange={(e) => updateQuestion(i, { difficulty: e.target.value as any })}
                        className="appearance-none bg-amber-50 px-3 py-1.5 pr-8 rounded-full text-[9px] font-black uppercase tracking-wider text-amber-600 border-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                      <BarChart size={10} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-amber-300" />
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setQuestions(questions.filter((_, idx) => idx !== i));
                  }}
                  className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              <textarea 
                className="w-full bg-transparent border-none p-0 text-xl font-black text-slate-900 placeholder:text-slate-200 focus:ring-0 resize-none"
                value={q.text}
                rows={2}
                placeholder="Type your question prompt here..."
                onChange={(e) => updateQuestion(i, { text: e.target.value })}
                onClick={(e) => e.stopPropagation()}
              />

              {q.type === 'multiple-choice' && q.options && (
                <div className="mt-8 grid sm:grid-cols-2 gap-4">
                  {q.options.map((opt, optIdx) => (
                    <div key={optIdx} className="relative group/opt">
                      <input 
                        className={`w-full bg-slate-50 border-2 px-6 py-4 rounded-[1.5rem] text-sm font-bold transition-all
                          ${q.correctAnswer === optIdx 
                            ? 'border-emerald-400 bg-emerald-50 text-emerald-900' 
                            : 'border-slate-50 text-slate-900 group-hover/opt:border-slate-100'}
                        `}
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...q.options!];
                          newOpts[optIdx] = e.target.value;
                          updateQuestion(i, { options: newOpts });
                        }}
                      />
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          updateQuestion(i, { correctAnswer: optIdx });
                        }}
                        className={`absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-xl border-2 transition-all flex items-center justify-center
                          ${q.correctAnswer === optIdx 
                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                            : 'bg-white border-slate-200 text-transparent'}
                        `}
                      >
                        <CheckCircle2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {q.type !== 'multiple-choice' && (
                <div className="mt-6 p-6 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-400 flex items-center justify-center shrink-0">
                    <MessageSquare size={20} />
                  </div>
                  <p className="text-xs font-bold text-slate-400">
                    Students will provide a {q.type === 'essay' ? 'long-form analysis' : 'short 1-2 sentence'} response. 
                    AI will assist with evaluation.
                  </p>
                </div>
              )}
            </div>
          ))}

          <button 
            onClick={() => {
              const newId = Date.now().toString();
              setQuestions([...questions, { 
                id: newId, 
                text: '', 
                type: 'short-answer', 
                difficulty: 'medium', 
                category: 'recall',
                options: [],
                points: 10
              }]);
            }}
            className="w-full py-10 border-4 border-dashed border-slate-100 rounded-[3.5rem] text-slate-400 font-black flex flex-col items-center justify-center gap-4 hover:bg-slate-50 hover:border-indigo-100 hover:text-indigo-400 transition-all group"
          >
            <div className="p-4 bg-white rounded-full shadow-lg group-hover:scale-110 transition-transform">
              <Plus size={32} />
            </div>
            <span className="uppercase tracking-[0.2em] text-[10px]">Add Manual Question Card</span>
          </button>
        </div>

        <div className="lg:col-span-4">
          {/* AI Assistant sticky panel remains same as previous */}
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden sticky top-28">
            <div className="p-8 bg-indigo-600 text-white">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles size={24} className="fill-white/20" />
                <h3 className="text-xl font-black">AI Creative Partner</h3>
              </div>
              <p className="text-indigo-100 text-xs font-medium leading-relaxed">
                {editingIndex !== null 
                  ? `You are editing question #${editingIndex + 1}. I can help make it trickier, easier, or pivot its focus.`
                  : "Pick a question card to unlock AI-assisted refinement tools."
                }
              </p>
            </div>
            <div className="p-6 space-y-4 min-h-[300px] flex flex-col">
              <div className="flex-1 space-y-3">
                {editingIndex === null ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-10 text-slate-400">
                    <div className="bg-slate-50 w-16 h-16 rounded-3xl flex items-center justify-center mb-4">
                      <BrainCircuit size={32} />
                    </div>
                    <p className="text-sm font-black uppercase tracking-widest text-slate-300">Ready to Assist</p>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Selected Context</p>
                    <p className="text-sm font-bold text-slate-700 leading-relaxed italic">
                      {questions[editingIndex].text ? `"${questions[editingIndex].text}"` : "Question is currently empty..."}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="relative">
                <textarea 
                  disabled={editingIndex === null || isRefining}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="e.g. 'Turn this into an analysis question about the tone'"
                  className="w-full bg-slate-50 border-none rounded-[2rem] py-5 px-6 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 resize-none min-h-[120px] shadow-inner"
                />
                <button 
                  onClick={handleRefine}
                  disabled={editingIndex === null || isRefining || !chatInput.trim()}
                  className="absolute right-3 bottom-3 p-4 bg-indigo-600 text-white rounded-2xl shadow-xl hover:bg-indigo-700 transition-all disabled:opacity-30 active:scale-95"
                >
                  {isRefining ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Send size={20} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizStudio;
