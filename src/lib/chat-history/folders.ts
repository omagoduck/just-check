/**
 * Conversation Folders Service
 *
 * Database operations for folder CRUD and conversation-folder management.
 */

import { getSupabaseAdminClient } from '@/lib/supabase-client';
import type {
  ConversationFolder,
  CreateFolderParams,
  UpdateFolderParams,
  ListFoldersParams,
  MoveToFolderParams,
} from './types';

/**
 * Creates a new folder for a user
 *
 * @param params - Folder creation parameters
 * @returns The created folder
 * @throws Error if folder name already exists or database query fails
 */
export async function createFolder(
  params: CreateFolderParams
): Promise<ConversationFolder> {
  const { clerkUserId, name, color } = params;

  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('conversation_folders')
    .insert({
      clerk_user_id: clerkUserId,
      name: name.trim(),
      color: color || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('A folder with this name already exists');
    }
    throw new Error(`Failed to create folder: ${error.message}`);
  }

  return data as ConversationFolder;
}

/**
 * Updates an existing folder
 *
 * @param params - Folder update parameters
 * @returns The updated folder
 * @throws Error if folder not found or database query fails
 */
export async function updateFolder(
  params: UpdateFolderParams
): Promise<ConversationFolder> {
  const { folderId, clerkUserId, name, color } = params;

  const supabase = getSupabaseAdminClient();

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name.trim();
  if (color !== undefined) updateData.color = color;

  const { data, error } = await supabase
    .from('conversation_folders')
    .update(updateData)
    .eq('id', folderId)
    .eq('clerk_user_id', clerkUserId)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('A folder with this name already exists');
    }
    throw new Error(`Failed to update folder: ${error.message}`);
  }

  if (!data) {
    throw new Error('Folder not found');
  }

  return data as ConversationFolder;
}

/**
 * Soft-deletes a folder (conversations become folder-less)
 *
 * @param folderId - ID of the folder to delete
 * @param clerkUserId - Owner's Clerk user ID
 * @throws Error if folder not found or database query fails
 */
export async function deleteFolder(
  folderId: string,
  clerkUserId: string
): Promise<void> {
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase
    .from('conversation_folders')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', folderId)
    .eq('clerk_user_id', clerkUserId)
    .is('deleted_at', null);

  if (error) {
    throw new Error(`Failed to delete folder: ${error.message}`);
  }
}

/**
 * Lists all folders for a user with conversation counts
 *
 * @param params - List parameters including clerkUserId
 * @returns Array of folders with conversation counts
 * @throws Error if database query fails
 */
export async function listFolders(
  params: ListFoldersParams
): Promise<ConversationFolder[]> {
  const { clerkUserId } = params;

  const supabase = getSupabaseAdminClient();

  // Get folders
  const { data: folders, error } = await supabase
    .from('conversation_folders')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch folders: ${error.message}`);
  }

  if (!folders || folders.length === 0) {
    return [];
  }

  // Get conversation counts for each folder
  const folderIds = folders.map((f) => f.id);
  const { data: counts, error: countError } = await supabase
    .from('conversations')
    .select('folder_id')
    .in('folder_id', folderIds)
    .is('deleted_at', null)
    .is('archived_at', null);

  if (countError) {
    throw new Error(`Failed to fetch folder counts: ${countError.message}`);
  }

  // Count conversations per folder
  const countMap = new Map<string, number>();
  for (const row of counts || []) {
    countMap.set(row.folder_id, (countMap.get(row.folder_id) || 0) + 1);
  }

  return folders.map((folder) => ({
    ...(folder as ConversationFolder),
    conversation_count: countMap.get(folder.id) || 0,
  }));
}

/**
 * Moves a conversation to a folder (or removes from folder if folderId is null)
 *
 * @param params - Move parameters
 * @throws Error if folder not found or database query fails
 */
export async function moveConversationToFolder(
  params: MoveToFolderParams
): Promise<void> {
  const { conversationId, folderId, clerkUserId } = params;

  const supabase = getSupabaseAdminClient();

  // If folderId is provided, verify folder ownership
  if (folderId) {
    const { data: folder, error: folderError } = await supabase
      .from('conversation_folders')
      .select('id')
      .eq('id', folderId)
      .eq('clerk_user_id', clerkUserId)
      .is('deleted_at', null)
      .single();

    if (folderError || !folder) {
      throw new Error('Folder not found');
    }
  }

  // Update conversation's folder_id
  const { error } = await supabase
    .from('conversations')
    .update({ folder_id: folderId })
    .eq('id', conversationId)
    .eq('clerk_user_id', clerkUserId)
    .is('deleted_at', null);

  if (error) {
    throw new Error(`Failed to move conversation: ${error.message}`);
  }
}

/**
 * Gets a single folder by ID
 *
 * @param folderId - Folder ID
 * @param clerkUserId - Owner's Clerk user ID
 * @returns The folder or null if not found
 */
export async function getFolder(
  folderId: string,
  clerkUserId: string
): Promise<ConversationFolder | null> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('conversation_folders')
    .select('*')
    .eq('id', folderId)
    .eq('clerk_user_id', clerkUserId)
    .is('deleted_at', null)
    .single();

  if (error || !data) {
    return null;
  }

  return data as ConversationFolder;
}
