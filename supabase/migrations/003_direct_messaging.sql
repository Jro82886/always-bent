-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Direct message conversations table
CREATE TABLE dm_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant1_id TEXT NOT NULL,
  participant1_username TEXT NOT NULL,
  participant2_id TEXT NOT NULL,
  participant2_username TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_preview TEXT,
  -- Ensure unique conversation between two users
  CONSTRAINT unique_conversation UNIQUE (
    LEAST(participant1_id, participant2_id),
    GREATEST(participant1_id, participant2_id)
  )
);

-- Direct messages table
CREATE TABLE dm_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES dm_conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_username TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- Unread counts view for quick badge display
CREATE TABLE dm_unread_counts (
  user_id TEXT PRIMARY KEY,
  unread_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_dm_conversations_participant1 ON dm_conversations(participant1_id);
CREATE INDEX idx_dm_conversations_participant2 ON dm_conversations(participant2_id);
CREATE INDEX idx_dm_conversations_last_message ON dm_conversations(last_message_at DESC);
CREATE INDEX idx_dm_messages_conversation ON dm_messages(conversation_id);
CREATE INDEX idx_dm_messages_created ON dm_messages(created_at DESC);
CREATE INDEX idx_dm_messages_expires ON dm_messages(expires_at);

-- Function to auto-update conversation last_message_at
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE dm_conversations
  SET 
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.content, 50)
  WHERE id = NEW.conversation_id;
  
  -- Update unread count for recipient
  INSERT INTO dm_unread_counts (user_id, unread_count, updated_at)
  VALUES (
    CASE 
      WHEN NEW.sender_id = (SELECT participant1_id FROM dm_conversations WHERE id = NEW.conversation_id)
      THEN (SELECT participant2_id FROM dm_conversations WHERE id = NEW.conversation_id)
      ELSE (SELECT participant1_id FROM dm_conversations WHERE id = NEW.conversation_id)
    END,
    1,
    NOW()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    unread_count = dm_unread_counts.unread_count + 1,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation
AFTER INSERT ON dm_messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_last_message();

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_read(
  p_conversation_id UUID,
  p_user_id TEXT
)
RETURNS void AS $$
BEGIN
  UPDATE dm_messages
  SET read_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND read_at IS NULL;
    
  -- Reset unread count
  UPDATE dm_unread_counts
  SET unread_count = 0, updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Auto-delete expired messages (run periodically)
CREATE OR REPLACE FUNCTION delete_expired_messages()
RETURNS void AS $$
BEGIN
  DELETE FROM dm_messages
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;