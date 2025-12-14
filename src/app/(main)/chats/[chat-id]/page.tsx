'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from 'ai';
import { useRef, useEffect } from 'react';
import { Bot } from 'lucide-react';
import { ChatInput } from '@/components/chat-input';
import { MessageRenderer } from '@/components/messages/renderers/MessageRenderer';
import { executeClientTool } from '@/lib/tools/client-executors';

export default function ChatPage({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { messages, sendMessage, status, addToolOutput, stop } = useChat({
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

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="flex h-full w-full bg-background">
      <div className="flex-1 flex flex-col">
        {/* Messages container - takes all available space and scrolls */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-4 py-6"
        >
          <div className="space-y-6 min-h-full max-w-3xl mx-auto">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Bot className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">Start chatting</h3>
                  <p className="text-muted-foreground mt-2">
                    Ask me anything! Try asking "What time is it?"
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message) => {
                const isStreaming = status === 'streaming';
                return (
                  <MessageRenderer key={message.id} message={message} isStreaming={isStreaming} />
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Fixed input at bottom */}
        <div className="border-t bg-background p-4">
          <div className="flex justify-center">
            <div className="w-full max-w-3xl">
              <ChatInput
                onSubmit={handleSendMessage}
                isLoading={isLoading}
                isAiGenerating={isGenerating}
                onStopGenerating={stop}
                placeholder="Type your message..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
