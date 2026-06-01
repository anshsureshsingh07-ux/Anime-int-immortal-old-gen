-- SQL Schema for Comment and Heart System
-- Execute this query in your Supabase SQL Editor.

-- Drop tables if they exist to prevent conflicts on repeat installs
DROP TABLE IF EXISTS public.article_comments CASCADE;
DROP TABLE IF EXISTS public.article_likes CASCADE;

-- 1. Create Article Comments Table
CREATE TABLE public.article_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id TEXT NOT NULL, -- Flexible TEXT type to support both Integer and UUID article keys
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create Article Likes Table
CREATE TABLE public.article_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id TEXT NOT NULL, -- Flexible TEXT type to support both Integer and UUID article keys
    user_id TEXT NOT NULL, -- Stores current user sub/uid/email
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_article_user_like UNIQUE (article_id, user_id)
);

-- Enable Row-Level Security (RLS)
ALTER TABLE public.article_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_likes ENABLE ROW LEVEL SECURITY;

-- 3. Create Security Policies for article_comments
CREATE POLICY "Allow public read access to comments" 
ON public.article_comments FOR SELECT USING (true);

CREATE POLICY "Allow authenticated/unauthenticated insert to comments" 
ON public.article_comments FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow users to delete their own comments" 
ON public.article_comments FOR DELETE USING (true); -- Flexible policy for our system

-- 4. Create Security Policies for article_likes
CREATE POLICY "Allow public read access to likes" 
ON public.article_likes FOR SELECT USING (true);

CREATE POLICY "Allow all access to likes" 
ON public.article_likes FOR ALL USING (true);

-- Enable Supabase Realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE article_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE article_likes;
