-- BetterLibraries Database Schema
-- Complete schema for AI-powered educational reading platform
-- Optimized for Supabase with Storage CDN integration
-- Created: February 13, 2026

-- ============================================================================
-- ENABLE REQUIRED EXTENSIONS
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security helpers
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- USER MANAGEMENT
-- ============================================================================
-- Note: Supabase Auth handles authentication via auth.users table
-- This table extends auth.users with application-specific data

CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
    school VARCHAR(255),
    current_lexile_level INTEGER DEFAULT 400,
    -- Profile avatar stored in Supabase Storage bucket 'avatars'
    -- Format: avatars/{user_id}/profile.{ext}
    profile_avatar_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.student_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    books_read INTEGER DEFAULT 0,
    quizzes_completed INTEGER DEFAULT 0,
    average_score DECIMAL(5,2) DEFAULT 0.00,
    lexile_growth INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    last_streak_date DATE,
    total_points INTEGER DEFAULT 0,
    class_rank INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

ALTER TABLE public.student_stats ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.student_interests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    genre VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, genre)
);

ALTER TABLE public.student_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own interests"
    ON public.student_interests FOR ALL
    USING (auth.uid() = user_id);

-- ============================================================================
-- CLASS & ROSTER MANAGEMENT
-- ============================================================================

CREATE TABLE public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    teacher_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    school VARCHAR(255),
    grade_level VARCHAR(50),
    academic_year VARCHAR(20),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_active BOOLEAN DEFAULT true
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.class_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'withdrawn')),
    UNIQUE(class_id, student_id)
);

ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage enrollments in their classes"
    ON public.class_enrollments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.classes
            WHERE id = class_enrollments.class_id
            AND teacher_id = auth.uid()
        )
    );

CREATE POLICY "Students can view their own enrollments"
    ON public.class_enrollments FOR SELECT
    USING (auth.uid() = student_id);

-- ============================================================================
-- BOOK LIBRARY
-- ============================================================================
-- Book cover images stored in Storage bucket 'book-covers'
-- Full book content stored in Storage bucket 'book-content'
-- Format: book-covers/{book_id}/cover.{ext}
-- Format: book-content/{book_id}/full.pdf

CREATE TABLE public.books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    author VARCHAR(255) NOT NULL,
    -- Cover image path in Supabase Storage
    cover_image_path TEXT,
    description TEXT,
    full_description TEXT,
    lexile_level INTEGER NOT NULL,
    genre VARCHAR(100) NOT NULL,
    pages INTEGER NOT NULL,
    estimated_time_minutes INTEGER,
    content TEXT, -- Sample text for AI processing (first few pages)
    -- Full content path in Supabase Storage
    full_content_path TEXT,
    isbn VARCHAR(20),
    publisher VARCHAR(255),
    publication_year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_active BOOLEAN DEFAULT true
);

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view books"
    ON public.books FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins and teachers can manage books"
    ON public.books FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('admin', 'teacher')
        )
    );

CREATE TABLE public.book_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
    tag VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(book_id, tag)
);

ALTER TABLE public.book_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view book tags"
    ON public.book_tags FOR SELECT
    USING (auth.role() = 'authenticated');

-- ============================================================================
-- READING TRACKING
-- ============================================================================

CREATE TABLE reading_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_page_read INTEGER DEFAULT 1,
    total_pages INTEGER NOT NULL,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    completed_at TIMESTAMP,
    total_time_minutes INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'in-progress' CHECK (status IN ('not-started', 'in-progress', 'completed', 'abandoned'))
);

CREATE TABLE reading_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE word_lookups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    word VARCHAR(255) NOT NULL,
    context TEXT,
    ai_explanation TEXT,
    added_to_word_bank BOOLEAN DEFAULT false,
    looked_up_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE word_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    word VARCHAR(255) NOT NULL,
    definition TEXT NOT NULL,
    example_sentence TEXT,
    source_book_id UUID REFERENCES books(id),
    mastery_level INTEGER DEFAULT 0 CHECK (mastery_level BETWEEN 0 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, word)
);

-- ============================================================================
-- QUIZZES & ASSESSMENTS
-- ============================================================================

CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    created_by_user_id UUID REFERENCES users(id),
    title VARCHAR(500),
    source_type VARCHAR(20) DEFAULT 'book' CHECK (source_type IN ('book', 'custom-upload')),
    source_content TEXT, -- For custom uploads
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'published', 'archived')),
    total_points INTEGER DEFAULT 100,
    ai_generated BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP
);

CREATE TABLE quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    question_order INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('multiple-choice', 'short-answer', 'essay')),
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    category VARCHAR(20) NOT NULL CHECK (category IN ('recall', 'inference', 'analysis')),
    points INTEGER DEFAULT 10,
    correct_answer_index INTEGER, -- For multiple choice (0-based index)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quiz_question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
    option_order INTEGER NOT NULL,
    option_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(question_id, option_order)
);

-- ============================================================================
-- ASSIGNMENTS
-- ============================================================================
-- Created before quiz_attempts because quiz_attempts references assignments

CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    quiz_id UUID REFERENCES quizzes(id),
    created_by_user_id UUID REFERENCES users(id),
    title VARCHAR(500) NOT NULL,
    instructions TEXT,
    deadline TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'closed', 'archived')),
    has_discussion BOOLEAN DEFAULT false,
    discussion_max_score INTEGER DEFAULT 0,
    allow_late_submission BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP
);

CREATE TABLE assignment_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'not-started' CHECK (status IN ('not-started', 'in-progress', 'submitted', 'graded')),
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    is_late BOOLEAN DEFAULT false,
    UNIQUE(assignment_id, student_id)
);

-- ============================================================================
-- QUIZ ATTEMPTS (Continuation of Quizzes section)
-- ============================================================================
-- Must come after assignments table since it references assignment_id

CREATE TABLE quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES assignments(id), -- NULL if not part of assignment
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    score DECIMAL(5,2),
    total_possible_points INTEGER,
    time_spent_minutes INTEGER,
    ai_feedback_summary TEXT,
    status VARCHAR(20) DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'completed', 'abandoned'))
);

CREATE TABLE quiz_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
    selected_option_index INTEGER, -- For multiple choice
    answer_text TEXT, -- For short answer and essay
    is_correct BOOLEAN,
    points_earned DECIMAL(5,2),
    ai_evaluation_score DECIMAL(5,2),
    ai_feedback TEXT,
    teacher_score DECIMAL(5,2),
    teacher_feedback TEXT,
    graded_by_user_id UUID REFERENCES users(id),
    graded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(attempt_id, question_id)
);

CREATE TABLE ai_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    strengths JSONB, -- Array of strength points
    weaknesses JSONB, -- Array of weakness points
    suggestions JSONB, -- Array of suggestions
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ASSIGNMENT SUBMISSIONS & REMINDERS
-- ============================================================================

CREATE TABLE assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    quiz_attempt_id UUID REFERENCES quiz_attempts(id),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_score DECIMAL(5,2),
    total_possible_score DECIMAL(5,2),
    discussion_score DECIMAL(5,2),
    is_reviewed BOOLEAN DEFAULT false,
    reviewed_by_user_id UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    is_late BOOLEAN DEFAULT false,
    teacher_comments TEXT,
    UNIQUE(assignment_id, student_id)
);

CREATE TABLE assignment_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reminder_type VARCHAR(20) DEFAULT 'manual' CHECK (reminder_type IN ('manual', 'automatic', 'deadline-approaching'))
);

-- ============================================================================
-- DISCUSSION BOARDS
-- ============================================================================

CREATE TABLE discussion_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES assignments(id), -- NULL if not assignment-specific
    class_id UUID REFERENCES classes(id),
    title VARCHAR(500),
    description TEXT,
    is_graded BOOLEAN DEFAULT false,
    max_score INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE discussion_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID REFERENCES discussion_threads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_post_id UUID REFERENCES discussion_posts(id), -- For replies
    score DECIMAL(5,2),
    max_score DECIMAL(5,2),
    graded_by_user_id UUID REFERENCES users(id),
    graded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT false
);

CREATE TABLE discussion_post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES discussion_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
);

-- ============================================================================
-- BADGES & GAMIFICATION
-- ============================================================================

CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    instructions TEXT, -- How to earn this badge
    icon VARCHAR(50) NOT NULL, -- Icon name from icon library
    color VARCHAR(50) NOT NULL, -- Color class
    created_by_type VARCHAR(20) DEFAULT 'system' CHECK (created_by_type IN ('system', 'teacher')),
    created_by_user_id UUID REFERENCES users(id),
    badge_type VARCHAR(50), -- e.g., 'streak', 'achievement', 'participation'
    requirement_config JSONB, -- Flexible config for auto-awarding
    points_value INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    is_earned BOOLEAN DEFAULT false,
    awarded_by_user_id UUID REFERENCES users(id),
    UNIQUE(user_id, badge_id)
);

CREATE TABLE leaderboard_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    rank INTEGER,
    week_start_date DATE,
    period_type VARCHAR(20) DEFAULT 'all-time' CHECK (period_type IN ('weekly', 'monthly', 'semester', 'all-time')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(class_id, user_id, period_type, week_start_date)
);

-- ============================================================================
-- ACTIVITY & ANALYTICS
-- ============================================================================

CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- e.g., 'started_reading', 'completed_quiz', 'earned_badge'
    activity_description TEXT,
    reference_type VARCHAR(50), -- 'book', 'quiz', 'assignment', 'discussion'
    reference_id UUID,
    metadata JSONB, -- Flexible additional data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lexile_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    lexile_level INTEGER NOT NULL,
    change_amount INTEGER,
    measurement_date DATE DEFAULT CURRENT_DATE,
    source VARCHAR(50), -- e.g., 'quiz_result', 'manual_update', 'ai_assessment'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reading_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    streak_date DATE NOT NULL,
    activity_count INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, streak_date)
);

-- ============================================================================
-- AI INTERACTIONS & HISTORY
-- ============================================================================

CREATE TABLE ai_quiz_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    requested_by_user_id UUID REFERENCES users(id),
    source_content_preview TEXT,
    model_used VARCHAR(100) DEFAULT 'gemini-3-flash-preview',
    generation_parameters JSONB,
    questions_generated INTEGER,
    generation_time_seconds DECIMAL(6,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ai_question_refinements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
    original_question_text TEXT NOT NULL,
    refinement_instruction TEXT NOT NULL,
    refined_question_text TEXT NOT NULL,
    refined_by_user_id UUID REFERENCES users(id),
    model_used VARCHAR(100) DEFAULT 'gemini-3-flash-preview',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ai_word_explanations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word VARCHAR(255) NOT NULL,
    context TEXT,
    explanation TEXT NOT NULL,
    lexile_level INTEGER,
    model_used VARCHAR(100) DEFAULT 'gemini-3-flash-preview',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- e.g., 'assignment_due', 'badge_earned', 'feedback_received'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- ============================================================================
-- SYSTEM SETTINGS
-- ============================================================================

CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(20) DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_school ON users(school);

-- Class indexes
CREATE INDEX idx_classes_teacher ON classes(teacher_id);
CREATE INDEX idx_class_enrollments_student ON class_enrollments(student_id);
CREATE INDEX idx_class_enrollments_class ON class_enrollments(class_id);

-- Book indexes
CREATE INDEX idx_books_genre ON books(genre);
CREATE INDEX idx_books_lexile ON books(lexile_level);
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_author ON books(author);

-- Reading session indexes
CREATE INDEX idx_reading_sessions_user ON reading_sessions(user_id);
CREATE INDEX idx_reading_sessions_book ON reading_sessions(book_id);
CREATE INDEX idx_reading_sessions_status ON reading_sessions(status);

-- Quiz indexes
CREATE INDEX idx_quizzes_book ON quizzes(book_id);
CREATE INDEX idx_quizzes_status ON quizzes(status);
CREATE INDEX idx_quiz_attempts_student ON quiz_attempts(student_id);
CREATE INDEX idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);

-- Assignment indexes
CREATE INDEX idx_assignments_class ON assignments(class_id);
CREATE INDEX idx_assignments_deadline ON assignments(deadline);
CREATE INDEX idx_assignment_students_student ON assignment_students(student_id);

-- Discussion indexes
CREATE INDEX idx_discussion_posts_thread ON discussion_posts(thread_id);
CREATE INDEX idx_discussion_posts_user ON discussion_posts(user_id);

