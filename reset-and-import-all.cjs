const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Book data with all metadata
const booksData = [
  {
    title: "Rikki-Tikki-Tavi",
    author: "Rudyard Kipling",
    lexile: "850-930L",
    genre: "Classic Fiction",
    pages: 14,
    coverImage: "Rikki-Tikki-Tavi.jpg",
    pdfFile: "Rikki-Tikki-Tavi.pdf",
    description: "A brave mongoose protects a family from cobras in colonial India."
  },
  {
    title: "The Elves and the Shoemaker",
    author: "Brothers Grimm",
    lexile: "550-650L",
    genre: "Fairy Tale",
    pages: 32,
    coverImage: "The Elves and the Shoemaker.jfif",
    pdfFile: "The Elves and the Shoemaker.pdf",
    description: "Helpful elves secretly assist a struggling shoemaker."
  },
  {
    title: "The Little Prince",
    author: "Antoine de Saint-Exupéry",
    lexile: "710L",
    genre: "Classic Fiction",
    pages: 64,
    coverImage: "The Little Prince.jpg",
    pdfFile: "The Little Prince.pdf",
    description: "A young prince travels from planet to planet seeking wisdom."
  },
  {
    title: "THE MONKEY'S PAW",
    author: "W. W. Jacobs",
    lexile: "950-1050L",
    genre: "Horror",
    pages: 18,
    coverImage: "The Monkey's Paw.jpg",
    pdfFile: "The Monkey's Paw.pdf",
    description: "A cursed talisman grants three wishes with terrible consequences."
  },
  {
    title: "The Most Dangerous Game",
    author: "Richard Connell",
    lexile: "950L",
    genre: "Adventure",
    pages: 28,
    coverImage: "The Most Dangerous Game.jpeg",
    pdfFile: "The Most Dangerous Game.pdf",
    description: "A hunter becomes the hunted on a remote island."
  },
  {
    title: "The Old Man and the Sea",
    author: "Ernest Hemingway",
    lexile: "940L",
    genre: "Classic Fiction",
    pages: 52,
    coverImage: "The Old Man and the Sea.jfif",
    pdfFile: "The Old Man and the Sea.pdf",
    description: "An elderly fisherman battles a giant marlin in the Gulf Stream."
  },
  {
    title: "The Outsiders",
    author: "S.E. Hinton",
    lexile: "750L",
    genre: "Young Adult",
    pages: 192,
    coverImage: "The Outsiders.jpg",
    pdfFile: "The Outsiders.pdf",
    description: "Rival gangs clash in 1960s Oklahoma, exploring class and loyalty."
  },
  {
    title: "The Tale of Benjamin Bunny",
    author: "Beatrix Potter",
    lexile: "600-620L",
    genre: "Children's Literature",
    pages: 58,
    coverImage: "The Tale of Benjamin Bunny.jpg",
    pdfFile: "The Tale of Benjamin Bunny.pdf",
    description: "Benjamin and Peter return to Mr. McGregor's garden."
  },
  {
    title: "THE TALE OF PETER RABBIT",
    author: "Beatrix Potter",
    lexile: "660L",
    genre: "Children's Literature",
    pages: 72,
    coverImage: "The Tale of Peter Rabbit.jpg",
    pdfFile: "The Tale of Peter Rabbit.pdf",
    description: "A mischievous rabbit ventures into Mr. McGregor's garden."
  },
  {
    title: "The Tale of Squirrel Nutkin",
    author: "Beatrix Potter",
    lexile: "720L",
    genre: "Children's Literature",
    pages: 68,
    coverImage: "The Tale of Squirrel Nutkin.jpg",
    pdfFile: "The Tale of Squirrel Nutkin.pdf",
    description: "An impertinent squirrel challenges Old Brown the owl."
  },
  {
    title: "The Tell-Tale Heart",
    author: "Edgar Allan Poe",
    lexile: "850L",
    genre: "Horror",
    pages: 12,
    coverImage: "The Tell-Tale Heart.jpg",
    pdfFile: "The Tell-Tale Heart.pdf",
    description: "A murderer is haunted by the sound of his victim's heartbeat."
  },
  {
    title: "The Town Musicians of Bremen",
    author: "Brothers Grimm",
    lexile: "750L",
    genre: "Fairy Tale",
    pages: 40,
    coverImage: "The Town Musicians of Bremen.jfif",
    pdfFile: "The Town Musicians of Bremen.pdf",
    description: "Four aging animals band together to become musicians."
  },
  {
    title: "The Velveteen Rabbit",
    author: "Margery Williams",
    lexile: "820L",
    genre: "Children's Literature",
    pages: 44,
    coverImage: "The Velveteen Rabbit.jpg",
    pdfFile: "The Velveteen Rabbit.pdf",
    description: "A stuffed rabbit learns what it means to become real through love."
  },
  {
    title: "Winnie the Pooh",
    author: "A.A. Milne",
    lexile: "540L",
    genre: "Children's Literature",
    pages: 161,
    coverImage: "Winnie the Pooh.jfif",
    pdfFile: "Winnie the Pooh.pdf",
    description: "Adventures of a lovable bear and his friends in the Hundred Acre Wood."
  }
];

