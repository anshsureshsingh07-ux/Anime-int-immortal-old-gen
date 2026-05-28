-- 1. Create Profiles table (Extends Supabase Auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  email TEXT,
  avatar_url TEXT,
  profile_photo_url TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'news_writer', 'moderator', 'admin')),
  xp INT DEFAULT 0,
  level INT DEFAULT 1,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create News (Blogs) table
CREATE TABLE news (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Trending',
  image TEXT,
  author_id UUID REFERENCES auth.users,
  author_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Applications (Recruitment) table
CREATE TABLE applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  user_email TEXT,
  name TEXT,
  age INTEGER,
  discord TEXT,
  role TEXT,
  skills TEXT,
  experience TEXT,
  availability TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Anime Database table
CREATE TABLE anime (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image TEXT,
  rating DECIMAL(3,1),
  status TEXT,
  episodes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Release Tracker table
CREATE TABLE release_tracker (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  release_date TIMESTAMPTZ NOT NULL,
  episode INTEGER,
  platform TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create Polls table
CREATE TABLE polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE poll_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE poll_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  option_id UUID REFERENCES poll_options(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

-- 7. Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE anime ENABLE ROW LEVEL SECURITY;
ALTER TABLE release_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies
-- Anime
CREATE POLICY "Public Anime Access" ON anime FOR SELECT USING (true);
CREATE POLICY "Admin Anime Management" ON anime FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Releases
CREATE POLICY "Public Release Access" ON release_tracker FOR SELECT USING (true);
CREATE POLICY "Admin Release Management" ON release_tracker FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Polls
CREATE POLICY "Public Poll Access" ON polls FOR SELECT USING (true);
CREATE POLICY "Admin Poll Management" ON polls FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Poll Options
CREATE POLICY "Public Option Access" ON poll_options FOR SELECT USING (true);
CREATE POLICY "Admin Option Management" ON poll_options FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Poll Votes
CREATE POLICY "Public Vote Access" ON poll_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated Vote" ON poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 9. RLS Policies for News
CREATE POLICY "Public News Access" ON news FOR SELECT USING (true);
CREATE POLICY "Admin News Management" ON news FOR ALL 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('news_writer', 'admin'))
    OR (auth.jwt()->>'email') IN ('anshsureshsingh07@gmail.com', 'animeintofficial@gmail.com')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('news_writer', 'admin'))
    OR (auth.jwt()->>'email') IN ('anshsureshsingh07@gmail.com', 'animeintofficial@gmail.com')
  );

-- 10. RLS Policies for Profiles
CREATE POLICY "Public Profile Access" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON profiles FOR ALL 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    OR auth.jwt()->>'email' IN ('anshsureshsingh07@gmail.com', 'animeintofficial@gmail.com')
  );

-- 11. RLS Policies for Applications
CREATE POLICY "Users can see own applications" ON applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can submit applications" ON applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage applications" ON applications FOR ALL 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'moderator'))
    OR auth.jwt()->>'email' IN ('anshsureshsingh07@gmail.com', 'animeintofficial@gmail.com')
  );

-- 12. Supabase Storage Setup
-- Buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('news', 'news', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile photo', 'profile photo', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatar', 'avatar', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies (Universal helper for public buckets)
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id IN ('news', 'avatars', 'profile photo', 'avatar'));

CREATE POLICY "Admin/Writer Storage Access" ON storage.objects FOR ALL 
  TO authenticated
  USING (
    (bucket_id = 'news' AND (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('news_writer', 'admin')) OR (auth.jwt()->>'email') IN ('anshsureshsingh07@gmail.com', 'animeintofficial@gmail.com')))
    OR (bucket_id = 'avatars' AND auth.uid() = (storage.foldername(name))[1]::uuid)
    OR (bucket_id = 'avatars' AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  );

