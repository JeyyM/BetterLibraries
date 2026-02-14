# 🤖 Miro AI Integration - Gemini + Miro

## Overview

This feature uses **Gemini AI** to analyze books and create study materials that are displayed on **Miro whiteboards**.

## What It Does

When you click the **"AI Study Tools"** button while reading:

1. **Gemini AI** (`gemini-2.5-flash-lite`) analyzes the book and generates:
   - � **Book Analysis**: Comprehensive description covering themes, characters, plot, settings, symbols, and quotes
   - � **Study Notes**: 6 key insights, questions, and observations

2. **Miro API** creates the content on your whiteboard:
   - **Book Analysis Card**: Large blue sticky note with full analysis
   - **Study Notes**: Yellow sticky notes arranged in a grid

## How to Use

### Step 1: Open a Book
Navigate to any book and click "Start Reading"

### Step 2: Show Whiteboard
Click the **"Show Whiteboard"** button (purple sparkles icon)

### Step 3: Generate AI Content
Click the **"AI Study Tools"** button (magic wand icon)

### Step 4: Wait for Generation
- Gemini analyzes the book (3-5 seconds)
- Miro creates the content on your board (2-3 seconds)
- You'll see a success message when done

### Step 5: Explore Your Board
Open the board in a new tab to:
- Read the AI-generated analysis
- Review study notes
- Add your own annotations
- Draw connections and diagrams

## Technical Details

### Updated Implementation

**Fixed Gemini API Usage:**
- Changed from deprecated `@google/generative-ai` to `@google/genai`
- Updated from `gemini-pro` to `gemini-2.5-flash-lite` (matches rest of codebase)
- Simplified response parsing (no JSON, uses plain text)

**Key Functions:**

1. **`generateContentDescription()`**
   - Uses Gemini to create comprehensive book analysis
   - Returns 500-800 word structured description
   - Covers themes, characters, plot, settings, symbols, quotes

2. **`generateStudyNotes()`**  
   - Creates 6 study notes per book
   - Returns numbered list of insights
   - Context-aware if current page is provided

3. **`createStickyNotes()`**
   - Creates yellow sticky notes on Miro board
   - Arranges in 3-column grid layout
   - Uses Miro REST API v2

4. **`createBookAnalysisCard()`**
   - Creates large blue sticky note
   - Contains full book analysis from Gemini
   - Positioned prominently on board

5. **`populateReadingBoardWithAI()`**
   - Main orchestration function
   - Calls Gemini, then Miro API
   - Handles errors gracefully

### Data Flow

```
User clicks "AI Study Tools"
  ↓
ReadingView.handleGenerateAIContent()
  ↓
populateReadingBoardWithAI(boardId, book, currentPage)
  ↓
┌─────────────────────────────────────┐
│  Gemini AI (gemini-2.5-flash-lite)  │
├─────────────────────────────────────┤
│ • generateContentDescription()      │
│ • generateStudyNotes()              │
└─────────────────┬───────────────────┘
                  ↓
┌─────────────────────────────────────┐
│  Miro REST API v2                   │
├─────────────────────────────────────┤
│ • POST /sticky_notes (analysis)     │
│ • POST /sticky_notes (6x notes)     │
└─────────────────────────────────────┘
  ↓
Success message to user
```

### Gemini Prompts

**Book Analysis:**
```
Analyzes book to create detailed description with:
- 2-3 main themes
- 3-5 key characters with descriptions  
- Major plot events and turning points
- Important locations and their significance
- Recurring symbols and motifs
- 2-3 memorable quotes

Format: Plain text, 500-800 words
```

**Study Notes:**
```
Creates 6 study notes:
- Key insights and observations
- Thought-provoking questions
- Connections to understand

Format: Numbered list
```

## Environment Variables Required

```bash
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_MIRO_ACCESS_TOKEN=your_miro_oauth_token
```

## Limitations & Future

### Current Approach
- ✅ Gemini generates comprehensive text analysis
- ✅ Creates sticky notes on Miro board
- ✅ Simple, reliable implementation
- ⚠️ Requires `boards:write` permission (may need paid Miro plan)

### Future Enhancements
- [ ] Use Miro's native AI features when available
- [ ] Add diagrams and visual elements
- [ ] Character relationship graphs
- [ ] Timeline visualization
- [ ] Interactive quiz cards

## Demo Script for Hackathon

1. **Open a book**: "The Monkey's Paw" or any classic
2. **Show whiteboard**: Split-screen view appears
3. **Click AI Study Tools**: "Watch Gemini analyze the book..."
4. **Wait 5-10 seconds**: Progress shown with loading animation
5. **Success!**: Board now has:
   - Blue analysis card with themes, characters, plot, symbols
   - 6 yellow study notes with insights
6. **Open in new tab**: Show how students can add their own notes
7. **Highlight benefits**:
   - ✨ Instant study guide generation
   - 📝 Organized note-taking
   - 🎨 Visual learning support
   - 🤝 Shareable with classmates

## API Costs (Approximate)

- **Gemini API**: Free tier (60 requests/minute with gemini-2.5-flash-lite)
- **Miro API**: Free tier has rate limits, paid plans for production

## Success Metrics

- Generation time: ~5-8 seconds total
- Notes created: 6 sticky notes + 1 analysis card
- User experience: Simple one-click operation 🎉
