import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@/lib/clerk/clerk-client';

// For now clerk is used for profile picture storage and kinda okay
// TODO P5: Remove clerk dependency and use Supabase for profile picture storage

/**
 * Profile Avatar Upload API Route
 * Handles uploading user profile pictures directly to Clerk.
 * 
 * Clerk handles the file storage - we just pass the file and Clerk returns
 * a URL hosted on their CDN.
 * 
 * Flow:
 * 1. User selects image file
 * 2. This endpoint validates the file (type, size)
 * 3. Uploads to Clerk via updateUserProfileImage
 * 4. Returns the new image URL
 * 5. Webhook will sync the URL to Supabase on next profile access
 */

// Allowed MIME types for profile pictures
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * POST /api/profile/avatar
 * Uploads a profile picture to Clerk
 */
export async function POST(req: Request) {
  try {
    // Get authenticated user ID from Clerk
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    // Validate that a file was provided
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed types: JPEG, PNG, WebP, GIF' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB' },
        { status: 400 }
      );
    }

    // Read file into a buffer for Clerk API
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create a File object with the buffer for Clerk SDK
    // Clerk expects a File/Blob object
    const fileForClerk = new File([buffer], file.name, { type: file.type });

    // Upload to Clerk using centralized client
    console.log('📤 Uploading profile picture to Clerk for user:', clerkUserId);

    const updatedUser = await clerkClient.users.updateUserProfileImage(clerkUserId, {
      file: fileForClerk,
    });

    // Clerk returns the updated user object with the new image URL
    const imageUrl = updatedUser.imageUrl;

    console.log('✅ Profile picture uploaded to Clerk successfully');
    console.log('🖼️ New image URL:', imageUrl);

    return NextResponse.json({
      success: true,
      imageUrl,
      message: 'Profile picture uploaded successfully. It will sync to your profile on next visit.',
    });
  } catch (error) {
    console.error('❌ Error uploading profile picture:', error);

    // Handle specific Clerk errors
    if (error instanceof Error) {
      if (error.message.includes('File')) {
        return NextResponse.json(
          { error: 'Invalid file format' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to upload profile picture' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profile/avatar
 * Removes the user's profile picture
 */
export async function DELETE() {
  try {
    // Get authenticated user ID from Clerk
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Remove profile image from Clerk by passing null
    console.log('🗑️ Removing profile picture from Clerk for user:', clerkUserId);

    await clerkClient.users.updateUserProfileImage(clerkUserId, {
      file: null as any, // Passing null removes the profile image
    });

    console.log('✅ Profile picture removed from Clerk successfully');

    return NextResponse.json({
      success: true,
      message: 'Profile picture removed successfully',
    });
  } catch (error) {
    console.error('❌ Error removing profile picture:', error);
    return NextResponse.json(
      { error: 'Failed to remove profile picture' },
      { status: 500 }
    );
  }
}
