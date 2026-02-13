import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase with service role key
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });

// Books directory
const BOOKS_DIR = path.join(__dirname, 'books');

/**
 * Extract basic info from PDF
 */
async function extractPDFInfo(pdfPath) {
  try {
    const stats = fs.statSync(pdfPath);
    const fileName = path.basename(pdfPath, '.pdf');
    const estimatedPages = Math.max(1, Math.round(stats.size / 102400));
    
    return {
      fileName: fileName,
      fileSize: stats.size,
      estimatedPages: estimatedPages
    };
  } catch (error) {
    console.error(`Error extracting PDF info:`, error.message);
    return null;
  }
}

/**
 * Analyze book with Gemini
 */
async function analyzeBookWithAI(title, pages) {
  try {
    const prompt = `Analyze this classic book title and provide detailed metadata in JSON format.

Book Title: "${title}"
Estimated Pages: ${pages}

Please provide the following information in JSON format:
{
  "author": "Author name (use your knowledge of classic literature)",
  "genre": "Primary genre (e.g., 'Classic Fiction', 'Children's Literature', 'Mystery', 'Adventure', etc.)",
  "lexile_level": estimated Lexile reading level (number between 200-1700),
  "estimated_time_minutes": estimated reading time in minutes based on ${pages} pages,
  "description": "A compelling 2-3 sentence description for students",
  "full_description": "A detailed 4-5 sentence description including themes, plot overview, and educational value",
  "themes": ["theme1", "theme2", "theme3"],
  "recommended_grade": "Recommended grade level (e.g., '3-5', '6-8', '9-12')",
  "publication_year": estimated original publication year (number)
}

Guidelines:
- Lexile levels: Elementary (200-600), Middle School (600-1000), High School (1000-1700)
- Reading time: Assume 200-250 words per minute for appropriate grade level
- Be accurate and educational in descriptions
- Use your knowledge of classic literature to fill in accurate information
- Identify clear themes that teachers can use for discussion`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const metadata = JSON.parse(response.text);
    
    // Validate required fields and provide defaults if missing
    if (!metadata.author || metadata.author === 'undefined') {
      console.log(`   ⚠️  Missing author, using "W. W. Jacobs"`);
      metadata.author = 'W. W. Jacobs';
    }
    if (!metadata.lexile_level || metadata.lexile_level === 'undefined') {
      console.log(`   ⚠️  Missing Lexile level, using 950`);
      metadata.lexile_level = 950;
    }
    if (!metadata.genre) {
      metadata.genre = 'Horror / Gothic Fiction';
    }
    if (!metadata.themes || metadata.themes.length === 0) {
      metadata.themes = ['Fate', 'Consequences', 'Greed'];
    }
    
    return metadata;
  } catch (error) {
    console.error(`   ❌ AI error:`, error.message);
    return null;
  }
}

/**
 * Upload PDF to Supabase Storage
 */
async function uploadBookPDF(bookId, pdfPath) {
  try {
    const fileBuffer = fs.readFileSync(pdfPath);
    const storagePath = `${bookId}/full.pdf`;

    const { data, error } = await supabase.storage
      .from('book-content')
      .upload(storagePath, fileBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (error) {
      console.error(`   ❌ Storage upload error:`, error.message);
      return null;
    }

    return storagePath;
  } catch (error) {
    console.error(`   ❌ Error uploading PDF:`, error.message);
    return null;
  }
}

/**
 * Insert book record into database
 */
async function insertBookRecord(bookData) {
  try {
    const { data, error } = await supabase
      .from('books')
      .insert([bookData])
      .select()
      .single();

    if (error) {
      console.error(`   ❌ Database insert error:`, error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error(`   ❌ Error inserting book:`, error.message);
    return null;
  }
}

/**
 * Import THE MONKEY'S PAW
 */
async function importMonkeysPaw() {
  console.log('📚 Importing THE MONKEY\'S PAW\n');
  console.log('=' .repeat(60));
  
  const fileName = 'THE MONKEY\'S PAW.pdf';
  const filePath = path.join(BOOKS_DIR, fileName);
  const title = 'THE MONKEY\'S PAW';
  
  console.log(`\n📖 Processing: ${title}`);
  
  // Step 1: Extract PDF info
  console.log(`   ⏳ Analyzing PDF file...`);
  const pdfInfo = await extractPDFInfo(filePath);
  
  if (!pdfInfo) {
    console.log(`   ❌ Failed to analyze PDF`);
    return;
  }
  
  console.log(`   ✅ Estimated ${pdfInfo.estimatedPages} pages`);
  
  // Step 2: Analyze with Gemini AI
  console.log(`   ⏳ Analyzing with Gemini AI...`);
  const metadata = await analyzeBookWithAI(title, pdfInfo.estimatedPages);
  
  if (!metadata) {
    console.log(`   ❌ Failed to analyze with AI`);
    return;
  }
  
  console.log(`   ✅ Detected: ${metadata.author} | ${metadata.genre} | Lexile ${metadata.lexile_level}`);
  
  // Step 3: Generate book ID and upload PDF
  const bookId = randomUUID();
  console.log(`   ⏳ Uploading to Supabase Storage...`);
  const storagePath = await uploadBookPDF(bookId, filePath);
  
  if (!storagePath) {
    console.log(`   ❌ Failed to upload PDF`);
    return;
  }
  
  console.log(`   ✅ Uploaded to storage`);
  
  // Step 4: Prepare book record
  const bookRecord = {
    id: bookId,
    title: title,
    author: metadata.author,
    genre: metadata.genre,
    lexile_level: metadata.lexile_level,
    pages: pdfInfo.estimatedPages,
    estimated_time_minutes: metadata.estimated_time_minutes,
    description: metadata.description,
    full_description: metadata.full_description,
    content: `${title} by ${metadata.author}. ${metadata.description}`,
    full_content_path: storagePath,
    publication_year: metadata.publication_year,
    is_active: true,
    cover_image_path: null
  };
  
  // Step 5: Insert into database
  console.log(`   ⏳ Saving to database...`);
  const insertedBook = await insertBookRecord(bookRecord);
  
  if (!insertedBook) {
    console.log(`   ❌ Failed to save to database`);
    return;
  }
  
  console.log(`   ✅ ${title} imported successfully!`);
  
  // Add book tags
  if (metadata.themes && metadata.themes.length > 0) {
    for (const theme of metadata.themes) {
      await supabase
        .from('book_tags')
        .insert([{ book_id: bookId, tag: theme }]);
    }
    console.log(`   ✅ Added ${metadata.themes.length} tags`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 Import complete!');
  console.log('='.repeat(60));
}

// Run the import
importMonkeysPaw().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
