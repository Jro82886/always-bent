-- ABFI Database Schema for 60+ Users
-- Run this in Supabase SQL Editor (Settings → SQL Editor)

-- 1. PROFILES TABLE (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  captain_name TEXT NOT NULL,
  boat_name TEXT NOT NULL,
  vessel_type TEXT DEFAULT 'F/V',
  home_inlet TEXT,
  signup_source TEXT DEFAULT 'direct', -- 'squarespace', 'direct', etc
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. VESSEL POSITIONS (real-time tracking)
CREATE TABLE IF NOT EXISTS public.vessel_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  captain_name TEXT NOT NULL,
  boat_name TEXT NOT NULL,
  lat FLOAT NOT NULL,
  lng FLOAT NOT NULL,
  speed FLOAT,
  heading FLOAT,
  selected_inlet TEXT,
  is_on_water BOOLEAN DEFAULT false,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ONLINE PRESENCE (who's active)
CREATE TABLE IF NOT EXISTS public.online_presence (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  captain_name TEXT NOT NULL,
  boat_name TEXT NOT NULL,
  status TEXT CHECK (status IN ('online', 'away', 'offline')) DEFAULT 'online',
  current_inlet TEXT,
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CATCH REPORTS (bite data)
CREATE TABLE IF NOT EXISTS public.catch_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  captain_name TEXT NOT NULL,
  boat_name TEXT NOT NULL,
  species TEXT,
  lat FLOAT NOT NULL,
  lng FLOAT NOT NULL,
  selected_inlet TEXT,
  sst_temp FLOAT,
  chl_level FLOAT,
  conditions JSONB,
  notes TEXT,
  is_abfi_bite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. MESSAGES (DMs and channel chat)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- NULL for channels
  channel_id TEXT, -- 'inlet:ocean-city' or 'species:tuna'
  content TEXT NOT NULL,
  lat FLOAT,
  lng FLOAT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ENABLE ROW LEVEL SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vessel_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE online_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE catch_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 7. SECURITY POLICIES

-- Profiles: Public read, own update
CREATE POLICY "Public profiles are viewable by everyone" 
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Vessel Positions: Public read, own write
CREATE POLICY "Vessel positions are viewable by everyone" 
  ON vessel_positions FOR SELECT USING (true);

CREATE POLICY "Users can insert own vessel position" 
  ON vessel_positions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vessel position" 
  ON vessel_positions FOR UPDATE USING (auth.uid() = user_id);

-- Online Presence: Public read, own write
CREATE POLICY "Online presence is viewable by everyone" 
  ON online_presence FOR SELECT USING (true);

CREATE POLICY "Users can manage own presence" 
  ON online_presence FOR ALL USING (auth.uid() = user_id);

-- Catch Reports: Public read, own write
CREATE POLICY "Catch reports are viewable by everyone" 
  ON catch_reports FOR SELECT USING (true);

CREATE POLICY "Users can create own catch reports" 
  ON catch_reports FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own catch reports" 
  ON catch_reports FOR UPDATE USING (auth.uid() = user_id);

-- Messages: Read own and sent to you
CREATE POLICY "Users can read own messages" 
  ON messages FOR SELECT USING (
    auth.uid() = sender_id OR 
    auth.uid() = recipient_id OR
    channel_id IS NOT NULL -- Public channels
  );

CREATE POLICY "Users can send messages" 
  ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 8. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_vessel_positions_user_id ON vessel_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_vessel_positions_timestamp ON vessel_positions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_online_presence_status ON online_presence(status);
CREATE INDEX IF NOT EXISTS idx_catch_reports_user_id ON catch_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_catch_reports_created ON catch_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_channel ON messages(channel_id);

-- 9. FUNCTIONS FOR TRIGGERS

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. TRIGGERS
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 11. REALTIME SUBSCRIPTIONS
-- Enable realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE vessel_positions;
ALTER PUBLICATION supabase_realtime ADD TABLE online_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE catch_reports;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ ABFI Database Schema Created Successfully!';
  RAISE NOTICE '✅ Tables: profiles, vessel_positions, online_presence, catch_reports, messages';
  RAISE NOTICE '✅ Security policies enabled';
  RAISE NOTICE '✅ Realtime subscriptions enabled';
  RAISE NOTICE '🚀 Ready for 60+ users!';
END $$;
