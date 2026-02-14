-- Add Miro Integration Support
-- Adds columns to store Miro board IDs for reading whiteboard feature

-- Add Miro board ID to reading_progress table
-- Each student gets their own whiteboard per book
ALTER TABLE public.reading_progress 
ADD COLUMN IF NOT EXISTS miro_board_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reading_progress_miro_board 
ON public.reading_progress(miro_board_id) 
WHERE miro_board_id IS NOT NULL;

-- Add Miro trophy board to users table (for future Feature 3)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS miro_trophy_board_id TEXT;

-- Add Miro discussion board to discussion_threads (for future Feature 2)
ALTER TABLE public.discussion_threads 
ADD COLUMN IF NOT EXISTS miro_board_id TEXT;

-- Optional: Create dedicated Miro boards table for better tracking
CREATE TABLE IF NOT EXISTS public.miro_boards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id TEXT NOT NULL UNIQUE,
    board_type VARCHAR(50) NOT NULL CHECK (board_type IN ('reading', 'discussion', 'trophy')),
    board_name TEXT,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    embed_url TEXT,
    view_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Disable RLS for Miro boards (for development)
ALTER TABLE public.miro_boards DISABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_miro_boards_user_book 
ON public.miro_boards(user_id, book_id) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_miro_boards_type 
ON public.miro_boards(board_type) 
WHERE is_active = true;

-- Verify changes
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'reading_progress'
AND column_name = 'miro_board_id';

SELECT 
    'Miro boards table created' as status,
    COUNT(*) as board_count
FROM public.miro_boards;
