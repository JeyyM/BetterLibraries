
import React from 'react';
import { Book } from '../types';
import { ChevronLeft, ChevronRight, Bookmark, Settings, ListChecks, HelpCircle, X, Sparkles } from 'lucide-react';
import { getWordExplanation } from '../services/geminiService';

interface ReadingViewProps {
  book: Book;
  onFinish: () => void;
  onBack: () => void;
}

const ReadingView: React.FC<ReadingViewProps> = ({ book, onFinish, onBack }) => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [selectedWord, setSelectedWord] = React.useState<string | null>(null);
  const [explanation, setExplanation] = React.useState<string | null>(null);
  const [isExplaining, setIsExplaining] = React.useState(false);
  const totalPages = Math.ceil(book.pages / 20);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (text && text.split(/\s+/).length === 1) { // Only single words
      setSelectedWord(text);
      fetchExplanation(text);
    }
  };

  const fetchExplanation = async (word: string) => {
    setIsExplaining(true);
    setExplanation(null);
    try {
      const result = await getWordExplanation(word, book.content, book.level);
      setExplanation(result);
    } catch (e) {
      setExplanation("Oops! I couldn't explain that right now.");
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Reader Nav */}
      <nav className="h-16 border-b border-slate-100 flex items-center justify-between px-4 sm:px-8 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-sm font-bold text-slate-900 line-clamp-1">{book.title}</h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">{book.author}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors hidden sm:block">
            <Bookmark size={20} />
          </button>
          <button 
            onClick={onFinish}
            className="ml-2 flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            <ListChecks size={16} />
            Finish & Take Quiz
          </button>
        </div>
      </nav>

      {/* Reader Content */}
      <div className="flex-1 overflow-y-auto bg-slate-50 flex justify-center py-12 px-4 relative">
        <div 
          className="max-w-2xl w-full bg-white shadow-2xl shadow-slate-200/50 rounded-[2.5rem] p-8 sm:p-16 min-h-[800px] flex flex-col"
          onMouseUp={handleTextSelection}
        >
          <div className="flex-1 text-slate-800 text-lg sm:text-xl leading-relaxed font-serif space-y-6 select-text">
            <h2 className="text-2xl font-bold text-slate-900 font-sans mb-8">Chapter {currentPage}</h2>
            <p>{book.content}</p>
            <p>
              The journey ahead was uncertain, but Maya felt a strange sense of <strong>clarity</strong>. She looked at Sparky, whose optical sensors flickered with a rhythmic pulse. It was as if the robot was dreaming, processing the vast amounts of data gathered from their afternoon at the park.
            </p>
            <p>
              "Do you think they'll find us here?" she whispered. Sparky's head tilted. "The probability of detection is currently 4.2%," he synthesized. "We are safe for now."
            </p>
          </div>
          
          <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-widest">
            <span>Page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-2 rounded-full hover:bg-slate-50 disabled:opacity-30"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-2 rounded-full hover:bg-slate-50 disabled:opacity-30"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Word Explanation Popup */}
        {selectedWord && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-slate-900 text-white rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-4 border border-white/10 z-[60]">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className="bg-indigo-500 p-1.5 rounded-lg">
                  <Sparkles size={16} />
                </div>
                <h4 className="font-bold text-indigo-300">"{selectedWord}"</h4>
              </div>
              <button onClick={() => setSelectedWord(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            
            {isExplaining ? (
              <div className="flex items-center gap-3 text-slate-400 py-2">
                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium">Asking Gemini...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm leading-relaxed text-slate-200">{explanation}</p>
                <button className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors">
                  Add to Word Bank
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Progress Footer */}
      <footer className="h-4 bg-slate-100 shrink-0">
        <div 
          className="h-full bg-indigo-500 transition-all duration-500" 
          style={{ width: `${(currentPage / totalPages) * 100}%` }}
        ></div>
      </footer>
    </div>
  );
};

export default ReadingView;
