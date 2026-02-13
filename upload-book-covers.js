import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Mapping of image filenames to book titles in database
const imageMapping = {
  'Rikki-Tikki-Tavi.jpg': 'Rikki-Tikki-Tavi',
  'The Elves and the Shoemaker.jfif': 'The Elves and the Shoemaker',
  'The Little Prince.jpg': 'The Little Prince',
  'The Most Dangerous Game.jpeg': 'The Most Dangerous Game',
  'The Old Man and the Sea.jfif': 'The Old Man and the Sea',
  'The Outsiders.jpg': 'The Outsiders',
  'The Tale of Benjamin Bunny.jpg': 'The Tale of Benjamin Bunny',
  'The Tale of Peter Rabbit.jpg': 'THE TALE OF PETER RABBIT',
  'The Tale of Squirrel Nutkin.jpg': 'The Tale of Squirrel Nutkin',
  'The Tell-Tale Heart.jpg': 'The Tell-Tale Heart',
  'The Town Musicians of Bremen.jfif': 'The Town Musicians of Bremen',
  'The Velveteen Rabbit.jpg': 'The Velveteen Rabbit',
  'Winnie the Pooh.jfif': 'Winnie the Pooh',
  "The Monkey's Paw.jpg": "THE MONKEY'S PAW"
};

async function uploadBookCovers() {
  console.log('📚 Starting book cover upload process...\n');

  const bookImagesDir = path.join(__dirname, 'book images');
  
  if (!fs.existsSync(bookImagesDir)) {
    console.error('❌ Book images directory not found:', bookImagesDir);
    process.exit(1);
  }

  // First, get all books from the database
  const { data: books, error: booksError } = await supabase
    .from('books')
    .select('id, title');

  if (booksError) {
    console.error('❌ Error fetching books:', booksError);
    process.exit(1);
  }

  console.log(`📖 Found ${books.length} books in database\n`);

  let uploadedCount = 0;
  let errorCount = 0;

  for (const [imageFilename, bookTitle] of Object.entries(imageMapping)) {
    const imagePath = path.join(bookImagesDir, imageFilename);

    if (!fs.existsSync(imagePath)) {
      console.log(`⚠️  Image not found: ${imageFilename}`);
      errorCount++;
      continue;
    }

    // Find the book in the database
    const book = books.find(b => b.title === bookTitle);

    if (!book) {
      console.log(`⚠️  Book not found in database: "${bookTitle}"`);
      errorCount++;
      continue;
    }

    console.log(`📤 Uploading: ${imageFilename} → ${book.title}`);

    try {
      // Read the image file
      const imageBuffer = fs.readFileSync(imagePath);
      
      // Determine content type based on file extension
      const ext = path.extname(imageFilename).toLowerCase();
      const contentType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 
                         ext === '.jfif' ? 'image/jpeg' : 'image/jpeg';

      // Upload to Supabase Storage (book-covers bucket)
      // Use book ID as filename for easy retrieval
      const fileName = `${book.id}.jpg`;
      
      const { data, error } = await supabase.storage
        .from('book-covers')
        .upload(fileName, imageBuffer, {
          contentType: contentType,
          upsert: true // Overwrite if exists
        });

      if (error) {
        console.error(`   ❌ Upload failed: ${error.message}`);
        errorCount++;
      } else {
        console.log(`   ✅ Uploaded as: ${fileName}`);
        uploadedCount++;
      }
    } catch (err) {
      console.error(`   ❌ Error: ${err.message}`);
      errorCount++;
    }

    console.log('');
  }

  console.log('\n============================================================');
  console.log('📊 Upload Summary');
  console.log('============================================================');
  console.log(`✅ Successfully uploaded: ${uploadedCount} covers`);
  console.log(`❌ Failed: ${errorCount} covers`);
  console.log('============================================================\n');

  // Show public URLs
  if (uploadedCount > 0) {
    console.log('🔗 Sample Cover URLs:');
    const sampleBooks = books.slice(0, 3);
    for (const book of sampleBooks) {
      const { data } = supabase.storage
        .from('book-covers')
        .getPublicUrl(`${book.id}.jpg`);
      console.log(`   ${book.title}: ${data.publicUrl}`);
    }
  }
}

uploadBookCovers().catch(console.error);
