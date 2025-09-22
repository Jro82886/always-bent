-- Fix Chat Messages Table and RLS Policies
-- Safe to run multiple times (idempotent)

-- Table (if not already created)
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inlet_id text NOT NULL,
  user_id uuid NOT NULL,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_inlet_created 
ON public.chat_messages(inlet_id, created_at DESC);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Read for everyone
DROP POLICY IF EXISTS "Anyone can read messages" ON public.chat_messages;
CREATE POLICY "Anyone can read messages" ON public.chat_messages
  FOR SELECT USING (true);

-- Insert for any user (anonymous or authed) – we'll pass a UUID from the app
DROP POLICY IF EXISTS "Anyone can insert messages" ON public.chat_messages;
CREATE POLICY "Anyone can insert messages" ON public.chat_messages
  FOR INSERT WITH CHECK (true);

-- Update existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.chat_messages;

-- Grant permissions
GRANT SELECT, INSERT ON public.chat_messages TO anon, authenticated;

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'chat_messages'
ORDER BY ordinal_position;
