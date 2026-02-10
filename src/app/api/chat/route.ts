import { streamText, convertToModelMessages, UIMessage } from 'ai';
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
import { logMessageTokenUsage } from '@/lib/allowance';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '@clerk/nextjs/server';
import { getRemainingAllowance, deductAllowance, getModelPricing, calculateCostCents } from '@/lib/allowance';

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

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

    // =========================================================================
    // ALLOWANCE PRE-CHECK
    // =========================================================================
    // Verify that the user has available allowance before proceeding.
    // This prevents wasteful streaming when balance is zero.
    const remainingAllowance = await getRemainingAllowance(clerkUserId);
    if (remainingAllowance <= 0) {
      return new Response(JSON.stringify({ error: 'Insufficient allowance' }), { status: 402 });
    }

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
      // Detailed breakdowns (v6)
      inputTokenDetails: undefined,
      outputTokenDetails: undefined,
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


    const modelMessages = await convertToModelMessages(messages);

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
        // Collect Step Data - using AI SDK v6 structure
        const stepUsage: StepUsage = {
          totalTokens: usage.totalTokens || 0,
          inputTokens: usage.inputTokens || 0,
          outputTokens: usage.outputTokens || 0,
          // Include detailed breakdowns if available (v6 feature)
          // Always include all fields for consistent DB storage
          inputTokenDetails: usage.inputTokenDetails
            ? {
              noCacheTokens: usage.inputTokenDetails.noCacheTokens,
              cacheReadTokens: usage.inputTokenDetails.cacheReadTokens,
              cacheWriteTokens: usage.inputTokenDetails.cacheWriteTokens,
            }
            : undefined,
          outputTokenDetails: usage.outputTokenDetails
            ? {
              textTokens: usage.outputTokenDetails.textTokens,
              reasoningTokens: usage.outputTokenDetails.reasoningTokens,
            }
            : undefined,
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
            // AI SDK v6 detailed breakdowns - accumulate across steps
            inputTokenDetails: (() => {
              const current = currentUsage?.inputTokenDetails;
              const accumulated = accumulatedUsage.inputTokenDetails;
              if (!current && !accumulated) return undefined;
              // Always include all fields for consistent DB storage
              return {
                noCacheTokens:
                  (accumulated?.noCacheTokens || 0) + (current?.noCacheTokens || 0),
                cacheReadTokens:
                  (accumulated?.cacheReadTokens || 0) + (current?.cacheReadTokens || 0),
                cacheWriteTokens:
                  (accumulated?.cacheWriteTokens || 0) + (current?.cacheWriteTokens || 0),
              };
            })(),
            outputTokenDetails: (() => {
              const current = currentUsage?.outputTokenDetails;
              const accumulated = accumulatedUsage.outputTokenDetails;
              if (!current && !accumulated) return undefined;
              // Always include all fields for consistent DB storage
              return {
                textTokens:
                  (accumulated?.textTokens || 0) + (current?.textTokens || 0),
                reasoningTokens:
                  (accumulated?.reasoningTokens || 0) + (current?.reasoningTokens || 0),
              };
            })(),
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
        } else {
          // Save a new assistant message, linking to the previous message if it exists
          await saveAssistantMessage({
            conversationId,
            assistantMessage,
            previousMessageId: lastMessageFromDB?.id || null,
          });
        }

        // =========================================================================
        // ALLOWANCE DEDUCTION
        // =========================================================================
        // After the message has been saved (or updated), calculate cost and deduct.
        try {
          // The totalUsage is stored in the assistant message metadata (set in messageMetadata)
          const meta = assistantMessage.metadata as any;
          const totalUsage = meta?.totalUsage as TotalUsage | undefined;

          if (totalUsage && route) {
            const pricing = getModelPricing(route.provider, route.id);
            let cost = 0;

            if (!pricing) {
              // If pricing not found, log error but do not block response.
              console.error(`Pricing not found for model ${route.provider}/${route.id}`);
            } else {
              cost = calculateCostCents(
                totalUsage.totalInputTokens || 0,
                totalUsage.totalOutputTokens || 0,
                pricing
              );
              // Deduct allowance if there's a cost
              if (cost > 0) {
                await deductAllowance(clerkUserId, cost);
              }
            }

            // Always log token usage for analytics (best effort)
            try {
              await logMessageTokenUsage({
                messageId: assistantMessage.id,
                tokenUsage: totalUsage,
                modelInfo: { provider, modelID, internalModelId },
                totalCostCents: cost,
                pricingUsed: pricing ?? { input: 0, output: 0 },
              });
            } catch (logErr) {
              // Logging failures should not affect the user response
              console.error('Failed to log token usage:', logErr);
            }
          }
        } catch (err) {
          // Deduction failures should not affect the client response.
          console.error('Failed to deduct allowance:', err);
        }
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
