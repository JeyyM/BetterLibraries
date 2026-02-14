const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testStorage() {
  console.log('🔍 Testing storage setup...\n');

  // 1. List buckets
  console.log('1️⃣ Checking buckets...');
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  
  if (bucketsError) {
    console.error('❌ Error listing buckets:', bucketsError);
  } else {
    console.log('✅ Found buckets:', buckets.map(b => `${b.name} (${b.public ? 'public' : 'private'})`).join(', '));
  }

  // 2. Try to create a test file
  console.log('\n2️⃣ Testing upload to book-content...');
  const testContent = new Blob(['test'], { type: 'application/pdf' });
  const testFileName = 'test-upload-' + Date.now();
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('book-content')
    .upload(testFileName, testContent, {
      cacheControl: '3600',
      upsert: true
    });

  if (uploadError) {
    console.error('❌ Upload failed:', uploadError);
    console.error('   Error details:', JSON.stringify(uploadError, null, 2));
  } else {
    console.log('✅ Upload successful:', uploadData.path);
    
    // Clean up
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

  // 3. Check public URL access
  console.log('\n4️⃣ Testing public URL generation...');
  const { data: publicUrlData } = supabase.storage
    .from('book-content')
    .getPublicUrl('test-file');
  
  console.log('✅ Public URL format:', publicUrlData.publicUrl);
}

testStorage().catch(console.error);
