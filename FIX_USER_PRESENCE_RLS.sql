-- ============================================================================
-- FIX USER PRESENCE RLS POLICIES
-- ============================================================================
-- This script fixes the RLS policies for the user_presence table to work
-- with profile IDs instead of auth.uid() directly.
--
-- Run this in your Supabase SQL Editor.
-- ============================================================================

BEGIN;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view presence" ON user_presence;
DROP POLICY IF EXISTS "Anyone can view presence" ON user_presence;
DROP POLICY IF EXISTS "Users can update their own presence" ON user_presence;
DROP POLICY IF EXISTS "Users can insert their own presence" ON user_presence;
DROP POLICY IF EXISTS "Users can delete their own presence" ON user_presence;

-- Create new RLS policies that work with profile IDs
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

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this to verify the policies were created:
-- 
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'user_presence';
-- ============================================================================

