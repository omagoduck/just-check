import { streamText, convertToModelMessages, UIMessage } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { getTimeTool, getWeatherTool, webSearchTool } from '@/lib/tools';
import {
  saveUserMessage,
  saveAssistantMessage,
  getLastMessageFromDB,
  updateMessage,
  storedMessagesToUIMessages,
  getConversationMessages
} from '@/lib/chat-history';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Allow streaming responses up to 2 minutes.
// export const maxDuration = 120; // Right now we don't want to limit it for user.

export async function POST(req: Request) {
  try {
    const { messages, id: conversationId }: { messages: UIMessage[]; id: string } = await req.json();

    // Get the last message from the client
    const lastMessageInArray = messages[messages.length - 1];

    // Save only if it's a user message
    if (lastMessageInArray.role === 'user') {
      // Get the last message from the database to link the new user message.
      const lastMessageFromDB = await getLastMessageFromDB(conversationId);

      await saveUserMessage({
        conversationId,
        userMessage: lastMessageInArray,
        previousMessageId: lastMessageFromDB?.id ?? null,
      });
    }


    const result = streamText({
      model: openrouter.chat('xiaomi/mimo-v2-flash:free'),
      messages: convertToModelMessages(messages),
      system: `You are Lumy, a helpful AI assistant built with the AI SDK.
              You are friendly, knowledgeable, and provide helpful responses.
              You can help with coding, writing, analysis, and answering questions.
              You have access to tools that can provide:
              - getTime: Current date and time
              - getWeather: Current weather and forecast for any location
              - webSearch: Search the web for information using AI-powered search providers
              You can automatically detect user location for weather queries if they don't specify a location.
              Always be respectful and helpful in your responses.`,
      tools: {
        // Client side tools
        getTime: getTimeTool, //Needs client time
        getWeather: getWeatherTool, //Needs client location also works with given location, no matter what it runs client side.
        // Server side tools
        webSearch: webSearchTool
      },
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      onFinish: async ({ messages: completedMessages, isContinuation, finishReason }) => {

        // Fetch again for latest data or it may stale.
        const lastMessageFromDB = await getLastMessageFromDB(conversationId);

        // The assistant message is the last one in the completed messages
        const assistantMessage = completedMessages[completedMessages.length - 1];

        if (isContinuation && lastMessageFromDB && lastMessageFromDB.sender_type === 'assistant') {
          // If it's a continuation, update the existing assistant message
          await updateMessage(lastMessageFromDB.id, {
            content: assistantMessage.parts,
            metadata: assistantMessage.metadata as any,
          });
          return;
        }

        // Save a new assistant message, linking to the previous message if it exists
        await saveAssistantMessage({
          conversationId,
          assistantMessage,
          previousMessageId: lastMessageFromDB?.id || null,
        });
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process chat' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
