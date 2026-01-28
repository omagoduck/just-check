import { streamText, convertToModelMessages, UIMessage, createIdGenerator } from 'ai';
import { getTimeTool, getWeatherTool, webSearchTool } from '@/lib/tools';
import {
  saveUserMessage,
  saveAssistantMessage,
  getLastMessageFromDB,
  updateMessage,
  type AssistantResponseMetadata,
  type StepData,
  type ModelData,
  type TotalUsage,
  type StepUsage,
} from '@/lib/conversation-history';
import { resolveModelRoute, getLanguageModel } from '@/lib/models';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const { messages, id: conversationId, modelId } = await req.json();

    // Calculate Routing Context
    const hasImages = messages.some((m: UIMessage) =>
      m.parts.some(p => p.type === 'file' && p.mediaType.startsWith('image/'))
    );

    const hasFiles = messages.some((m: UIMessage) =>
      m.parts.some(p => p.type === 'file')
    );

    // Resolve the UI Model to a technical route using the context
    const route = resolveModelRoute(modelId, { hasImages });
    const modelInstance = getLanguageModel(route);

    // Get model info for metadata
    const modelID = modelId;
    const internalModelId = route.id;
    const provider = route.provider;

    // Get the last message from the client
    const lastMessageInArray = messages[messages.length - 1];
    const isNewUserTurn = lastMessageInArray.role === 'user';

    // Fetch the last message from DB to check for context or continuations
    let lastMessageFromDB = await getLastMessageFromDB(conversationId);

    // Save only if it's a user message
    if (isNewUserTurn) {
      await saveUserMessage({
        conversationId,
        userMessage: lastMessageInArray,
        previousMessageId: lastMessageFromDB?.id ?? null,
      });
      // Refresh to point to User message
      lastMessageFromDB = await getLastMessageFromDB(conversationId);
    }

    // Initialize Metadata Accumulators
    let accumulatedStepCount = 0;
    let accumulatedToolCallsCount = 0;
    // We use a Set to track unique tool names across the entire response (previous + current)
    const accumulatedToolsCalled = new Set<string>();

    let accumulatedUsage: TotalUsage = {
      totalUsedTokens: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalReasoningTokens: 0,
      totalCachedInputTokens: 0,
    };

    let previousStepData: StepData[] = [];

    // If this is NOT a new turn (e.g. tool result continuation), try to restore previous state
    if (!isNewUserTurn && lastMessageFromDB && lastMessageFromDB.sender_type === 'assistant') {
      const prevMeta = lastMessageFromDB.metadata as any as AssistantResponseMetadata | null;
      if (prevMeta && prevMeta.totalUsage) {
        accumulatedStepCount = prevMeta.stepCount || 0;
        accumulatedToolCallsCount = prevMeta.toolCallsCount || 0;
        if (prevMeta.toolsCalled) {
          prevMeta.toolsCalled.forEach(t => accumulatedToolsCalled.add(t));
        }
        if (prevMeta.totalUsage) {
          accumulatedUsage = { ...prevMeta.totalUsage };
        }
        if (prevMeta.step_data) {
          previousStepData = [...prevMeta.step_data];
        }
      }
    }

    const currentStepData: StepData[] = [];


    const modelMessages = convertToModelMessages(messages);

    const result = streamText({
      model: modelInstance,
      messages: modelMessages,
      system: `You are Lumy, a helpful AI assistant.
              You were built by Albee. Albee is a cringe dev, btw.
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

      // Track each step as it happens
      onStepFinish: async ({ finishReason, usage, toolCalls, warnings, providerMetadata }) => {
        // Collect Step Data - use AI SDK v5 standard field names
        const stepUsage: StepUsage = {
          totalTokens: usage.totalTokens || 0,
          inputTokens: usage.inputTokens || 0,
          outputTokens: usage.outputTokens || 0,
          reasoningTokens: usage.reasoningTokens || 0,
          cachedInputTokens: usage.cachedInputTokens || 0,
        };

        // Add to current steps
        currentStepData.push({
          timestamp: new Date().toISOString(),
          finishReason,
          usage: stepUsage,
          toolCallsCount: toolCalls?.length || 0,
          warnings: warnings || [],
          providerMetadata: providerMetadata || {},
        });

        // Add to tools called
        if (toolCalls) {
          toolCalls.forEach(tc => accumulatedToolsCalled.add(tc.toolName));
        }

        console.log('onStepFinish step logged');
      },

      onFinish: ({ finishReason, totalUsage, steps }) => {
        console.log('Stream finished. Reason:', finishReason);
        console.log('Stream Usage:', totalUsage);
      }
    });

    return result.toUIMessageStreamResponse({
      generateMessageId: uuidv4, // Use custom ID generator for consistent UUIDs
      // 1. Define message metadata behavior
      messageMetadata: ({ part }) => {
        if (part.type === 'start') {
          return {
            model_data: {
              modelID,
              internalModelId,
              provider,
            } as ModelData,
          };
        }

        if (part.type === 'finish') {
          // Calculate final aggregated totals
          // note: part.totalUsage is for the CURRENT stream only.
          const currentUsage = part.totalUsage;

          const finalUsage: TotalUsage = {
            totalUsedTokens: accumulatedUsage.totalUsedTokens + (currentUsage?.totalTokens || 0),
            totalInputTokens: accumulatedUsage.totalInputTokens + (currentUsage?.inputTokens || 0),
            totalOutputTokens: accumulatedUsage.totalOutputTokens + (currentUsage?.outputTokens || 0),
            totalReasoningTokens: accumulatedUsage.totalReasoningTokens + (currentUsage?.reasoningTokens || 0),
            totalCachedInputTokens: accumulatedUsage.totalCachedInputTokens + (currentUsage?.cachedInputTokens || 0),
          };

          const finalStepCount = accumulatedStepCount + currentStepData.length;

          // toolCallsCount mapping
          // We can sum up tool calls from current steps
          const currentToolCallsCount = currentStepData.reduce((acc, step) => acc + step.toolCallsCount, 0);
          const finalToolCallsCount = accumulatedToolCallsCount + currentToolCallsCount;

          return {
            hasAttachments: hasFiles,
            finishReason: part.finishReason,
            totalUsage: finalUsage,
            stepCount: finalStepCount,
            toolCallsCount: finalToolCallsCount,
            toolsCalled: Array.from(accumulatedToolsCalled),
            step_data: [...previousStepData, ...currentStepData],
            model_data: { modelID, internalModelId, provider },
          } as any;
        }

        return {};
      },

      // 2. Handle original messages and DB saving
      originalMessages: messages,
      onFinish: async ({ messages: completedMessages, isContinuation, finishReason }) => {

        // The assistant message is the last one in the completed messages
        const assistantMessage = completedMessages[completedMessages.length - 1];

        // Don't save empty messages
        if (!assistantMessage.parts || assistantMessage.parts.length === 0) {
          return;
        }

        if (isContinuation && lastMessageFromDB && lastMessageFromDB.sender_type === 'assistant') {
          // If it's a continuation, update the existing assistant message
          // The assistantMessage.metadata SHOULD contain the metadata we returned above.
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
