import React from 'react';
import { Book } from '../types';
import { BookOpen, FileText, Trash2, Eye, Plus } from 'lucide-react';
import { supabase } from '../src/lib/supabase';

interface TeacherLibraryProps {
  onReadBook: (book: Book) => void;
  onViewQuiz: (book: Book) => void;
  onAddBook: () => void;
}

const TeacherLibrary: React.FC<TeacherLibraryProps> = ({ onReadBook, onViewQuiz, onAddBook }) => {
  const [books, setBooks] = React.useState<Book[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      // Fetch all books
      const { data: booksData, error: booksError } = await supabase
        .from('books')
        .select('*')
        .eq('is_active', true)
        .order('title');

      if (booksError) throw booksError;

      if (booksData) {
        const transformedBooks: Book[] = booksData.map(book => ({
          id: book.id,
          title: book.title,
          author: book.author,
          coverImage: getCoverImageUrl(book.id),
          description: book.description || '',
          fullDescription: book.full_description || book.description || '',
          level: book.lexile_level,
          genre: book.genre || 'Fiction',
          pages: book.pages || 100,
          estimatedTime: `${Math.ceil((book.pages || 100) / 30)} min`,
          content: ''
        }));

        setBooks(transformedBooks);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCoverImageUrl = (bookId: string): string => {
    const { data } = supabase.storage
      .from('book-covers')
      .getPublicUrl(`${bookId}.jpg`);
    
    return data.publicUrl || `https://placehold.co/300x400/6366f1/white?text=${bookId}`;
  };

  const handleDeleteBook = async (book: Book) => {
    if (!confirm(`Are you sure you want to delete "${book.title}"?`)) {
      return;
    }

    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('books')
        .delete()
        .eq('id', book.id);

      if (dbError) throw dbError;

      // Delete PDF from storage
      await supabase.storage.from('book-content').remove([book.id]);

      // Delete cover from storage
      await supabase.storage.from('book-covers').remove([`${book.id}.jpg`]);

      // Refresh the list
      fetchBooks();
      
      console.log('✅ Book deleted:', book.title);
    } catch (error) {
      console.error('Error deleting book:', error);
      alert('Failed to delete book. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Library Management</h1>
            <p className="text-slate-600 mt-2 font-medium">{books.length} books in your library</p>
          </div>
          <button
            onClick={onAddBook}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md font-semibold"
          >
            <Plus className="w-5 h-5" />
            Add Book
          </button>
        </div>

        {/* Books Table */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-600">Book</th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-600">Author</th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-600">Genre</th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-600">Lexile</th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-600">Pages</th>
                  <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {books.map((book) => (
                  <tr key={book.id} className="hover:bg-slate-50 transition-colors">
                    {/* Book Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="w-12 h-16 object-cover rounded-lg shadow-sm"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{book.title}</div>
                          <div className="text-sm text-slate-500 line-clamp-1">{book.description}</div>
                        </div>
                      </div>
                    </td>

                    {/* Author */}
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-700">{book.author}</div>
                    </td>

                    {/* Genre */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                        {book.genre}
                      </span>
                    </td>

                    {/* Lexile */}
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-700">{book.level}L</div>
                    </td>

                    {/* Pages */}
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-600">{book.pages}</div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {/* Read Book Button */}
                        <button
                          onClick={() => onReadBook(book)}
                          className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all"
                          title="Read Book"
                        >
                          <BookOpen size={14} />
                          Read
                        </button>

                        {/* Quiz Button */}
                        <button
                          onClick={() => onViewQuiz(book)}
                          className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition-all"
                          title="View Quiz"
                        >
                          <Eye size={14} />
                          View Quiz
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteBook(book)}
                          className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-all"
                          title="Delete Book"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {books.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">No books in library yet</p>
              <p className="text-slate-400 text-sm mt-1">Add books to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherLibrary;
