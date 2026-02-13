
import React from 'react';
import { Book } from '../types';
import { Search, Filter, BookOpen, Clock, Tag } from 'lucide-react';
import { supabase } from '../src/lib/supabase';

interface LibraryProps {
  onReadBook: (book: Book) => void;
}

const Library: React.FC<LibraryProps> = ({ onReadBook }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedGenre, setSelectedGenre] = React.useState('All');
  const [books, setBooks] = React.useState<Book[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [genres, setGenres] = React.useState<string[]>(['All']);

  // Fetch books from Supabase
  React.useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        console.log('🔍 Fetching books from Supabase...');
        const { data, error } = await supabase
          .from('books')
          .select('*')
          .eq('is_active', true)
          .order('title');

        console.log('📊 Supabase response:', { data, error });

        if (error) {
          console.error('❌ Error fetching books:', error);
          throw error;
        }

        if (data) {
          console.log(`✅ Found ${data.length} books in database`);
          
          // Transform database books to match our Book type
          const transformedBooks: Book[] = data.map(book => ({
            id: book.id,
            title: book.title,
            author: book.author,
            coverImage: getCoverImageUrl(book.id), // Get image from Supabase Storage
            description: book.description || '',
            fullDescription: book.full_description || book.description || '',
            level: book.lexile_level,
            genre: book.genre || 'Fiction',
            pages: book.pages || 100,
            estimatedTime: `${Math.ceil((book.pages || 100) / 30)} min`,
            content: '' // We'll load this when needed
          }));

          console.log('📚 Transformed books:', transformedBooks);
          setBooks(transformedBooks);

          // Extract unique genres
          const uniqueGenres = ['All', ...new Set(data.map(b => b.genre).filter(Boolean))];
          console.log('🏷️ Genres:', uniqueGenres);
          setGenres(uniqueGenres);
        }
      } catch (error) {
        console.error('💥 Error fetching books:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  // Helper function to get book cover URL from Supabase Storage
  const getCoverImageUrl = (bookId: string): string => {
    const { data } = supabase.storage
      .from('book-covers')
      .getPublicUrl(`${bookId}.jpg`);
    
    // Fallback to placeholder if image doesn't exist
    return data.publicUrl || `https://placehold.co/300x400/6366f1/white?text=${bookId}`;
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === 'All' || book.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-400/20 blur-3xl rounded-full animate-pulse"></div>
          <BookOpen className="text-indigo-600 animate-bounce relative" size={64} />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">Loading Library...</h2>
          <p className="text-slate-500 mt-2">Fetching your personalized book collection.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Explore Library</h1>
          <p className="text-slate-600 mt-1">Discover thousands of books at your perfect reading level.</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search titles, authors, genres..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
          {genres.map(genre => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`
                px-4 py-2 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all
                ${selectedGenre === genre 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300'}
              `}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Book Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredBooks.map(book => (
          <div key={book.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="relative aspect-[3/4] overflow-hidden">
              <img 
                src={book.coverImage} 
                alt={book.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                <button 
                  onClick={() => onReadBook(book)}
                  className="w-full bg-white text-slate-900 py-3 rounded-2xl font-bold shadow-lg hover:bg-indigo-600 hover:text-white transition-colors"
                >
                  Start Reading
                </button>
              </div>
              <div className="absolute top-4 left-4">
                <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl text-[10px] font-black text-indigo-700 shadow-sm uppercase tracking-widest border border-indigo-100">
                  {book.level}L
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                    {book.title}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium">{book.author}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-4">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                  <Tag size={12} />
                  {book.genre}
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                  <Clock size={12} />
                  {book.estimatedTime}
                </div>
              </div>

              <p className="text-slate-600 text-sm mt-4 line-clamp-2 leading-relaxed">
                {book.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {filteredBooks.length === 0 && (
        <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
          <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="text-slate-300" size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No books found</h3>
          <p className="text-slate-600 mt-2">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
};

export default Library;
