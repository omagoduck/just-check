import { streamText, stepCountIs, convertToModelMessages, UIMessage, hasToolCall } from 'ai';
import { getTimeTool, getWeatherTool, webSearchTool } from '@/lib/tools';
import {
  saveUserMessage,
  saveAssistantMessage,
  getLastMessageFromDB,
  updateMessage,
} from '@/lib/chat-history';
import { resolveModelRoute, getLanguageModel } from '@/lib/models';

export async function POST(req: Request) {
  try {
    const { messages, id: conversationId, modelId } = await req.json();

    // Calculate Routing Context
    const hasImages = messages.some((m: UIMessage) =>
      m.parts.some(p => p.type === 'file' && p.mediaType.startsWith('image/'))
    );

    // Resolve the UI Model to a technical route using the context
    const route = resolveModelRoute(modelId, { hasImages });
    const modelInstance = getLanguageModel(route);

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

    const modelMessages = convertToModelMessages(messages);

    const result = streamText({
      model: modelInstance,
      messages: modelMessages,
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
