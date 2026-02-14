import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdminClient } from '@/lib/supabase-client';
import { clerkClient } from '@/lib/clerk/clerk-client';
import { UpdateProfileRequest } from '@/types/profile';
import { splitFullName } from '@/lib/clerk/utils';
import { validateAge } from '@/lib/age-validation';

/**
 * Profile API Route
 * Handles GET and PATCH requests for user profile management.
 * Integrates with both Supabase (primary profile storage) and Clerk (authentication/user data).
 */

/**
 * GET /api/profile
 * Fetches the current user's profile from Supabase.
 * Returns null if no profile exists (user hasn't created one yet).
 */
export async function GET() {
  try {
    // Get authenticated user ID from Clerk
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdminClient();

    // Query the profiles table for the current user
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (fetchError) {
      // PGRST116 is PostgREST's "no rows returned" error
      // This is expected for new users who haven't created a profile yet
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ profile: null });
      }
      console.error('Error fetching profile:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error in GET /api/profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/profile
 * Updates the current user's profile in both Supabase and Clerk.
 * Only updates the fields that are provided in the request body.
 * Also syncs name and avatar changes to Clerk for consistency.
 */
export async function PATCH(req: Request) {
  try {
    // Get authenticated user ID from Clerk
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body: UpdateProfileRequest = await req.json();
    const { full_name, nickname, date_of_birth, avatar_url } = body;

    // Ensure at least one field is being updated
    if (full_name === undefined && nickname === undefined && date_of_birth === undefined && avatar_url === undefined) {
      return NextResponse.json(
        { error: 'At least one field must be provided for update' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Build update object with only the fields that were provided
    // This prevents overwriting existing data with undefined values
    const updateData: any = {};
    if (full_name !== undefined) {
      const trimmed = full_name.trim();
      // Validate full name length (minimum 2, maximum 100 characters)
      if (trimmed.length < 2 || trimmed.length > 100) {
        return NextResponse.json(
          { error: 'Full name must be between 2 and 100 characters' },
          { status: 400 }
        );
      }
      // Validate full name has at least 2 words (for splitting into first/last)
      const nameParts = trimmed.split(/\s+/);
      if (nameParts.length < 2) {
        return NextResponse.json(
          { error: 'Full name must contain at least 2 words (first name and last name)' },
          { status: 400 }
        );
      }
      updateData.full_name = trimmed;
    }
    if (nickname !== undefined) {
      const trimmed = nickname.trim();
      // Validate nickname length (minimum 2, maximum 50 characters)
      if (trimmed.length < 2 || trimmed.length > 50) {
        return NextResponse.json(
          { error: 'Nickname must be between 2 and 50 characters' },
          { status: 400 }
        );
      }
      // Sanitize: remove potential HTML/script tags to prevent XSS
      const sanitized = trimmed.replace(/<[^>]*>/g, '');
      if (sanitized.length !== trimmed.length) {
        return NextResponse.json(
          { error: 'Nickname contains invalid characters' },
          { status: 400 }
        );
      }
      updateData.nickname = sanitized;
    }
    if (date_of_birth !== undefined) {
      // Use existing validateAge function from age-validation library
      const ageValidation = validateAge(date_of_birth, 13, 150);
      if (!ageValidation.isValid) {
        return NextResponse.json(
          { error: ageValidation.error || 'Invalid date of birth' },
          { status: 400 }
        );
      }
      updateData.date_of_birth = date_of_birth;
    }
    if (avatar_url !== undefined) {
      // Validate avatar_url is a valid URL format
      try {
        const url = new URL(avatar_url);
        if (!['http:', 'https:'].includes(url.protocol)) {
          return NextResponse.json(
            { error: 'Avatar URL must be a valid HTTP or HTTPS URL' },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: 'Avatar URL must be a valid URL' },
          { status: 400 }
        );
      }
      updateData.avatar_url = avatar_url;
    }

    // Update the profile in Supabase
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('clerk_user_id', clerkUserId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    // Sync relevant changes to Clerk to keep authentication user data consistent
    // We sync name and avatar because these are displayed in Clerk's UI and email templates
    const clerkUpdates: any = {};
    if (full_name !== undefined) {
      // Split full name into first and last name for better OAuth compatibility
      // First word = firstName, rest = lastName
      const splitName = splitFullName(full_name.trim());
      if (splitName) {
        clerkUpdates.firstName = splitName.firstName;
        clerkUpdates.lastName = splitName.lastName;
      } else {
        // Fallback: if somehow validation passed but split fails, use full name as firstName
        clerkUpdates.firstName = full_name.trim();
        clerkUpdates.lastName = '';
      }
    }
    if (avatar_url !== undefined) {
      clerkUpdates.imageUrl = avatar_url;
    }

    // Only call Clerk API if there are updates to sync
    if (Object.keys(clerkUpdates).length > 0) {
      try {
        // Use centralized clerk client
        await clerkClient.users.updateUser(clerkUserId, clerkUpdates);
      } catch (clerkError) {
        console.error('Error updating Clerk user:', clerkError);
        // Don't fail the request - profile is already updated in Supabase
        // Log the error for debugging but continue with success response
      }
    }

    return NextResponse.json({ profile: updatedProfile });
  } catch (error) {
    console.error('Error in PATCH /api/profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
