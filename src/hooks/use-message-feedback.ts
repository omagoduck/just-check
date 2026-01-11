import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// ============================================================================
// TYPES
// ============================================================================

export type FeedbackType = 'like' | 'dislike';

export interface MessageFeedback {
  type: 'like' | 'dislike';
  presets: string[];
  comment: string | null;
}

export interface FeedbackData {
  id: string;
  message_id: string;
  clerk_user_id: string;
  feedback: MessageFeedback;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// FETCH (Query)
// ============================================================================

async function fetchFeedback(messageId: string): Promise<FeedbackData | null> {
  const response = await fetch(`/api/message-feedback/${messageId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch feedback');
  }
  const data = await response.json();
  // Return null if no feedback exists (API returns null)
  return data === null ? null : data;
}

export function useMessageFeedback(messageId: string | null) {
  return useQuery({
    queryKey: ['messageFeedback', messageId],
    queryFn: () => (messageId ? fetchFeedback(messageId) : Promise.resolve(null)),
    enabled: !!messageId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============================================================================
// MUTATION (Create/Update/Delete)
// ============================================================================

interface SubmitFeedbackInput {
  type: FeedbackType;
  presets?: string[];
  comment?: string;
}

async function submitFeedback(messageId: string, data: SubmitFeedbackInput | null): Promise<FeedbackData | null> {
  if (data === null) {
    // Delete feedback (undo)
    const response = await fetch(`/api/message-feedback/${messageId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete feedback');
    }
    return null;
  } else {
    // Create or update feedback
    const response = await fetch(`/api/message-feedback/${messageId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to save feedback');
    }
    return response.json();
  }
}

export function useMessageFeedbackMutation(messageId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SubmitFeedbackInput | null) => submitFeedback(messageId, data),
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['messageFeedback', messageId] });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<FeedbackData | null>(['messageFeedback', messageId]);

      // Optimistically update
      if (newData === null) {
        // Undo - set to null
        queryClient.setQueryData(['messageFeedback', messageId], null);
      } else {
        // Set optimistic feedback data
        queryClient.setQueryData(['messageFeedback', messageId], {
          id: 'optimistic',
          message_id: messageId,
          clerk_user_id: 'optimistic',
          feedback: newData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      return { previousData };
    },
    onError: (err, _, context) => {
      // Rollback on error
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(['messageFeedback', messageId], context.previousData);
      }
    },
    onSettled: () => {
      // Refetch to ensure server state
      queryClient.invalidateQueries({ queryKey: ['messageFeedback', messageId] });
    },
  });
}
