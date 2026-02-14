# 🚀 Miro Auto-Create Setup Guide

## Two Options Available:

### ✨ **OPTION 1: Auto-Create Boards (RECOMMENDED)**
Each student gets their own unique board automatically created when they open a book!

### 📋 **OPTION 2: Shared Board (Quick Demo)**
All students share a single pre-created board (simpler but less powerful)

---

## ✨ OPTION 1: Auto-Create Setup (Production-Ready)

### Step 1: Get Miro Access Token (5 minutes)

#### Method A: Personal Access Token (Easiest for hackathon)
1. Go to https://miro.com/app/settings/user-profile/apps
2. Scroll to **"Your apps"**
3. Click **"Create new app"**
4. Fill in:
   - **App Name**: "BetterLibraries"
   - **Description**: "Educational reading platform with whiteboard integration"
5. Click **"Create app"**
6. In your new app dashboard, go to **"OAuth & Permissions"**
7. Under **"Access Token"**, click **"Generate access token"**
8. **COPY THE TOKEN** (you won't see it again!)
9. Make sure these scopes are enabled:
   - ✅ `boards:read`
   - ✅ `boards:write`

#### Method B: OAuth Flow (For production)
1. Follow the same steps as above
2. Set up OAuth redirect URI: `http://localhost:5173/auth/miro/callback`
3. Implement OAuth flow (more complex, better for production)

### Step 2: Add Token to Environment

In your `.env.local` file:
```bash
VITE_MIRO_ACCESS_TOKEN=your-access-token-here
```

### Step 3: Test It!

```bash
npm run dev
```

1. Login as a student
2. Open any book
3. Click **"Show Whiteboard"**
4. 🎉 A NEW board is created automatically!
5. Check your Miro dashboard - you'll see a board named:
   ```
   [Book Title] - Reading Notes (student@email.com)
   ```

### What Happens Automatically:
- ✅ Board is created via Miro REST API
- ✅ Named with book title + student email
- ✅ Board ID saved to database
- ✅ Same board loads next time student opens that book
- ✅ Each student-book combo gets unique board
- ✅ Private permissions (student's team only)

---

## 📋 OPTION 2: Shared Board Setup (Quick Demo)

### Step 1: Create ONE Miro Board (2 minutes)
1. Go to https://miro.com
2. Sign in
3. Click **"Create new board"**
4. Name it: "BetterLibraries Demo"
5. Copy board ID from URL: `https://miro.com/app/board/uXjVK1234=/`
   - Board ID = `uXjVK1234=`

### Step 2: Add to Environment

In your `.env.local` file:
```bash
# Leave this blank for shared board mode:
# VITE_MIRO_ACCESS_TOKEN=

# Add your shared board ID:
VITE_MIRO_BOARD_ID=uXjVK1234=
```

### Step 3: Test It!

```bash
npm run dev
```

All students will share the same board. Good for demos, but not ideal for real use.

---

## 🔧 Technical Details

### How Auto-Create Works:

1. **Student clicks "Show Whiteboard"**
2. **Check database**: Does this student+book have a board?
   - YES → Load existing board
   - NO → Continue to step 3
3. **Call Miro API**: `POST https://api.miro.com/v2/boards`
4. **Miro creates board** with custom name and permissions
5. **Save board ID** to database (`reading_progress.miro_board_id`)
6. **Embed board** in iframe
7. **Next time**: Uses saved board ID (no new board created)

### API Request Example:

```javascript
POST https://api.miro.com/v2/boards
Headers:
  Authorization: Bearer YOUR_ACCESS_TOKEN
  Content-Type: application/json

Body:
{
  "name": "The Little Prince - Reading Notes (john@school.edu)",
  "description": "Personal reading notes for The Little Prince",
  "policy": {
    "permissionsPolicy": {
      "collaborationToolsStartAccess": "all_editors",
      "copyAccess": "anyone"
    },
    "sharingPolicy": {
      "access": "private",
      "teamAccess": "edit"
    }
  }
}
```

### Fallback Logic:

```
IF access_token exists:
  → Try to create board via API
  → If fails → Fall back to shared board mode
ELSE:
  → Use shared board mode (VITE_MIRO_BOARD_ID)
```

---

## 📊 Database Schema

The `miro_board_id` is stored per student per book:

```sql
reading_progress
├── user_email (student's email)
├── book_id (which book)
├── current_page
├── miro_board_id ← NEW! Stores the auto-created board ID
└── ...
```

Each student+book combination gets ONE unique board that persists.

---

## 🎯 Comparison Table

| Feature | Auto-Create (Option 1) | Shared Board (Option 2) |
|---------|------------------------|-------------------------|
| Setup Time | 5 min | 2 min |
| Boards Created | Unique per student+book | One for everyone |
| Privacy | Private per student | Shared by all |
| Hackathon Impact | ⭐⭐⭐⭐⭐ High | ⭐⭐⭐ Medium |
| Production Ready | ✅ Yes | ❌ Demo only |
| Scalability | ✅ Unlimited | ❌ One board |
| Student Experience | ✅ Personal workspace | ⚠️ Collaborative chaos |

---

## 🚨 Troubleshooting

### "Board creation failed" error
- Check if `VITE_MIRO_ACCESS_TOKEN` is valid
- Verify token has `boards:write` permission
- Check Miro app is not rate-limited
- Check browser console for API errors

### Board creates but doesn't embed
- Check CORS settings in Miro app
- Verify embed URL format is correct
- Check browser console for iframe errors

### Database error saving board ID
- Make sure migration ran: `ALTER TABLE reading_progress ADD COLUMN miro_board_id TEXT;`
- Check Supabase connection
- Verify RLS is disabled for testing

---

## 🎉 Recommended for Hackathon

**Use OPTION 1 (Auto-Create)** because:
- ✅ More impressive demo
- ✅ Shows API integration skills
- ✅ Better user experience
- ✅ Scalable solution
- ✅ Unique value proposition

But have **OPTION 2 as backup** in case:
- ⚠️ API issues during demo
- ⚠️ Rate limits hit
- ⚠️ Network problems

---

## 📚 Resources

- [Miro REST API Docs](https://developers.miro.com/reference/api-reference)
- [Create Board API](https://developers.miro.com/reference/create-board)
- [Miro OAuth Guide](https://developers.miro.com/docs/oauth-2-0-guide)
- [Embed Boards Guide](https://developers.miro.com/docs/embed-miro-boards)

---

Ready to auto-create boards! 🚀
