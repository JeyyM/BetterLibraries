import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for testing

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBooks() {
  console.log('🔍 Checking books in database...\n');
  
  const { data, error, count } = await supabase
    .from('books')
    .select('id, title, author, lexile_level, genre, is_active', { count: 'exact' });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`📊 Total books in database: ${count}\n`);
  
  if (data && data.length > 0) {
    console.log('📚 Books found:\n');
    data.forEach((book, index) => {
      console.log(`${index + 1}. ${book.title} by ${book.author}`);
      console.log(`   - Lexile: ${book.lexile_level}L`);
      console.log(`   - Genre: ${book.genre}`);
      console.log(`   - Active: ${book.is_active}`);
      console.log(`   - ID: ${book.id}\n`);
    });

    const activeBooks = data.filter(b => b.is_active);
    console.log(`\n✅ Active books: ${activeBooks.length}`);
    console.log(`⛔ Inactive books: ${data.length - activeBooks.length}`);
  } else {
    console.log('⚠️  No books found in database!');
  }
}

checkBooks();