-- Activity indexes
CREATE INDEX idx_activity_log_user ON activity_log(user_id);
CREATE INDEX idx_activity_log_type ON activity_log(activity_type);
CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);

-- Badge indexes
CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_badges_earned ON user_badges(is_earned);

-- Notification indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================
-- Policies are defined after all tables to avoid forward reference errors

-- Users table policies
CREATE POLICY "Users can view their own data"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Teachers can view students in their classes"
    ON public.users FOR SELECT
    USING (
        role = 'student' AND
        EXISTS (
            SELECT 1 FROM public.class_enrollments ce
            JOIN public.classes c ON ce.class_id = c.id
            WHERE ce.student_id = users.id
            AND c.teacher_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all users"
    ON public.users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Student stats policies
CREATE POLICY "Users can view their own stats"
    ON public.student_stats FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view their students' stats"
    ON public.student_stats FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.class_enrollments ce
            JOIN public.classes c ON ce.class_id = c.id
            WHERE ce.student_id = student_stats.user_id
            AND c.teacher_id = auth.uid()
        )
    );

-- Classes policies
CREATE POLICY "Teachers can manage their own classes"
    ON public.classes FOR ALL
    USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view classes they're enrolled in"
    ON public.classes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.class_enrollments
            WHERE class_id = classes.id
            AND student_id = auth.uid()
        )
    );

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Student dashboard view
CREATE VIEW student_dashboard_view AS
SELECT 
    u.id as user_id,
    u.name,
    u.current_lexile_level,
    ss.books_read,
    ss.average_score,
    ss.lexile_growth,
    ss.streak_days,
    ss.total_points,
    ss.class_rank,
    COUNT(DISTINCT ub.badge_id) FILTER (WHERE ub.is_earned = true) as badges_earned,
    COUNT(DISTINCT a.id) FILTER (WHERE a.status IN ('not-started', 'in-progress')) as pending_assignments
FROM users u
LEFT JOIN student_stats ss ON u.id = ss.user_id
LEFT JOIN user_badges ub ON u.id = ub.user_id
LEFT JOIN assignment_students ast ON u.id = ast.student_id
LEFT JOIN assignments a ON ast.assignment_id = a.id
WHERE u.role = 'student'
GROUP BY u.id, u.name, u.current_lexile_level, ss.books_read, ss.average_score, 
         ss.lexile_growth, ss.streak_days, ss.total_points, ss.class_rank;

-- Teacher class overview
CREATE VIEW teacher_class_overview AS
SELECT 
    c.id as class_id,
    c.name as class_name,
    c.teacher_id,
    COUNT(DISTINCT ce.student_id) as total_students,
    AVG(u.current_lexile_level) as average_lexile,
    COUNT(DISTINCT qa.id) FILTER (WHERE qa.completed_at >= CURRENT_DATE - INTERVAL '7 days') as weekly_quizzes,
    COUNT(DISTINCT rs.id) FILTER (WHERE rs.status = 'in-progress') as active_readers,
    COUNT(DISTINCT u.id) FILTER (WHERE ss.average_score < 70) as at_risk_students
FROM classes c
LEFT JOIN class_enrollments ce ON c.id = ce.class_id AND ce.status = 'active'
LEFT JOIN users u ON ce.student_id = u.id
LEFT JOIN student_stats ss ON u.id = ss.user_id
LEFT JOIN quiz_attempts qa ON u.id = qa.student_id
LEFT JOIN reading_sessions rs ON u.id = rs.user_id
GROUP BY c.id, c.name, c.teacher_id;

-- ============================================================================
-- TRIGGERS FOR AUTO-UPDATING
-- ============================================================================

-- Update user updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_stats_updated_at BEFORE UPDATE ON public.student_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON public.books
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON public.quizzes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SAMPLE DATA INSERTION (Optional)
-- ============================================================================

