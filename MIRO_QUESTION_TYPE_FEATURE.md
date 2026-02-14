# Miro Question Type Feature

## Overview
Teachers can now create digital task questions using Miro boards in assignments. This allows students to complete paper-based activities digitally (e.g., creating tables, mind maps, diagrams) directly within the assignment workflow.

## How It Works

### For Teachers (Creating Assignments)

#### 1. Create Assignment with Miro Question
1. Navigate to Assignment Manager → Create tab
2. Select a book and fill in assignment details
3. Click "Build Questions"
4. Click "AI Generate Questions" - **This automatically adds 1 Miro question as the last question**
5. Click on the Miro question to edit it

#### 2. Configure Miro Question
When editing a Miro question type, teachers can set:
- **Board Title**: Short name for the task (e.g., "Compare and Contrast")
  - Final board name will be: `"{Book Title}: {Board Title}, {Student Name}"`
  - Example: `"The Monkey's Paw: Compare and Contrast, John Doe"`
- **Task Description**: Detailed instructions for what students should create
  - Example: "Create a table to contrast the main characters. Include their traits, motivations, and character development."
- **Points**: How many points the task is worth (default: 20)

#### 3. Publish Assignment
- Miro questions display with a purple "Miro Task" badge
- Teacher does NOT get a Miro board (boards are only created for students)
- Grading must be done manually (cannot be AI-graded)

### For Students (Completing Assignments)

#### 1. Start Assignment
1. Navigate to Assignments tab
2. Click "Start" on the assignment
3. Complete multiple-choice, short-answer, and essay questions normally

#### 2. Complete Miro Question
1. When reaching the Miro question:
   - Read the task instructions (purple box)
   - Click **"Open Miro Board"** button
2. A personal Miro board is created automatically:
   - Board name: `"{Book Title}: {Task Title}, {Student Name}"`
   - Example: `"The Monkey's Paw: Compare and Contrast, Sarah Lee"`
3. Use the embedded Miro board or click "Open in New Tab" for full-screen work
4. Complete the assigned task on the Miro board
5. Work is automatically saved
6. Click "Next" or "Submit Quiz" when done

#### 3. Submit Assignment
- All work (including Miro board) is submitted automatically
- Teacher will manually review and grade the Miro board work

### For Teachers (Grading Submissions)

#### 1. View Submissions
1. Navigate to Assignment Manager → Track tab
2. Click on an assignment
3. Click "Grade" on a student submission

#### 2. Grade Miro Questions
For questions with Miro boards:
- **View Board**: Click the Miro board link to open it in a new tab
- **Review Work**: Examine what the student created
- **Score Manually**: Enter points earned and feedback
- **No AI Grading**: Miro questions must be manually graded

## Technical Implementation

### Database Schema

#### `quiz_answers` table - New Column
```sql
ALTER TABLE quiz_answers
ADD COLUMN miro_board_id TEXT;
```

Stores the Miro board ID for each student's submission.

### Updated Types

#### `QuizQuestion` interface
```typescript
export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer?: number;
  type: 'multiple-choice' | 'short-answer' | 'essay' | 'miro'; // New: 'miro'
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'recall' | 'inference' | 'analysis';
  points?: number;
  miroTitle?: string; // New: Board title
  miroDescription?: string; // New: Task instructions
}
```

#### `Submission` interface
```typescript
answers: {
  questionId: string;
  studentAnswer: string;
  studentSelectedIndex?: number | null;
  score?: number;
  feedback?: string;
  id?: string;
  miro_board_id?: string; // New: Miro board ID
}[];
gradingStatus?: 'ai-graded' | 'teacher-graded' | 'not-graded' | 'manual-review'; // New: manual-review
```

### Key Components Modified

#### 1. `types.ts`
- Added `'miro'` to question type enum
- Added `miroTitle` and `miroDescription` fields
- Added `miro_board_id` to submission answers
- Added `'manual-review'` grading status

#### 2. `AssignmentManager.tsx`
- Added "Miro Board (Digital Task)" option to question type dropdown
- Added Miro configuration UI (title + description inputs)
- Updated `handleGenerateQuestions()` to automatically add 1 Miro question at the end
- Added purple badge display for Miro questions
- Shows Miro board info in question preview

#### 3. `QuizView.tsx`
- Added Miro service imports
- Added `miroBoardIds` and `loadingMiro` state
- Added `userName` state for board naming
- Added `createMiroBoardForQuestion()` function
- Added Miro question UI:
  - Task instructions display
  - "Open Miro Board" button
  - Embedded iframe with Miro board
  - "Open in New Tab" button
- Updated validation to require Miro board creation before proceeding
- Updated submission logic to save `miro_board_id`
- Excluded Miro questions from AI auto-grading

#### 4. `miroService.ts` (already exists)
- Uses existing `createReadingBoard()` function
- Formats board name: `"{bookTitle}: {taskTitle}, {studentName}"`
- Stores board ID in database

### Auto-Generation Behavior

When teacher clicks "AI Generate Questions":
1. Gemini generates 3-5 multiple-choice, short-answer, and essay questions
2. **Automatically appends 1 Miro question** with defaults:
   - **Title**: "Analysis Task"
   - **Description**: "Use the Miro board to complete the assigned task. Your teacher will provide specific instructions."
   - **Points**: 20
   - **Type**: 'miro'
