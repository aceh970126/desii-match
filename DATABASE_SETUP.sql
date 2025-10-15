-- ============================================================================
-- COMPLETE FROM-SCRATCH SUPABASE SETUP FOR DESIIMATCH
-- ============================================================================
-- Run this script in your Supabase SQL Editor.
-- WARNING: This script DROPS and recreates tables. Back up data first.
-- ============================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- Extensions
-- --------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- for gen_random_uuid()

-- --------------------------------------------------------------------------
-- PROFILES (per-profile identity; supports family accounts)
-- --------------------------------------------------------------------------
DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  gender TEXT,
  age INTEGER,
  bio TEXT,
  avatar TEXT,
  interests TEXT[],
  account_type TEXT NOT NULL DEFAULT 'individual', -- 'individual' | 'family'
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure only one active profile per auth user
CREATE UNIQUE INDEX profiles_one_active_per_user
ON profiles(user_id)
WHERE is_active = true;

-- Helpful indexes
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_created_at ON profiles(created_at DESC);

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_set_updated_at ON profiles;
CREATE TRIGGER trg_profiles_set_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;

CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own profile"
ON profiles FOR DELETE
USING (user_id = auth.uid());

-- --------------------------------------------------------------------------
-- USER PRESENCE (online/offline per profile)
-- --------------------------------------------------------------------------
DROP TABLE IF EXISTS user_presence CASCADE;

CREATE TABLE user_presence (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_presence_online ON user_presence(online);
CREATE INDEX idx_user_presence_last_seen ON user_presence(last_seen DESC);

ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view presence" ON user_presence;
DROP POLICY IF EXISTS "Users can update their own presence" ON user_presence;
DROP POLICY IF EXISTS "Users can insert their own presence" ON user_presence;
DROP POLICY IF EXISTS "Users can delete their own presence" ON user_presence;

CREATE POLICY "Anyone can view presence"
ON user_presence FOR SELECT
USING (true);

CREATE POLICY "Users can update their own presence"
ON user_presence FOR UPDATE
USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
WITH CHECK (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own presence"
ON user_presence FOR INSERT
WITH CHECK (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own presence"
ON user_presence FOR DELETE
USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- --------------------------------------------------------------------------
-- CONVERSATIONS (between two profiles)
-- --------------------------------------------------------------------------
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id < user2_id)
);

CREATE INDEX idx_conversations_user1_id ON conversations(user1_id);
CREATE INDEX idx_conversations_user2_id ON conversations(user2_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON conversations;

CREATE POLICY "Users can view their own conversations"
ON conversations FOR SELECT
USING (
  user1_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR
  user2_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create conversations"
ON conversations FOR INSERT
WITH CHECK (
  user1_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR
  user2_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can delete their own conversations"
ON conversations FOR DELETE
USING (
  user1_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR
  user2_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- --------------------------------------------------------------------------
-- MESSAGES (per conversation)
-- --------------------------------------------------------------------------
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_read ON messages(read);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can mark messages as read" ON messages;

CREATE POLICY "Users can view messages in their conversations"
ON messages FOR SELECT
USING (
  conversation_id IN (
    SELECT id FROM conversations
    WHERE user1_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
       OR user2_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Users can send messages"
ON messages FOR INSERT
WITH CHECK (
  sender_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  AND
  conversation_id IN (
    SELECT id FROM conversations
    WHERE user1_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
       OR user2_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Users can update their own messages"
ON messages FOR UPDATE
USING (sender_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
WITH CHECK (sender_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can mark messages as read"
ON messages FOR UPDATE
USING (
  conversation_id IN (
    SELECT id FROM conversations
    WHERE user1_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
       OR user2_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

-- Keep conversations.updated_at fresh
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_conversation_timestamp_trigger ON messages;
CREATE TRIGGER update_conversation_timestamp_trigger
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();

-- --------------------------------------------------------------------------
-- LIKES
-- --------------------------------------------------------------------------
DROP TABLE IF EXISTS likes CASCADE;

CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  liked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(liker_id, liked_id)
);

CREATE INDEX idx_likes_liker_id ON likes(liker_id);
CREATE INDEX idx_likes_liked_id ON likes(liked_id);
CREATE INDEX idx_likes_created_at ON likes(created_at);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can like others" ON likes;
DROP POLICY IF EXISTS "Users can view their own likes" ON likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON likes;

CREATE POLICY "Users can like others"
ON likes FOR INSERT
WITH CHECK (
  liker_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view their own likes"
ON likes FOR SELECT
USING (
  liker_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can delete their own likes"
ON likes FOR DELETE
USING (
  liker_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- --------------------------------------------------------------------------
-- DISLIKES
-- --------------------------------------------------------------------------
DROP TABLE IF EXISTS dislikes CASCADE;

CREATE TABLE dislikes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  disliked_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, disliked_user_id)
);

CREATE INDEX idx_dislikes_user_id ON dislikes(user_id);
CREATE INDEX idx_dislikes_disliked_user_id ON dislikes(disliked_user_id);
CREATE INDEX idx_dislikes_created_at ON dislikes(created_at);

ALTER TABLE dislikes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can dislike others" ON dislikes;
DROP POLICY IF EXISTS "Users can view their own dislikes" ON dislikes;
DROP POLICY IF EXISTS "Users can delete their own dislikes" ON dislikes;

CREATE POLICY "Users can dislike others"
ON dislikes FOR INSERT
WITH CHECK (
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view their own dislikes"
ON dislikes FOR SELECT
USING (
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can delete their own dislikes"
ON dislikes FOR DELETE
USING (
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- --------------------------------------------------------------------------
-- DONE
-- --------------------------------------------------------------------------
COMMIT;

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
-- Summary:
-- ✅ Profiles: multiple profiles per user (family accounts), single active enforced
-- ✅ Presence: per-profile presence with open read policy
-- ✅ Conversations/Messages: per-profile chat with updated timestamps
-- ✅ Likes/Dislikes: per-profile matching and filtering
-- ✅ RLS: policies scoped via auth.uid() → profiles.id mapping
-- ============================================================================
