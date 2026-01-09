/**
 * Chat History Module
 *
 * Provides functions for storing and retrieving chat messages.
 * Messages are stored with links to previous messages forming a conversation tree.
 */

// Export all types
export type {
  UIMessage,
  UIMessageParts,
  UIMessagePart,
  SenderRole,
  MessageMetadata,
  StoredMessage,
  CreateMessageInput,
  StoredConversation,
  ListConversationsParams,
  ListConversationsResult,
  AssistantResponseMetadata,
  ModelData,
  TotalUsage,
  StepUsage,
  StepData,
  CreateAssistantMetadataInput,
} from './types';

// Export all database service functions
export {
  saveMessage,
  saveConversationTurn,
  saveUserMessage,
  saveAssistantMessage,
  updateMessage,
  getLastMessageFromDB,
  getMessagesForConversation,
} from './chat-db-service';

// Export conversation service functions
export { listConversations } from './conversations';
