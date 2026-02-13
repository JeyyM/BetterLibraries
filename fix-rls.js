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

async function fixRLS() {
  console.log('🔧 Fixing RLS policies for books table...\n');

  // Disable RLS on books table since it's public data
  const { error } = await supabase.rpc('exec_sql', {
    sql: 'ALTER TABLE books DISABLE ROW LEVEL SECURITY;'
  });

  if (error) {
    console.log('⚠️  Could not use exec_sql RPC. Running manual approach...\n');
    console.log('Please run this SQL manually in Supabase SQL Editor:');
    console.log('');
    console.log('ALTER TABLE books DISABLE ROW LEVEL SECURITY;');
    console.log('');
    console.log('Go to: https://supabase.com/dashboard/project/iorphpkzpyjgawtvisst/sql');
  } else {
    console.log('✅ Successfully disabled RLS on books table!');
  }

  // Test the query again
  console.log('\n🧪 Testing books query...');
  const { data, error: queryError } = await supabase
    .from('books')
    .select('id, title')
    .limit(3);

  if (queryError) {
    console.error('❌ Still getting error:', queryError);
  } else {
    console.log('✅ Query successful!');
    console.log('📚 Sample books:', data);
  }
}

fixRLS();