async function clearEverything() {
  console.log('\n🗑️  STEP 1: Clearing existing data...\n');
  
  // Delete all books from database
  const { error: deleteError } = await supabase
    .from('books')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (deleteError) {
    console.error('❌ Error deleting books:', deleteError);
  } else {
    console.log('✅ Deleted all books from database');
  }

  // Clear book-covers bucket
  const { data: coverFiles } = await supabase.storage
    .from('book-covers')
    .list('');
  
  if (coverFiles && coverFiles.length > 0) {
    const coverPaths = coverFiles.map(f => f.name);
    const { error: coverDeleteError } = await supabase.storage
      .from('book-covers')
      .remove(coverPaths);
    
    if (coverDeleteError) {
      console.error('❌ Error deleting covers:', coverDeleteError);
    } else {
      console.log(`✅ Deleted ${coverPaths.length} cover images`);
    }
  }

  // Clear book-content bucket
  const { data: pdfFiles } = await supabase.storage
    .from('book-content')
    .list('');
  
  if (pdfFiles && pdfFiles.length > 0) {
    const pdfPaths = pdfFiles.map(f => f.name);
    const { error: pdfDeleteError } = await supabase.storage
      .from('book-content')
      .remove(pdfPaths);
    
    if (pdfDeleteError) {
      console.error('❌ Error deleting PDFs:', pdfDeleteError);
    } else {
      console.log(`✅ Deleted ${pdfPaths.length} PDF files`);
    }
  }
}

async function importEverything() {
  console.log('\n📚 STEP 2: Importing books, covers, and PDFs...\n');

  const coversDir = path.join(__dirname, 'book images');
  const pdfsDir = path.join(__dirname, 'books');

  let successCount = 0;
  let errors = [];

  for (const bookData of booksData) {
    try {
      console.log(`\n📖 Processing: ${bookData.title}`);

      // 1. Insert book into database first to get the UUID
      // Extract numeric part from lexile (e.g., "850-930L" -> 850, "710L" -> 710)
      const lexileNumeric = parseInt(bookData.lexile.split('-')[0].replace('L', ''));
      
      console.log(`  📄 Using page count: ${bookData.pages}`);
      
      const { data: insertedBook, error: insertError } = await supabase
        .from('books')
        .insert({
          title: bookData.title,
          author: bookData.author,
          lexile_level: lexileNumeric,
          genre: bookData.genre,
          description: bookData.description,
          pages: bookData.pages,
          is_active: true
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Database insert failed: ${insertError.message}`);
      }

      const bookId = insertedBook.id;
      console.log(`  ✅ Created book in DB (ID: ${bookId}, Pages: ${insertedBook.pages})`);

      // 2. Upload cover image with book ID as filename
      const coverPath = path.join(coversDir, bookData.coverImage);
      if (fs.existsSync(coverPath)) {
        const coverBuffer = fs.readFileSync(coverPath);
        const { error: coverError } = await supabase.storage
          .from('book-covers')
          .upload(`${bookId}.jpg`, coverBuffer, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (coverError) {
          throw new Error(`Cover upload failed: ${coverError.message}`);
        }
        console.log(`  ✅ Uploaded cover image`);
      } else {
        console.log(`  ⚠️  Cover image not found: ${coverPath}`);
      }

      // 3. Upload PDF with book ID as filename (no extension)
      const pdfPath = path.join(pdfsDir, bookData.pdfFile);
      if (fs.existsSync(pdfPath)) {
        const pdfBuffer = fs.readFileSync(pdfPath);
        const { error: pdfError } = await supabase.storage
          .from('book-content')
          .upload(bookId, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: true
          });

        if (pdfError) {
          throw new Error(`PDF upload failed: ${pdfError.message}`);
        }
        console.log(`  ✅ Uploaded PDF`);
      } else {
        console.log(`  ⚠️  PDF not found: ${pdfPath}`);
      }

      successCount++;
      console.log(`  ✨ Completed: ${bookData.title}`);

    } catch (error) {
      errors.push({ book: bookData.title, error: error.message });
      console.error(`  ❌ Failed: ${bookData.title} - ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n✅ Successfully imported ${successCount}/${booksData.length} books\n`);

  if (errors.length > 0) {
    console.log('❌ Errors encountered:');
    errors.forEach(e => console.log(`  - ${e.book}: ${e.error}`));
  }
}

async function verifyImport() {
  console.log('\n🔍 STEP 3: Verifying import...\n');

  // Check database
  const { data: books } = await supabase
    .from('books')
    .select('id, title, author')
    .order('title');

  console.log(`📊 Books in database: ${books.length}`);
  
  // Check storage
  const { data: covers } = await supabase.storage.from('book-covers').list('');
  const { data: pdfs } = await supabase.storage.from('book-content').list('');

  console.log(`🖼️  Cover images: ${covers.length}`);
  console.log(`📄 PDF files: ${pdfs.length}`);

  // Verify all books have matching files
  console.log('\n📋 Verification Results:');
  const coverIds = new Set(covers.map(f => f.name.replace('.jpg', '')));
  const pdfIds = new Set(pdfs.map(f => f.name));

  books.forEach(book => {
    const hasCover = coverIds.has(book.id);
    const hasPdf = pdfIds.has(book.id);
    const status = hasCover && hasPdf ? '✅' : '⚠️';
    console.log(`  ${status} ${book.title}: Cover=${hasCover ? '✅' : '❌'}, PDF=${hasPdf ? '✅' : '❌'}`);
  });
}

async function main() {
  console.log('🚀 RESET AND IMPORT ALL BOOKS');
  console.log('='.repeat(60));

  await clearEverything();
  await importEverything();
  await verifyImport();

  console.log('\n✨ Process complete!\n');
}

main().catch(console.error);
