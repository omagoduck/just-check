/**
 * Chat History Module
 *
 * Provides functions for storing and retrieving chat messages.
 * Messages are stored with links to previous messages forming a conversation tree.
 */

// Export all types
export type {
  StoredConversation,
  ListConversationsParams,
  ListConversationsResult,
  ListConversationsWithFiltersParams,
  ConversationView,
  ConversationFolder,
  CreateFolderParams,
  UpdateFolderParams,
  ListFoldersParams,
  MoveToFolderParams,
} from './types';

export { PIN_LIMIT } from './types';

// Export conversation service functions
export {
  listConversations,
  listConversationsWithFilters,
  pinConversation,
  unpinConversation,
  archiveConversation,
  unarchiveConversation,
  archiveAllConversations,
  deleteAllConversations,
  getPinnedCount,
} from './conversations';

// Export folder service functions
export {
  createFolder,
  updateFolder,
  deleteFolder,
  listFolders,
  moveConversationToFolder,
  getFolder,
} from './folders';
