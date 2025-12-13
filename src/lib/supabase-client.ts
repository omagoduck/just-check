import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

// Singleton instances for connection pooling
let adminClient: SupabaseClient | null = null
let publicClient: SupabaseClient | null = null

/**
 * Configuration for Supabase client connection pooling
 */
interface SupabaseClientConfig {
  url: string
  key: string
  options?: {
    auth?: {
      autoRefreshToken?: boolean
      persistSession?: boolean
    }
    global?: {
      headers?: Record<string, string>
    }
  }
}

/**
 * Gets or creates a singleton Supabase admin client (using service role key)
 * This client bypasses Row Level Security (RLS) and should only be used server-side
 * 
 * @returns SupabaseClient instance with admin privileges
 * @throws Error if environment variables are not configured
 */
export function getSupabaseAdminClient(): SupabaseClient {
  if (adminClient) {
    return adminClient
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'
    )
  }

  // Create client with optimized settings for server-side use
  adminClient = createClient(url, key, {
    auth: {
      autoRefreshToken: false, // No need to refresh tokens server-side
      persistSession: false,   // No need to persist sessions server-side
    },
    global: {
      headers: {
        'X-Client-Info': 'lumy-app-server',
      },
    },
  })

  return adminClient
}

/**
 * Gets or creates a singleton Supabase public client (using anon key)
 * This client respects Row Level Security (RLS) and can be used client-side
 * 
 * @returns SupabaseClient instance with public privileges
 * @throws Error if environment variables are not configured
 */
export function getSupabasePublicClient(): SupabaseClient {
  if (publicClient) {
    return publicClient
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
    )
  }

  // Create client with settings optimized for public use
  publicClient = createClient(url, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
    global: {
      headers: {
        'X-Client-Info': 'lumy-app-public',
      },
    },
  })

  return publicClient
}

/**
 * Creates a new Supabase client instance (for special cases where singleton is not appropriate)
 * Use this sparingly - most use cases should use the singleton methods above
 * 
 * @param config - Configuration for the client
 * @returns New SupabaseClient instance
 */
export function createSupabaseClient(config: SupabaseClientConfig): SupabaseClient {
  return createClient(config.url, config.key, config.options)
}

/**
 * Resets the singleton instances (useful for testing)
 * @internal
 */
export function resetSupabaseClients(): void {
  adminClient = null
  publicClient = null
}

// Export types for convenience
export type { SupabaseClient } from '@supabase/supabase-js'