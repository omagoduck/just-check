import { createClerkClient } from '@clerk/nextjs/server'

/**
 * Centralized Clerk client instance for server-side operations.
 * Uses the secret key from environment variables.
 * 
 * Use this instead of creating new ClerkClient instances in every route.
 */

// Validate required environment variable at startup
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
if (!CLERK_SECRET_KEY) {
  throw new Error('CLERK_SECRET_KEY environment variable is required');
}

export const clerkClient = createClerkClient({
  secretKey: CLERK_SECRET_KEY
})

// Re-export types and functions as needed
export { clerkClient as default }
