-- ==============================================================================
-- "ምክረ አበው" (Mikre Abew) - Q&A Database Schema & Realtime Setup
-- Execute this script directly in your Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- 1. Create table `questions` with strict security constraints
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    author_name TEXT DEFAULT 'አይታወቅም',
    category TEXT DEFAULT 'ጠቅላላ',
    is_answered BOOLEAN DEFAULT false,
    is_starred BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Robust Database Constraints (prevent spam, oversized payloads, invalid categories)
    CONSTRAINT check_content_length CHECK (char_length(trim(content)) >= 10 AND char_length(content) <= 1500),
    CONSTRAINT check_author_length CHECK (char_length(author_name) <= 80),
    CONSTRAINT check_valid_category CHECK (category IN ('ጠቅላላ', 'ለአባቶች', 'ለወጣቶች', 'ለቤተሰብ'))
);

-- 2. Performance Indexes for fast live sorting and filtering
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON public.questions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_questions_category ON public.questions (category);
CREATE INDEX IF NOT EXISTS idx_questions_is_answered ON public.questions (is_answered);
CREATE INDEX IF NOT EXISTS idx_questions_is_starred ON public.questions (is_starred);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Clean existing policies if re-running
DROP POLICY IF EXISTS "Public can submit questions" ON public.questions;
DROP POLICY IF EXISTS "Authorized admins can view questions" ON public.questions;
DROP POLICY IF EXISTS "Authorized admins can update questions" ON public.questions;
DROP POLICY IF EXISTS "Authorized admins can delete questions" ON public.questions;
DROP POLICY IF EXISTS "Allow anon read for PIN admin" ON public.questions;
DROP POLICY IF EXISTS "Allow anon update for PIN admin" ON public.questions;

-- Policy A: Anyone (public / anon) can submit questions (enforces min & max characters)
CREATE POLICY "Public can submit questions"
ON public.questions
FOR INSERT
TO anon, authenticated
WITH CHECK (
    char_length(trim(content)) >= 10 AND
    char_length(content) <= 1500 AND
    category IN ('ጠቅላላ', 'ለአባቶች', 'ለወጣቶች', 'ለቤተሰብ')
);

-- Policy B: Authorized admins (Supabase Authenticated) have full view, update & delete access
CREATE POLICY "Authorized admins can view questions"
ON public.questions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authorized admins can update questions"
ON public.questions
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authorized admins can delete questions"
ON public.questions
FOR DELETE
TO authenticated
USING (true);

-- ------------------------------------------------------------------------------
-- NOTE FOR PIN-ONLY ACCESS WITHOUT SUPABASE USER ACCOUNTS:
-- The application includes a secure Next.js Server API (/api/admin/questions)
-- that handles PIN verification server-side using SUPABASE_SERVICE_ROLE_KEY.
-- However, if you prefer client-side direct Realtime with only the anon key,
-- you can also uncomment the policies below:
-- ------------------------------------------------------------------------------
-- CREATE POLICY "Allow anon read for PIN admin"
-- ON public.questions FOR SELECT TO anon USING (true);
--
-- CREATE POLICY "Allow anon update for PIN admin"
-- ON public.questions FOR UPDATE TO anon USING (true) WITH CHECK (true);
-- ------------------------------------------------------------------------------

-- 4. Enable Supabase Realtime for the `questions` table
-- Ensures live synchronization to stage monitor and organizer dashboards.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'questions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.questions;
    END IF;
END $$;

-- 5. Helpful Sample Data in Amharic (Seed Questions)
INSERT INTO public.questions (content, author_name, category, is_answered, is_starred) VALUES
('በዘመናችን ወጣቶች በመንፈሳዊ ህይወት እና በዘመናዊ ቴክኖሎጂ ተጽዕኖ መካከል ሚዛናቸውን እንዴት መጠበቅ ይችላሉ?', 'ዳዊት ተክሌ', 'ለወጣቶች', false, true),
('በቤተሰብ ውስጥ አለመግባባቶች ሲፈጠሩ በክርስቲያናዊ ፍቅርና ትዕግሥት እንዴት መፍታት ይቻላል?', 'አዳነች በቀለ', 'ለቤተሰብ', false, false),
('አባቶቻችን በፈተና ወቅት ያሳዩት ጽናት ለዛሬው ትውልድ ምን ዓይነት ትምህርት ይሰጣል?', 'አይታወቅም', 'ለአባቶች', false, true),
('የዚህ ዝግጅት ቀጣይ ክፍለ ጊዜ መቼ ነው የሚካሄደው? እንዲሁም መጽሐፉን ከየት ማግኘት እንችላለን?', 'ተስፋዬ', 'ጠቅላላ', true, false)
ON CONFLICT DO NOTHING;