CREATE POLICY "Avatar Owner Storage Access" ON storage.objects FOR ALL
  TO authenticated
  USING (
    (bucket_id = 'avatar' AND (
      name = 'profiles/' || auth.uid()::text || '.png'
      OR name = 'profiles/' || auth.uid()::text || '.jpg'
      OR name = 'profiles/' || auth.uid()::text || '.jpeg'
      OR name = 'profiles/' || auth.uid()::text || '.gif'
      OR name = 'profiles/' || auth.uid()::text || '.webp'
      OR (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    ))
  )
  WITH CHECK (
    (bucket_id = 'avatar' AND (
      name = 'profiles/' || auth.uid()::text || '.png'
      OR name = 'profiles/' || auth.uid()::text || '.jpg'
      OR name = 'profiles/' || auth.uid()::text || '.jpeg'
      OR name = 'profiles/' || auth.uid()::text || '.gif'
      OR name = 'profiles/' || auth.uid()::text || '.webp'
      OR (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    ))
  );

CREATE POLICY "Public Avatar Upload" ON storage.objects FOR ALL
  USING (bucket_id = 'avatar')
  WITH CHECK (bucket_id = 'avatar');

CREATE POLICY "Profile Photo Owner Storage Access" ON storage.objects FOR ALL
  TO authenticated
  USING (
    (bucket_id = 'profile photo' AND auth.uid() = (storage.foldername(name))[1]::uuid)
    OR (bucket_id = 'profile photo' AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  )
  WITH CHECK (
    (bucket_id = 'profile photo' AND auth.uid() = (storage.foldername(name))[1]::uuid)
    OR (bucket_id = 'profile photo' AND EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  );

-- 13. Trigger to create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, avatar_url, role)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'username', 
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    CASE 
      WHEN new.email IN ('anshsureshsingh07@gmail.com', 'animeintofficial@gmail.com') THEN 'admin'
      ELSE 'member'
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 14. Anime Streaming Features (Tables & Policies)
CREATE TABLE anime_series (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE anime_episodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  series_id UUID REFERENCES anime_series(id) ON DELETE CASCADE,
  episode_number INTEGER NOT NULL,
  title TEXT,
  episode_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE anime_streams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  episode_id UUID REFERENCES anime_episodes(id) ON DELETE CASCADE,
  language_region TEXT NOT NULL, -- e.g., 'English Sub', 'Hindi Dub'
  stream_url TEXT NOT NULL, -- embed content
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE anime_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE anime_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE anime_streams ENABLE ROW LEVEL SECURITY;

-- Standard Public SELECT privileges for streaming
CREATE POLICY "Public Anime Series Access" ON anime_series FOR SELECT USING (true);
CREATE POLICY "Public Anime Episodes Access" ON anime_episodes FOR SELECT USING (true);
CREATE POLICY "Public Anime Streams Access" ON anime_streams FOR SELECT USING (true);

-- Admin Privileges for insertion/deletion/updates
CREATE POLICY "Admin Anime Series Management" ON anime_series FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Admin Anime Episodes Management" ON anime_episodes FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Admin Anime Streams Management" ON anime_streams FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));


-- 15. Premium/Upgrade Ledger (Payment Transactions)
CREATE TABLE payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_email TEXT,
  username TEXT,
  transaction_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
  tier TEXT DEFAULT 'premium', -- 'plus', 'god', 'monarch'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions and insert them
CREATE POLICY "Users can insert their own payment transactions" ON payment_transactions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select their own payment transactions" ON payment_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can manage all transactions
CREATE POLICY "Admins can manage all payment transactions" ON payment_transactions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    OR auth.jwt()->>'email' IN ('anshsureshsingh07@gmail.com', 'animeintofficial@gmail.com')
  );


-- 16. Alert Profiles Table structure with is_verified column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Trigger to protect profiles.is_verified from being altered by non-admins
CREATE OR REPLACE FUNCTION public.check_is_verified_update()
RETURNS trigger AS $$
BEGIN
  IF NEW.is_verified IS DISTINCT FROM OLD.is_verified AND NEW.is_verified = true THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    ) AND (auth.jwt()->>'email') NOT IN ('anshsureshsingh07@gmail.com', 'animeintofficial@gmail.com') THEN
      RAISE EXCEPTION 'Unauthorized: Only administrators can toggle verification status.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_check_is_verified_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.check_is_verified_update();


-- 17. Social Chat & Engagement Tables
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  is_group BOOLEAN DEFAULT false,
  theme_color TEXT DEFAULT 'Blue',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on Chat structures
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 18. Secure Access RLS Policies for Chat channels

-- Participants read access
CREATE POLICY "Users can select participants of their conversations" ON conversation_participants
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants as cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
    )
  );

-- Participants insert access
CREATE POLICY "Users can insert participants" ON conversation_participants
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Conversations select access
CREATE POLICY "Users can view their conversations" ON conversations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
      AND conversation_participants.user_id = auth.uid()
    )
  );

-- Conversations creation access
CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Conversation theme updates access
CREATE POLICY "Users can update their conversations" ON conversations
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
      AND conversation_participants.user_id = auth.uid()
    )
  );

-- Messages select access
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
    )
  );

-- Messages insert access
CREATE POLICY "Users can send messages to their conversations" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
    )
  );


-- 19. Profiles: Account Status
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'banned'));

-- 20. Posts Table (Supports both standard posts and reels)
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  media_url TEXT,
  is_reel BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Posts select access
CREATE POLICY "Public Posts Access" ON posts
  FOR SELECT USING (true);

-- Posts insert access
CREATE POLICY "Authenticated users can create posts" ON posts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Posts delete/update access
CREATE POLICY "Users can manage own posts" ON posts
  FOR ALL TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 21. Reports Table for Reporting System
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reported_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'banned')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Reports Select (Authenticated users can see their own reports, admins can see all)
CREATE POLICY "Users can see own reports" ON reports
  FOR SELECT TO authenticated
  USING (
    reporter_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Reports Insert
CREATE POLICY "Authenticated users can insert reports" ON reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

-- Reports Update (Admins can update reports to resolve/ban)
CREATE POLICY "Only admins can update reports" ON reports
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );



