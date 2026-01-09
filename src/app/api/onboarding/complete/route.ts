import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase-client'
import { createClerkClient } from '@clerk/nextjs/server'
import { validateAge } from '@/lib/age-validation'

export async function POST(req: Request) {
  try {
    console.log('🎯 ONBOARDING COMPLETION STARTED')
    
    // Authenticate user and get current user details
    console.log('🔐 Authenticating user...')
    const { userId } = await auth()
    if (!userId) {
      console.log('🚨 AUTH FAILED: No user ID found')
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }
    
    console.log('✅ User authenticated:', userId)
    
    // Get current user to access email
    console.log('📧 Fetching user email from Clerk...')
    const currentUserData = await currentUser()
    
    if (!currentUserData) {
      console.log('🚨 ERROR: Could not fetch current user details')
      return NextResponse.json(
        { error: 'Could not fetch user details', code: 'USER_FETCH_ERROR' },
        { status: 500 }
      )
    }
    
    // Get primary email from Clerk user data
    const userEmail = currentUserData.emailAddresses?.[0]?.emailAddress ||
                     currentUserData.primaryEmailAddress?.emailAddress
    
    if (!userEmail) {
      console.log('🚨 ERROR: No email found in Clerk user data')
      console.log('🔍 Available email data:', currentUserData.emailAddresses)
      return NextResponse.json(
        { error: 'No email address found for user', code: 'NO_EMAIL' },
        { status: 400 }
      )
    }
    
    console.log('✅ User email retrieved:', userEmail)

    // Parse request body
    const body = await req.json()
    const { fullName, nickname, dateOfBirth, avatarUrl } = body

    // Validate input
    const errors: string[] = []
    if (!fullName || fullName.trim().length < 2) {
      errors.push('Full name must be at least 2 characters')
    }
    if (!nickname || nickname.trim().length < 2) {
      errors.push('Nickname must be at least 2 characters')
    }
    if (!dateOfBirth) {
      errors.push('Date of birth is required')
    } else {
      const ageValidation = validateAge(dateOfBirth, 1, 150)
      if (!ageValidation.isValid) {
        errors.push(ageValidation.error || 'Invalid date of birth')
      }
    }
    if (avatarUrl && !avatarUrl.startsWith('http')) {
      errors.push('Avatar URL must be a valid URL')
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: errors, code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabase = getSupabaseAdminClient()

    try {
      console.log('💾 Starting database operation for user:', userId)
      
      // First, check if profile exists
      console.log('🔍 Checking if profile exists...')
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id, clerk_user_id, email')
        .eq('clerk_user_id', userId)
        .single()

      console.log('👤 Profile check result:', {
        profile_exists: !!existingProfile,
        profile_id: existingProfile?.id,
        email: existingProfile?.email
      })

      let updateError
      let updatedProfile
      
      if (existingProfile) {
        // Update existing profile
        console.log('📝 Updating existing profile...')
        const result = await supabase
          .from('profiles')
          .update({
            full_name: fullName.trim(),
            nickname: nickname.trim(),
            date_of_birth: dateOfBirth,
            avatar_url: avatarUrl || null,
            updated_at: new Date().toISOString(),
          })
          .eq('clerk_user_id', userId)
          .select()
        
        updateError = result.error
        updatedProfile = result.data
        
        console.log('🔄 Profile update result:', {
          success: !updateError,
          updated_rows: updatedProfile?.length || 0
        })
      } else {
        // Create new profile with real email
        console.log('➕ Creating new profile with email:', userEmail)
        console.log('📊 Profile data to create:', {
          clerk_user_id: userId,
          email: userEmail,
          full_name: fullName.trim(),
          nickname: nickname.trim(),
          date_of_birth: dateOfBirth,
          avatar_url: avatarUrl || null,
        })
        
        const result = await supabase
          .from('profiles')
          .insert({
            clerk_user_id: userId,
            email: userEmail, // Using real email from Clerk
            full_name: fullName.trim(),
            nickname: nickname.trim(),
            date_of_birth: dateOfBirth,
            avatar_url: avatarUrl || null,
          })
          .select()
        
        updateError = result.error
        updatedProfile = result.data
        
        console.log('✨ Profile creation result:', {
          success: !updateError,
          created_profile: updatedProfile
        })
      }

      if (updateError) {
        console.error('🚨 DATABASE ERROR:', updateError)
        console.error('🚨 ERROR DETAILS:', {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint
        })
        throw updateError
      }

      console.log('✅ Profile database operation completed successfully')
      console.log('Profile updated successfully for user:', userId)

      // Update Clerk metadata to mark profile as complete
      console.log('🔧 Updating Clerk metadata...')
      const clerk = createClerkClient({
        secretKey: process.env.CLERK_SECRET_KEY!
      })

      await clerk.users.updateUser(userId, {
        publicMetadata: {
          profileComplete: true
        }
      })

      console.log('✅ Clerk metadata updated successfully for user:', userId)
      console.log('User metadata updated successfully for user:', userId)

      return NextResponse.json({
        success: true,
        message: 'Profile completed successfully',
        requiresAuthTokenRefresh: true, // Flag for frontend to force token refresh
        tokenRefreshDelay: 1500, // Recommended delay before redirect
        data: {
          fullName: fullName.trim(),
          nickname: nickname.trim(),
          dateOfBirth,
          avatarUrl: avatarUrl || null,
        }
      })

    } catch (dbError) {
      console.error('Database operation failed:', dbError)
      return NextResponse.json(
        { 
          error: 'Failed to update profile', 
          code: 'DATABASE_ERROR'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Onboarding completion error:', error)
    
    // Return user-friendly error messages
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Failed to complete profile', 
          details: error.message,
          code: 'SERVER_ERROR'
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR'
      },
      { status: 500 }
    )
  }
}

// Add GET endpoint to check profile status
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // For now, we'll just return the status from Clerk metadata
    // In a more complex system, you might also check Supabase
    return NextResponse.json({
      success: true,
      data: {
        userId,
        // This would typically come from sessionClaims, but for a GET request
        // we can't easily access that, so this is a simple response
        message: 'Profile status check - metadata will be updated on next middleware check'
      }
    })

  } catch (error) {
    console.error('Profile status check error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check profile status',
        code: 'SERVER_ERROR'
      },
      { status: 500 }
    )
  }
}