import React from 'react';
import { ChevronLeft, Upload, FileText, Image, BookOpen, Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { supabase } from '../src/lib/supabase';
import { extractBookMetadata } from '../services/geminiService';
import * as pdfjsLib from 'pdfjs-dist';

// Import worker for pdfjs-dist v5.x
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

interface AddBookProps {
  onBack: () => void;
  onBookAdded: () => void;
}

const AddBook: React.FC<AddBookProps> = ({ onBack, onBookAdded }) => {
  const [title, setTitle] = React.useState('');
  const [author, setAuthor] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [genre, setGenre] = React.useState('Fiction');
  const [lexileLevel, setLexileLevel] = React.useState('');
  const [pdfFile, setPdfFile] = React.useState<File | null>(null);
  const [pdfPageCount, setPdfPageCount] = React.useState<number>(0); // Store actual page count from PDF
  const [coverImage, setCoverImage] = React.useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<string>('');
  const [error, setError] = React.useState<string>('');
  const [success, setSuccess] = React.useState(false);

  const genres = ['Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy', 'Mystery', 'Historical', 'Biography', 'Adventure'];

  // Configure PDF.js worker for version 5.x
  React.useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
  }, []);

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

  const handleAIAutofill = async () => {
    if (!pdfFile) {
      setError('Please upload a PDF file first');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      // Extract text from PDF
      const { text: pdfText, pageCount } = await extractTextFromPDF(pdfFile);
      
      // Store the actual page count
      setPdfPageCount(pageCount);
      
      // Use AI to analyze and extract metadata
      const metadata = await extractBookMetadata(pdfText, title || undefined);
      
      // Fill in the form fields (only if they're empty and metadata exists)
      if (!title && metadata.title) setTitle(metadata.title);
      if (!author && metadata.author) setAuthor(metadata.author);
      if (!description && metadata.description) setDescription(metadata.description);
      if (metadata.genre) setGenre(metadata.genre);
      if (metadata.lexileLevel) setLexileLevel(metadata.lexileLevel.toString());
      
      console.log('✨ AI autofill complete:', metadata);
      console.log('📄 PDF has', pageCount, 'pages');
    } catch (err: any) {
      console.error('AI autofill error:', err);
      setError(err.message || 'Failed to analyze PDF. Please fill in the fields manually.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setError('');
      
      // Extract page count when PDF is uploaded
      try {
        const { pageCount } = await extractTextFromPDF(file);
        setPdfPageCount(pageCount);
        console.log('📄 PDF uploaded:', file.name, '-', pageCount, 'pages');
      } catch (err) {
        console.error('Failed to extract page count:', err);
        // Don't block the upload, just set a default
        setPdfPageCount(100);
      }
    } else {
      setError('Please select a valid PDF file');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setCoverImage(file);
      setError('');
    } else {
      setError('Please select a valid image file (JPG, PNG, etc.)');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!pdfFile) {
      setError('PDF file is required');
      return;
    }
    if (!coverImage) {
      setError('Cover image is required');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setUploadProgress('Uploading book...');

    try {
      // Create FormData to send files to API
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('author', author.trim() || 'Unknown Author');
      formData.append('description', description.trim() || 'No description provided');
      formData.append('genre', genre);
      formData.append('lexileLevel', lexileLevel || '500');
      formData.append('pages', pdfPageCount.toString() || '100');
      formData.append('pdf', pdfFile);
      formData.append('cover', coverImage);

      console.log('📤 Sending book to upload API...');
      
      // TODO: Replace with your Render backend URL after deployment
      const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      
      // Send to server API (uses SERVICE_ROLE_KEY to bypass RLS)
      const response = await fetch(`${API_URL}/api/upload-book`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      console.log('✅ Book uploaded successfully:', result.book);

      setUploadProgress('Book added successfully!');
      setSuccess(true);

      // Reset form after 2 seconds
      setTimeout(() => {
        setTitle('');
        setAuthor('');
        setDescription('');
        setGenre('Fiction');
        setLexileLevel('');
        setPdfFile(null);
        setPdfPageCount(0);
        setCoverImage(null);
        setSuccess(false);
        setUploadProgress('');
        onBookAdded();
      }, 2000);

    } catch (err: any) {
      console.error('Error adding book:', err);
      setError(err.message || 'Failed to add book. Please try again.');
      setUploadProgress('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white rounded-full transition-all"
            disabled={isSubmitting}
          >
            <ChevronLeft size={24} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Add New Book</h1>
            <p className="text-slate-600 mt-1 font-medium">Upload a book to your library</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
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
                disabled={!pdfFile || isAnalyzing || isSubmitting}
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
                  <p className="text-sm font-bold text-purple-700">AI is analyzing your PDF...</p>
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
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., The Little Prince"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none transition-all"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Author
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={e => setAuthor(e.target.value)}
                  placeholder="e.g., Antoine de Saint-Exupéry"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none transition-all"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Genre
                </label>
                <select
                  value={genre}
                  onChange={e => setGenre(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:outline-none transition-all"
                  disabled={isSubmitting}
                >
                  {genres.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Lexile Level
                </label>
                <input
                  type="number"
                  value={lexileLevel}
                  onChange={e => setLexileLevel(e.target.value)}
                  placeholder="e.g., 850"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none transition-all"
                  disabled={isSubmitting}
                />
              </div>

              {/* Show page count if PDF is uploaded */}
              {pdfPageCount > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                    Total Pages
                  </label>
                  <div className="w-full bg-indigo-50 border-2 border-indigo-200 rounded-xl py-3 px-4 text-sm font-bold text-indigo-900">
                    {pdfPageCount} pages
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                Description
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Brief description of the book..."
                rows={4}
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none transition-all resize-none"
                disabled={isSubmitting}
              />
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
              {/* PDF Upload */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                  PDF File <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfChange}
                    className="hidden"
                    id="pdf-upload"
                    disabled={isSubmitting}
                  />
                  <label
                    htmlFor="pdf-upload"
                    className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl transition-all cursor-pointer ${
                      pdfFile
                        ? 'border-emerald-300 bg-emerald-50'
                        : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50'
                    } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {pdfFile ? (
                      <>
                        <FileText className="text-emerald-600 mb-2" size={32} />
                        <p className="text-sm font-bold text-emerald-700 text-center px-2">{pdfFile.name}</p>
                        <p className="text-xs text-emerald-600 mt-1">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </>
                    ) : (
                      <>
                        <FileText className="text-slate-400 mb-2" size={32} />
                        <p className="text-sm font-bold text-slate-600">Click to upload PDF</p>
                        <p className="text-xs text-slate-400 mt-1">PDF files only</p>
                      </>
                    )}
                  </label>
                </div>
                {pdfFile && (
                  <p className="text-xs text-purple-600 font-bold flex items-center gap-1">
                    <Sparkles size={12} />
                    Click "AI Autofill" above to extract book details
                  </p>
                )}
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
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                    disabled={isSubmitting}
                  />
                  <label
                    htmlFor="image-upload"
                    className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl transition-all cursor-pointer ${
                      coverImage
                        ? 'border-emerald-300 bg-emerald-50'
                        : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50'
                    } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
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

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={20} />
              <p className="text-sm font-bold text-rose-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
              <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={20} />
              <p className="text-sm font-bold text-emerald-700">Book added successfully!</p>
            </div>
          )}

          {uploadProgress && !success && (
            <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-4 flex items-start gap-3">
              <Loader2 className="text-indigo-600 shrink-0 mt-0.5 animate-spin" size={20} />
              <p className="text-sm font-bold text-indigo-700">{uploadProgress}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !title.trim() || !pdfFile || !coverImage}
            className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Adding Book...
              </>
            ) : (
              <>
                <BookOpen size={20} />
                Add Book to Library
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddBook;
