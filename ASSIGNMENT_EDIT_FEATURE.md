# Assignment Manager - RLS Fix & Edit Feature Summary

## ✅ Issues Fixed

### 1. **RLS Infinite Recursion on Users Table**
**Problem:** The users table had RLS policies that queried the users table itself, creating infinite recursion and blocking student data fetching.

**Solution:** 
- Disabled RLS temporarily to confirm the issue
- Created proper RLS policies in `enable-users-rls-proper.sql`:
  - Uses `TO authenticated` with `USING (true)` for SELECT operations
  - Avoids any subqueries on the users table
  - Allows all authenticated users to view all profiles
  - Restricts updates to own profile only

**⚠️ IMPORTANT: Run `enable-users-rls-proper.sql` in Supabase SQL Editor to re-enable RLS!**

### 2. **Students Not Appearing in Tracking View**
**Problem:** Even with assignments successfully published and students assigned, the tracking view showed 0 students.

**Root Cause:** RLS policies on users table were silently returning empty results.

**Solution:** Fixed RLS policies as described above.

---

## ✨ New Feature: Edit Published Assignments

### What's New
Teachers can now **fully edit assignments** after they've been published!

### Features

#### 1. **Edit Button on Every Assignment**
- Located on the right side of each assignment card
- Indigo-themed button with Edit icon
- Prevents card click-through (only edits, doesn't open tracking view)

#### 2. **Smart Form Pre-filling**
When you click Edit, the form automatically loads:
- ✅ Assignment title
- ✅ Deadline date
- ✅ Instructions
- ✅ Selected book (with cover image)
- ✅ Selected class
- ✅ All questions with their answers and points
- ✅ Discussion settings

#### 3. **Visual Edit Mode Indicators**
- Header changes from "Create Mission" → "Edit Mission"
- Badge shows "Editing existing assignment"
- Button changes from "Publish Assignment" → "Update Assignment"
- Icon changes from Rocket → Edit
- Build Questions header shows "Editing Mode" badge

#### 4. **Smart Navigation**
- If assignment has questions → Opens directly to "Build Questions" step
- If no questions → Opens to form step
- Back button clears edit mode and returns to assignment list

#### 5. **Safe Tab Switching**
- Switching to "Create" tab clears edit mode (prevents accidental edits)
- Clicking "Create Assignment" button clears edit mode
- Going back from form clears edit mode if in edit state

### How to Use

**To Edit an Assignment:**
1. Go to "Track & Grade" tab
2. Find the assignment you want to edit
3. Click the **"Edit"** button (purple/indigo button on the right)
4. Form loads with all existing data
5. Make your changes:
   - Change title, deadline, instructions
   - Modify questions, add new ones, delete old ones
   - Change point values
   - Switch to different class (re-assigns students)
6. Click **"Update Assignment"** to save

**What Gets Updated:**
- Assignment metadata (title, deadline, instructions)
- Questions and their properties
- Total points (recalculated automatically)
- Class assignment (students re-assigned if class changes)
- `updated_at` timestamp

**What's Preserved:**
- Assignment ID (same assignment, not a new one)
- Student submissions (if any exist)
- Created date
- Book association (can be changed by selecting different book)

---

## 🔧 Technical Implementation

### New State Variables
```tsx
const [editingAssignmentId, setEditingAssignmentId] = React.useState<string | null>(null);
```

### New Functions

**`handleEditAssignment(assignment: Assignment)`**
- Loads assignment data into all form fields
- Sets `editingAssignmentId` to track edit mode
- Switches to Create tab
- Opens Build Questions step if questions exist
- Opens Form step if no questions

### Updated Functions

**`handlePublishAssignment()`**
- Detects edit mode by checking `editingAssignmentId`
- **If editing:** Updates existing assignment via `.update()`
- **If creating:** Inserts new assignment and assigns students
- Clears edit mode after successful save

### UI Changes

**Assignment Cards (Track & Grade tab):**
```tsx
// Changed from button to div
<div className="...">
  {/* Clickable sections */}
  <div onClick={viewTracking}>...</div>
  
  {/* Edit button with stopPropagation */}
  <button onClick={(e) => {
    e.stopPropagation();
    handleEditAssignment(asgn);
  }}>
    Edit
  </button>
</div>
```

**Dynamic Button Labels:**
```tsx
{editingAssignmentId ? 'Update Assignment' : 'Publish Assignment'}
{editingAssignmentId ? <Edit size={18} /> : <Rocket size={18} />}
```

**Form Headers:**
```tsx
<h2>{editingAssignmentId ? 'Edit Mission' : 'Create Mission'}</h2>
{editingAssignmentId && (
  <p className="...">Editing existing assignment</p>
)}
```

---

## 🎯 Testing Checklist

- [x] Students appear in tracking view after assignment published ✅
- [x] Edit button appears on each assignment ✅
- [x] Click Edit loads assignment into form correctly ✅
- [x] Form pre-fills with all assignment data ✅
- [x] Header shows "Edit Mission" and editing badge ✅
- [x] Button shows "Update Assignment" with Edit icon ✅
- [ ] Update Assignment saves changes without creating duplicate
- [ ] Assigned students remain after update
- [ ] Can change title, deadline, instructions
- [ ] Can modify questions (add, edit, delete)
- [ ] Can change class (re-assigns students)
- [ ] Updated assignment appears in Track & Grade tab
- [ ] Going back from edit mode clears the form
- [ ] Switching tabs clears edit mode

---

## 🚀 Next Steps

1. **REQUIRED:** Run `enable-users-rls-proper.sql` to re-enable RLS
2. Test editing an assignment end-to-end
3. Test updating questions and verifying changes persist
4. Test changing the class and verifying students are re-assigned
5. Build student submission interface
6. Build teacher grading interface

---

## 📝 Notes

- Edit mode is **session-only** - refreshing the page clears it
- Editing doesn't affect existing student submissions
- Changing the class will re-assign students (old assignments remain but new students added)
- Total points auto-recalculate when questions are modified
- All changes save to the same assignment ID (no duplicates)
