'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls, createIdGenerator } from 'ai';
import { useRef, useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChatInput } from '@/components/chat-input';
import { MessageRenderer } from '@/components/messages/renderers/MessageRenderer';
import { executeClientTool } from '@/lib/tools/client-executors';
import { motion, AnimatePresence } from 'framer-motion';
import { useMessages } from '@/hooks/use-messages';
import { useConversationStarterStore } from '@/stores/message-store';
import { ChatHistorySkeleton } from '@/components/messages/renderers/ChatHistorySkeleton';
import { useSubscriptionAndAllowanceStatus } from '@/hooks/use-subscription-and-allowance';
import { v4 as uuidv4 } from 'uuid';
import { ChevronDown } from 'lucide-react';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params['chat-id'] as string;
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationStarter = useConversationStarterStore((state) => state.conversationStarter);
  const clearConversationStarter = useConversationStarterStore((state) => state.clearConversationStarter);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const { isFreeUser, hasAllowance, remainingPercentage, periodEnd, isLoading: isLoadingAllowance } = useSubscriptionAndAllowanceStatus();

  // Fetch conversation history using TanStack Query
  const { data: messagesData, isPending: isLoadingHistory, isError } = useMessages(chatId);

  // Redirect on error (404, 401, etc.)
  useEffect(() => {
    if (isError) {
      router.push('/');
    }
  }, [isError, router]);

  const { messages, sendMessage, status, addToolOutput, stop, setMessages } = useChat({
    id: chatId,
    experimental_throttle: 100,
    generateId: uuidv4,
    transport: new DefaultChatTransport({
      api: '/api/chat',
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
          tool: toolCall.toolName as any,
          toolCallId: toolCall.toolCallId,
          state: result.error.state,
          errorText: result.error.errorText,
        });
      } else {
        addToolOutput({
          tool: toolCall.toolName as any,
          toolCallId: toolCall.toolCallId,
          output: result.output,
        });
      }
    },
  });

  // Load initial messages into the chat when data is available
  useEffect(() => {
    if (messagesData?.messages && messagesData.messages.length > 0) {
      setMessages(messagesData.messages);
    }
  }, [messagesData, setMessages]);

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

      sendMessage({ parts }, { body: { UIModelId: conversationStarter.UIModelId } });
      clearConversationStarter();
    }
  }, [conversationStarter, isLoadingHistory, messagesData, sendMessage, clearConversationStarter]);

  const handleSendMessage = (text: string, attachments?: Array<{ url: string; originalName: string; mimeType: string }>, modelId?: string) => {
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

    sendMessage({ parts }, {
      body: { UIModelId: modelId }
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
    if (messages.length > 0 && !isLoadingHistory && isUserAtBottomRef.current) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        if (messagesContainerRef.current && isUserAtBottomRef.current) {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
    }
  }, [messages, isLoadingHistory]);

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
                {messages.map((message, index, array) => {
                  const isLastMessage = index === array.length - 1;
                  return (
                    <MessageRenderer
                      key={message.id}
                      message={message}
                      isStreaming={isGenerating && isLastMessage}
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1"
            >
              <ChatInput
                onSubmit={handleSendMessage}
                isLoading={isLoading}
                isAiGenerating={isGenerating}
                onStopGenerating={stop}
                placeholder="Type your message..."
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
