import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
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

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Books directory
const BOOKS_DIR = path.join(__dirname, 'books');

/**
 * Extract basic info from PDF filename and file size
 * Since we can't easily parse PDF text in Node without complex dependencies,
 * we'll use the filename and let Gemini infer metadata
 */
async function extractPDFInfo(pdfPath) {
  try {
    const stats = fs.statSync(pdfPath);
    const fileName = path.basename(pdfPath, '.pdf');
    
    // Estimate pages based on file size (rough estimate: 100KB per page)
    const estimatedPages = Math.max(1, Math.round(stats.size / 102400));
    
    return {
      fileName: fileName,
      fileSize: stats.size,
      estimatedPages: estimatedPages
    };
  } catch (error) {
    console.error(`Error extracting PDF info from ${pdfPath}:`, error.message);
    return null;
  }
}

/**
 * Retry function with exponential backoff
 */
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 2000) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if it's a 503 error (high demand)
      if (error.message?.includes('503') || error.message?.includes('UNAVAILABLE')) {
        if (i < maxRetries - 1) {
          const delay = initialDelay * Math.pow(2, i);
          console.log(`   ⏳ API busy, retrying in ${delay/1000}s... (attempt ${i + 2}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      // If it's not a 503 or we're out of retries, throw
      throw error;
    }
  }
  
  throw lastError;
}

/**
 * Use OpenAI to analyze book title and infer metadata
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
- Identify clear themes that teachers can use for discussion

Respond with ONLY the JSON object, no additional text.`;

    // Use OpenAI with retry logic
    const response = await retryWithBackoff(async () => {
      return await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Fast and cost-effective
        messages: [
          {
            role: 'system',
            content: 'You are a literary expert and educational content specialist. Respond only with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7
      });
    }, 3, 2000);

    const metadata = JSON.parse(response.choices[0].message.content);
    return metadata;
  } catch (error) {
    console.error(`   ❌ OpenAI error:`, error.message);
    return null;
  }
}

/**
 * Upload PDF to Supabase Storage
 */
async function uploadBookPDF(bookId, pdfPath, fileName) {
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
 * Process a single book
 */
async function processBook(filePath, fileName) {
  const title = fileName.replace('.pdf', '');
  
  console.log(`\n📖 Processing: ${title}`);
  
  // Step 1: Extract PDF info
  console.log(`   ⏳ Analyzing PDF file...`);
  const pdfInfo = await extractPDFInfo(filePath);
  
  if (!pdfInfo) {
    console.log(`   ❌ Failed to analyze PDF`);
    return { success: false, title };
  }
  
  console.log(`   ✅ Estimated ${pdfInfo.estimatedPages} pages`);
  
  // Step 2: Analyze with OpenAI
  console.log(`   ⏳ Analyzing with ChatGPT AI...`);
  const metadata = await analyzeBookWithAI(title, pdfInfo.estimatedPages);
  
  if (!metadata) {
    console.log(`   ❌ Failed to analyze with AI`);
    return { success: false, title };
  }
  
  console.log(`   ✅ Detected: ${metadata.author} | ${metadata.genre} | Lexile ${metadata.lexile_level}`);
  
  // Step 3: Generate book ID and upload PDF
  const bookId = randomUUID();
  console.log(`   ⏳ Uploading to Supabase Storage...`);
  const storagePath = await uploadBookPDF(bookId, filePath, fileName);
  
  if (!storagePath) {
    console.log(`   ❌ Failed to upload PDF`);
    return { success: false, title };
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
    content: `${title} by ${metadata.author}. ${metadata.description}`, // Summary for search
    full_content_path: storagePath,
    publication_year: metadata.publication_year,
    is_active: true,
    cover_image_path: null // Will be added later or use default
  };
  
  // Step 5: Insert into database
  console.log(`   ⏳ Saving to database...`);
  const insertedBook = await insertBookRecord(bookRecord);
  
  if (!insertedBook) {
    console.log(`   ❌ Failed to save to database`);
    return { success: false, title };
  }
  
  console.log(`   ✅ ${title} imported successfully!`);
  
  // Add book tags if themes are provided
  if (metadata.themes && metadata.themes.length > 0) {
    for (const theme of metadata.themes) {
      await supabase
        .from('book_tags')
        .insert([{ book_id: bookId, tag: theme }]);
    }
    console.log(`   ✅ Added ${metadata.themes.length} tags`);
  }
  
  return { 
    success: true, 
    title, 
    metadata,
    bookId 
  };
}

/**
 * Main import function
 */
async function importAllBooks() {
  console.log('📚 BetterLibraries Book Import Tool\n');
  console.log('=' .repeat(60));
  
  // Get all PDF files
  const files = fs.readdirSync(BOOKS_DIR).filter(f => f.endsWith('.pdf'));
  
  console.log(`\n📁 Found ${files.length} PDF files in books folder\n`);
  
  const results = {
    successful: [],
    failed: []
  };
  
  // Process each book
  for (let i = 0; i < files.length; i++) {
    const fileName = files[i];
    const filePath = path.join(BOOKS_DIR, fileName);
    
    console.log(`\n[${i + 1}/${files.length}]`);
    
    const result = await processBook(filePath, fileName);
    
    if (result.success) {
      results.successful.push(result);
    } else {
      results.failed.push(result);
    }
    
    // Add delay between books to avoid rate limiting (2 seconds)
    if (i < files.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 IMPORT SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successfully imported: ${results.successful.length} books`);
  console.log(`❌ Failed: ${results.failed.length} books`);
  
  if (results.successful.length > 0) {
    console.log('\n✨ Successfully Imported Books:');
    results.successful.forEach(book => {
      console.log(`   • ${book.title} (${book.metadata?.author || 'Unknown'})`);
    });
  }
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed Books:');
    results.failed.forEach(book => {
      console.log(`   • ${book.title}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 Import process complete!');
  console.log('='.repeat(60));
}

// Run the import
importAllBooks().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
