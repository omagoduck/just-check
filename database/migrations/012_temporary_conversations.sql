-- ============================================================================
-- TEMPORARY CONVERSATIONS (INCOGNITO CHAT)
-- Lumy Alpha
-- Version: 012
-- Created: 2026-04-03
-- ============================================================================

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS is_temporary BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_conversations_temporary_cleanup
  ON public.conversations(clerk_user_id, is_temporary, updated_at)
  WHERE is_temporary = TRUE;

-- ============================================================================
-- DAILY CLEANUP JOB
-- ============================================================================
-- Runs daily at 03:00 UTC to permanently delete temporary conversations
-- older than 30 days.

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'cleanup_expired_temporary_conversations',
  '0 3 * * *',
  $$
    DELETE FROM public.conversations
    WHERE is_temporary = TRUE
      AND updated_at < (NOW() - INTERVAL '30 days');
  $$
);
