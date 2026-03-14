import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getRemainingAllowance } from '@/lib/allowance';
import { uploadFileToStorage, recordFileUpload, deleteFileFromStorage } from '@/lib/storage/file-storage-service';
import { validateFiles, SUPPORTED_FILE_TYPES } from '@/lib/storage/file-validation';
import { uploadRatelimit } from '@/lib/ratelimit';

export async function POST(req: NextRequest) {
  try {
    // Authenticate
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit uploads
    const { success } = await uploadRatelimit.limit(clerkUserId);
    if (!success) {
      return NextResponse.json({ error: 'Too many uploads. Please wait a moment.' }, { status: 429 });
    }

    // Check allowance before creating conversation
    const remainingAllowance = await getRemainingAllowance(clerkUserId);
    if (remainingAllowance <= 0) {
      return NextResponse.json({ error: 'Insufficient allowance' }, { status: 402 });
    }

    // Parse form data
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files.length) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
    const MAX_FILES = 5;

    // Validate all files upfront
    const validation = await validateFiles(files, {
      maxSize: MAX_SIZE,
      maxFiles: MAX_FILES,
      allowedTypes: SUPPORTED_FILE_TYPES,
    });

    if (validation.errors.length > 0) {
      return NextResponse.json(
        {
          error: `${validation.errors.length} file(s) failed validation`,
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    const validFiles = validation.validFiles;

    // Upload all files in parallel
    const uploadPromises = validFiles.map(async (file) => {
      let storagePath;
      try {
        storagePath = await uploadFileToStorage(clerkUserId, file);
        const uploadedFile = await recordFileUpload(
          clerkUserId,
          storagePath,
          file
        );

        return {
          id: uploadedFile.id,
          attachmentUrl: `attachment://${uploadedFile.id}`,
          originalName: uploadedFile.original_filename,
          mimeType: uploadedFile.mime_type,
        };
      } catch (uploadError) {
        // Cleanup any uploaded file if DB record fails
        if (storagePath) {
          await deleteFileFromStorage(storagePath).catch(console.error);
        }
        console.error(`Upload failed for ${file.name}:`, uploadError);
        return null;
      }
    });

    const uploadResults = await Promise.allSettled(uploadPromises);

    const results: Array<{ id: string; attachmentUrl: string; originalName: string; mimeType: string }> = [];
    for (const result of uploadResults) {
      if (result.status === 'fulfilled' && result.value !== null) {
        results.push(result.value);
      }
    }

    // If no valid files but we had validFiles, return error
    if (results.length === 0 && validFiles.length > 0) {
      return NextResponse.json(
        { error: 'All file uploads failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({ files: results });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
