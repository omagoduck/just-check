import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { NextRequest } from 'next/server'
import { createClerkClient } from '@clerk/nextjs/server'
import { getSupabaseAdminClient } from '@/lib/supabase-client'

// TODO: This file was a important piece missing in this codebase for a longtime, though it didn't catch our eye, cause it never cause build error, and we are not in production yet.
// Now we have copy pasted it here from our old codebase for critical fix. But this needs a super clear review later.

// Webhook endpoint to handle Clerk user events (user.created, user.updated, user.deleted)
// This ensures Clerk metadata stays synchronized with your application state
//
// IMPORTANT: This webhook sets publicMetadata that will appear in session tokens
// Configure the _session template in Clerk Dashboard to include: 
// { "publicMetadata": { "profileComplete": "{{user.public_metadata.profileComplete}}" } }
export async function POST(req: NextRequest) {
  console.log('🔔 WEBHOOK RECEIVED - Starting processing...')
  
  try {
    // ✅ CORRECT: Use Clerk's built-in verifyWebhook helper for security
    // This validates the webhook signature to prevent malicious requests
    const evt = await verifyWebhook(req)

    console.log('✅ Webhook verified successfully')
    console.log('📋 Event type:', evt.type)

    const eventType = evt.type

    // ✅ PROPER TYPE CHECKING: Handle different event types appropriately
    if (eventType === 'user.created' || eventType === 'user.updated') {
      const userData = evt.data as any // Clerk User type
      const { 
        id: clerkUserId, 
        email_addresses, 
        first_name, 
        last_name, 
        image_url 
      } = userData

      if (!clerkUserId || !email_addresses?.[0]?.email_address) {
        console.error('Missing required user data:', { clerkUserId, email_addresses })
        return new Response('Missing required user data', { status: 400 })
      }

      console.log('👤 User ID:', clerkUserId)
      console.log('📧 Email:', email_addresses[0].email_address)

      const supabase = getSupabaseAdminClient()

      // Handle new user registration
      // Creates database record and sets initial completion status
      if (eventType === 'user.created') {
        const email = email_addresses[0].email_address
        
        console.log('🗃️ Creating profile in Supabase...')
        console.log('📊 Profile data to insert:', {
          clerk_user_id: clerkUserId,
          email: email,
          full_name: `${first_name || ''} ${last_name || ''}`.trim() || null,
          nickname: null,                    // Will be filled during onboarding
          date_of_birth: null,               // Will be filled during onboarding  
          avatar_url: image_url || null,     // From OAuth provider (Google, etc.)
        })
        
        // Create user profile in your database
        const { error: profileError, data: insertedProfile } = await supabase
          .from('profiles')
          .insert({
            clerk_user_id: clerkUserId,
            email: email,
            full_name: `${first_name || ''} ${last_name || ''}`.trim() || null,
            nickname: null,                    // Required: set to null initially
            date_of_birth: null,               // Required: set to null initially
            avatar_url: image_url || null,     // Optional: from OAuth provider
          })
          .select()

        if (profileError) {
          console.error('🚨 ERROR: Profile creation failed:', profileError)
          console.error('🚨 ERROR DETAILS:', {
            code: profileError.code,
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint
          })
          return new Response('Error creating profile', { status: 500 })
        }

        console.log('✅ Profile created successfully:', insertedProfile)
        console.log('Profile created for user:', clerkUserId)

        // 🔑 IMPORTANT: Set Clerk publicMetadata for session claims
        // This data will appear in JWT tokens and be available in middleware
        // Configure _session template in Clerk Dashboard to include:
        // { "publicMetadata": { "profileComplete": "{{user.public_metadata.profileComplete}}" } }
        const clerk = createClerkClient({
          secretKey: process.env.CLERK_SECRET_KEY!
        })
        
        // Set initial completion status to false (user needs to complete onboarding)
        await clerk.users.updateUser(clerkUserId, {
          publicMetadata: {
            profileComplete: false  // Will be set to true when onboarding is complete
          }
        })

        console.log('User metadata updated for profile completion tracking')
      }

      // Handle user updates (profile completion changes or profile edits)
      // This runs when user completes onboarding or updates their profile
      if (eventType === 'user.updated') {
        console.log('🔄 Processing user.updated event for:', clerkUserId)
        
        // Check current profile completion status in your database
        console.log('🔍 Checking profile completion status...')
        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('full_name, nickname, date_of_birth')
          .eq('clerk_user_id', clerkUserId)
          .single()

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('🚨 ERROR: Error fetching profile:', fetchError)
          return new Response('Error fetching profile', { status: 500 })
        }

        // Calculate if profile is complete based on required fields
        // Profile is complete when ALL required fields are filled
        const isComplete = !!(
          profile?.full_name &&     // Required: User's full name
          profile?.nickname &&      // Required: Short display name
          profile?.date_of_birth    // Required: For age verification
        )
        
        console.log('📊 Profile completion check:', {
          full_name: !!profile?.full_name,
          nickname: !!profile?.nickname,
          date_of_birth: !!profile?.date_of_birth,
          isComplete  // true = all fields filled, false = still missing required data
        })

        // Update Clerk publicMetadata to match database state
        // This ensures session tokens have accurate completion status
        console.log('🔧 Updating Clerk metadata...')
        const clerk = createClerkClient({
          secretKey: process.env.CLERK_SECRET_KEY!
        })
        await clerk.users.updateUser(clerkUserId, {
          publicMetadata: {
            profileComplete: isComplete  // This appears in sessionClaims via _session template
          }
        })

        console.log('✅ User metadata updated successfully:', { isComplete, clerkUserId })
        console.log('User metadata updated:', { isComplete, clerkUserId })
      }
    }

    // Handle user account deletion
    if (eventType === 'user.deleted') {
      const userData = evt.data as any
      const { id: clerkUserId } = userData

      if (!clerkUserId) {
        console.error('Missing user ID for deletion')
        return new Response('Missing user ID', { status: 400 })
      }

      const supabase = getSupabaseAdminClient()
      
      // Soft delete the profile (don't permanently remove data)
      const { error: deleteError } = await supabase
        .from('profiles')
        .update({ 
          deleted_at: new Date().toISOString()  // Soft delete: mark as deleted but keep record
        })
        .eq('clerk_user_id', clerkUserId)

      if (deleteError) {
        console.error('Error soft deleting profile:', deleteError)
        return new Response('Error deleting profile', { status: 500 })
      }

      console.log('Profile soft deleted for user:', clerkUserId)
      console.log('💡 Note: Clerk user is permanently deleted, but profile data is preserved')
    }

    return new Response('Webhook processed successfully', { status: 200 })
  } catch (error) {
    console.error('🚨 ERROR: Webhook verification failed:', error)
    return new Response('Invalid webhook', { status: 400 })
  }
}