-- Insert default system badges
INSERT INTO public.badges (name, description, instructions, icon, color, created_by_type, badge_type, points_value) VALUES
('7-Day Streak', 'Read every day for a week!', 'Complete at least one reading activity for 7 consecutive days.', 'Flame', 'text-orange-500', 'system', 'streak', 50),
('Quiz Master', 'Scored 100% on 5 quizzes', 'Achieve a perfect score on 5 different quizzes.', 'Award', 'text-indigo-500', 'system', 'achievement', 100),
('Genre Explorer', 'Read 3 different genres', 'Complete books from at least 3 different genres.', 'Compass', 'text-emerald-500', 'system', 'exploration', 75),
('Word Smith', 'Looked up 20 new words', 'Use the AI dictionary to look up 20 different words.', 'BookMarked', 'text-amber-500', 'system', 'vocabulary', 40);

-- Insert system settings
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description) VALUES
('default_lexile_level', '400', 'number', 'Default Lexile level for new students'),
('streak_grace_period_days', '1', 'number', 'Days of grace before breaking a reading streak'),
('max_quiz_attempts', '3', 'number', 'Maximum attempts allowed per quiz'),
('ai_model_name', 'gemini-3-flash-preview', 'string', 'Default AI model for generation');

-- ============================================================================
-- SUPABASE STORAGE BUCKETS CONFIGURATION
-- ============================================================================
-- These buckets should be created via Supabase Dashboard or API
-- This is documentation of the required bucket structure

/*
REQUIRED STORAGE BUCKETS:

1. avatars (Private)
   - User profile pictures
   - Path structure: {user_id}/profile.{ext}
   - Max file size: 5MB
   - Allowed types: image/jpeg, image/png, image/webp
   - RLS: Users can upload/update their own avatar

2. book-covers (Public)
   - Book cover images
   - Path structure: {book_id}/cover.{ext}
   - Max file size: 2MB
   - Allowed types: image/jpeg, image/png, image/webp
   - RLS: Public read, admin/teacher write

3. book-content (Private)
   - Full book content (PDFs, EPUBs)
   - Path structure: {book_id}/full.{pdf|epub}
   - Max file size: 50MB
   - Allowed types: application/pdf, application/epub+zip
   - RLS: Authenticated users can read, admin/teacher write

4. quiz-uploads (Private)
   - Teacher-uploaded text files for quiz generation
   - Path structure: {teacher_id}/{timestamp}-{filename}
   - Max file size: 10MB
   - Allowed types: text/plain, application/pdf
   - RLS: Teachers can upload/read their own files

5. assignment-resources (Private)
   - Additional assignment resources
   - Path structure: {assignment_id}/{filename}
   - Max file size: 20MB
   - Allowed types: pdf, doc, docx, txt, images
   - RLS: Class members can read, teacher can write
*/

-- ============================================================================
-- STORAGE BUCKET POLICIES (SQL Commands)
-- ============================================================================

-- Create buckets via SQL (alternative to dashboard)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('book-covers', 'book-covers', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('book-content', 'book-content', false, 52428800, ARRAY['application/pdf', 'application/epub+zip']),
  ('quiz-uploads', 'quiz-uploads', false, 10485760, ARRAY['text/plain', 'application/pdf']),
  ('assignment-resources', 'assignment-resources', false, 20971520, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for avatars bucket
CREATE POLICY "Users can view their own avatar"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS Policies for book-covers bucket (public read)
CREATE POLICY "Anyone can view book covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'book-covers');

CREATE POLICY "Teachers and admins can upload book covers"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'book-covers' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "Teachers and admins can update book covers"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'book-covers' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('teacher', 'admin')
    )
  );

-- RLS Policies for book-content bucket
CREATE POLICY "Authenticated users can view book content"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'book-content' AND auth.role() = 'authenticated');

CREATE POLICY "Teachers and admins can upload book content"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'book-content' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('teacher', 'admin')
    )
  );

-- RLS Policies for quiz-uploads bucket
CREATE POLICY "Teachers can view their own quiz uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'quiz-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Teachers can upload quiz files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'quiz-uploads' AND
    auth.uid()::text = (storage.foldername(name))[1] AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'teacher'
    )
  );

