// Quick test to verify Supabase connection from browser environment
import { supabase } from './src/lib/supabase';

console.log('🔧 Testing Supabase Connection...');
console.log('📍 Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('🔑 Anon Key (first 20 chars):', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20));

// Test a simple query
async function testConnection() {
  console.log('\n🧪 Running test query...');
  
  const { data, error, count } = await supabase
    .from('books')
    .select('*', { count: 'exact' })
    .limit(5);

  if (error) {
    console.error('❌ Test failed:', error);
  } else {
    console.log(`✅ Test passed! Found ${count} total books`);
    console.log('📚 Sample books:', data);
  }
}

testConnection();

export default function TestComponent() {
  return null;
}
