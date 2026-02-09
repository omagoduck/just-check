-- ============================================================================
-- SUBSCRIPTION SYSTEM SETUP
-- Lumy Alpha - DODO Payments, Allowance Tracking & Webhook System
-- Version: 006
-- Created: 2026-02-02
-- ============================================================================

-- ============================================================================
-- USER SUBSCRIPTIONS TABLE
-- Stores DODO subscription data for each user
-- ============================================================================

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id TEXT NOT NULL,
    dodo_subscription_id TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'inactive',
    plan_type TEXT NOT NULL DEFAULT 'free',
    billing_period TEXT,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    payment_status TEXT DEFAULT 'unpaid',
    amount INTEGER,
    currency TEXT DEFAULT 'USD',
    dodo_customer_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Performance indexes for user_subscriptions
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_clerk_user_id 
    ON public.user_subscriptions(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_dodo_subscription_id 
    ON public.user_subscriptions(dodo_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status 
    ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_type 
    ON public.user_subscriptions(plan_type);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_current_period_end 
    ON public.user_subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_active_subscriptions 
    ON public.user_subscriptions(clerk_user_id, status);

-- Auto-update updated_at trigger for user_subscriptions
DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON public.user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Disable RLS (consistent with other tables)
ALTER TABLE public.user_subscriptions DISABLE ROW LEVEL SECURITY;

-- Enable real-time for future use
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_subscriptions;

-- ============================================================================
-- PERIODIC ALLOWANCE TABLE
-- Tracks token/message usage allowance per user per billing period
-- ============================================================================

-- Create periodic_allowance table
-- clerk_user_id is the PRIMARY KEY to ensure one row per user
CREATE TABLE IF NOT EXISTS public.periodic_allowance (
    clerk_user_id TEXT PRIMARY KEY,
    alloted_allowance INTEGER NOT NULL DEFAULT 0,
    remaining_allowance INTEGER NOT NULL DEFAULT 0,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    last_reset_at TIMESTAMP WITH TIME ZONE,
    rolledover_amount INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Performance indexes for periodic_allowance
CREATE INDEX IF NOT EXISTS idx_periodic_allowance_period_end 
    ON public.periodic_allowance(period_end);
CREATE INDEX IF NOT EXISTS idx_active_allowances 
    ON public.periodic_allowance(clerk_user_id, period_end);

-- Auto-update updated_at trigger for periodic_allowance
DROP TRIGGER IF EXISTS update_periodic_allowance_updated_at ON public.periodic_allowance;
CREATE TRIGGER update_periodic_allowance_updated_at
    BEFORE UPDATE ON public.periodic_allowance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Disable RLS (consistent with other tables)
ALTER TABLE public.periodic_allowance DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- WEBHOOK EVENT LOG TABLE
-- Logs all DODO webhook events for debugging and auditing
-- ============================================================================

-- Create webhook_event_log table
CREATE TABLE IF NOT EXISTS public.webhook_event_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,
    event_type TEXT NOT NULL,
    provider_event_id TEXT,
    payload JSONB NOT NULL DEFAULT '{}',
    processed BOOLEAN DEFAULT FALSE,
    processing_details JSONB DEFAULT '{}',
    http_status INTEGER,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Performance indexes for webhook_event_log
CREATE INDEX IF NOT EXISTS idx_webhook_event_provider_event_id 
    ON public.webhook_event_log(provider_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_event_provider 
    ON public.webhook_event_log(provider);
CREATE INDEX IF NOT EXISTS idx_webhook_event_event_type 
    ON public.webhook_event_log(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_event_processed 
    ON public.webhook_event_log(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_event_received_at 
    ON public.webhook_event_log(received_at);

-- Disable RLS (consistent with other tables)
ALTER TABLE public.webhook_event_log DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DODO CUSTOMER MAPPING TABLE
-- Links Clerk users to DODO customers for subscription tracking
-- ============================================================================

-- Create dodo_customer_mapping table
CREATE TABLE IF NOT EXISTS public.dodo_customer_mapping (
    clerk_user_id TEXT PRIMARY KEY,
    dodo_customer_id TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Performance indexes for dodo_customer_mapping
CREATE INDEX IF NOT EXISTS idx_dodo_customer_mapping_dodo_customer_id 
    ON public.dodo_customer_mapping(dodo_customer_id);

-- Auto-update updated_at trigger for dodo_customer_mapping
DROP TRIGGER IF EXISTS update_dodo_customer_mapping_updated_at ON public.dodo_customer_mapping;
CREATE TRIGGER update_dodo_customer_mapping_updated_at
    BEFORE UPDATE ON public.dodo_customer_mapping
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Disable RLS (consistent with other tables)
ALTER TABLE public.dodo_customer_mapping DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SETUP COMPLETE!
-- 
-- Tables created:
-- 1. user_subscriptions - Tracks DODO payment subscriptions
-- 2. periodic_allowance - Tracks token/message usage allowance per user
-- 3. webhook_event_log - Logs all DODO webhook events
-- 4. dodo_customer_mapping - Links Clerk users to DODO customers
--
-- Next steps:
-- 1. Run this script in Supabase SQL Editor
-- 2. Set up DODO webhook endpoint to sync subscription data
-- 3. Implement subscription validation in your API routes
--
-- Notes:
-- - periodic_allowance.clerk_user_id is PRIMARY KEY = only ONE row per user
-- - webhook_event_log helps debug and retry failed webhook processing
-- - dodo_customer_mapping enables customer-based checkout flow
-- ============================================================================
