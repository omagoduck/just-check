'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from 'ai';
import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChatInput } from '@/components/chat-input';
import { MessageRenderer } from '@/components/messages/renderers/MessageRenderer';
import { executeClientTool } from '@/lib/tools/client-executors';
import { motion, AnimatePresence } from 'framer-motion';
import { useMessages } from '@/hooks/use-messages';
import { useConversationStarterStore } from '@/stores/message-store';
import { ChatHistorySkeleton } from '@/components/messages/renderers/ChatHistorySkeleton';
import { useSubscriptionAndAllowanceStatus } from '@/hooks/use-subscription-and-allowance';
import { useBranchSync } from '@/hooks/use-branch-sync';
import { getLastRealMessageId } from '@/hooks/use-branch-state';
import { useOptimisticMessages } from '@/hooks/use-optimistic-messages';
import { v4 as uuidv4 } from 'uuid';
import { ChevronDown } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params['chat-id'] as string;
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationStarter = useConversationStarterStore((state) => state.conversationStarter);
  const clearConversationStarter = useConversationStarterStore((state) => state.clearConversationStarter);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [currentUIModelId, setCurrentUIModelId] = useState<string>('fast');
  const { isFreeUser, hasAllowance, remainingPercentage, periodEnd, isLoading: isLoadingAllowance } = useSubscriptionAndAllowanceStatus();

  // Fetch ALL conversation messages for branch tree
  const { data: messagesData, isPending: isLoadingHistory, isError } = useMessages(chatId);
  const queryClient = useQueryClient();

  // Redirect on error (404, 401, etc.)
  useEffect(() => {
    if (isError) {
      router.push('/');
    }
  }, [isError, router]);

  // Branch state management
  const {
    displayedMessages: branchDisplayedMessages,
    branchState,
    siblingInfo,
    handleBranchPrevious,
    handleBranchNext,
    toUIMessage,
  } = useBranchSync(messagesData, chatId);

  // Sync useChat display with branch state
  const prevActivePathRef = useRef<string[]>([]);

  const { messages, sendMessage, regenerate, status, addToolOutput, stop, setMessages } = useChat({
    id: chatId,
    experimental_throttle: 100,
    generateId: uuidv4,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      prepareSendMessagesRequest: ({ id, messages, body, trigger, messageId }) => ({
        body: { id, messages, trigger, messageId, ...body },
      }),
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    // Handle client-side tools that should be automatically executed
    async onToolCall({ toolCall }) {
      const result = await executeClientTool(toolCall);

      if (!result) {
        // Tool not found in registry - it might be a server-side tool or needs special handling
        return;
      }

      // No await - avoids potential deadlocks
      if (result.error) {
        addToolOutput({
          tool: toolCall.toolName,
          toolCallId: toolCall.toolCallId,
          state: result.error.state,
          errorText: result.error.errorText,
        });
      } else {
        addToolOutput({
          tool: toolCall.toolName,
          toolCallId: toolCall.toolCallId,
          output: result.output,
        });
      }
    },
  });

  // Optimistic caching: sync useChat messages into the query cache
  useOptimisticMessages(messages, chatId, queryClient);

  // Determine if user is viewing the branch currently being streamed.
  // Compare the last message (not just last user message) because different
  // branches can share the same user message but have different assistant responses.
  const streamingLastMessageId = useMemo(() => {
    return messages.length > 0 ? messages[messages.length - 1].id : null;
  }, [messages]);

  const activePathLastMessageId = useMemo(() => {
    const p = branchState.activePath;
    return p.length > 0 ? p[p.length - 1].id : null;
  }, [branchState.activePath]);

  const isViewingStreamingBranch = status !== 'ready' && streamingLastMessageId && activePathLastMessageId && streamingLastMessageId === activePathLastMessageId;

  // Choose message source: useChat during streaming on the active branch, branch path otherwise
  const displayedMessages = useMemo(() => {
    return isViewingStreamingBranch ? messages : branchDisplayedMessages;
  }, [isViewingStreamingBranch, messages, branchDisplayedMessages]);

  // Sync useChat with branch active path (only when not streaming and not viewing streaming branch)
  useEffect(() => {
    if (status === 'ready' && branchState.activePath.length > 0 && !isViewingStreamingBranch) {
      const newIds = branchState.activePath.map(m => m.id);
      const prevIds = prevActivePathRef.current;
      const isSame = newIds.length === prevIds.length && newIds.every((id, i) => id === prevIds[i]);
      if (!isSame) {
        setMessages(branchState.activePath.map(toUIMessage));
        prevActivePathRef.current = newIds;
      }
    }
  }, [branchState.activePath, status, setMessages, toUIMessage, isViewingStreamingBranch]);

  // Handle pending message from main page
  useEffect(() => {
    if (conversationStarter && !isLoadingHistory && messagesData) {
      const parts: Array<{ type: 'text'; text: string } | { type: 'file'; url: string; mediaType: string; filename?: string }> = [
        { type: 'text', text: conversationStarter.message }
      ];

      if (conversationStarter.attachments) {
        conversationStarter.attachments.forEach(att => {
          parts.push({
            type: 'file',
            url: att.url,
            mediaType: att.mimeType,
            filename: att.originalName,
          });
        });
      }

      sendMessage({ parts }, { body: { UIModelId: conversationStarter.UIModelId, previousMessageId: getLastRealMessageId(displayedMessages) } });
      clearConversationStarter();
    }
  }, [conversationStarter, isLoadingHistory, messagesData, sendMessage, clearConversationStarter, displayedMessages]);

  const handleSendMessage = (text: string, attachments?: Array<{ url: string; originalName: string; mimeType: string }>) => {
    // Block submission if user has no allowance
    if (!hasAllowance) return;

    // Build message parts including attachments if present
    const parts: Array<{ type: 'text'; text: string } | { type: 'file'; url: string; mediaType: string; filename?: string }> = [
      { type: 'text', text }
    ];

    if (attachments) {
      attachments.forEach(att => {
        parts.push({
          type: 'file',
          url: att.url, // This is the attachment:// URL
          mediaType: att.mimeType,
          filename: att.originalName,
        });
      });
    }

    // For normal replies, previousMessageId is the last message with actual content in the current display.
    // Skip empty assistant messages (from stopped streams) as they are never saved to DB.
    // For edits/branching, handleEditMessage calls sendMessage directly with the correct parent.
    const previousMessageId = getLastRealMessageId(displayedMessages);

    sendMessage({ parts }, {
      body: { UIModelId: currentUIModelId, previousMessageId }
    });
  };

  // Handle edit of a user message — creates a new branch
  const handleEditMessage = (text: string, previousMessageId: string | null) => {
    if (!hasAllowance) return;

    // Clear any stale user override for this parent so defaultSelectedSiblings
    // can automatically navigate to the new branch once the cache updates.
    branchState.clearOverride(previousMessageId);

    if (previousMessageId) {
      const parentChain = branchState.getAncestors(previousMessageId);
      setMessages(parentChain.map(toUIMessage));
    } else {
      setMessages([]);
    }

    sendMessage({
      parts: [{ type: 'text', text }]
    }, {
      body: { UIModelId: currentUIModelId, previousMessageId }
    });
  };

  // Handle regenerate of an assistant message — creates a new branch
  const handleRegenerate = (messageId: string, parentId: string | null) => {
    if (!hasAllowance) return;

    // Clear any stale user override for this parent so defaultSelectedSiblings
    // can automatically navigate to the new branch once the cache updates.
    branchState.clearOverride(parentId);

    regenerate({
      messageId,
      body: { UIModelId: currentUIModelId },
    });
  };

  const isUserAtBottomRef = useRef(true);

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  // Track scroll position to show/hide scroll button and track if user is near bottom
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const nearBottom = distanceFromBottom < 100;
      
      setShowScrollButton(!nearBottom);
      isUserAtBottomRef.current = nearBottom;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll to bottom only when user is near bottom
  useEffect(() => {
    if (displayedMessages.length > 0 && !isLoadingHistory && isUserAtBottomRef.current) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        if (messagesContainerRef.current && isUserAtBottomRef.current) {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
    }
  }, [displayedMessages, isLoadingHistory]);

  // Determine loading states based on chat status
  const isLoading = status === 'submitted'; // When message is submitted
  const isGenerating = status === 'streaming'; // When AI is generating response

  // Don't render chat if not valid (will be redirected)
  if (isError) {
    return null;
  }

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* Container with relative for positioning the button outside scroll area */}
      <div className="relative flex-1">
        {/* Messages container - takes all available space and scrolls */}
        <div
          ref={messagesContainerRef}
          className="absolute inset-0 overflow-y-auto p-4"
        >
          <div className="space-y-6 min-h-full max-w-3xl mx-auto">
            {isLoadingHistory ? (
              <ChatHistorySkeleton />
            ) : (
              <>
                {displayedMessages.map((message, index, array) => {
                  const isLastMessage = index === array.length - 1;

                  // O(1) lookup for branch info using pre-computed siblingInfo
                  const info = siblingInfo.get(message.id);
                  const branchCurrentIndex = info && info.total > 1 ? info.index : undefined;
                  const branchTotalSiblings = info && info.total > 1 ? info.total : undefined;
                  const branchParentId = info && info.total > 1 ? info.parentId : undefined;

                  const editParentId =
                    message.role === 'user'
                      ? siblingInfo.get(message.id)?.parentId ??
                        (message.metadata as { previous_message_id?: string | null } | undefined)
                          ?.previous_message_id ??
                        null
                      : null;

                  return (
                    <MessageRenderer
                      key={message.id}
                      message={message}
                      isStreaming={isGenerating && isLastMessage}
                      isLoading={isLoading}
                      isGenerating={isGenerating}
                      onEdit={
                        message.role === 'user'
                          ? (text) => handleEditMessage(text, editParentId)
                          : undefined
                      }
                      onRegenerate={
                        message.role === 'assistant'
                          ? () => handleRegenerate(message.id, branchParentId ?? null)
                          : undefined
                      }
                      branchCurrentIndex={branchCurrentIndex}
                      branchTotalSiblings={branchTotalSiblings}
                      onBranchPrevious={branchParentId !== undefined ? () => handleBranchPrevious(branchParentId!) : undefined}
                      onBranchNext={branchParentId !== undefined ? () => handleBranchNext(branchParentId!) : undefined}
                    />
                  );
                })}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Scroll to bottom button - fixed position relative to parent */}
        <AnimatePresence>
          {showScrollButton && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={scrollToBottom}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center w-10 h-10 bg-black/50 hover:bg-black/70 border border-white/20 rounded-full text-white shadow-lg transition-colors"
              aria-label="Scroll to bottom"
            >
              <ChevronDown className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>

      </div>

      <div className="sticky bottom-0 left-0 right-0 bg-background border-t border-border p-2">
        <div className="w-full max-w-3xl mx-auto flex flex-col">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            <motion.div
              layoutId="chat-input-container"
              className="flex-1"
            >
              <ChatInput
                onSubmit={handleSendMessage}
                isLoading={isLoading}
                isAiGenerating={isGenerating}
                onStopGenerating={stop}
                placeholder="Type your message..."
                selectedUIModelId={currentUIModelId}
                onUIModelChange={setCurrentUIModelId}
                isFreeUser={isFreeUser}
                hasAllowance={hasAllowance}
                remainingPercentage={remainingPercentage}
                allowanceResetTime={periodEnd}
                isLoadingAllowance={isLoadingAllowance}
              />
            </motion.div>
            <p className="text-center text-[12px] text-gray-500 mt-1">
              AI can make mistakes, consider checking important information.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
