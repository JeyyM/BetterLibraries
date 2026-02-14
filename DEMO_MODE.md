# 🎯 Demo Mode Configuration

## Email Hardcoded for Hackathon Demo

For the hackathon demo, all Miro boards are created under:
```
jeymson8000@gmail.com
```

### What Changed:
- ✅ Board names simplified to: `[Book Title] - Reading Notes`
- ✅ No student email in board name (cleaner for demo)
- ✅ All boards under your single Miro account
- ✅ Judges can test without creating accounts

### Board Naming:
```
Before: "The Little Prince - Reading Notes (john.doe@school.edu)"
Now:    "The Little Prince - Reading Notes"
```

### Benefits for Demo:
- ✅ Simpler board management
- ✅ All boards in one Miro workspace
- ✅ Easier to show judges your Miro dashboard
- ✅ No need to create multiple student accounts

### What Still Works:
- ✅ Unique board per book (via book_id in database)
- ✅ Board persistence (saved to database)
- ✅ Auto-creation via API
- ✅ Split-screen embed

### Console Output:
You'll see:
```
🎨 Creating new Miro board via API...
📚 Book: The Little Prince
👤 Demo Email: jeymson8000@gmail.com
🔧 (Actual user email: john.doe@school.edu - hardcoded for demo)
```

### For Production:
To revert to personalized boards per student, just remove this line from `miroService.ts`:
```typescript
const demoEmail = 'jeymson8000@gmail.com';
```

And change the board name back to:
```typescript
name: `${bookTitle} - Reading Notes (${userEmail})`
```

---

Ready for demo! 🚀
