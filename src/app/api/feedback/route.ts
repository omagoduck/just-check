import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdminClient } from '@/lib/supabase-client';
import { feedbackSubmitRatelimit } from '@/lib/ratelimit';
import { uploadFeedbackFileToStorage, deleteFileFromStorage } from '@/lib/storage/file-storage-service';
import { SUPPORTED_IMAGE_MIME_TYPES, validateFiles } from '@/lib/storage/file-validation';
import { getModelProcessableMimeType } from '@/lib/storage/file-extraction';

const MAX_FEEDBACK_MESSAGE_LENGTH = 5000;
const MAX_FEEDBACK_CATEGORY_LENGTH = 100;
const MAX_FEEDBACK_IMAGES = 3;
const MAX_FEEDBACK_IMAGE_SIZE = 5 * 1024 * 1024;

function getStringFormValue(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === 'string' ? value : null;
}

function getImageFiles(formData: FormData): File[] {
  return formData
    .getAll('images')
    .filter((value): value is File => value instanceof File && value.size > 0);
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { success } = await feedbackSubmitRatelimit.limit(clerkUserId);
    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Too many requests.' },
        { status: 429 }
      );
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
    }

    const category = getStringFormValue(formData, 'category');
    const message = getStringFormValue(formData, 'message');
    const images = getImageFiles(formData);

    if (!category) {
      return NextResponse.json({ error: 'Feedback category is required' }, { status: 400 });
    }

    const trimmedCategory = category.trim();
    if (trimmedCategory.length < 1) {
      return NextResponse.json({ error: 'Feedback category is required' }, { status: 400 });
    }

    if (trimmedCategory.length > MAX_FEEDBACK_CATEGORY_LENGTH) {
      return NextResponse.json(
        { error: `Feedback category must be ${MAX_FEEDBACK_CATEGORY_LENGTH} characters or fewer` },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json({ error: 'Feedback message is required' }, { status: 400 });
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length < 1) {
      return NextResponse.json({ error: 'Feedback message is required' }, { status: 400 });
    }

    if (trimmedMessage.length > MAX_FEEDBACK_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Feedback message must be ${MAX_FEEDBACK_MESSAGE_LENGTH} characters or fewer` },
        { status: 400 }
      );
    }

    const validation = await validateFiles(images, {
      maxSize: MAX_FEEDBACK_IMAGE_SIZE,
      maxFiles: MAX_FEEDBACK_IMAGES,
      allowedTypes: SUPPORTED_IMAGE_MIME_TYPES,
    });

    if (validation.errors.length > 0) {
      return NextResponse.json(
        {
          error: `${validation.errors.length} image(s) failed validation`,
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    const metadata = {
      source_path: req.headers.get('x-feedback-source') || null,
      referrer: req.headers.get('referer') || null,
      user_agent: req.headers.get('user-agent') || null,
    };

    const supabase = getSupabaseAdminClient();
    const { data: feedback, error } = await supabase
      .from('feedback_submissions')
      .insert({
        clerk_user_id: clerkUserId,
        category: trimmedCategory,
        message: trimmedMessage,
        metadata,
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create feedback submission: ${error.message}`);
    }

    const uploadedStoragePaths: string[] = [];

    try {
      const attachmentRows = [];

      for (const image of validation.validFiles) {
        const mimeType = getModelProcessableMimeType(image);
        const storagePath = await uploadFeedbackFileToStorage(
          clerkUserId,
          feedback.id,
          image,
          mimeType
        );

        uploadedStoragePaths.push(storagePath);

        attachmentRows.push({
          feedback_id: feedback.id,
          clerk_user_id: clerkUserId,
          storage_path: storagePath,
          original_filename: image.name,
          mime_type: mimeType,
          file_size: image.size,
          metadata: {},
        });
      }

      if (attachmentRows.length > 0) {
        const { data: attachments, error: attachmentError } = await supabase
          .from('feedback_attachments')
          .insert(attachmentRows)
          .select('*');

        if (attachmentError) {
          throw new Error(`Failed to record feedback attachments: ${attachmentError.message}`);
        }

        return NextResponse.json({ feedback, attachments });
      }

      return NextResponse.json({ feedback, attachments: [] });
    } catch (attachmentError) {
      await Promise.all(uploadedStoragePaths.map((storagePath) => deleteFileFromStorage(storagePath)));
      await supabase
        .from('feedback_submissions')
        .delete()
        .eq('id', feedback.id)
        .eq('clerk_user_id', clerkUserId);

      throw attachmentError;
    }
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
