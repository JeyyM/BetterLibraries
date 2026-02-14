-- Create quiz_items table for storing quizzes
CREATE TABLE IF NOT EXISTS public.quiz_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  title TEXT,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'published')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID,
  total_points INTEGER DEFAULT 0
);

-- Create index on book_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_quiz_items_book_id ON public.quiz_items(book_id);

-- Create index on status
CREATE INDEX IF NOT EXISTS idx_quiz_items_status ON public.quiz_items(status);

-- Enable RLS
ALTER TABLE public.quiz_items ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read all quizzes
CREATE POLICY "Anyone can view quizzes" ON public.quiz_items
  FOR SELECT
  USING (true);

-- Create policy for authenticated users to insert quizzes
CREATE POLICY "Authenticated users can create quizzes" ON public.quiz_items
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Create policy for authenticated users to update quizzes
CREATE POLICY "Authenticated users can update quizzes" ON public.quiz_items
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Create policy for authenticated users to delete quizzes
CREATE POLICY "Authenticated users can delete quizzes" ON public.quiz_items
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_quiz_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_quiz_items_updated_at_trigger ON public.quiz_items;
CREATE TRIGGER update_quiz_items_updated_at_trigger
  BEFORE UPDATE ON public.quiz_items
  FOR EACH ROW
  EXECUTE FUNCTION update_quiz_items_updated_at();

-- Create quiz_attempts table for storing student quiz attempts (optional, for future use)
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quiz_items(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  score INTEGER DEFAULT 0,
  max_score INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  time_spent_seconds INTEGER DEFAULT 0
);

-- Create index on quiz_attempts for faster lookups
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student_id ON public.quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_book_id ON public.quiz_attempts(book_id);

-- Enable RLS for quiz_attempts
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Create policy for quiz attempts
CREATE POLICY "Users can view their own quiz attempts" ON public.quiz_attempts
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert quiz attempts" ON public.quiz_attempts
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
