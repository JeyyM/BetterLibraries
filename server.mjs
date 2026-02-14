import express from 'express';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// CORS configuration - allow requests from Vite dev server
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Supabase client with SERVICE_ROLE_KEY (bypasses RLS)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Book upload API running' });
});

// Upload book endpoint
app.post('/api/upload-book', upload.fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('📚 Book upload request received');
    
    // Get form data
    const { title, author, description, genre, lexileLevel, pages } = req.body;
    const pdfFile = req.files['pdf']?.[0];
    const coverFile = req.files['cover']?.[0];

    // Validation
    if (!title || !pdfFile || !coverFile) {
      return res.status(400).json({ 
        error: 'Missing required fields: title, pdf, and cover are required' 
      });
    }

    console.log('📖 Creating book:', title);

    // 1. Create book in database
    const { data: bookData, error: bookError } = await supabase
      .from('books')
      .insert([{
        title: title.trim(),
        author: author?.trim() || 'Unknown Author',
        description: description?.trim() || 'No description provided',
        genre: genre || 'Fiction',
        lexile_level: parseInt(lexileLevel) || 500,
        pages: parseInt(pages) || 100,
        is_active: true
      }])
      .select()
      .single();

    if (bookError) {
      console.error('❌ Database error:', bookError);
      throw bookError;
    }

    const bookId = bookData.id;
    console.log('✅ Book created with ID:', bookId);

    // 2. Upload PDF
    console.log('📤 Uploading PDF...');
    const { error: pdfError } = await supabase.storage
      .from('book-content')
      .upload(bookId, pdfFile.buffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: true
      });

    if (pdfError) {
      console.error('❌ PDF upload error:', pdfError);
      // Rollback: delete the book
      await supabase.from('books').delete().eq('id', bookId);
      throw pdfError;
    }
    console.log('✅ PDF uploaded');

    // 3. Upload cover image
    console.log('📤 Uploading cover...');
    const { error: coverError } = await supabase.storage
      .from('book-covers')
      .upload(`${bookId}.jpg`, coverFile.buffer, {
        contentType: coverFile.mimetype,
        cacheControl: '3600',
        upsert: true
      });

    if (coverError) {
      console.error('❌ Cover upload error:', coverError);
      // Rollback: delete book and PDF
      await supabase.from('books').delete().eq('id', bookId);
      await supabase.storage.from('book-content').remove([bookId]);
      throw coverError;
    }
    console.log('✅ Cover uploaded');

    // 4. Get public URLs
    const { data: pdfUrl } = supabase.storage
      .from('book-content')
      .getPublicUrl(bookId);

    const { data: coverUrl } = supabase.storage
      .from('book-covers')
      .getPublicUrl(`${bookId}.jpg`);

    console.log('✨ Book upload complete!');

    res.json({
      success: true,
      book: {
        id: bookId,
        title,
        author: author || 'Unknown Author',
        pdfUrl: pdfUrl.publicUrl,
        coverUrl: coverUrl.publicUrl
      }
    });

  } catch (error) {
    console.error('💥 Upload error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to upload book',
      details: error
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Book upload API server running on http://localhost:${PORT}`);
  console.log(`📚 Upload endpoint: http://localhost:${PORT}/api/upload-book`);
});
