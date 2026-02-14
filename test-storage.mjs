import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local file
const envPath = join(__dirname, '.env.local');
const envConfig = dotenv.parse(readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Storage Setup\n');
console.log('📍 URL:', supabaseUrl);
console.log('🔑 Key:', supabaseKey.substring(0, 20) + '...\n');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStorage() {
  try {
    // 1. List buckets
    console.log('1️⃣ Listing storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return;
    }
    
    console.log('✅ Found buckets:');
    buckets.forEach(b => {
      console.log(`   - ${b.name} (${b.public ? 'PUBLIC' : 'private'}) - ${b.file_size_limit / 1024 / 1024}MB limit`);
    });

    // 2. Try to upload a test file
    console.log('\n2️⃣ Attempting test upload to book-content...');
    const testContent = Buffer.from('This is a test PDF content');
    const testFileName = `test-${Date.now()}.pdf`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('book-content')
      .upload(testFileName, testContent, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'application/pdf'
      });

    if (uploadError) {
      console.error('❌ Upload failed:');
      console.error('   Message:', uploadError.message);
      console.error('   Status:', uploadError.statusCode);
      console.error('   Full error:', JSON.stringify(uploadError, null, 2));
    } else {
      console.log('✅ Upload successful!');
      console.log('   Path:', uploadData.path);
      
      // 3. Get public URL
      const { data: urlData } = supabase.storage
        .from('book-content')
        .getPublicUrl(testFileName);
      console.log('   Public URL:', urlData.publicUrl);
      
      // 4. Clean up
      console.log('\n3️⃣ Cleaning up test file...');
      const { error: deleteError } = await supabase.storage
        .from('book-content')
        .remove([testFileName]);
      
      if (deleteError) {
        console.error('⚠️  Cleanup failed:', deleteError);
      } else {
        console.log('✅ Test file deleted');
      }
    }

  } catch (err) {
    console.error('💥 Unexpected error:', err);
  }
}

testStorage();
