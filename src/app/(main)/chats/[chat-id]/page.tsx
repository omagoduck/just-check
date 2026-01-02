'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from 'ai';
import { useRef, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChatInput } from '@/components/chat-input';
import { MessageRenderer } from '@/components/messages/renderers/MessageRenderer';
import { executeClientTool } from '@/lib/tools/client-executors';
import { motion } from 'framer-motion';

export default function ChatPage({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const params = useParams();
  const router = useRouter();
  const chatId = params['chat-id'] as string;
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Validate conversation existence and ownership
  useEffect(() => {
    const validateConversation = async () => {
      try {
        const response = await fetch(`/api/conversations/existance?id=${chatId}`);
        const data = await response.json();

        if (!data.valid) {
          // Redirect to home page if conversation is invalid
          router.push('/');
          return;
        }

        setIsValid(true);
      } catch (error) {
        console.error('Error validating conversation:', error);
        // Redirect to home page on error
        router.push('/');
      } finally {
        setIsValidating(false);
      }
    };

    validateConversation();
  }, [chatId, router]);

  const { messages, sendMessage, status, addToolOutput, stop } = useChat({
    id: chatId,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      // We don't need the body right now because we can use the id parameter provided by the useChat hook.
      // body: {
      //   conversationId: chatId,
      // },
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (text: string, attachments?: File[]) => {
    sendMessage({ text });
  };

  // Determine loading states based on chat status
  const isLoading = status === 'submitted'; // When message is submitted
  const isGenerating = status === 'streaming'; // When AI is generating response

  // Show loading state while validating
  if (isValidating) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    );
  }

  // Don't render chat if not valid (will be redirected)
  if (!isValid) {
    return null;
  }

  return (
    <div className="flex h-full w-full bg-background">
      <div className="flex-1 flex flex-col">
        {/* Messages container - takes all available space and scrolls */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4"
        >
          <div className="space-y-6 min-h-full max-w-3xl mx-auto">
            {messages.map((message) => {
              const isStreaming = status === 'streaming';
              return (
                <MessageRenderer key={message.id} message={message} isStreaming={isStreaming} />
              );
            })}
            <div ref={messagesEndRef} />
          </div>
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
                />
              </motion.div>
              <p className="text-center text-[12px] text-gray-500 mt-1">
                AI can make mistakes, consider checking important information.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
