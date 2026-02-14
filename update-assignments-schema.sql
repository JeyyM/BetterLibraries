-- Add questions and total_points columns to assignments table
-- This allows assignments to have custom questions separate from quiz_id

-- Add questions column (JSONB array of QuizQuestion objects)
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS questions JSONB DEFAULT '[]'::jsonb;

-- Add total_points column (sum of all question points + discussion score)
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;

-- Add comment to explain the schema
COMMENT ON COLUMN assignments.questions IS 'Array of QuizQuestion objects with id, text, options, correctAnswer, type, difficulty, category, and points';
COMMENT ON COLUMN assignments.total_points IS 'Total points possible for this assignment (sum of question points + discussion_max_score)';

-- Make quiz_id nullable since assignments can now have custom questions
ALTER TABLE assignments 
ALTER COLUMN quiz_id DROP NOT NULL;

-- Update existing assignments to have empty questions array if null
UPDATE assignments 
SET questions = '[]'::jsonb 
WHERE questions IS NULL;

-- Update existing assignments to calculate total_points from discussion_max_score
UPDATE assignments 
SET total_points = COALESCE(discussion_max_score, 0) 
WHERE total_points = 0;

-- Optional: Create an index on questions for faster queries
CREATE INDEX IF NOT EXISTS idx_assignments_questions ON assignments USING GIN (questions);

-- Display success message
DO $$ 
BEGIN 
    RAISE NOTICE 'Successfully updated assignments table schema!';
    RAISE NOTICE 'Added columns: questions (JSONB), total_points (INTEGER)';
END $$;