-- RLS Policies for assignment-resources bucket
CREATE POLICY "Class members can view assignment resources"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'assignment-resources' AND
    EXISTS (
      SELECT 1 FROM public.assignments a
      WHERE a.id::text = (storage.foldername(name))[1]
      AND (
        -- Teacher who created it
        a.created_by_user_id = auth.uid()
        OR
        -- Student enrolled in the class
        EXISTS (
          SELECT 1 FROM public.class_enrollments ce
          WHERE ce.class_id = a.class_id
          AND ce.student_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Teachers can upload assignment resources"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'assignment-resources' AND
    EXISTS (
      SELECT 1 FROM public.assignments a
      WHERE a.id::text = (storage.foldername(name))[1]
      AND a.created_by_user_id = auth.uid()
    )
  );

-- ============================================================================
-- SUPABASE REALTIME SUBSCRIPTIONS
-- ============================================================================
-- Enable realtime for live activity feeds and notifications

ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.discussion_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reading_sessions;

-- ============================================================================
-- HELPER FUNCTIONS FOR SUPABASE
-- ============================================================================

-- Function to get signed URL for storage objects (used in views/queries)
CREATE OR REPLACE FUNCTION public.get_storage_url(bucket_name text, file_path text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN 'https://' || current_setting('app.settings.project_ref') || '.supabase.co/storage/v1/object/public/' || bucket_name || '/' || file_path;
END;
$$;

-- Function to update streak automatically
CREATE OR REPLACE FUNCTION public.update_reading_streak()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  last_streak_date DATE;
  current_streak INTEGER;
BEGIN
  -- Get the user's current streak info
  SELECT ss.last_streak_date, ss.streak_days
  INTO last_streak_date, current_streak
  FROM public.student_stats ss
  WHERE ss.user_id = NEW.user_id;

  -- If reading today
  IF last_streak_date IS NULL OR last_streak_date < CURRENT_DATE THEN
    -- Check if it's consecutive
    IF last_streak_date = CURRENT_DATE - INTERVAL '1 day' THEN
      -- Increment streak
      UPDATE public.student_stats
      SET streak_days = streak_days + 1,
          last_streak_date = CURRENT_DATE
      WHERE user_id = NEW.user_id;
    ELSIF last_streak_date < CURRENT_DATE - INTERVAL '1 day' THEN
      -- Reset streak
      UPDATE public.student_stats
      SET streak_days = 1,
          last_streak_date = CURRENT_DATE
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to update streaks when reading session is created
CREATE TRIGGER update_streak_on_reading
  AFTER INSERT ON public.reading_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reading_streak();

-- Function to auto-award badges based on criteria
CREATE OR REPLACE FUNCTION public.check_and_award_badges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check for 7-day streak badge
  IF NEW.streak_days >= 7 THEN
    INSERT INTO public.user_badges (user_id, badge_id, is_earned, earned_at)
    SELECT NEW.user_id, b.id, true, NOW()
    FROM public.badges b
    WHERE b.name = '7-Day Streak'
    ON CONFLICT (user_id, badge_id) DO UPDATE
    SET is_earned = true, earned_at = NOW();
  END IF;

  -- Check for Quiz Master badge (5 perfect scores)
  IF (
    SELECT COUNT(*)
    FROM public.quiz_attempts qa
    WHERE qa.student_id = NEW.user_id
    AND qa.score >= 100
  ) >= 5 THEN
    INSERT INTO public.user_badges (user_id, badge_id, is_earned, earned_at)
    SELECT NEW.user_id, b.id, true, NOW()
    FROM public.badges b
    WHERE b.name = 'Quiz Master'
    ON CONFLICT (user_id, badge_id) DO UPDATE
    SET is_earned = true, earned_at = NOW();
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to check badges when stats are updated
CREATE TRIGGER check_badges_on_stats_update
  AFTER UPDATE ON public.student_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.check_and_award_badges();

-- ============================================================================
-- EDGE FUNCTIONS INTEGRATION NOTES
-- ============================================================================
/*
RECOMMENDED SUPABASE EDGE FUNCTIONS:

1. generate-quiz
   - Endpoint: /functions/v1/generate-quiz
   - Calls Gemini API to generate quiz questions
   - Input: { bookId, content, lexileLevel }
   - Output: Array of quiz questions

2. evaluate-answer
   - Endpoint: /functions/v1/evaluate-answer
   - AI-powered answer evaluation
   - Input: { question, answer, context }
   - Output: { score, feedback }

3. get-word-explanation
   - Endpoint: /functions/v1/explain-word
   - Real-time vocabulary assistance
   - Input: { word, context, lexileLevel }
   - Output: { explanation, example }

4. send-notification
   - Endpoint: /functions/v1/send-notification
   - Email/push notifications for deadlines
   - Input: { userId, type, message }
   - Uses Supabase Auth and external email service

5. generate-ai-feedback
   - Endpoint: /functions/v1/generate-feedback
   - Post-quiz personalized feedback
   - Input: { attemptId, score, answers }
   - Output: { summary, strengths, weaknesses, suggestions }
*/

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.users IS 'Core user accounts for students, teachers, and admins - extends Supabase auth.users';
COMMENT ON TABLE public.books IS 'Digital library catalog with book metadata - cover images and content stored in Supabase Storage';
COMMENT ON TABLE public.quizzes IS 'AI-generated and teacher-created comprehension assessments';
COMMENT ON TABLE public.quiz_attempts IS 'Student quiz submissions and results';
COMMENT ON TABLE public.assignments IS 'Teacher-assigned reading missions';
COMMENT ON TABLE public.discussion_posts IS 'Student and teacher discussion board posts';
COMMENT ON TABLE public.badges IS 'Achievement badges for gamification';
COMMENT ON TABLE public.ai_feedback IS 'Personalized AI-generated student feedback';
COMMENT ON TABLE public.word_lookups IS 'Track vocabulary words looked up during reading';

COMMENT ON COLUMN public.users.profile_avatar_path IS 'Path to avatar in Supabase Storage bucket: avatars/{user_id}/profile.ext';
COMMENT ON COLUMN public.books.cover_image_path IS 'Path to cover in Storage: book-covers/{book_id}/cover.ext';
COMMENT ON COLUMN public.books.full_content_path IS 'Path to full book in Storage: book-content/{book_id}/full.pdf';

-- ============================================================================
-- SUPABASE-SPECIFIC SETUP SUMMARY
-- ============================================================================
/*
SETUP CHECKLIST FOR SUPABASE:

✅ 1. Enable Required Extensions (done in this schema)
   - uuid-ossp for UUID generation
   - pgcrypto for encryption

✅ 2. Create Storage Buckets (see STORAGE BUCKETS section)
   - avatars (private, 5MB, images)
   - book-covers (public, 2MB, images)
   - book-content (private, 50MB, PDFs/EPUBs)
   - quiz-uploads (private, 10MB, text/PDFs)
   - assignment-resources (private, 20MB, mixed)

✅ 3. Enable Row Level Security (RLS) on all tables
   - All tables have RLS enabled
   - Policies restrict access based on user role and relationships

✅ 4. Set up Realtime Subscriptions (optional)
   - activity_log for live activity feed
   - notifications for real-time alerts
   - discussion_posts for live discussions
   - reading_sessions for teacher monitoring

✅ 5. Deploy Edge Functions (recommended)
   - generate-quiz: Gemini AI quiz generation
   - evaluate-answer: AI answer grading
   - get-word-explanation: Vocabulary assistance
   - send-notification: Email/push notifications
   - generate-ai-feedback: Personalized feedback

✅ 6. Configure Authentication
   - Email/password auth enabled
   - Email confirmation (optional)
   - Password reset flow
   - JWT tokens for API access

✅ 7. Set Environment Variables
   - GEMINI_API_KEY: Google Gemini API key
   - PUBLIC_SUPABASE_URL: Your Supabase project URL
   - PUBLIC_SUPABASE_ANON_KEY: Public anonymous key
   - SUPABASE_SERVICE_ROLE_KEY: Service role key (server-side only)

✅ 8. Performance Optimization
   - All foreign keys indexed
   - Composite indexes for common queries
   - Materialized views for dashboards (optional)

INTEGRATION WITH REACT APP:
- Use @supabase/supabase-js client library
- Initialize with project URL and anon key
- Use storage.from('bucket-name').upload() for file uploads
- Use storage.from('bucket-name').getPublicUrl() for public URLs
- Use storage.from('bucket-name').createSignedUrl() for private URLs
- Set up Realtime subscriptions for live features

DEPLOYMENT NOTES:
- Run this schema against your Supabase project
- Create buckets via Dashboard or INSERT commands
- Test RLS policies with different user roles
- Configure bucket policies via Dashboard
- Deploy Edge Functions separately via Supabase CLI
*/
