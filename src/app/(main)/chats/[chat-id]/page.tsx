'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from 'ai';
import { useRef, useEffect } from 'react';
import { Bot } from 'lucide-react';
import { ChatInput } from '@/components/chat-input';
import { MessageRenderer } from '@/components/messages/renderers/MessageRenderer';
import { GetTimeInput, GetTimeOutput } from '@/lib/tools';

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
      // Check if it's a dynamic tool first for proper type narrowing
      if (toolCall.dynamic) {
        return;
      }

      if (toolCall.toolName === 'getTime') {
        const input = toolCall.input as GetTimeInput;
        const timezone = input.timezone || 'Asia/Dhaka';
        
        try {
          // Get the current time in the specified timezone
          const now = new Date();
          const timeString = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short',
          }).format(now);

          const output: GetTimeOutput = {
            time: timeString,
            timezone: timezone,
            iso: now.toISOString(),
          };

          // No await - avoids potential deadlocks
          addToolOutput({
            tool: 'getTime',
            toolCallId: toolCall.toolCallId,
            output,
          });
        } catch (err) {
          addToolOutput({
            tool: 'getTime',
            toolCallId: toolCall.toolCallId,
            state: 'output-error',
            errorText: 'Unable to get the current time',
          });
        }
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
