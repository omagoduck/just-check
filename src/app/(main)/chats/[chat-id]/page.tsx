'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ChatPageShell,
  type ChatPageShellAttachment,
  type ChatPageShellPendingMessage,
} from '@/components/chat/chat-page-shell';
import { ChatHistorySkeleton } from '@/components/messages/renderers/ChatHistorySkeleton';
import { useMessages } from '@/hooks/use-messages';
import { useSubscriptionAndAllowanceStatus } from '@/hooks/use-subscription-and-allowance';
import { useConversationStarterStore } from '@/stores/message-store';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params['chat-id'] as string;
  const conversationStarter = useConversationStarterStore((state) => state.conversationStarter);
  const clearConversationStarter = useConversationStarterStore((state) => state.clearConversationStarter);
  const { isFreeUser, hasAllowance, remainingPercentage, periodEnd, isLoading: isLoadingAllowance } = useSubscriptionAndAllowanceStatus();
  const { data: messagesData, isPending: isLoadingHistory, isError } = useMessages(chatId);

  useEffect(() => {
    if (isError) {
      router.push('/');
    }
  }, [isError, router]);

  if (isError) {
    return null;
  }

  const pendingMessage: ChatPageShellPendingMessage | null = conversationStarter
    ? {
        message: conversationStarter.message,
        attachments: conversationStarter.attachments as ChatPageShellAttachment[] | undefined,
        UIModelId: conversationStarter.UIModelId ?? 'fast',
      }
    : null;

  return (
    <ChatPageShell
      chatId={chatId}
      messagesData={messagesData}
      prepareSendMessagesRequest={({ id, messages, body, trigger, messageId }) => ({
        body: { id, messages, trigger, messageId, ...body },
      })}
      isLoadingHistory={isLoadingHistory}
      historyContent={<ChatHistorySkeleton />}
      pendingMessage={pendingMessage}
      onPendingMessageConsumed={clearConversationStarter}
      onSubmitMessage={({ text, attachments, currentUIModelId, displayedMessages, sendMessage, getLastRealMessageId }) => {
        sendMessage(
          {
            parts: [
              { type: 'text', text },
              ...(attachments ?? []).map((attachment) => ({
                type: 'file' as const,
                url: attachment.url,
                mediaType: attachment.mimeType,
                filename: attachment.originalName,
              })),
            ],
          },
          {
            body: {
              UIModelId: currentUIModelId,
              previousMessageId: getLastRealMessageId(displayedMessages),
            },
          }
        );
      }}
      onSubmitEditedMessage={({ text, previousMessageId, currentUIModelId, sendMessage }) => {
        sendMessage(
          { parts: [{ type: 'text', text }] },
          {
            body: { UIModelId: currentUIModelId, previousMessageId },
          }
        );
      }}
      onSubmitRegeneratedMessage={({ messageId, currentUIModelId, regenerate }) => {
        regenerate({
          messageId,
          body: { UIModelId: currentUIModelId },
        });
      }}
      canSendMessages={!!hasAllowance}
      canMutateMessages={!!hasAllowance}
      isFreeUser={isFreeUser}
      hasAllowance={hasAllowance}
      remainingPercentage={remainingPercentage}
      allowanceResetTime={periodEnd}
      isLoadingAllowance={isLoadingAllowance}
    />
  );
}
