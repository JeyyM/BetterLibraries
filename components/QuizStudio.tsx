
import React from 'react';
import { Book, QuizQuestion } from '../types';
import { supabase } from '../src/lib/supabase';
import { generateQuizForBook, extractBookMetadata } from '../services/geminiService';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
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
  Target,
  Image,
  BookOpen,
  Loader2
} from 'lucide-react';

interface QuizStudioProps {
  onBack: () => void;
  book?: Book; // Optional book prop - if provided, skip selection
}

const QuizStudio: React.FC<QuizStudioProps> = ({ onBack, book }) => {
  // Initialize PDF.js worker
  React.useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
  }, []);
  const [step, setStep] = React.useState<'select' | 'view-quizzes' | 'generate' | 'edit' | 'create-book'>(
    book ? 'view-quizzes' : 'select'
  );
  const [source, setSource] = React.useState<{ title: string, content: string, bookId?: string } | null>(
    book ? { title: book.title, content: book.content, bookId: book.id } : null
  );
  const [questions, setQuestions] = React.useState<QuizQuestion[]>([]);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [chatInput, setChatInput] = React.useState('');
  const [isRefining, setIsRefining] = React.useState(false);
  const [books, setBooks] = React.useState<Book[]>([]);
  const [loadingBooks, setLoadingBooks] = React.useState(true);
  const [existingQuizzes, setExistingQuizzes] = React.useState<any[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = React.useState(false);
  const [selectedQuiz, setSelectedQuiz] = React.useState<any | null>(null);

  // Book creation states
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
  const [coverImage, setCoverImage] = React.useState<File | null>(null);
  const [bookTitle, setBookTitle] = React.useState('');
  const [bookAuthor, setBookAuthor] = React.useState('');
  const [bookDescription, setBookDescription] = React.useState('');
  const [bookGenre, setBookGenre] = React.useState('Fiction');
  const [lexileLevel, setLexileLevel] = React.useState(500);
  const [pageCount, setPageCount] = React.useState(100);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [isPublishing, setIsPublishing] = React.useState(false);

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

  // Fetch quizzes for the selected book
  React.useEffect(() => {
    const fetchQuizzes = async () => {
      if (!source?.bookId) return;
      
      setLoadingQuizzes(true);
      try {
        const { data, error } = await supabase
          .from('quiz_items')
          .select('*')
          .eq('book_id', source.bookId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setExistingQuizzes(data || []);
      } catch (error) {
        console.error('Error fetching quizzes:', error);
        setExistingQuizzes([]);
      } finally {
        setLoadingQuizzes(false);
      }
    };

    if (step === 'view-quizzes') {
      fetchQuizzes();
    }
  }, [source?.bookId, step]);

  const getCoverImageUrl = (bookId: string): string => {
    const { data } = supabase.storage
      .from('book-covers')
      .getPublicUrl(`${bookId}.jpg`);
    
    return data.publicUrl || `https://placehold.co/300x400/6366f1/white?text=Book`;
  };

  const extractTextFromPDF = async (file: File): Promise<{ text: string; pageCount: number }> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      const pageCount = pdf.numPages; // Get actual page count
      
      let fullText = '';
      const pagesToExtract = Math.min(5, pageCount); // Extract first 5 pages
      
      for (let i = 1; i <= pagesToExtract; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }
      
      return { text: fullText, pageCount };
    } catch (err) {
      console.error('Error extracting PDF text:', err);
      throw new Error('Failed to extract text from PDF');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      
      // If it's a PDF, extract text properly
      if (file.type === 'application/pdf') {
        try {
          const { text, pageCount } = await extractTextFromPDF(file);
          setSource({ title: file.name, content: text });
          setPageCount(pageCount);
          console.log('📄 PDF extracted:', pageCount, 'pages,', text.length, 'characters');
        } catch (err) {
          console.error('Failed to extract PDF:', err);
          alert('Failed to extract text from PDF. Please try a different file.');
          return;
        }
      } else {
        // For TXT files, read as text
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          setSource({ title: file.name, content: text });
        };
        reader.readAsText(file);
      }
      
      setStep('create-book'); // Go to book creation step
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
    }
  };

  const handleAIAutofill = async () => {
    if (!uploadedFile || !source?.content) {
      alert('Please upload a PDF file first');
      return;
    }

    setIsAnalyzing(true);
    try {
      console.log('🤖 Calling AI to extract book metadata...');
      const metadata = await extractBookMetadata(source.content);
      
      console.log('✨ AI metadata:', metadata);
      
      setBookTitle(metadata.title || '');
      setBookAuthor(metadata.author || '');
      setBookDescription(metadata.description || '');
      setBookGenre(metadata.genre || 'Fiction');
      setLexileLevel(metadata.lexileLevel || 500);
      setPageCount(metadata.estimatedPages || 100);
      
      console.log('✨ AI autofill complete:', metadata);
    } catch (err) {
      console.error('AI autofill error:', err);
      alert('Failed to extract metadata. Please fill in manually.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectBook = (book: Book) => {
    setSource({ title: book.title, content: book.content, bookId: book.id });
    setStep('view-quizzes');
  };

  const startGeneration = async () => {
    if (!source) return;
    setIsGenerating(true);
    
    try {
      // Fetch the actual book content from storage if we have a bookId
      let bookContent = source.content;
      let bookData: any = { title: source.title, content: bookContent };

      if (source.bookId) {
        // Try to fetch the PDF text content
        const { data: pdfData, error: pdfError } = await supabase.storage
          .from('book-content')
          .download(`${source.bookId}.txt`);

        if (!pdfError && pdfData) {
          bookContent = await pdfData.text();
          bookData.content = bookContent;
        }

        // Also get book metadata for better context
        const { data: bookMetadata } = await supabase
          .from('books')
          .select('author, lexile_level, description, full_description')
          .eq('id', source.bookId)
          .single();

        if (bookMetadata) {
          bookData.author = bookMetadata.author;
          bookData.level = bookMetadata.lexile_level;
          // Use full description or description as fallback if no PDF text
          if (!pdfData) {
            bookData.content = bookMetadata.full_description || bookMetadata.description || source.content;
          }
        }
      }

      console.log('Generating quiz with AI for:', bookData.title);
      console.log('Content length:', bookData.content?.length || 0);

      // Generate quiz using Gemini AI
      const generatedQuestions = await generateQuizForBook(bookData);

      if (generatedQuestions && generatedQuestions.length > 0) {
        setQuestions(generatedQuestions);
        setStep('edit');
      } else {
        alert('Failed to generate quiz. Please try again.');
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      alert('Error generating quiz. Please check your API key and try again.');
    } finally {
      setIsGenerating(false);
    }
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

  const handlePublishQuiz = async () => {
    if (!source?.bookId || questions.length === 0) {
      alert('Cannot publish: No questions generated or book not selected');
      return;
    }

    try {
      console.log('💾 Saving quiz to database...');
      console.log('📚 Book ID:', source.bookId);
      console.log('❓ Questions:', questions);

      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ User not authenticated:', authError);
        alert('You must be logged in to publish a quiz. Please log in and try again.');
        return;
      }

      console.log('✅ User authenticated:', user.email);

      // Save to quiz_items table
      const { data, error } = await supabase
        .from('quiz_items')
        .insert({
          book_id: source.bookId,
          questions: questions,
          status: 'published',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error saving quiz:', error);
        alert(`Failed to save quiz: ${error.message}`);
        return;
      }

      console.log('✅ Quiz saved successfully:', data);
      alert('Quiz published successfully! ✨');
      onBack();
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      alert('Failed to publish quiz. Please try again.');
    }
  };

  const handlePublishBook = async () => {
    if (!bookTitle || !uploadedFile || !coverImage) {
      alert('Please fill in all required fields (Title, PDF, and Cover Image)');
      return;
    }

    setIsPublishing(true);
    try {
      console.log('📚 Publishing book to database...');

      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        alert('You must be logged in to publish a book.');
        setIsPublishing(false);
        return;
      }

      // Generate unique book ID
      const bookId = `book_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Upload PDF to storage
      console.log('📄 Uploading PDF...');
      const { error: pdfError } = await supabase.storage
        .from('book-pdfs')
        .upload(`${bookId}.pdf`, uploadedFile);

      if (pdfError) {
        console.error('❌ PDF upload error:', pdfError);
        alert(`Failed to upload PDF: ${pdfError.message}`);
        setIsPublishing(false);
        return;
      }

      // Upload cover image to storage
      console.log('🖼️ Uploading cover image...');
      const { error: imageError } = await supabase.storage
        .from('book-covers')
        .upload(`${bookId}.jpg`, coverImage);

      if (imageError) {
        console.error('❌ Cover image upload error:', imageError);
        alert(`Failed to upload cover image: ${imageError.message}`);
        setIsPublishing(false);
        return;
      }

      // Insert book metadata into database
      console.log('💾 Saving book metadata...');
      const { data: bookData, error: dbError } = await supabase
        .from('books')
        .insert({
          id: bookId,
          title: bookTitle,
          author: bookAuthor || 'Unknown Author',
          description: bookDescription || 'No description available',
          full_description: bookDescription || 'No description available',
          genre: bookGenre,
          lexile_level: lexileLevel,
          pages: pageCount,
          page_count: pageCount,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (dbError) {
        console.error('❌ Database error:', dbError);
        alert(`Failed to save book: ${dbError.message}`);
        setIsPublishing(false);
        return;
      }

      console.log('✅ Book published successfully:', bookData);
      
      // Set the source with the new book ID and move to quiz generation
      setSource({ title: bookTitle, content: source?.content || '', bookId: bookId });
      alert('Book published successfully! 📚 Now you can generate a quiz for it.');
      setStep('generate');
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      alert('Failed to publish book. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  if (step === 'select') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pb-20">
        <div className="max-w-6xl mx-auto p-6 space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-white rounded-full transition-all">
              <ArrowLeft size={24} className="text-slate-600" />
            </button>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Quiz Studio</h1>
              <p className="text-slate-600 mt-1 font-medium">Create AI-powered quizzes from books or custom content</p>
            </div>
          </div>

          {/* Two Widget Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Upload Source Material Widget */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                  <Upload className="text-indigo-600" size={24} />
                </div>
                <h2 className="text-xl font-black text-slate-900">Upload Source Material</h2>
              </div>

              <p className="text-slate-600 text-sm leading-relaxed">
                Upload a TXT or PDF file to generate a quiz from custom text content.
              </p>

              {/* File Upload Area */}
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="file"
                    accept=".txt,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl transition-all cursor-pointer border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50"
                  >
                    <FileText className="text-slate-400 mb-3" size={40} />
                    <p className="text-sm font-bold text-slate-600">Click to upload file</p>
                    <p className="text-xs text-slate-400 mt-2">TXT or PDF files only</p>
                  </label>
                </div>
              </div>
            </div>

            {/* Choose from Library Widget */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                  <FileText className="text-indigo-600" size={24} />
                </div>
                <h2 className="text-xl font-black text-slate-900">Choose from Library</h2>
              </div>

              <p className="text-slate-600 text-sm leading-relaxed">
                Select a book from your library to create or manage quizzes.
              </p>

              {/* Book List */}
              {loadingBooks ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-slate-400 text-sm mt-4 font-medium">Loading books...</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                  {books.map(book => (
                    <button 
                      key={book.id}
                      onClick={() => handleSelectBook(book)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all text-left group"
                    >
                      <img 
                        src={book.coverImage} 
                        className="w-12 h-16 rounded-lg object-cover shadow-sm" 
                        alt={book.title} 
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 truncate">{book.title}</p>
                        <p className="text-xs text-indigo-600 font-bold uppercase tracking-widest">{book.level}L Lexile</p>
                      </div>
                      <ChevronRight size={20} className="text-slate-400 group-hover:text-indigo-600 transition-colors flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'create-book') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pb-20">
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <button onClick={() => setStep('select')} className="p-2 hover:bg-white rounded-full transition-all">
              <ArrowLeft size={24} className="text-slate-600" />
            </button>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Create New Book</h1>
              <p className="text-slate-600 mt-1 font-medium">Add book details and publish to your library</p>
            </div>
          </div>

          {/* Book Information Card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                  <BookOpen className="text-indigo-600" size={24} />
                </div>
                <h2 className="text-xl font-black text-slate-900">Book Information</h2>
              </div>
              
              {/* AI Autofill Button */}
              <button
                type="button"
                onClick={handleAIAutofill}
                disabled={!uploadedFile || isAnalyzing || isPublishing}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-purple-100 hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    AI Autofill
                  </>
                )}
              </button>
            </div>

            {isAnalyzing && (
              <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-4 flex items-start gap-3">
                <Sparkles className="text-purple-600 shrink-0 mt-0.5 animate-pulse" size={20} />
                <div>
                  <p className="text-sm font-bold text-purple-700">AI is analyzing your file...</p>
                  <p className="text-xs text-purple-600 mt-1">Extracting title, author, description, genre, and reading level.</p>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={bookTitle}
                  onChange={e => setBookTitle(e.target.value)}
                  placeholder="e.g., The Little Prince"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none transition-all"
                  disabled={isPublishing}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Author
                </label>
                <input
                  type="text"
                  value={bookAuthor}
                  onChange={e => setBookAuthor(e.target.value)}
                  placeholder="e.g., Antoine de Saint-Exupéry"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none transition-all"
                  disabled={isPublishing}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Genre
                </label>
                <select
                  value={bookGenre}
                  onChange={e => setBookGenre(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:outline-none transition-all"
                  disabled={isPublishing}
                >
                  <option>Fiction</option>
                  <option>Non-Fiction</option>
                  <option>Science Fiction</option>
                  <option>Fantasy</option>
                  <option>Mystery</option>
                  <option>Biography</option>
                  <option>History</option>
                  <option>Science</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Lexile Level
                </label>
                <input
                  type="number"
                  value={lexileLevel}
                  onChange={e => setLexileLevel(parseInt(e.target.value) || 0)}
                  placeholder="500"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none transition-all"
                  disabled={isPublishing}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Page Count
                </label>
                <input
                  type="number"
                  value={pageCount}
                  onChange={e => setPageCount(parseInt(e.target.value) || 0)}
                  placeholder="100"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none transition-all"
                  disabled={isPublishing}
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Description
                </label>
                <textarea
                  value={bookDescription}
                  onChange={e => setBookDescription(e.target.value)}
                  placeholder="Enter book description..."
                  rows={4}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none transition-all resize-none"
                  disabled={isPublishing}
                />
              </div>
            </div>
          </div>

          {/* File Uploads Card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                <Upload className="text-emerald-600" size={24} />
              </div>
              <h2 className="text-xl font-black text-slate-900">File Uploads</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* PDF Status */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                  PDF File <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl border-emerald-300 bg-emerald-50">
                  <FileText className="text-emerald-600 mb-2" size={32} />
                  <p className="text-sm font-bold text-emerald-700 text-center px-2">{uploadedFile?.name}</p>
                  <p className="text-xs text-emerald-600 mt-1">{uploadedFile ? (uploadedFile.size / 1024 / 1024).toFixed(2) + ' MB' : ''}</p>
                </div>
              </div>

              {/* Cover Image Upload */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Cover Image <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageChange}
                    className="hidden"
                    id="cover-image-upload"
                    disabled={isPublishing}
                  />
                  <label
                    htmlFor="cover-image-upload"
                    className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl transition-all cursor-pointer ${
                      coverImage
                        ? 'border-emerald-300 bg-emerald-50'
                        : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50'
                    } ${isPublishing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {coverImage ? (
                      <>
                        <Image className="text-emerald-600 mb-2" size={32} />
                        <p className="text-sm font-bold text-emerald-700 text-center px-2">{coverImage.name}</p>
                        <p className="text-xs text-emerald-600 mt-1">{(coverImage.size / 1024).toFixed(2)} KB</p>
                      </>
                    ) : (
                      <>
                        <Image className="text-slate-400 mb-2" size={32} />
                        <p className="text-sm font-bold text-slate-600">Click to upload image</p>
                        <p className="text-xs text-slate-400 mt-1">JPG, PNG, etc.</p>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <button
              onClick={() => setStep('select')}
              disabled={isPublishing}
              className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePublishBook}
              disabled={isPublishing || !bookTitle || !uploadedFile || !coverImage}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Publishing...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Publish Book & Generate Quiz
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'view-quizzes') {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full">
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              {source?.title}
            </h1>
            <p className="text-slate-600 font-medium mt-1">Quiz Management</p>
          </div>
        </div>

        {loadingQuizzes ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-400 text-sm mt-4">Loading quizzes...</p>
          </div>
        ) : existingQuizzes.length > 0 ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900">Existing Quizzes</h2>
              <button
                onClick={() => setStep('generate')}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all"
              >
                <Plus size={18} />
                Create New Quiz
              </button>
            </div>
            
            <div className="grid gap-4">
              {existingQuizzes.map((quiz, index) => (
                <div
                  key={quiz.id}
                  className="bg-white p-6 rounded-3xl border-2 border-slate-100 hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => {
                    // Load this quiz for editing
                    const parsedQuestions = typeof quiz.questions === 'string' 
                      ? JSON.parse(quiz.questions) 
                      : quiz.questions;
                    setQuestions(parsedQuestions);
                    setSelectedQuiz(quiz);
                    setStep('edit');
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-black text-slate-900">
                          Quiz #{index + 1}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                          ${quiz.status === 'published' ? 'bg-green-100 text-green-700' : 
                            quiz.status === 'approved' ? 'bg-blue-100 text-blue-700' : 
                            'bg-yellow-100 text-yellow-700'}`}
                        >
                          {quiz.status || 'draft'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <FileText size={14} />
                          {typeof quiz.questions === 'string' 
                            ? JSON.parse(quiz.questions).length 
                            : quiz.questions?.length || 0} questions
                        </span>
                        {quiz.created_at && (
                          <span>Created: {new Date(quiz.created_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={24} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full animate-pulse"></div>
              <div className="bg-white p-10 rounded-[4rem] shadow-2xl relative">
                <Sparkles className="text-indigo-600 animate-bounce" size={64} />
              </div>
            </div>
            
            <div className="text-center max-w-md">
              <h2 className="text-3xl font-black text-slate-900">No Quizzes Yet</h2>
              <p className="text-slate-600 mt-3 font-medium leading-relaxed">
                This book doesn't have any quizzes yet. Let's create one using AI!
              </p>
            </div>

            <button
              onClick={() => setStep('generate')}
              className="bg-indigo-600 text-white px-10 py-5 rounded-[2rem] font-black shadow-2xl shadow-indigo-100 hover:scale-105 transition-all flex items-center gap-3"
            >
              Generate Quiz
              <Sparkles size={24} />
            </button>
          </div>
        )}
      </div>
    );
  }

  if (step === 'generate') {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => source?.bookId ? setStep('view-quizzes') : setStep('select')} 
            className="p-2 hover:bg-slate-100 rounded-full"
          >
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Generate Quiz</h1>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-8">
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
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => source?.bookId ? setStep('view-quizzes') : setStep('select')} className="p-2 hover:bg-slate-100 rounded-full">
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Refine Your Quiz</h1>
            <p className="text-slate-500 font-medium uppercase text-[10px] tracking-widest mt-1">Source: {source?.title}</p>
          </div>
        </div>
        <button 
          onClick={handlePublishQuiz}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-slate-800 transition-colors"
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
