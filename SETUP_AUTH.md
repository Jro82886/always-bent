# 🔐 ABFI AUTHENTICATION SETUP (FOR 60+ USERS)

## ✅ WHAT'S BUILT:
- Complete auth system with Supabase
- Login page at `/auth/login`
- Signup page at `/auth/signup`
- Captain name + boat name registration
- Session management
- Auth provider and context

## 🚀 TO ACTIVATE:

### 1. Create Supabase Project (5 minutes)
```bash
# Go to https://app.supabase.com
# Click "New Project"
# Name it "always-bent" or "abfi-prod"
# Wait for it to provision
```

### 2. Get Your API Keys
```bash
# In Supabase Dashboard:
# Settings > API
# Copy:
# - Project URL (https://xxxxx.supabase.co)
# - anon/public key (long string)
# - service_role key (keep secret!)
```

### 3. Add to .env.local
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_KEY
```

### 4. Create Database Tables
Run this SQL in Supabase SQL Editor:

```sql
-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  captain_name TEXT NOT NULL,
  boat_name TEXT NOT NULL,
  vessel_type TEXT DEFAULT 'F/V',
  home_inlet TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vessel positions for real-time tracking
CREATE TABLE vessel_positions (
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

-- Online presence tracking
CREATE TABLE online_presence (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  captain_name TEXT NOT NULL,
  boat_name TEXT NOT NULL,
  status TEXT CHECK (status IN ('online', 'away', 'offline')),
  current_inlet TEXT,
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vessel_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE online_presence ENABLE ROW LEVEL SECURITY;

-- Policies: Users can read all but only update their own
CREATE POLICY "Public profiles are viewable by everyone" 
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Vessel positions are viewable by everyone" 
  ON vessel_positions FOR SELECT USING (true);

CREATE POLICY "Users can insert own vessel position" 
  ON vessel_positions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Online presence is viewable by everyone" 
  ON online_presence FOR SELECT USING (true);

CREATE POLICY "Users can update own presence" 
  ON online_presence FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_vessel_positions_user_id ON vessel_positions(user_id);
CREATE INDEX idx_vessel_positions_timestamp ON vessel_positions(timestamp DESC);
CREATE INDEX idx_online_presence_status ON online_presence(status);
```

### 5. Test It!
```bash
npm run dev
# Go to http://localhost:3000/auth/signup
# Create an account
# You're in!
```

## 📱 FEATURES NOW AVAILABLE:
- ✅ Unique user IDs (no collisions)
- ✅ Password protection
- ✅ Email verification (optional)
- ✅ Password reset
- ✅ Persistent sessions
- ✅ Ready for 60+ simultaneous users
- ✅ Real-time presence
- ✅ Vessel tracking foundation

## 🔥 NEXT STEPS:
1. Add presence indicators (green dots)
2. Show vessels on map
3. Enable DMs between captains
4. Track history/breadcrumbs

## WITHOUT SUPABASE:
The app will still work with localStorage only, but:
- ❌ No unique user IDs
- ❌ No password protection
- ❌ No data persistence
- ❌ Limited to ~10 users max
