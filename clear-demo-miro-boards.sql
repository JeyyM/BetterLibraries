-- Clear out invalid demo Miro board IDs
-- Run this to reset Miro integration and allow fresh board creation

-- Remove all 'demo-board-id' entries
UPDATE public.reading_progress
SET miro_board_id = NULL
WHERE miro_board_id = 'demo-board-id' 
   OR miro_board_id LIKE '%demo%';

-- Verify cleanup
SELECT 
    user_email,
    book_id,
    miro_board_id,
    last_read_at
FROM public.reading_progress
WHERE miro_board_id IS NOT NULL;

-- This should show no rows with 'demo-board-id'
