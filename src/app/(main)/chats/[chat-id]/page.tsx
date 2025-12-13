'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from 'ai';
import { useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User, Clock } from 'lucide-react';
import { Markdown } from '@/components/markdown';
import { ChatInput } from '@/components/chat-input';
import { GetTimeInput, GetTimeOutput } from '@/lib/tools/tools';

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
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* Messages */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-4 py-6"
        >
          <div className="space-y-6">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Bot className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">Start chatting</h3>
                  <p className="text-muted-foreground mt-2">
                    Ask me anything! You can also ask me for the current time.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div
                    className={`max-w-[70%] ${
                      message.role === 'user'
                        ? 'order-first'
                        : ''
                    }`}
                  >
                    <Card
                      className={`${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground ml-auto'
                          : ''
                      }`}
                    >
                      <CardContent className="p-4">
                        {message.parts.map((part, index) => {
                          switch (part.type) {
                            case 'text':
                              return (
                                <div key={index} className="prose prose-sm max-w-none">
                                  <Markdown>{part.text}</Markdown>
                                </div>
                              );
                            
                            // Handle getTime tool calls and results
                            case 'tool-getTime': {
                              const callId = part.toolCallId;
                              const input = part.input as GetTimeInput;
                              const output = part.output as GetTimeOutput;

                              switch (part.state) {
                                case 'input-streaming':
                                  return (
                                    <div key={callId} className="flex items-center space-x-2 text-muted-foreground">
                                      <Clock className="h-4 w-4 animate-pulse" />
                                      <span>Getting time request...</span>
                                    </div>
                                  );
                                case 'input-available':
                                  return (
                                    <div key={callId} className="flex items-center space-x-2 text-muted-foreground">
                                      <Clock className="h-4 w-4" />
                                      <span>
                                        Getting current time{input?.timezone ? ` for ${input.timezone}` : ''}...
                                      </span>
                                    </div>
                                  );
                                case 'output-available':
                                  return (
                                    <div key={callId} className="flex items-center space-x-2 bg-muted p-3 rounded-lg">
                                      <Clock className="h-5 w-5 text-blue-500" />
                                      <div>
                                        <div className="font-medium text-foreground">Current Time</div>
                                        <div className="text-sm text-muted-foreground">
                                          {output.time}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                case 'output-error':
                                  return (
                                    <div key={callId} className="flex items-center space-x-2 text-destructive">
                                      <Clock className="h-4 w-4" />
                                      <span>Error: {part.errorText}</span>
                                    </div>
                                  );
                              }
                              break;
                            }

                            default:
                              return null;
                          }
                        })}
                      </CardContent>
                    </Card>
                  </div>

                  {message.role === 'user' && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="border-t bg-background">
          <div className="flex justify-center p-4">
            <ChatInput
              onSubmit={handleSendMessage}
              isLoading={isLoading}
              isAiGenerating={isGenerating}
              onStopGenerating={stop}
              placeholder="Type your message... (try asking 'What time is it?')"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
