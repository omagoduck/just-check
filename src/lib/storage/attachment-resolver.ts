import { resolveAttachmentUrl } from './file-storage-service';
import type { UIMessage, UIMessagePart } from '@/lib/conversation-history/types';

/**
 * Custom URL scheme: attachment://{fileId}
 * This function resolves such URLs to fresh signed URLs
 */
const ATTACHMENT_URL_PREFIX = 'attachment://';

export function isAttachmentUrl(url: string): boolean {
  return url.startsWith(ATTACHMENT_URL_PREFIX);
}

export function extractFileIdFromAttachmentUrl(url: string): string {
  if (!isAttachmentUrl(url)) {
    throw new Error('Invalid attachment URL');
  }
  return url.slice(ATTACHMENT_URL_PREFIX.length);
}

/**
 * Resolves attachment URLs in a UIMessage part
 * Returns null if the attachment cannot be resolved (e.g., deleted, access denied)
 */
export async function resolvePartAttachment(
  part: UIMessagePart,
  userId: string
): Promise<UIMessagePart | null> {
  if (part.type === 'file' && typeof part.url === 'string' && isAttachmentUrl(part.url)) {
    try {
      const fileId = extractFileIdFromAttachmentUrl(part.url);
      const resolvedUrl = await resolveAttachmentUrl(fileId, userId);

      return {
        ...part,
        url: resolvedUrl,
      };
    } catch (error) {
      console.warn('Failed to resolve attachment, removing from message:', {
        url: part.url,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  return part;
}

/**
 * Resolves all attachment URLs in a message
 */
export async function resolveMessageAttachments(
  message: UIMessage,
  userId: string
): Promise<UIMessage> {
  const resolvedParts = await Promise.all(
    message.parts.map((part: UIMessagePart) => resolvePartAttachment(part, userId))
  );

  return {
    ...message,
    parts: resolvedParts.filter((part): part is UIMessagePart => part !== null),
  };
}

/**
 * Resolves attachment URLs in an array of messages
 */
export async function resolveMessagesAttachments(
  messages: UIMessage[],
  userId: string
): Promise<UIMessage[]> {
  return Promise.all(messages.map(msg => resolveMessageAttachments(msg, userId)));
}
