-- Add display_name to chat_messages for better UX
-- This avoids needing to join with profiles table on every query

ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_display_name
  ON public.chat_messages(display_name);

-- Update the insert policy to allow setting display_name
DROP POLICY IF EXISTS "chat_messages_insert" ON public.chat_messages;

CREATE POLICY "chat_messages_insert" ON public.chat_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Comment for clarity
COMMENT ON COLUMN public.chat_messages.display_name IS 'User display name for chat UI (denormalized from profiles)';
