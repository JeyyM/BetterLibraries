# Miro Integration Setup Guide

## 🎯 Overview
This integration allows students to use a Miro whiteboard side-by-side with the book reader for taking visual notes while reading.

---

## 📋 Feature 1: Reading Whiteboard (COMPLETED ✅)

### What It Does
- Shows a **Miro whiteboard** next to the PDF reader in a split-screen layout
- Students can take notes, draw diagrams, and brainstorm while reading
- Whiteboard state is saved per student per book
- Toggle on/off with a button in the reading interface
- Open in new tab for full-screen editing

---

## 🚀 Quick Setup (For Hackathon Demo)

### ✨ OPTION 1: Auto-Create Boards (RECOMMENDED)

**Each student gets their own unique board automatically!**

1. **Get Miro Access Token** (5 min):
   - Go to https://miro.com/app/settings/user-profile/apps
   - Click "Create new app"
   - Name it "BetterLibraries"
   - Go to "OAuth & Permissions"
   - Click "Generate access token"
   - Copy the token (only shown once!)

2. **Add to `.env.local`:**
   ```bash
   VITE_MIRO_ACCESS_TOKEN=your-access-token-here
   ```

3. **Run database migration** (see Step 3 below)

4. **Restart dev server:**
   ```bash
   npm run dev
   ```

5. **Test it:**
   - Login as student
   - Open any book
   - Click "Show Whiteboard"
   - 🎉 New board auto-creates with personalized name!

**Benefits:**
- ✅ Unique board per student per book
- ✅ Automatic creation via Miro REST API
- ✅ Professional, scalable solution
- ✅ Private workspaces for each student

---

### 📋 OPTION 2: Shared Board (Quick Demo Backup)

**All students share one pre-created board.**

### Step 1: Create a Miro Board

