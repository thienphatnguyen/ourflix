-- ==============================================================================
-- OURFLIX - SUPABASE DATABASE SCHEMA & REALTIME SETUP
-- Chạy script này trực tiếp trên Supabase SQL Editor
-- ==============================================================================

-- 1. BẢNG TIẾN ĐỘ XEM PHIM XUYÊN THIẾT BỊ (watch_history)
CREATE TABLE IF NOT EXISTS public.watch_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movie_slug TEXT UNIQUE NOT NULL,
    movie_name TEXT NOT NULL,
    poster_url TEXT,
    episode_slug TEXT NOT NULL,
    episode_name TEXT NOT NULL,
    current_time_sec FLOAT8 DEFAULT 0,
    duration_sec FLOAT8 DEFAULT 0,
    updated_by TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_watch_history_updated_at ON public.watch_history (updated_at DESC);

-- 2. BẢNG KHO PHIM DÙNG CHUNG CỦA CẶP ĐÔI (couple_movies)
CREATE TABLE IF NOT EXISTS public.couple_movies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movie_slug TEXT NOT NULL,
    movie_name TEXT NOT NULL,
    poster_url TEXT,
    category TEXT NOT NULL CHECK (category IN ('favorite', 'couple_pick')),
    note TEXT,
    added_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_movie_category UNIQUE(movie_slug, category)
);

CREATE INDEX IF NOT EXISTS idx_couple_movies_category ON public.couple_movies (category, created_at DESC);

-- 3. BẢNG TRẠNG THÁI CẶP ĐÔI & BANNER (couple_status)
CREATE TABLE IF NOT EXISTS public.couple_status (
    id INT PRIMARY KEY DEFAULT 1,
    anniversary_date DATE NOT NULL DEFAULT '2025-07-25',
    banner_message TEXT NOT NULL DEFAULT 'Tối nay 9h lên kèo cày phim cùng nhau nhé ❤️',
    featured_slug TEXT NOT NULL DEFAULT 'hen-ho-chon-cong-so',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Khởi tạo dữ liệu mặc định (ID = 1)
INSERT INTO public.couple_status (id, anniversary_date, banner_message, featured_slug)
VALUES (
    1,
    '2025-07-25',
    'Tối nay 9h lên kèo cày phim cùng nhau nhé ❤️',
    'hen-ho-chon-cong-so'
)
ON CONFLICT (id) DO UPDATE 
SET anniversary_date = '2025-07-25', updated_at = now();

-- 4. BẢNG TIN NHẮN TÌNH YÊU CẶP ĐÔI (couple_messages)
CREATE TABLE IF NOT EXISTS public.couple_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_couple_messages_created_at ON public.couple_messages (created_at DESC);

-- Chèn mẫu 2 tin nhắn khởi tạo
INSERT INTO public.couple_messages (sender_id, sender_name, message, created_at)
VALUES 
('thien-phat', 'Thiên Phát', 'Tối nay xem phim với anh nhé ❤️', now() - interval '10 minutes'),
('tra-my', 'Trà My', 'Biết thế chẳng hạn 🥰', now() - interval '5 minutes')
ON CONFLICT DO NOTHING;

-- 5. BẬT TOÀN QUYỀN ĐỌC GHI (RLS POLICIES CHO PHÉP ANON)
ALTER TABLE public.watch_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_movies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_messages DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access watch_history" ON public.watch_history;
CREATE POLICY "Public access watch_history" ON public.watch_history FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access couple_movies" ON public.couple_movies;
CREATE POLICY "Public access couple_movies" ON public.couple_movies FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access couple_status" ON public.couple_status;
CREATE POLICY "Public access couple_status" ON public.couple_status FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access couple_messages" ON public.couple_messages;
CREATE POLICY "Public access couple_messages" ON public.couple_messages FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON TABLE public.watch_history TO anon, authenticated;
GRANT ALL ON TABLE public.couple_movies TO anon, authenticated;
GRANT ALL ON TABLE public.couple_status TO anon, authenticated;
GRANT ALL ON TABLE public.couple_messages TO anon, authenticated;

-- 6. BẬT SUPABASE REALTIME REPLICATION CHO CẢ 4 BẢNG
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'watch_history'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.watch_history;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'couple_movies'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.couple_movies;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'couple_status'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.couple_status;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'couple_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.couple_messages;
    END IF;
END $$;
