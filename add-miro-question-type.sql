-- Add Miro board support to quiz_answers table
-- This allows students to submit Miro boards as answers for digital tasks

ALTER TABLE quiz_answers
ADD COLUMN IF NOT EXISTS miro_board_id TEXT;

COMMENT ON COLUMN quiz_answers.miro_board_id IS 'Miro board ID for question type=miro. Board name format: "<Book Title>: <Task Title>, <Student Name>"';