3. Teacher can then edit the Miro question to customize title and description

### Miro Board Naming Convention

Format: `"{Book Title}: {Task Title}, {Student Name}"`

Examples:
- `"The Monkey's Paw: Compare and Contrast, John Doe"`
- `"To Kill a Mockingbird: Character Analysis, Sarah Lee"`
- `"1984: Theme Map, Alex Johnson"`

**Important**: 
- Teacher does NOT get a board created
- Each student gets their own unique board
- Board is created when student clicks "Open Miro Board" button

### Grading Rules

#### Cannot Be AI-Graded:
- Miro questions are excluded from auto-grading
- Visual/creative work requires human review
- Teacher must manually score and provide feedback

#### Grading Workflow:
1. Teacher views student's Miro board
2. Reviews the content against task requirements
3. Assigns points (0 to max points)
4. Provides written feedback
5. Marks as reviewed

### UI Elements

#### Teacher Side (Assignment Manager)
```
[Question Type Dropdown]
  - Multiple Choice
  - Short Answer
  - Essay
  - Miro Board (Digital Task)  ← NEW

[When Miro selected:]
┌─────────────────────────────────┐
│ ✨ MIRO BOARD TASK             │
│                                  │
│ Board Title                      │
│ ┌────────────────────────────┐  │
│ │ Compare and Contrast       │  │
│ └────────────────────────────┘  │
│ Board will be named:             │
│ "Book: Compare and Contrast,     │
│  [Student Name]"                 │
│                                  │
│ Task Description                 │
│ ┌────────────────────────────┐  │
│ │ Create a table to contrast │  │
│ │ the main characters...     │  │
│ └────────────────────────────┘  │
│                                  │
│ ℹ Students will get a blank     │
│   Miro board to complete this   │
│   task. Teacher will manually   │
│   review and grade their work.  │
└─────────────────────────────────┘
```

#### Student Side (Quiz View)
```
Before Creating Board:
┌─────────────────────────────────┐
│ Question 5 - MIRO TASK - 20pts │
│                                  │
│ Complete the digital task on     │
│ your Miro board                  │
│                                  │
│ ┌─────────────────────────────┐ │
│ │ 📋 TASK INSTRUCTIONS        │ │
│ │ Create a table to contrast  │ │
│ │ the main characters...      │ │
│ └─────────────────────────────┘ │
│                                  │
│      [✨ Open Miro Board]       │
│                                  │
│ Click to create your personal    │
│ Miro board for this task         │
└─────────────────────────────────┘

After Creating Board:
┌─────────────────────────────────┐
│ ┌─────────────────────────────┐ │
│ │ ✨ YOUR MIRO BOARD          │ │
│ │         [🔗 Open in New Tab]│ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ │  [Embedded Miro Board]      │ │
│ │                             │ │
│ └─────────────────────────────┘ │
│ Complete your work on the Miro   │
│ board above. It will be          │
│ automatically saved.             │
└─────────────────────────────────┘
```

## Use Cases

### Example Digital Tasks

1. **Character Comparison**
   - Title: "Compare and Contrast"
   - Description: "Create a Venn diagram comparing two main characters. Include personality traits, goals, and conflicts."

2. **Plot Timeline**
   - Title: "Story Timeline"
   - Description: "Create a visual timeline of major events in chronological order. Include dates/time markers and brief descriptions."

3. **Theme Analysis**
   - Title: "Theme Map"
   - Description: "Create a mind map showing the main theme in the center, with branches for supporting evidence, quotes, and examples from the text."

4. **Setting Visualization**
   - Title: "Setting Sketch"
   - Description: "Draw and label the main setting. Include important details mentioned in the book."

5. **Cause and Effect**
   - Title: "Cause & Effect Chain"
   - Description: "Create a flowchart showing how one event leads to another. Start with the inciting incident."

## Migration Steps

### 1. Run SQL Migration
```bash
# In Supabase SQL Editor, run:
add-miro-question-type.sql
```

### 2. Restart Dev Server
```bash
npm run dev
```

### 3. Test Flow
1. Create a new assignment with AI-generated questions
2. Verify Miro question appears as last question
3. Edit Miro question title and description
4. Publish assignment
5. As student, complete assignment
6. Click "Open Miro Board" on Miro question
7. Verify board is created with correct name format
8. Complete work on board
9. Submit assignment
10. As teacher, grade submission and verify board link

## Notes

- **Board Persistence**: Miro boards are saved to database and persist across sessions
- **No Deletion**: Boards are not deleted when assignments are deleted (manual cleanup if needed)
- **One Board Per Student Per Question**: Each student gets exactly one board per Miro question
- **Manual Grading Only**: Miro questions cannot be auto-graded by AI
- **Teacher Has No Board**: Teachers don't get a board created; they only view student boards
- **Always Last Question**: Auto-generated Miro question is always added as the final question

## Future Enhancements

Potential improvements:
- [ ] Allow multiple Miro questions per assignment
- [ ] Add Miro question templates (pre-designed boards)
- [ ] Bulk grading interface for Miro submissions
- [ ] Export Miro boards as PDFs for archiving
- [ ] Allow students to share boards with classmates
- [ ] Add AI analysis of Miro board content (experimental)
