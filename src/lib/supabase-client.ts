import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

let publicClient: SupabaseClient | null = null

/**
 * Gets or creates a singleton Supabase public client (using publishable key)
 * This client respects Row Level Security (RLS) and is safe for client-side use
 */
export function getSupabasePublicClient(): SupabaseClient {
  if (publicClient) {
    return publicClient
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are set.'
    )
  }

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
 * Resets the singleton instance (useful for testing)
 * @internal
 */
export function resetSupabaseClients(): void {
  publicClient = null
}

export type { SupabaseClient } from '@supabase/supabase-js'
