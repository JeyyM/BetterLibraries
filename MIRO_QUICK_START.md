# 🎯 Miro Integration - Quick Setup Card

## ✅ SETUP CHECKLIST

### 1. Create Miro Board (2 minutes)
- [ ] Go to https://miro.com
- [ ] Sign in with your account
- [ ] Click "Create new board"
- [ ] Copy the board ID from URL: `https://miro.com/app/board/YOUR_ID_HERE/`

### 2. Add to Environment (30 seconds)
```bash
# In .env.local file:
VITE_MIRO_BOARD_ID=paste-your-board-id-here
```

### 3. Run Database Migration (1 minute)
```sql
-- In Supabase SQL Editor, run:
ALTER TABLE public.reading_progress 
ADD COLUMN IF NOT EXISTS miro_board_id TEXT;
```

### 4. Restart Dev Server (30 seconds)
```bash
npm run dev
```

---

## 🎮 HOW TO TEST

1. Login as a student
2. Open any book from library
3. Click **"Show Whiteboard"** button (top right)
4. See split screen: PDF left, Miro right ✨
5. Take some notes on the Miro board
6. Click **"Hide Whiteboard"** to toggle off
7. Close and reopen the book - your Miro board persists! 🎉

---

## 🚨 TROUBLESHOOTING

**Board not showing?**
- Check `.env.local` has correct board ID
- Restart dev server after adding env var
- Check browser console for errors

**Split screen weird?**
- Make browser window wider (min 1024px)
- Check if Tailwind CSS is loading

**Database error?**
- Run the SQL migration in Supabase
- Check table exists: `SELECT * FROM reading_progress LIMIT 1;`

---

## 🎨 FILES CHANGED

✅ **NEW:**
- `services/miroService.ts` - Miro board logic
- `add-miro-integration.sql` - Database migration  
- `MIRO_INTEGRATION.md` - Full documentation

✅ **MODIFIED:**
- `components/ReadingView.tsx` - Split screen UI
- `.env.example` - Environment template

---

## 💡 DEMO SCRIPT

**"Watch this - I'm going to show you our Miro integration!"**

1. "Here's a student reading a book..." *(open book)*
2. "They want to take visual notes..." *(click Show Whiteboard)*
3. "Boom! Split screen with Miro board!" ✨
4. "They can draw, mind map, anything..." *(draw on Miro)*
5. "Toggle it off when done..." *(click Hide)*
6. "And it's saved! Watch..." *(close & reopen book)*
7. "Same board, right where they left off!" 🎯

**Key Points:**
- Seamless integration
- No context switching  
- Persistent storage
- Visual learning support

---

## 🎯 NEXT FEATURES

Want to add more? Here's the roadmap:

**Feature 2: Discussion Whiteboard** (2 hours)
- Add Miro to class discussions
- Collaborative brainstorming

**Feature 3: Trophy Case** (3 hours)
- Personal Miro board with stickers
- Auto-add when badges earned
- Show on dashboard

---

Ready to ship! 🚀
