import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🧹 CLEANUP ALL BOOKS AND FILES');
console.log('============================================================\n');

async function cleanupAll() {
  try {
    // 1. Get all files from book-content bucket
    console.log('📂 Fetching files from book-content bucket...');
    const { data: pdfFiles, error: pdfListError } = await supabase.storage
      .from('book-content')
      .list();

    if (pdfListError) {
      console.error('❌ Error listing PDFs:', pdfListError);
    } else {
      console.log(`   Found ${pdfFiles.length} PDF files`);
      
      if (pdfFiles.length > 0) {
        const pdfPaths = pdfFiles.map(file => file.name);
        console.log('🗑️  Deleting PDFs...');
        const { error: pdfDeleteError } = await supabase.storage
          .from('book-content')
          .remove(pdfPaths);
        
        if (pdfDeleteError) {
          console.error('❌ Error deleting PDFs:', pdfDeleteError);
        } else {
          console.log(`✅ Deleted ${pdfFiles.length} PDF files`);
        }
      }
    }

    // 2. Get all files from book-covers bucket
    console.log('\n📂 Fetching files from book-covers bucket...');
    const { data: coverFiles, error: coverListError } = await supabase.storage
      .from('book-covers')
      .list();

    if (coverListError) {
      console.error('❌ Error listing covers:', coverListError);
    } else {
      console.log(`   Found ${coverFiles.length} cover images`);
      
      if (coverFiles.length > 0) {
        const coverPaths = coverFiles.map(file => file.name);
        console.log('🗑️  Deleting covers...');
        const { error: coverDeleteError } = await supabase.storage
          .from('book-covers')
          .remove(coverPaths);
        
        if (coverDeleteError) {
          console.error('❌ Error deleting covers:', coverDeleteError);
        } else {
          console.log(`✅ Deleted ${coverFiles.length} cover images`);
        }
      }
    }

    // 3. Delete all reading progress
    console.log('\n📊 Deleting reading progress...');
    const { error: progressError } = await supabase
      .from('reading_progress')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (progressError) {
      console.error('❌ Error deleting reading progress:', progressError);
    } else {
      console.log('✅ Deleted all reading progress');
    }

    // 4. Delete all books
    console.log('\n📚 Deleting all books from database...');
    const { error: booksError } = await supabase
      .from('books')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (booksError) {
      console.error('❌ Error deleting books:', booksError);
    } else {
      console.log('✅ Deleted all books from database');
    }

    // 5. Verify cleanup
    console.log('\n🔍 Verifying cleanup...');
    const { data: remainingBooks } = await supabase
      .from('books')
      .select('id');
    
    const { data: remainingPDFs } = await supabase.storage
      .from('book-content')
      .list();
    
    const { data: remainingCovers } = await supabase.storage
      .from('book-covers')
      .list();

    console.log(`\n📊 Cleanup Results:`);
    console.log(`   Books in database: ${remainingBooks?.length || 0}`);
    console.log(`   PDFs in storage: ${remainingPDFs?.length || 0}`);
    console.log(`   Covers in storage: ${remainingCovers?.length || 0}`);

    if ((remainingBooks?.length || 0) === 0 && 
        (remainingPDFs?.length || 0) === 0 && 
        (remainingCovers?.length || 0) === 0) {
      console.log('\n✨ Cleanup complete! Everything is clean.');
    } else {
      console.log('\n⚠️  Some items may still remain. Check the results above.');
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

cleanupAll();
