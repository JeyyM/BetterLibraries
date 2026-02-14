-- Add book_id column to quiz_attempts table
-- This allows filtering quiz attempts by book for teacher grading view

ALTER TABLE quiz_attempts 
ADD COLUMN IF NOT EXISTS book_id UUID REFERENCES books(id) ON DELETE CASCADE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_book_id ON quiz_attempts(book_id);

-- Add a comment to document the column
COMMENT ON COLUMN quiz_attempts.book_id IS 'Reference to the book this quiz attempt is for. Helps teachers view all attempts for a specific book quiz.';
