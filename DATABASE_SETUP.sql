-- ============================================================================
-- COMPLETE DATABASE SETUP FOR TOGETHER APP
-- ============================================================================
-- This is the complete, consolidated migration script for setting up the
-- Together App database with support for both individual and family accounts.
--
-- Run this script in your Supabase SQL Editor.
--
-- IMPORTANT: This script will DROP and recreate tables. Back up your data first!
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: PROFILES TABLE SETUP
-- ============================================================================

-- Drop parent_user_id column if it exists (old schema)
ALTER TABLE profiles DROP COLUMN IF EXISTS parent_user_id CASCADE;

-- Drop UNIQUE constraint on user_id to allow multiple profiles per user
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_key;

-- Ensure account_type column exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'account_type'
  ) THEN
    ALTER TABLE profiles ADD COLUMN account_type TEXT;
  END IF;
END $$;

-- Ensure is_active column exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_active BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Set default values for existing profiles
UPDATE profiles
SET account_type = 'individual'
WHERE account_type IS NULL;

-- Set the first profile for each user_id to active
UPDATE profiles p1
SET is_active = true
WHERE id = (
  SELECT id
  FROM profiles p2
  WHERE p2.user_id = p1.user_id
  ORDER BY created_at ASC
  LIMIT 1
);

-- Make columns NOT NULL
ALTER TABLE profiles ALTER COLUMN account_type SET NOT NULL;
ALTER TABLE profiles ALTER COLUMN is_active SET NOT NULL;
ALTER TABLE profiles ALTER COLUMN is_active SET DEFAULT false;

-- Update RLS policies for profiles
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

-- ============================================================================
-- STEP 2: USER PRESENCE TABLE SETUP
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view presence" ON user_presence;
DROP POLICY IF EXISTS "Anyone can view presence" ON user_presence;
DROP POLICY IF EXISTS "Users can update their own presence" ON user_presence;
DROP POLICY IF EXISTS "Users can insert their own presence" ON user_presence;
DROP POLICY IF EXISTS "Users can delete their own presence" ON user_presence;

-- Drop and recreate table
DROP TABLE IF EXISTS user_presence CASCADE;

CREATE TABLE user_presence (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  online BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_user_presence_online ON user_presence(online);
CREATE INDEX idx_user_presence_last_seen ON user_presence(last_seen DESC);

-- Enable RLS
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

-- ============================================================================
-- STEP 3: CONVERSATIONS TABLE SETUP
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON conversations;

-- Drop and recreate table
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id < user2_id)
);

-- Create indexes
CREATE INDEX idx_conversations_user1_id ON conversations(user1_id);
CREATE INDEX idx_conversations_user2_id ON conversations(user2_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

-- ============================================================================
-- STEP 4: MESSAGES TABLE SETUP
-- ============================================================================

CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_read ON messages(read);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

-- Create trigger to update conversation timestamp
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

-- ============================================================================
-- STEP 5: LIKES TABLE SETUP
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can like others" ON likes;
DROP POLICY IF EXISTS "Users can view their own likes" ON likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON likes;

-- Drop and recreate table
DROP TABLE IF EXISTS likes CASCADE;

CREATE TABLE likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  liker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  liked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(liker_id, liked_id)
);

-- Create indexes
CREATE INDEX idx_likes_liker_id ON likes(liker_id);
CREATE INDEX idx_likes_liked_id ON likes(liked_id);
CREATE INDEX idx_likes_created_at ON likes(created_at);

-- Enable RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

-- ============================================================================
-- STEP 6: DISLIKES TABLE SETUP
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can dislike others" ON dislikes;
DROP POLICY IF EXISTS "Users can view their own dislikes" ON dislikes;
DROP POLICY IF EXISTS "Users can delete their own dislikes" ON dislikes;

-- Drop and recreate table
DROP TABLE IF EXISTS dislikes CASCADE;

CREATE TABLE dislikes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  disliked_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, disliked_user_id)
);

-- Create indexes
CREATE INDEX idx_dislikes_user_id ON dislikes(user_id);
CREATE INDEX idx_dislikes_disliked_user_id ON dislikes(disliked_user_id);
CREATE INDEX idx_dislikes_created_at ON dislikes(created_at);

-- Enable RLS
ALTER TABLE dislikes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

-- ============================================================================
-- STEP 7: CLEANUP OLD FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS generate_uuid() CASCADE;
DROP FUNCTION IF EXISTS activate_profile(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_active_profile_id(UUID) CASCADE;

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- ✅ Profiles: Multiple profiles per user (family accounts support)
-- ✅ User Presence: Uses profile IDs for online/offline status
-- ✅ Conversations: Uses profile IDs for messaging
-- ✅ Messages: Uses profile IDs with read receipts
-- ✅ Likes: Uses profile IDs for matching
-- ✅ Dislikes: Uses profile IDs for filtering
-- ✅ RLS Policies: Updated to work with profile-based architecture
-- ============================================================================

-- HOW IT WORKS:
-- Individual Accounts: 1 profile with user_id = auth.uid()
-- Family Accounts: Multiple profiles with same user_id = auth.uid()
-- Active Profile: Only one profile per user has is_active = true
-- All features (likes, messages, etc.) use profile.id not user_id
-- ============================================================================

