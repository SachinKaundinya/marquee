-- Marquee Core Database Schema (PostgreSQL / Supabase)
-- Version 2.0.0 (Title-Level Architecture)

-- Enums for title classifications
DO $$ BEGIN
    CREATE TYPE media_type AS ENUM ('movie', 'tv');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tracking_status AS ENUM ('want_to_watch', 'watching', 'watched', 'dropped');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- User tracking table (Title-Level Only)
CREATE TABLE IF NOT EXISTS user_titles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tmdb_id INTEGER NOT NULL,
    media_type media_type NOT NULL,
    status tracking_status NOT NULL,
    
    -- Diary & Review Details
    rating NUMERIC(2, 1) CHECK (rating IS NULL OR (rating >= 0.5 AND rating <= 5.0)),
    notes TEXT,
    is_rewatch BOOLEAN DEFAULT FALSE,
    watched_on DATE,
    streaming_provider_id INTEGER,
    
    -- Cached metadata for offline fast browsing & diary display
    title TEXT,
    poster_path TEXT,
    backdrop_path TEXT,
    release_year INTEGER,
    runtime INTEGER,
    vote_average NUMERIC(3, 1),
    genres TEXT[] DEFAULT '{}',
    platform_name TEXT,
    
    -- System timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Uniqueness constraint: one status entry per user per title
    CONSTRAINT user_title_unique UNIQUE(user_id, tmdb_id, media_type)
);

-- Indices for instant query response times
CREATE INDEX IF NOT EXISTS idx_user_titles_user_status ON user_titles(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_titles_media ON user_titles(user_id, media_type);
CREATE INDEX IF NOT EXISTS idx_user_titles_watched_on ON user_titles(user_id, watched_on DESC);

-- User configured streaming subscriptions
CREATE TABLE IF NOT EXISTS user_streaming_providers (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_id INTEGER NOT NULL,
    provider_name TEXT NOT NULL,
    logo_path TEXT,
    display_priority INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, provider_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE user_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaming_providers ENABLE ROW LEVEL SECURITY;

-- Policies for user_titles
CREATE POLICY "Users can view their own tracked titles"
    ON user_titles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tracked titles"
    ON user_titles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracked titles"
    ON user_titles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tracked titles"
    ON user_titles FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for user_streaming_providers
CREATE POLICY "Users can view their own streaming providers"
    ON user_streaming_providers FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own streaming providers"
    ON user_streaming_providers FOR ALL
    USING (auth.uid() = user_id);
