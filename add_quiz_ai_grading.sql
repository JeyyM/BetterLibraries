-- Add enable_auto_ai_grading column to quiz_items table
-- This enables AI grading for book quizzes (similar to assignments)

ALTER TABLE quiz_items 
ADD COLUMN IF NOT EXISTS enable_auto_ai_grading BOOLEAN DEFAULT false;

-- Add a comment to document the column
COMMENT ON COLUMN quiz_items.enable_auto_ai_grading IS 'When true, essay and short-answer questions are automatically graded by AI on student submission';

-- Optional: Update existing quizzes to have AI grading disabled by default
UPDATE quiz_items 
SET enable_auto_ai_grading = false 
WHERE enable_auto_ai_grading IS NULL;
