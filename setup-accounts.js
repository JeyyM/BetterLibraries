// ============================================================================
// BETTERLIBRARIES - AUTOMATED ACCOUNT SETUP SCRIPT
// ============================================================================
// This script creates teacher and student accounts with classes
// Run with: node setup-accounts.js
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need service role for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// ============================================================================
// ACCOUNT DATA
// ============================================================================

const teacher = {
  email: 'jerrysmith@email.com',
  password: '123',
  name: 'Jerry Smith',
  role: 'teacher',
  school: 'Washington Elementary'
};

const sectionAStudents = [
  { email: 'john.doe@email.com', name: 'John Doe', lexile: 450 },
  { email: 'jane.smith@email.com', name: 'Jane Smith', lexile: 520 },
  { email: 'michael.johnson@email.com', name: 'Michael Johnson', lexile: 480 },
  { email: 'emily.williams@email.com', name: 'Emily Williams', lexile: 540 },
  { email: 'david.brown@email.com', name: 'David Brown', lexile: 460 },
  { email: 'sarah.jones@email.com', name: 'Sarah Jones', lexile: 510 },
  { email: 'james.garcia@email.com', name: 'James Garcia', lexile: 490 },
  { email: 'linda.martinez@email.com', name: 'Linda Martinez', lexile: 530 },
  { email: 'robert.rodriguez@email.com', name: 'Robert Rodriguez', lexile: 470 },
  { email: 'mary.wilson@email.com', name: 'Mary Wilson', lexile: 500 }
];

const sectionBStudents = [
  { email: 'william.anderson@email.com', name: 'William Anderson', lexile: 440 },
  { email: 'patricia.taylor@email.com', name: 'Patricia Taylor', lexile: 515 },
  { email: 'richard.thomas@email.com', name: 'Richard Thomas', lexile: 475 },
  { email: 'jennifer.moore@email.com', name: 'Jennifer Moore', lexile: 535 },
  { email: 'charles.jackson@email.com', name: 'Charles Jackson', lexile: 455 },
  { email: 'elizabeth.white@email.com', name: 'Elizabeth White', lexile: 525 },
  { email: 'joseph.harris@email.com', name: 'Joseph Harris', lexile: 485 },
  { email: 'susan.martin@email.com', name: 'Susan Martin', lexile: 505 },
  { email: 'thomas.thompson@email.com', name: 'Thomas Thompson', lexile: 465 },
  { email: 'jessica.lee@email.com', name: 'Jessica Lee', lexile: 495 }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function createAuthUser(email, password) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true // Auto-confirm email
  });

  if (error) {
    throw new Error(`Failed to create auth user: ${error.message}`);
  }

  return data.user;
}

async function createPublicUser(id, email, name, role, school, lexile = 400) {
  const { data, error } = await supabase
    .from('users')
    .insert({
      id,
      email,
      name,
      role,
      school,
      current_lexile_level: lexile,
      is_active: true
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create public user: ${error.message}`);
  }

  return data;
}

async function createStudentStats(userId) {
  const { data, error } = await supabase
    .from('student_stats')
    .insert({
      user_id: userId,
      books_read: 0,
      quizzes_completed: 0,
      average_score: 0,
      streak_days: 0,
      total_points: 0
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create student stats: ${error.message}`);
  }

  return data;
}

async function createClass(teacherId, className, gradeLevel = '5th Grade') {
  const { data, error } = await supabase
    .from('classes')
    .insert({
      name: className,
      teacher_id: teacherId,
      school: 'Washington Elementary',
      grade_level: gradeLevel,
      academic_year: '2025-2026',
      is_active: true
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create class: ${error.message}`);
  }

  return data;
}

async function enrollStudent(classId, studentId) {
  const { data, error } = await supabase
    .from('class_enrollments')
    .insert({
      class_id: classId,
      student_id: studentId,
      status: 'active'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to enroll student: ${error.message}`);
  }

  return data;
}

// ============================================================================
// MAIN SETUP FUNCTION
// ============================================================================

async function setupAccounts() {
  console.log('\n🚀 Starting BetterLibraries Account Setup...\n');
  
  const summary = {
    teachersCreated: 0,
    studentsCreated: 0,
    classesCreated: 0,
    enrollmentsCreated: 0,
    errors: []
  };

  try {
    // Step 1: Create Teacher Account
    console.log('👨‍🏫 Creating teacher account...');
    const teacherAuthUser = await createAuthUser(teacher.email, teacher.password);
    const teacherUser = await createPublicUser(
      teacherAuthUser.id,
      teacher.email,
      teacher.name,
      teacher.role,
      teacher.school
    );
    summary.teachersCreated++;
    console.log(`   ✅ ${teacher.name} (${teacher.email})`);

    // Step 2: Create Classes
    console.log('\n📚 Creating classes...');
    const sectionA = await createClass(teacherUser.id, 'Section A');
    summary.classesCreated++;
    console.log(`   ✅ Section A created`);

    const sectionB = await createClass(teacherUser.id, 'Section B');
    summary.classesCreated++;
    console.log(`   ✅ Section B created`);

    // Step 3: Create Section A Students
    console.log('\n👥 Creating Section A students...');
    for (const student of sectionAStudents) {
      try {
        const authUser = await createAuthUser(student.email, '123');
        await createPublicUser(
          authUser.id,
          student.email,
          student.name,
          'student',
          'Washington Elementary',
          student.lexile
        );
        await createStudentStats(authUser.id);
        await enrollStudent(sectionA.id, authUser.id);
        
        summary.studentsCreated++;
        summary.enrollmentsCreated++;
        console.log(`   ✅ ${student.name} (Lexile: ${student.lexile})`);
      } catch (error) {
        console.error(`   ❌ Failed: ${student.name} - ${error.message}`);
        summary.errors.push(`${student.name}: ${error.message}`);
      }
    }

    // Step 4: Create Section B Students
    console.log('\n👥 Creating Section B students...');
    for (const student of sectionBStudents) {
      try {
        const authUser = await createAuthUser(student.email, '123');
        await createPublicUser(
          authUser.id,
          student.email,
          student.name,
          'student',
          'Washington Elementary',
          student.lexile
        );
        await createStudentStats(authUser.id);
        await enrollStudent(sectionB.id, authUser.id);
        
        summary.studentsCreated++;
        summary.enrollmentsCreated++;
        console.log(`   ✅ ${student.name} (Lexile: ${student.lexile})`);
      } catch (error) {
        console.error(`   ❌ Failed: ${student.name} - ${error.message}`);
        summary.errors.push(`${student.name}: ${error.message}`);
      }
    }

    // Step 5: Print Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SETUP SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Teachers Created: ${summary.teachersCreated}`);
    console.log(`✅ Students Created: ${summary.studentsCreated}`);
    console.log(`✅ Classes Created: ${summary.classesCreated}`);
    console.log(`✅ Enrollments: ${summary.enrollmentsCreated}`);
    console.log(`📧 Total Accounts: ${summary.teachersCreated + summary.studentsCreated}`);
    
    if (summary.errors.length > 0) {
      console.log(`\n⚠️  Errors: ${summary.errors.length}`);
      summary.errors.forEach(err => console.log(`   - ${err}`));
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Setup Complete!');
    console.log('='.repeat(60));
    
    console.log('\n📝 Login Credentials:');
    console.log('   Teacher: jerrysmith@email.com / 123');
    console.log('   Students: [firstname.lastname]@email.com / 123');
    console.log('\n✨ You can now log in to BetterLibraries!\n');

  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// ============================================================================
// RUN SCRIPT
// ============================================================================

setupAccounts();
