-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    wallet_address TEXT UNIQUE,
    username TEXT UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated images table
CREATE TABLE IF NOT EXISTS generated_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    image_url TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    model TEXT,
    style TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    votes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Image votes table
CREATE TABLE IF NOT EXISTS image_votes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    image_id UUID REFERENCES generated_images(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, image_id)
);

-- Code executions table
CREATE TABLE IF NOT EXISTS code_executions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
    prompt TEXT NOT NULL,
    code TEXT NOT NULL,
    output TEXT,
    error TEXT,
    language TEXT DEFAULT 'python',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Search queries table
CREATE TABLE IF NOT EXISTS search_queries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
    query TEXT NOT NULL,
    results JSONB,
    search_type TEXT NOT NULL CHECK (search_type IN ('google', 'url_context', 'combined')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_user_id ON generated_images(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_public ON generated_images(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_generated_images_created_at ON generated_images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_images_votes ON generated_images(votes_count DESC);
CREATE INDEX IF NOT EXISTS idx_image_votes_image_id ON image_votes(image_id);
CREATE INDEX IF NOT EXISTS idx_image_votes_user_id ON image_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_code_executions_user_id ON code_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_search_queries_user_id ON search_queries(user_id);

-- Triggers for updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update vote counts
CREATE OR REPLACE FUNCTION update_image_votes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE generated_images 
        SET votes_count = votes_count + CASE WHEN NEW.vote_type = 'upvote' THEN 1 ELSE -1 END
        WHERE id = NEW.image_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE generated_images 
        SET votes_count = votes_count + 
            CASE WHEN NEW.vote_type = 'upvote' THEN 1 ELSE -1 END -
            CASE WHEN OLD.vote_type = 'upvote' THEN 1 ELSE -1 END
        WHERE id = NEW.image_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE generated_images 
        SET votes_count = votes_count - CASE WHEN OLD.vote_type = 'upvote' THEN 1 ELSE -1 END
        WHERE id = OLD.image_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER image_votes_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON image_votes
    FOR EACH ROW EXECUTE FUNCTION update_image_votes_count();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Chat sessions: users can only access their own
CREATE POLICY "Users can view own chat sessions" ON chat_sessions
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create own chat sessions" ON chat_sessions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own chat sessions" ON chat_sessions
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own chat sessions" ON chat_sessions
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Chat messages: users can only access their own
CREATE POLICY "Users can view own chat messages" ON chat_messages
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create own chat messages" ON chat_messages
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Generated images: users can view public images or their own
CREATE POLICY "Anyone can view public images" ON generated_images
    FOR SELECT USING (is_public = TRUE OR auth.uid()::text = user_id::text);

CREATE POLICY "Users can create own images" ON generated_images
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own images" ON generated_images
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own images" ON generated_images
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Image votes: users can vote on public images
CREATE POLICY "Users can view all votes" ON image_votes
    FOR SELECT USING (TRUE);

CREATE POLICY "Users can create votes" ON image_votes
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own votes" ON image_votes
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own votes" ON image_votes
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Code executions: users can only access their own
CREATE POLICY "Users can view own code executions" ON code_executions
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create own code executions" ON code_executions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Search queries: users can only access their own
CREATE POLICY "Users can view own search queries" ON search_queries
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create own search queries" ON search_queries
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Ask the Dev feature tables
CREATE TABLE IF NOT EXISTS dev_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_wallet_address TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('bug', 'feature', 'question', 'feedback', 'other')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    url TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dev_request_files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    request_id UUID REFERENCES dev_requests(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dev_responses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    request_id UUID REFERENCES dev_requests(id) ON DELETE CASCADE,
    admin_wallet_address TEXT NOT NULL,
    response_text TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Ask the Dev feature
CREATE INDEX IF NOT EXISTS idx_dev_requests_user_id ON dev_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_dev_requests_status ON dev_requests(status);
CREATE INDEX IF NOT EXISTS idx_dev_requests_created_at ON dev_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dev_request_files_request_id ON dev_request_files(request_id);
CREATE INDEX IF NOT EXISTS idx_dev_responses_request_id ON dev_responses(request_id);

-- Triggers for updating updated_at
CREATE TRIGGER update_dev_requests_updated_at BEFORE UPDATE ON dev_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dev_responses_updated_at BEFORE UPDATE ON dev_responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS policies for Ask the Dev feature
ALTER TABLE dev_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_request_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_responses ENABLE ROW LEVEL SECURITY;

-- Dev requests: users can view all requests but only create/update their own
CREATE POLICY "Anyone can view dev requests" ON dev_requests
    FOR SELECT USING (TRUE);

CREATE POLICY "Users can create own dev requests" ON dev_requests
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own dev requests" ON dev_requests
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Dev request files: users can view files for all requests but only upload to their own
CREATE POLICY "Anyone can view dev request files" ON dev_request_files
    FOR SELECT USING (TRUE);

CREATE POLICY "Users can upload files to own requests" ON dev_request_files
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM dev_requests 
            WHERE id = request_id AND user_id::text = auth.uid()::text
        )
    );

-- Dev responses: anyone can view, but only admins (specified wallet) can create
CREATE POLICY "Anyone can view dev responses" ON dev_responses
    FOR SELECT USING (TRUE);

CREATE POLICY "Admins can create responses" ON dev_responses
    FOR INSERT WITH CHECK (admin_wallet_address = 'BSg4ZyMunJKr585bUQTwQpigX4Em8iiCqVSHMxnZVz1u');

CREATE POLICY "Admins can update own responses" ON dev_responses
    FOR UPDATE USING (admin_wallet_address = 'BSg4ZyMunJKr585bUQTwQpigX4Em8iiCqVSHMxnZVz1u');