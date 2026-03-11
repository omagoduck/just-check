import { getSupabaseAdminClient } from '@/lib/supabase-client';
import type { UploadedFile } from '@/lib/conversation-history/types';
import { v4 as uuidv4 } from 'uuid';

const BUCKET_NAME = 'images';
const URL_EXPIRY_SECONDS = 86400; // 24 hours

/**
 * Generates a storage path for a file
 * Format: private/chat-file-upload/{userId}/{uuid}-{sanitizedFilename}
 */
export function generateStoragePath(
  userId: string,
  filename: string
): string {
  const uuid = uuidv4();
  const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `private/chat-file-upload/${userId}/${uuid}-${sanitized}`;
}

/**
 * Uploads a file to Supabase Storage
 * Returns the storage path
 */
export async function uploadFileToStorage(
  userId: string,
  file: File
): Promise<string> {
  const supabase = getSupabaseAdminClient();

  const storagePath = generateStoragePath(userId, file.name);

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false, // Never overwrite
    });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  return storagePath;
}

/**
 * Creates a signed URL for a storage path
 * URL expires after 24 hours
 */
export async function createSignedUrl(storagePath: string): Promise<string> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, URL_EXPIRY_SECONDS);

  if (error) {
    throw new Error(`Failed to create signed URL: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * Gets cached signed URL from database
 * Returns null if not found or expired
 */
async function getCachedSignedUrl(fileId: string): Promise<string | null> {
  const supabase = getSupabaseAdminClient();
  
  const { data, error } = await supabase
    .from('signed_url_cache')
    .select('signed_url, expires_at')
    .eq('file_id', fileId)
    .single();
  
  if (error || !data) return null;
  
  // Check if cached URL is still valid
  if (new Date(data.expires_at) > new Date()) {
    return data.signed_url;
  }
  
  return null; // Expired
}

/**
 * Caches a signed URL in the database
 */
async function cacheSignedUrl(fileId: string, signedUrl: string, expiresInSeconds: number): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
  
  await supabase
    .from('signed_url_cache')
    .upsert({
      file_id: fileId,
      signed_url: signedUrl,
      expires_at: expiresAt.toISOString(),
      cached_at: new Date().toISOString()
    }, { onConflict: 'file_id' });
}

/**
 * Resolves an attachment:// URL to a fresh signed URL
 * Format: attachment://{fileId}
 */
export async function resolveAttachmentUrl(
  fileId: string,
  requestingUserId: string
): Promise<string> {
  const supabase = getSupabaseAdminClient();

  // Fetch file metadata WITH ownership check in the query
  // This prevents information leakage about file existence and ownership
  const { data: file, error } = await supabase
    .from('file_uploads')
    .select('*')
    .eq('id', fileId)
    .eq('user_id', requestingUserId) // Filter by user in query - no separate check needed
    .single();

  if (error || !file) {
    // Log error for debugging but return generic message to avoid information leakage
    console.error('Attachment resolution failed:', { fileId, error });
    throw new Error('File not found or access denied');
  }

  // Check if file was soft-deleted
  if (file.deleted_at) {
    throw new Error('File has been deleted');
  }

  // Try to get cached URL first
  const cachedUrl = await getCachedSignedUrl(fileId);
  if (cachedUrl) {
    return cachedUrl;
  }

  // Generate fresh signed URL if not cached
  const signedUrl = await createSignedUrl(file.storage_path);
  
  // Cache the new URL
  await cacheSignedUrl(fileId, signedUrl, URL_EXPIRY_SECONDS);
  
  return signedUrl;
}

/**
 * Records file metadata in database after upload
 */
export async function recordFileUpload(
  userId: string,
  storagePath: string,
  file: File
): Promise<UploadedFile> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('file_uploads')
    .insert({
      user_id: userId,
      storage_path: storagePath,
      original_filename: file.name,
      mime_type: file.type,
      file_size: file.size,
      metadata: {},
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to record file upload: ${error.message}`);
  }

  return data as UploadedFile;
}

/**
 * Soft deletes a file (marks as deleted, doesn't remove from storage)
 */
export async function softDeleteFile(fileId: string, userId: string): Promise<void> {
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase
    .from('file_uploads')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', fileId)
    .eq('user_id', userId); // Ensure user can only delete their own

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Permanently removes a file from Supabase Storage
 * Use this for cleanup when upload fails midway
 */
export async function deleteFileFromStorage(storagePath: string): Promise<void> {
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([storagePath]);

  if (error) {
    console.error(`Failed to delete file from storage: ${error.message}`);
  }
}
