# Troubleshooting: No Classes Appear in Dropdown

## 🔍 Diagnosis Steps

Run these SQL queries in **Supabase SQL Editor** to diagnose the issue:

### 1. Check if classes exist
```sql
SELECT COUNT(*) as class_count FROM classes WHERE is_active = true;
```
- **If 0**: No classes exist - run `setup-classes-quick.sql`
- **If > 0**: Classes exist, check RLS policies

### 2. Check if students exist
```sql
SELECT COUNT(*) as student_count FROM users WHERE role = 'student' AND is_active = true;
```
- **If 0**: No students - create them in Supabase Dashboard > Authentication > Users

### 3. Check RLS policies
```sql
SELECT tablename, policyname FROM pg_policies WHERE tablename = 'classes';
```
- **If empty or restricted**: Run `fix-classes-rls.sql`

---

## 🛠️ Fix Solutions (Run in order)

### Solution 1: Create Demo Classes & Students
**File**: `setup-classes-quick.sql`
- Creates 4 demo classes (Grade 6A, 7A, 7B, 8A)
- Auto-enrolls any existing students
- Shows summary of what was created

### Solution 2: Fix RLS Policies
**File**: `fix-classes-rls.sql`
- Adds policy to allow reading classes
- Ensures authenticated users can see active classes
- Fixes enrollment policies

### Solution 3: Check App Console
Open browser console (F12) and look for:
- `Error fetching classes` - means database connection issue
- Check Network tab for failed `/rest/v1/classes` requests
- Look for 401/403 errors (permission issue)

---

## 📋 Quick Fix (All-in-One)

**Run this single SQL script**: `setup-classes-quick.sql`

It will:
1. ✅ Check current state
2. ✅ Create demo classes if needed
3. ✅ Enroll students if they exist
4. ✅ Show summary

Then:
1. Run `fix-classes-rls.sql` to ensure permissions are correct
2. Refresh your browser
3. Check the dropdown - classes should appear!

---

## 🎯 Expected Result

After running the scripts, you should see:
- **In SQL**: `SELECT * FROM classes;` returns 4 classes
- **In App**: Dropdown shows "Grade 7A - English (7th Grade)", etc.
- **In Console**: No errors related to classes

---

## ⚠️ Still Not Working?

If classes still don't appear:

1. **Check browser console** for specific error messages
2. **Verify you're logged in** as a teacher or admin
3. **Check Supabase API logs** in Dashboard > Logs
4. **Verify table exists**: Look in Table Editor > classes

Need help? Share the error message from browser console!
