import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function removeDuplicateBooks() {
  console.log('🧹 Cleaning up duplicate books...\n');

  // Get all books
  const { data: allBooks, error } = await supabase
    .from('books')
    .select('*')
    .order('title, created_at');

  if (error) {
    console.error('❌ Error fetching books:', error);
    return;
  }

  console.log(`📚 Found ${allBooks.length} total books\n`);

  // Group books by title and author
  const bookGroups = {};
  allBooks.forEach(book => {
    const key = `${book.title}|||${book.author}`;
    if (!bookGroups[key]) {
      bookGroups[key] = [];
    }
    bookGroups[key].push(book);
  });

  // Find duplicates and mark which to keep
  const booksToKeep = [];
  const booksToDelete = [];

  for (const [key, books] of Object.entries(bookGroups)) {
    if (books.length > 1) {
      const [title, author] = key.split('|||');
      console.log(`📖 Found ${books.length} copies of "${title}" by ${author}`);
      
      // Keep the first one (oldest), delete the rest
      booksToKeep.push(books[0]);
      
      for (let i = 1; i < books.length; i++) {
        console.log(`   ❌ Marking duplicate for deletion: ${books[i].id}`);
        booksToDelete.push(books[i].id);
      }
      console.log('');
    } else {
      booksToKeep.push(books[0]);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Books to keep: ${booksToKeep.length}`);
  console.log(`   🗑️  Books to delete: ${booksToDelete.length}\n`);

  if (booksToDelete.length > 0) {
    console.log('🗑️  Deleting duplicate books...');
    
    for (const bookId of booksToDelete) {
      const { error: deleteError } = await supabase
        .from('books')
        .delete()
        .eq('id', bookId);

      if (deleteError) {
        console.error(`   ❌ Error deleting ${bookId}:`, deleteError);
      } else {
        console.log(`   ✅ Deleted duplicate: ${bookId}`);
      }
    }

    console.log('\n✅ Cleanup complete!');
    console.log(`📚 Unique books remaining: ${booksToKeep.length}\n`);

    // Show the final list
    console.log('📚 Final book list:');
    booksToKeep
      .sort((a, b) => a.title.localeCompare(b.title))
      .forEach((book, index) => {
        console.log(`${index + 1}. ${book.title} by ${book.author} (Lexile ${book.lexile_level}L)`);
      });
  } else {
    console.log('✅ No duplicates found!');
  }
}

removeDuplicateBooks();
