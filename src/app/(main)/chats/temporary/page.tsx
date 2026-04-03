'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls, type UIMessage } from 'ai';
import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { ChatInput } from '@/components/chat-input';
import { MessageRenderer } from '@/components/messages/renderers/MessageRenderer';
import { executeClientTool } from '@/lib/tools/client-executors';
import { motion, AnimatePresence } from 'framer-motion';
import { useSubscriptionAndAllowanceStatus } from '@/hooks/use-subscription-and-allowance';
import { getLastRealMessageId } from '@/hooks/use-branch-state';
import { v4 as uuidv4 } from 'uuid';
import { ChevronDown, MessageCircleDashed } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useBranchSync } from '@/hooks/use-branch-sync';
import { useOptimisticMessages } from '@/hooks/use-optimistic-messages';

const MAX_CREATE_ATTEMPTS = 3;
type PendingMessage = {
  parts: UIMessage['parts'];
  UIModelId: string;
};

export default function TemporaryChatPage() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const [currentUIModelId, setCurrentUIModelId] = useState<string>('fast');
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [pendingFirstMessage, setPendingFirstMessage] = useState<PendingMessage | null>(null);
  const [isPreparingFirstSend, setIsPreparingFirstSend] = useState(false);
  const localSessionIdRef = useRef<string>(`temporary-${uuidv4()}`);
  const pendingCreateRef = useRef<Promise<string> | null>(null);
  const hasRequestedTemporaryEndRef = useRef(false);
  const pendingEndUsesBeaconRef = useRef(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const isUserAtBottomRef = useRef(true);
  const queryClient = useQueryClient();
  const branchChatKey = localSessionIdRef.current;

  const { isFreeUser, hasAllowance, remainingPercentage, periodEnd, isLoading: isLoadingAllowance } = useSubscriptionAndAllowanceStatus();

  const { mutateAsync: createTemporaryConversationMutateAsync } = useMutation({
    mutationFn: async (title: string) => {
      const response = await fetch('/api/conversations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, isTemporary: true }),
      });

      if (!response.ok) {
        throw new Error(`Create failed with status ${response.status}`);
      }

      const data = await response.json() as { id: string };
      return data.id;
    },
    retry: MAX_CREATE_ATTEMPTS - 1,
    retryDelay: (attempt) => Math.min(1000, 300 * attempt),
  });

  const { data: messagesData } = useQuery({
    queryKey: ['messages', branchChatKey],
    queryFn: async () => ({ messages: [] as UIMessage[] }),
    initialData: { messages: [] as UIMessage[] },
    staleTime: Number.POSITIVE_INFINITY,
  });

  const {
    displayedMessages: branchDisplayedMessages,
    branchState,
    siblingInfo,
    handleBranchPrevious,
    handleBranchNext,
    toUIMessage,
  } = useBranchSync(messagesData, branchChatKey);

  const prevActivePathRef = useRef<string[]>([]);

  const { messages, sendMessage, regenerate, status, addToolOutput, stop, setMessages } = useChat({
    id: localSessionIdRef.current,
    experimental_throttle: 100,
    generateId: uuidv4,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      prepareSendMessagesRequest: ({ messages, body, trigger, messageId }) => ({
        body: { id: body?.id ?? conversationId, messages, trigger, messageId, ...body },
      }),
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    async onToolCall({ toolCall }) {
      const result = await executeClientTool(toolCall);

      if (!result) {
        return;
      }

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

  useOptimisticMessages(messages, branchChatKey, queryClient);

  const streamingLastMessageId = useMemo(() => {
    return messages.length > 0 ? messages[messages.length - 1].id : null;
  }, [messages]);

  const activePathLastMessageId = useMemo(() => {
    const path = branchState.activePath;
    return path.length > 0 ? path[path.length - 1].id : null;
  }, [branchState.activePath]);

  const isViewingStreamingBranch = status !== 'ready'
    && streamingLastMessageId
    && activePathLastMessageId
    && streamingLastMessageId === activePathLastMessageId;

  const displayedMessages = useMemo(() => {
    return isViewingStreamingBranch ? messages : branchDisplayedMessages;
  }, [isViewingStreamingBranch, messages, branchDisplayedMessages]);

  useEffect(() => {
    if (status === 'ready' && branchState.activePath.length > 0 && !isViewingStreamingBranch) {
      const newIds = branchState.activePath.map((message) => message.id);
      const prevIds = prevActivePathRef.current;
      const isSame = newIds.length === prevIds.length && newIds.every((id, index) => id === prevIds[index]);
      if (!isSame) {
        setMessages(branchState.activePath.map(toUIMessage));
        prevActivePathRef.current = newIds;
      }
    }
  }, [branchState.activePath, isViewingStreamingBranch, setMessages, status, toUIMessage]);

  const requestEndTemporaryConversation = useCallback((targetConversationId: string, useBeacon: boolean) => {
    const url = `/api/conversations/${targetConversationId}/end-temporary`;

    if (useBeacon && typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(url, new Blob([], { type: 'application/json' }));
      return;
    }

    void fetch(url, {
      method: 'POST',
      keepalive: true,
    }).catch(() => {
      // Best-effort for leave events.
    });
  }, []);

  const createTemporaryConversation = useCallback(async (title: string): Promise<string> => {
    if (conversationId) {
      return conversationId;
    }

    if (pendingCreateRef.current) {
      return pendingCreateRef.current;
    }

    const createPromise = (async () => {
      setIsCreatingConversation(true);
      const createdConversationId = await createTemporaryConversationMutateAsync(title);

      if (hasRequestedTemporaryEndRef.current) {
        requestEndTemporaryConversation(createdConversationId, pendingEndUsesBeaconRef.current);
        return createdConversationId;
      }

      setConversationId(createdConversationId);
      return createdConversationId;
    })();

    pendingCreateRef.current = createPromise;

    try {
      return await createPromise;
    } finally {
      pendingCreateRef.current = null;
      setIsCreatingConversation(false);
    }
  }, [conversationId, createTemporaryConversationMutateAsync, requestEndTemporaryConversation]);

  const handleSendMessage = useCallback(async (
    text: string,
    attachments?: Array<{ url: string; originalName: string; mimeType: string }>
  ) => {
    if (!hasAllowance) return;

    const trimmedText = text.trim();
    if (!trimmedText) return;

    const parts: Array<{ type: 'text'; text: string } | { type: 'file'; url: string; mediaType: string; filename?: string }> = [
      { type: 'text', text: trimmedText },
    ];

    if (attachments) {
      attachments.forEach((att) => {
        parts.push({
          type: 'file',
          url: att.url,
          mediaType: att.mimeType,
          filename: att.originalName,
        });
      });
    }

    if (!conversationId) {
      setIsPreparingFirstSend(true);
      setPendingFirstMessage({
        parts,
        UIModelId: currentUIModelId,
      });
      try {
        await createTemporaryConversation(trimmedText.slice(0, 256));
      } catch {
        setPendingFirstMessage(null);
        setIsPreparingFirstSend(false);
        toast.error('Unable to start temporary chat. Please try again.');
      }
      return;
    }

    try {
      const previousMessageId = getLastRealMessageId(displayedMessages);

      sendMessage({ parts }, {
        body: {
          id: conversationId,
          UIModelId: currentUIModelId,
          previousMessageId,
        },
      });
    } catch {
      toast.error('Unable to start temporary chat. Please try again.');
    }
  }, [conversationId, createTemporaryConversation, currentUIModelId, displayedMessages, hasAllowance, sendMessage]);

  useEffect(() => {
    if (!conversationId || !pendingFirstMessage) {
      return;
    }

    const payload = pendingFirstMessage;
    setPendingFirstMessage(null);

    sendMessage(
      { parts: payload.parts },
      {
        body: {
          id: conversationId,
          UIModelId: payload.UIModelId,
          previousMessageId: null,
        },
      }
    );
  }, [conversationId, pendingFirstMessage, sendMessage]);

  useEffect(() => {
    if (isPreparingFirstSend && status !== 'ready') {
      setIsPreparingFirstSend(false);
    }
  }, [isPreparingFirstSend, status]);

  const handleEditMessage = useCallback((text: string, previousMessageId: string | null) => {
    if (!hasAllowance || !conversationId) return;

    branchState.clearOverride(previousMessageId);

    if (previousMessageId) {
      const parentChain = branchState.getAncestors(previousMessageId);
      setMessages(parentChain.map(toUIMessage));
    } else {
      setMessages([]);
    }

    sendMessage(
      { parts: [{ type: 'text', text }] },
      {
        body: { id: conversationId, UIModelId: currentUIModelId, previousMessageId },
      }
    );
  }, [branchState, conversationId, currentUIModelId, hasAllowance, sendMessage, setMessages, toUIMessage]);

  const handleRegenerate = useCallback((messageId: string, parentId: string | null) => {
    if (!hasAllowance || !conversationId) return;

    branchState.clearOverride(parentId);

    regenerate({
      messageId,
      body: { id: conversationId, UIModelId: currentUIModelId },
    });
  }, [branchState, conversationId, currentUIModelId, hasAllowance, regenerate]);

  const endTemporaryConversation = useCallback((useBeacon: boolean) => {
    const conversationId = conversationIdRef.current;
    if (hasRequestedTemporaryEndRef.current) {
      return;
    }

    if (!conversationId) {
      if (pendingCreateRef.current) {
        hasRequestedTemporaryEndRef.current = true;
        pendingEndUsesBeaconRef.current = useBeacon;
      }
      return;
    }

    hasRequestedTemporaryEndRef.current = true;
    requestEndTemporaryConversation(conversationId, useBeacon);
  }, [requestEndTemporaryConversation]);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    hasRequestedTemporaryEndRef.current = false;
    pendingEndUsesBeaconRef.current = false;
  }, [conversationId]);

  useEffect(() => {
    const handlePageHide = () => {
      endTemporaryConversation(true);
    };

    window.addEventListener('pagehide', handlePageHide);
    return () => {
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [endTemporaryConversation]);

  useEffect(() => {
    return () => {
      endTemporaryConversation(false);
    };
  }, [endTemporaryConversation]);

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, []);

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

  useEffect(() => {
    if (displayedMessages.length > 0 && isUserAtBottomRef.current) {
      setTimeout(() => {
        if (messagesContainerRef.current && isUserAtBottomRef.current) {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
    }
  }, [displayedMessages]);

  const isLoading = status === 'submitted' || isCreatingConversation || isPreparingFirstSend || pendingFirstMessage !== null;
  const isGenerating = status === 'streaming';

  return (
    <div className="flex flex-col h-full w-full bg-background">
      <div className="relative flex-1">
        <div
          ref={messagesContainerRef}
          className="absolute inset-0 overflow-y-auto p-4"
        >
          <div className="space-y-6 min-h-full max-w-3xl mx-auto">
            {displayedMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center select-none">
                <MessageCircleDashed className="w-10 h-10 text-muted-foreground/40 mb-3" strokeWidth={1.5} />
                <div className="text-base text-muted-foreground/60">
                  Start a temporary conversation
                </div>
              </div>
            )}
            {displayedMessages.map((message, index, array) => {
              const isLastMessage = index === array.length - 1;
              const info = siblingInfo.get(message.id);
              const branchCurrentIndex = info && info.total > 1 ? info.index : undefined;
              const branchTotalSiblings = info && info.total > 1 ? info.total : undefined;
              const branchParentId = info && info.total > 1 ? info.parentId : undefined;
              const editParentId =
                message.role === 'user'
                  ? siblingInfo.get(message.id)?.parentId ??
                    (message.metadata as { previous_message_id?: string | null } | undefined)?.previous_message_id ??
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
                  onBranchPrevious={branchParentId !== undefined ? () => handleBranchPrevious(branchParentId) : undefined}
                  onBranchNext={branchParentId !== undefined ? () => handleBranchNext(branchParentId) : undefined}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

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
