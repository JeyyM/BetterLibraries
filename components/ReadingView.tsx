
import React from 'react';
import { Book } from '../types';
import { ChevronLeft, Bookmark, ListChecks, FileText, Download, Loader2, ChevronRight, Sparkles, ExternalLink, Maximize2, Minimize2 } from 'lucide-react';
import { supabase } from '../src/lib/supabase';
import { getOrCreateReadingBoard, openBoardInNewTab } from '../services/miroService';

interface ReadingViewProps {
  book: Book;
  userEmail: string;
  onFinish: () => void;
  onBack: () => void;
}

const ReadingView: React.FC<ReadingViewProps> = ({ book, userEmail, onFinish, onBack }) => {
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [progressLoaded, setProgressLoaded] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  // Miro whiteboard state
  const [showWhiteboard, setShowWhiteboard] = React.useState(false);
  const [miroEmbedUrl, setMiroEmbedUrl] = React.useState<string | null>(null);
  const [miroBoardId, setMiroBoardId] = React.useState<string | null>(null);
  const [loadingMiro, setLoadingMiro] = React.useState(false);

  React.useEffect(() => {
    const loadPDF = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get the PDF URL from Supabase Storage (PDFs stored without .pdf extension)
        const { data } = supabase.storage
          .from('book-content')
          .getPublicUrl(book.id);

        if (data.publicUrl) {
          console.log('📄 PDF URL:', data.publicUrl);
          setPdfUrl(data.publicUrl);
        } else {
          setError('PDF not found for this book.');
        }
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF.');
      } finally {
        setLoading(false);
      }
    };

    loadPDF();
  }, [book.id]);

  // Load reading progress from database
  React.useEffect(() => {
    const loadProgress = async () => {
      if (!userEmail || !book.id) return;

      try {
        const { data, error } = await supabase
          .from('reading_progress')
          .select('current_page, miro_board_id')
          .eq('user_email', userEmail)
          .eq('book_id', book.id)
          .single();

        if (error) {
          if (error.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('Error loading progress:', error);
          }
        } else if (data) {
          console.log('📖 Loaded progress: Page', data.current_page);
          setCurrentPage(data.current_page);
          
          // Load existing Miro board if available
          if (data.miro_board_id) {
            setMiroBoardId(data.miro_board_id);
            console.log('📋 Found existing Miro board:', data.miro_board_id);
          }
        }
      } catch (err) {
        console.error('Error loading progress:', err);
      } finally {
        setProgressLoaded(true);
      }
    };

    loadProgress();
  }, [userEmail, book.id]);

  // Load or create Miro board when whiteboard is toggled
  const handleToggleWhiteboard = async () => {
    if (!showWhiteboard && !miroEmbedUrl) {
      setLoadingMiro(true);
      try {
        console.log('🎨 Loading Miro board...');
        const board = await getOrCreateReadingBoard(
          book.id,
          book.title,
          userEmail,
          miroBoardId
        );
        
        console.log('📋 Board received:', board);
        console.log('📺 Setting embed URL:', board.embedUrl);
        
        setMiroEmbedUrl(board.embedUrl);
        setMiroBoardId(board.id);
        
        // Save board ID to database
        if (!miroBoardId) {
          await supabase
            .from('reading_progress')
            .upsert({
              user_email: userEmail,
              book_id: book.id,
              current_page: currentPage,
              total_pages: totalPages,
              miro_board_id: board.id,
              last_read_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_email,book_id'
            });
          
          console.log('💾 Saved Miro board ID to database');
        }
      } catch (err) {
        console.error('❌ Error loading Miro board:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        alert(`Failed to load whiteboard: ${errorMessage}\n\nPlease check:\n1. Miro token is configured\n2. Token has boards:write permission\n3. Console for details`);
        return; // Don't toggle if failed
      } finally {
        setLoadingMiro(false);
      }
    }
    
    setShowWhiteboard(!showWhiteboard);
  };

  // Use custom PDF viewer without toolbar (keep URL constant, only use hash for navigation)
  const pdfViewerUrl = pdfUrl 
    ? `/pdf-viewer.html?file=${encodeURIComponent(pdfUrl)}`
    : null;

  const totalPages = book.pages || 100;
  const progressPercentage = (currentPage / totalPages) * 100;

  // Save reading progress to database (debounced)
  React.useEffect(() => {
    if (!progressLoaded || !userEmail || !book.id || currentPage < 1) return;

    const saveProgress = async () => {
      try {
        const { error } = await supabase
          .from('reading_progress')
          .upsert({
            user_email: userEmail,
            book_id: book.id,
            current_page: currentPage,
            total_pages: totalPages,
            last_read_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_email,book_id'
          });

        if (error) {
          console.error('Error saving progress:', error);
        } else {
          console.log('💾 Saved progress: Page', currentPage);
        }
      } catch (err) {
        console.error('Error saving progress:', err);
      }
    };

    // Debounce save by 1 second
    const timeoutId = setTimeout(saveProgress, 1000);
    return () => clearTimeout(timeoutId);
  }, [currentPage, userEmail, book.id, progressLoaded, totalPages]);

  // Debug: Log book pages
  React.useEffect(() => {
    console.log('📚 Book:', book.title, '- Pages:', book.pages, '- Total Pages Used:', totalPages);
  }, [book.title, book.pages, totalPages]);
  
  // Update PDF page when currentPage changes
  React.useEffect(() => {
    if (containerRef.current && pdfUrl && currentPage > 0) {
      const iframe = containerRef.current.querySelector('iframe') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        setTimeout(() => {
          try {
            console.log('🔄 Setting PDF page to:', currentPage);
            iframe.contentWindow.location.hash = `page=${currentPage}`;
          } catch (e) {
            console.log('Cannot update hash (cross-origin or not loaded yet)');
          }
        }, 100); // Small delay to ensure iframe is loaded
      }
    }
  }, [currentPage, pdfUrl]);

  // Add keyboard navigation (arrow keys)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default behavior for arrow keys when reading
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        
        if (e.key === 'ArrowLeft') {
          // Previous page
          navigateToPage(currentPage - 1);
        } else if (e.key === 'ArrowRight') {
          // Next page
          navigateToPage(currentPage + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentPage, totalPages]); // Include dependencies so we have latest values

  const navigateToPage = (page: number) => {
    const boundedPage = Math.max(1, Math.min(totalPages, page));
    console.log('Navigating to page:', boundedPage, '/', totalPages);
    setCurrentPage(boundedPage);
    // The useEffect above will handle updating the iframe hash
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
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
          
          {/* Miro Whiteboard Toggle */}
          <button
            onClick={handleToggleWhiteboard}
            disabled={loadingMiro}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              showWhiteboard
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-100 hover:bg-purple-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            title="Toggle Miro Whiteboard for Notes"
          >
            {loadingMiro ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Loading...
              </>
            ) : showWhiteboard ? (
              <>
                <Minimize2 size={16} />
                Hide Whiteboard
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Show Whiteboard
              </>
            )}
          </button>

          {/* Open in new tab button (when whiteboard is shown) */}
          {showWhiteboard && miroBoardId && (
            <button
              onClick={() => openBoardInNewTab(miroBoardId)}
              className="p-2 text-purple-600 hover:text-purple-700 transition-colors"
              title="Open whiteboard in new tab"
            >
              <ExternalLink size={18} />
            </button>
          )}
          
          <button 
            onClick={onFinish}
            className="ml-2 flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            <ListChecks size={16} />
            Finish & Take Quiz
          </button>
        </div>
      </nav>

      {/* Split-Screen Content: PDF + Miro Whiteboard */}
      <div className="flex-1 overflow-hidden bg-slate-50 flex relative">
        {/* PDF Reader Section */}
        <div 
          ref={containerRef} 
          className={`transition-all duration-300 flex justify-center relative bg-slate-50 ${
            showWhiteboard ? 'w-1/2' : 'w-full'
          }`}
        >
          {loading && (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
              <p className="text-slate-600 font-medium">Loading PDF...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-full">
              <FileText className="w-16 h-16 text-slate-300 mb-4" />
              <p className="text-slate-600 font-bold text-lg mb-2">{error}</p>
              <p className="text-slate-400 text-sm">The PDF file for this book is not available.</p>
            </div>
          )}

          {!loading && !error && pdfViewerUrl && (
            <div className="w-full h-full flex flex-col">
              <iframe
                key={pdfUrl}
                src={pdfViewerUrl}
                className="w-full flex-1 border-0"
                title={book.title}
                style={{ height: '100%' }}
              />
              
              {/* Page Navigation Overlay */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-xl border border-slate-200 z-10">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => navigateToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Previous page"
                  >
                    <ChevronLeft size={20} className="text-slate-700" />
                  </button>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={currentPage}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setCurrentPage(1);
                          return;
                        }
                        const page = parseInt(val);
                        if (!isNaN(page) && page >= 1 && page <= totalPages) {
                          setCurrentPage(page);
                        }
                      }}
                      onBlur={(e) => {
                        const val = e.target.value;
                        if (val === '' || isNaN(parseInt(val))) {
                          setCurrentPage(1);
                          return;
                        }
                        const page = parseInt(val);
                        const boundedPage = Math.max(1, Math.min(totalPages, page));
                        setCurrentPage(boundedPage);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = e.currentTarget.value;
                          if (val === '' || isNaN(parseInt(val))) {
                            navigateToPage(1);
                            return;
                          }
                          const page = parseInt(val);
                          navigateToPage(page);
                        }
                      }}
                      className="w-16 text-center px-2 py-1 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      min={1}
                      max={totalPages}
                    />
                    <span className="text-sm text-slate-400 font-medium">/ {totalPages}</span>
                  </div>

                  <button
                    onClick={() => navigateToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Next page"
                  >
                    <ChevronRight size={20} className="text-slate-700" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Miro Whiteboard Section */}
        {showWhiteboard && (
          <div className="w-1/2 border-l-4 border-purple-200 bg-white flex flex-col">
            {/* Whiteboard Header */}
            <div className="h-14 border-b border-slate-100 flex items-center justify-between px-6 bg-gradient-to-r from-purple-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                  <Sparkles size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Reading Notes</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Miro Whiteboard</p>
                </div>
              </div>
              <button
                onClick={() => setShowWhiteboard(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
                title="Close whiteboard"
              >
                <Minimize2 size={18} />
              </button>
            </div>

            {/* Miro Board Embed */}
            <div className="flex-1 relative bg-slate-50">
              {loadingMiro ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
                  <p className="text-slate-600 font-medium">Loading whiteboard...</p>
                </div>
              ) : miroEmbedUrl ? (
                <iframe
                  src={miroEmbedUrl}
                  className="w-full h-full border-0"
                  title="Miro Whiteboard"
                  allow="clipboard-read; clipboard-write"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mb-4">
                    <Sparkles size={32} className="text-purple-600" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mb-2">Interactive Whiteboard</h3>
                  <p className="text-sm text-slate-600 max-w-xs">
                    Take notes, draw diagrams, and visualize concepts while you read!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Progress Footer */}
      <footer className="h-1.5 bg-slate-200 shrink-0">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 shadow-lg shadow-indigo-200" 
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </footer>
    </div>
  );
};

export default ReadingView;
