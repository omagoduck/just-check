/**
 * Chat History Types
 * 
 * Uses UIMessage types directly from AI SDK for the content parts.
 * Each message represents a complete turn (user or assistant) with all its parts.
 * Messages are linked via previous_message_id to form a conversation tree.
 * 
 * We store UIMessage parts directly - only filtering out streaming states before storage.
 */

import type { UIMessage } from 'ai';

// Re-export UIMessage for convenience
export type { UIMessage };

/**
 * Extract the parts type from UIMessage
 * This gives us the array type of all possible UI message parts
 */
export type UIMessageParts = UIMessage['parts'];

/**
 * Individual part type from UIMessage
 */
export type UIMessagePart = UIMessageParts[number];

// ============================================================================
// MESSAGE TYPES
// ============================================================================

/**
 * Sender role for messages
 */
export type SenderRole = 'user' | 'assistant';

/**
 * Message metadata stored in the database
 */
export interface MessageMetadata {
  /** Any metadata */
  [key: string]: unknown;
}

/**
 * A message as stored in the database
 * Content stores UIMessage parts directly from the AI SDK
 */
export interface StoredMessage {
  /** UUID v4 - unique identifier for this message */
  id: string;
  /** UUID of the conversation this message belongs to */
  conversation_id: string;
  /** UUID of the previous message in the conversation chain (null for first message) */
  previous_message_id: string | null;
  /** Role of the sender */
  sender_type: SenderRole;
  /** Array of message parts from UIMessage - stored directly */
  content: UIMessagePart[];
  /** Optional metadata */
  metadata?: MessageMetadata;
  /** When the message was created */
  created_at?: string;
  /** Soft delete timestamp */
  deleted_at?: string | null;
}

/**
 * Input for creating a new message (without auto-generated fields)
 */
export interface CreateMessageInput {
  /** UUID v4 - must be generated using uuid v4 */
  id: string;
  /** UUID of the conversation */
  conversation_id: string;
  /** UUID of the previous message (null for first message) */
  previous_message_id: string | null;
  /** Role of the sender */
  sender_type: SenderRole;
  /** Array of completed message parts from UIMessage */
  content: UIMessagePart[];
  /** Optional metadata */
  metadata?: MessageMetadata;
}

// ============================================================================
// CONVERSATION TYPES
// ============================================================================

/**
 * A conversation as stored in the database
 */
export interface StoredConversation {
  id: string;
  user_id: string;
  clerk_user_id: string;
  title?: string | null;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}
