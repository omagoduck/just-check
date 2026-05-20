-- ============================================================================
-- APP CONFIG & FREE TIER KILL SWITCH
-- Version: 015
-- Created: 2026-05-17
-- ============================================================================

-- Kill switch config table for feature flags
CREATE TABLE IF NOT EXISTS public.app_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Seed the free tier kill switch (OFF by default)
INSERT INTO public.app_config (key, value) VALUES
    ('free_tier_enabled', '{"enabled": false}');

-- Auto-update trigger
DROP TRIGGER IF EXISTS update_app_config_updated_at ON public.app_config;
CREATE TRIGGER update_app_config_updated_at
    BEFORE UPDATE ON public.app_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
