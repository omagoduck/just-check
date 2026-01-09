import { useQuery } from '@tanstack/react-query';
import type { UIMessage } from 'ai';

interface MessagesResponse {
  messages: UIMessage[];
}

async function fetchMessages(conversationId: string): Promise<MessagesResponse> {
  const response = await fetch(`/api/conversations/${conversationId}/messages`);
  if (!response.ok) throw new Error('Failed to fetch messages');
  return response.json();
}

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => fetchMessages(conversationId),
    enabled: !!conversationId,
  });
}