1. Go to [https://miro.com](https://miro.com)
2. Sign in with your Miro account
3. Click **"Create new board"**
4. Name it something like: **"BetterLibraries Reading Notes"**
5. Once created, look at the URL in your browser:
   ```
   https://miro.com/app/board/uXjVK1a2b3c=/
   ```
   The board ID is the part between `/board/` and the next `/`
   In this example: `uXjVK1a2b3c=`

### Step 2: Add Board ID to Environment

1. Open your `.env.local` file (or create it from `.env.example`)
2. Add this line:
   ```bash
   VITE_MIRO_BOARD_ID=uXjVK1a2b3c=
   ```
   (Replace with your actual board ID)
   
   **Note:** Don't set `VITE_MIRO_ACCESS_TOKEN` if using this option!

### Step 3: Run the Database Migration

Run this SQL in your Supabase SQL Editor:
```bash
# Copy the contents of add-miro-integration.sql
```

Or run it directly:
```sql
ALTER TABLE public.reading_progress 
ADD COLUMN IF NOT EXISTS miro_board_id TEXT;
```

### Step 4: Restart Your Dev Server

```bash
npm run dev
```

---

## ✨ How to Use (User Perspective)

### For Students:

1. **Open any book** from the library
2. Click **"Show Whiteboard"** button in the top right
3. The screen splits in half:
   - **Left**: PDF reader
   - **Right**: Miro whiteboard
4. Take notes, draw diagrams, mind maps, etc.
5. Click **"Hide Whiteboard"** to go back to full-screen reading
6. Click the **external link icon** to open the board in a new tab

### Features:
- ✅ Whiteboard toggles smoothly
- ✅ Board ID is saved to database
- ✅ Same board loads every time you read that book
- ✅ Responsive layout
- ✅ Purple-themed UI to distinguish from main app

---

## 🔧 Technical Implementation

### Files Created/Modified:

1. **`services/miroService.ts`** (NEW)
   - Board creation logic
   - Embed URL generation
   - Open in new tab function

2. **`components/ReadingView.tsx`** (MODIFIED)
   - Added split-screen layout
   - Toggle whiteboard state
   - Load/save Miro board ID from database
   - Embed Miro iframe

3. **`add-miro-integration.sql`** (NEW)
   - Database schema changes
   - Adds `miro_board_id` column to `reading_progress`
   - Creates optional `miro_boards` tracking table

4. **`.env.example`** (UPDATED)
   - Added `VITE_MIRO_BOARD_ID` variable

### Database Schema:

```sql
-- Simple approach (already implemented)
ALTER TABLE reading_progress ADD COLUMN miro_board_id TEXT;

-- Advanced approach (optional)
CREATE TABLE miro_boards (
  id UUID PRIMARY KEY,
  board_id TEXT NOT NULL,
  board_type VARCHAR(50), -- 'reading', 'discussion', 'trophy'
  user_id UUID REFERENCES users(id),
  book_id UUID REFERENCES books(id),
  ...
);
```

---

## 🎨 UI/UX Details

### Toggle Button States:
- **Hidden**: Gray background, "Show Whiteboard" with sparkle icon
- **Visible**: Purple background, "Hide Whiteboard" with minimize icon
- **Loading**: Shows spinner animation

### Split-Screen Layout:
- **50/50 split** on desktop
- **Smooth transitions** (300ms duration)
- **Purple border** between sections
- **Responsive**: Can be enhanced for mobile (full-screen toggle)

### Whiteboard Section:
- **Header**: Purple gradient background with Miro logo
- **Close button**: Top right corner
- **External link**: Opens board in new Miro tab
- **Embedded iframe**: Full access to Miro features

---

## 🔐 Security & Permissions

### Current Implementation:
- Uses **public embed URLs** (no authentication required)
- Single shared board for demo purposes
- All students see the same board

### Production Recommendations:
- Use **Miro REST API** to create individual boards per user
- Implement **OAuth 2.0** for user authentication
- Set **board permissions** programmatically
- Create **private boards** for each student-book combination

---

## 📝 Next Steps (Future Features)

### Feature 2: Discussion Whiteboard
- Add Miro board to `DiscussionBoard.tsx`
- Collaborative whiteboard for class discussions
- Shared board per book per class

### Feature 3: Trophy Case
- Create personal Miro board for each student
- Auto-add stickers when badges are earned
- Display on Student Dashboard and Achievements page

---

## 🐛 Troubleshooting

### Board Not Loading?
1. Check if `VITE_MIRO_BOARD_ID` is set in `.env.local`
2. Verify the board ID is correct (no extra characters)
3. Make sure the Miro board is **public** or **embeddable**
4. Check browser console for errors

### Split Screen Not Working?
1. Ensure browser window is wide enough (min 1024px recommended)
2. Check if `showWhiteboard` state is toggling
3. Verify CSS classes are applied

### Database Errors?
1. Run the migration SQL: `add-miro-integration.sql`
2. Check if `miro_board_id` column exists in `reading_progress`
3. Verify RLS is disabled for testing

---

## 📊 Demo Talking Points (For Hackathon)

### Problem We Solve:
- Students need to take notes while reading
- Traditional apps force context switching
- Visual learners need whiteboard space

### Our Solution:
- **Side-by-side** reading + note-taking
- **Miro integration** for powerful visual tools
- **Persistent** boards per student per book
- **Seamless** toggle experience

### Technical Highlights:
- React + TypeScript frontend
- Supabase for persistence
- Miro embed API
- Smooth animations and UX

### Future Vision:
- AI-generated mind maps from book content
- Collaborative class boards
- Trophy case with sticker rewards

---

## 🎉 Success Metrics

### User Experience:
- ✅ One-click toggle
- ✅ Instant board loading
- ✅ Persistent storage
- ✅ Responsive design

### Technical Quality:
- ✅ Clean separation of concerns
- ✅ Reusable service layer
- ✅ Database normalization
- ✅ Error handling

---

## 📚 Resources

- [Miro Embed Documentation](https://developers.miro.com/docs/embed-miro-boards)
- [Miro REST API](https://developers.miro.com/reference/api-reference)
- [Miro Web SDK](https://developers.miro.com/docs/web-sdk-introduction)

---

## 🚀 Ready to Demo!

Your Miro integration is **ready for the hackathon**! Students can now:
1. Read books with interactive whiteboard
2. Take visual notes in Miro
3. Toggle whiteboard on/off seamlessly
4. Save their work automatically

**Next**: Set up Features 2 & 3 for even more impact! 🎯
