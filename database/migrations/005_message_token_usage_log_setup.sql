-- ============================================================================
-- MESSAGE TOKEN USAGE LOG SETUP
-- Lumy Alpha - Token Usage Tracking System
-- Version: 005
-- Created: 2026-01-31
-- ============================================================================

-- Create message_token_usage_log table
CREATE TABLE IF NOT EXISTS public.message_token_usage_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    token_usage JSONB NOT NULL DEFAULT '{}',
    model_info JSONB NOT NULL DEFAULT '{}',
    estimated_cost_detail JSONB NOT NULL DEFAULT '{}',
    estimated_total_cost INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_message_token_usage_log_message_id 
    ON public.message_token_usage_log(message_id);
CREATE INDEX IF NOT EXISTS idx_message_token_usage_log_created_at 
    ON public.message_token_usage_log(created_at);

-- Disable RLS (consistent with other tables)
ALTER TABLE public.message_token_usage_log DISABLE ROW LEVEL SECURITY;
