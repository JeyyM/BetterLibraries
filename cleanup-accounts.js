// ============================================================================
// BETTERLIBRARIES - CLEANUP SCRIPT
// ============================================================================
// This script removes all existing users and related data
// Run with: node cleanup-accounts.js
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function cleanupAccounts() {
  console.log('\n🧹 Starting BetterLibraries Cleanup...\n');
  
  const summary = {
    authUsersDeleted: 0,
    enrollmentsDeleted: 0,
    statsDeleted: 0,
    classesDeleted: 0,
    usersDeleted: 0,
    errors: []
  };

  try {
    // Step 1: Delete class enrollments
    console.log('📋 Deleting class enrollments...');
    const { error: enrollError, count: enrollCount } = await supabase
      .from('class_enrollments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (enrollError) {
      console.error(`   ⚠️  ${enrollError.message}`);
    } else {
      summary.enrollmentsDeleted = enrollCount || 0;
      console.log(`   ✅ Deleted ${summary.enrollmentsDeleted} enrollments`);
    }

    // Step 2: Delete student stats
    console.log('📊 Deleting student stats...');
    const { error: statsError, count: statsCount } = await supabase
      .from('student_stats')
      .delete()
      .neq('user_id', '00000000-0000-0000-0000-000000000000');

    if (statsError) {
      console.error(`   ⚠️  ${statsError.message}`);
    } else {
      summary.statsDeleted = statsCount || 0;
      console.log(`   ✅ Deleted ${summary.statsDeleted} stats records`);
    }

    // Step 3: Delete classes
    console.log('🏫 Deleting classes...');
    const { error: classError, count: classCount } = await supabase
      .from('classes')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (classError) {
      console.error(`   ⚠️  ${classError.message}`);
    } else {
      summary.classesDeleted = classCount || 0;
      console.log(`   ✅ Deleted ${summary.classesDeleted} classes`);
    }

    // Step 4: Delete public users
    console.log('👥 Deleting public users...');
    const { error: usersError, count: usersCount } = await supabase
      .from('users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (usersError) {
      console.error(`   ⚠️  ${usersError.message}`);
    } else {
      summary.usersDeleted = usersCount || 0;
      console.log(`   ✅ Deleted ${summary.usersDeleted} public users`);
    }

    // Step 5: Delete auth users
    console.log('🔐 Deleting auth users...');
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error(`   ⚠️  ${listError.message}`);
    } else if (authUsers && authUsers.users) {
      for (const user of authUsers.users) {
        try {
          await supabase.auth.admin.deleteUser(user.id);
          summary.authUsersDeleted++;
          console.log(`   ✅ Deleted ${user.email}`);
        } catch (error) {
          console.error(`   ❌ Failed to delete ${user.email}`);
          summary.errors.push(`${user.email}: ${error.message}`);
        }
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('🧹 CLEANUP SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Auth Users Deleted: ${summary.authUsersDeleted}`);
    console.log(`✅ Public Users Deleted: ${summary.usersDeleted}`);
    console.log(`✅ Classes Deleted: ${summary.classesDeleted}`);
    console.log(`✅ Student Stats Deleted: ${summary.statsDeleted}`);
    console.log(`✅ Enrollments Deleted: ${summary.enrollmentsDeleted}`);
    
    if (summary.errors.length > 0) {
      console.log(`\n⚠️  Errors: ${summary.errors.length}`);
      summary.errors.forEach(err => console.log(`   - ${err}`));
    }

    console.log('\n' + '='.repeat(60));
    console.log('✨ Cleanup Complete! You can now run setup-accounts.js');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

cleanupAccounts();
