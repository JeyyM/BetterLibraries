# 🎯 QUICK START: Get Your Miro Access Token

## ⚡ 3-Minute Setup

### 1️⃣ Go to Miro Settings
🔗 https://miro.com/app/settings/user-profile/apps

### 2️⃣ Create App
```
Click: "Create new app"

Fill in:
  App Name: BetterLibraries
  Description: Educational reading platform
  
Click: "Create app"
```

### 3️⃣ Generate Token
```
In your new app:
  1. Go to "OAuth & Permissions" tab
  2. Scroll to "Access Token" section
  3. Click "Generate access token"
  4. COPY THE TOKEN! (only shown once)
```

### 4️⃣ Add to .env.local
```bash
VITE_MIRO_ACCESS_TOKEN=paste-your-token-here
```

### 5️⃣ Restart Server
```bash
npm run dev
```

### 6️⃣ Test!
```
1. Login as student
2. Open book
3. Click "Show Whiteboard"
4. 🎉 Board auto-creates!
```

---

## ✅ What You'll See

**In Your App:**
- Split screen with PDF + Miro
- Board named: "[Book Title] - Reading Notes ([email])"
- Unique board per student per book

**In Miro Dashboard:**
- New boards appearing automatically
- Named with book titles and student emails
- All organized in your workspace

---

## 🎬 Demo Script

**"Let me show you the Miro auto-creation magic!"**

1. "Watch - I'm opening a book as a student..."
2. "Click 'Show Whiteboard'..."
3. "Boom! A brand new Miro board just got created!"
4. "See the name? It's personalized with the book and student!"
5. "Let me show you my Miro dashboard..."
6. "There it is - automatically created via API!"
7. "Each student gets their own private board!"
8. "No setup needed - happens instantly!"

---

## 🔥 Why This Is Awesome for Hackathon

✅ **Auto-magic** - No manual board creation
✅ **Scalable** - Works for 1 or 1000 students  
✅ **Personal** - Each student has private workspace
✅ **Smart** - Remembers board for next time
✅ **Impressive** - Shows real API integration

---

## 🆘 Backup Plan

If API fails during demo:

1. Set `VITE_MIRO_BOARD_ID=your-board-id`
2. Comment out `VITE_MIRO_ACCESS_TOKEN`
3. Falls back to shared board mode
4. Still works, just less impressive

---

Ready to ship! 🚀
