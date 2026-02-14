const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function fixStorageBuckets() {
  console.log('🔧 Checking and fixing storage buckets...\n');

  const bucketsToCheck = ['book-content', 'book-covers'];

  for (const bucketName of bucketsToCheck) {
    console.log(`📦 Checking bucket: ${bucketName}`);

    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error(`❌ Error listing buckets:`, listError);
      continue;
    }

    const bucketExists = buckets.some(b => b.name === bucketName);

    if (!bucketExists) {
      console.log(`   ⚠️  Bucket doesn't exist. Creating...`);
      
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: bucketName === 'book-content' 
          ? ['application/pdf']
          : ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      });

      if (error) {
        console.error(`   ❌ Failed to create bucket:`, error);
      } else {
        console.log(`   ✅ Bucket created successfully`);
      }
    } else {
      console.log(`   ✅ Bucket exists`);
      
      // Make sure it's public
      const bucket = buckets.find(b => b.name === bucketName);
      if (!bucket.public) {
        console.log(`   ⚠️  Bucket is private. Making it public...`);
        
        const { data, error } = await supabase.storage.updateBucket(bucketName, {
          public: true
        });

        if (error) {
          console.error(`   ❌ Failed to make bucket public:`, error);
        } else {
          console.log(`   ✅ Bucket is now public`);
        }
      } else {
        console.log(`   ✅ Bucket is public`);
      }
    }

    console.log('');
  }

  console.log('✨ Storage bucket check complete!');
}

fixStorageBuckets().catch(console.error);
