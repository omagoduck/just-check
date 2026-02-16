import { streamText, convertToModelMessages, UIMessage } from 'ai';
import { getTimeTool, getWeatherTool, webSearchTool, viewWebsiteTool } from '@/lib/tools';
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
import { buildSystemPrompt } from '@/lib/system-prompt';
import { DEFAULT_AI_CUSTOMIZATION_SETTINGS, type AICustomizationSettings } from '@/types/settings';
import { getSupabaseAdminClient } from '@/lib/supabase-client';

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { messages, id: conversationId, UIModelId } = await req.json();

    // Calculate Routing Context
    const hasImages = messages.some((m: UIMessage) =>
      m.parts.some(p => p.type === 'file' && p.mediaType.startsWith('image/'))
    );

    const hasFiles = messages.some((m: UIMessage) =>
      m.parts.some(p => p.type === 'file')
    );

    // Resolve the UI Model to a technical route using the context
    const route = resolveModelRoute(UIModelId, { hasImages });
    const modelInstance = getLanguageModel(route);

    // Get model info for metadata
    const internalModelId = route.id;
    const provider = route.provider;

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

    // Fetch user settings to build personalized system prompt
    // TODO P6: Consider if we can unify or move away settings fetching.
    let userAISettings: AICustomizationSettings = DEFAULT_AI_CUSTOMIZATION_SETTINGS;
    try {
      const supabase = getSupabaseAdminClient();
      const { data: existingSettings, error } = await supabase
        .from('user_settings')
        .select('settings_data')
        .eq('clerk_user_id', clerkUserId)
        .single();

      if (!error && existingSettings?.settings_data?.aiCustomizationSettings) {
        userAISettings = {
          ...DEFAULT_AI_CUSTOMIZATION_SETTINGS,
          ...existingSettings.settings_data.aiCustomizationSettings,
        };
      }
      // Silently ignore errors - will use defaults
    } catch (error) {
      console.error('Failed to fetch settings for system prompt:', error);
      // Continue with default settings
    }

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

    // The AI SDK provides aggregated total usage via onFinish's totalUsage callback, which gives all steps summed usage. It works well on a onetime single connection. Like with server side tool calls and resposnes. But this is not the same case in client side tool calls.
    // In case of client side tool calls the stream completely end after a client side tool call. Cause the client can either send or not the tool result. That's why this safety mechanism. But this has some cons. The client side tool calls result comes as a new request.
    // Beside as the stream completely end on a client side tool call, the sdk literally call backs the onFinish. Cause the stream completely ended, unlike a server sdie tool call. Now after getting the client side result back (if client give result back), a new stream starts, as a result the new streams onFinish doesn't account for privious ofFinish usages, rather a fresh count till the stream started.
    // Initialize Metadata Accumulators
    let accumulatedStepCount = 0;
    let accumulatedToolCallsCount = 0;
    // We use a Set to track unique tool names across the entire response (previous + current)
    const accumulatedToolsCalled = new Set<string>();

    let accumulatedUsage: TotalUsage = {
      totalUsedTokens: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      inputTokenDetails: undefined,
      outputTokenDetails: undefined,
    };

    let previousStepData: StepData[] = [];

    // If this is NOT a new turn (e.g. client side tool result continuation, confirmation (confirmation not implemented yet)), try to restore previous state.
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

    // Capture final usage from streamText's onFinish callback
    let streamOnFinishUsage: { totalTokens?: number; inputTokens?: number; outputTokens?: number; inputTokenDetails?: any; outputTokenDetails?: any } | undefined;

    const modelMessages = await convertToModelMessages(messages);

    // Build personalized system prompt from user settings
    const systemPrompt = buildSystemPrompt(userAISettings);

    const result = streamText({
      model: modelInstance,
      messages: modelMessages,
      system: systemPrompt,
      tools: {
        // Client side tools
        getTime: getTimeTool, //Needs client time
        getWeather: getWeatherTool, //Needs client location also works with given location, no matter what it runs client side.
        // Server side tools
        webSearch: webSearchTool,
        viewWebsite: viewWebsiteTool
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
        // Capture for later use in onFinish of toUIMessageStreamResponse
        streamOnFinishUsage = totalUsage;
      }
    });

    return result.toUIMessageStreamResponse({
      generateMessageId: uuidv4, // Use custom ID generator for consistent UUIDs
      // 1. Define message metadata behavior - ONLY client-safe fields
      messageMetadata: ({ part }) => {

        // Right now it sends metadata directly to client at stream time.
        if (part.type === 'start') {
          return {
            model_data: {
              UIModelId,
            },
          };
        }

        // Not sending anything on finish - only server cares about finish metadata
        // if (part.type === 'finish') {
        //   return {};
        // }

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

        // =========================================================================
        // BUILD SERVER-ONLY METADATA
        // =========================================================================
        // Use captured final usage from streamText's onFinish
        const serverMetadata: AssistantResponseMetadata = {
          // Client fields (will be merged from assistantMessage.metadata)
          model_data: { UIModelId, internalModelId, provider },
          hasAttachments: hasFiles,
          finishReason: finishReason || 'stop',

          // Server-only fields (accumulated during streaming)
          totalUsage: {
            totalUsedTokens: accumulatedUsage.totalUsedTokens + (streamOnFinishUsage?.totalTokens || 0),
            totalInputTokens: accumulatedUsage.totalInputTokens + (streamOnFinishUsage?.inputTokens || 0),
            totalOutputTokens: accumulatedUsage.totalOutputTokens + (streamOnFinishUsage?.outputTokens || 0),
            inputTokenDetails: (() => {
              const current = streamOnFinishUsage?.inputTokenDetails;
              const accumulated = accumulatedUsage.inputTokenDetails;
              if (!current && !accumulated) return undefined;
              return {
                noCacheTokens: (accumulated?.noCacheTokens || 0) + (current?.noCacheTokens || 0),
                cacheReadTokens: (accumulated?.cacheReadTokens || 0) + (current?.cacheReadTokens || 0),
                cacheWriteTokens: (accumulated?.cacheWriteTokens || 0) + (current?.cacheWriteTokens || 0),
              };
            })(),
            outputTokenDetails: (() => {
              const current = streamOnFinishUsage?.outputTokenDetails;
              const accumulated = accumulatedUsage.outputTokenDetails;
              if (!current && !accumulated) return undefined;
              return {
                textTokens: (accumulated?.textTokens || 0) + (current?.textTokens || 0),
                reasoningTokens: (accumulated?.reasoningTokens || 0) + (current?.reasoningTokens || 0),
              };
            })(),
          },
          stepCount: accumulatedStepCount + currentStepData.length,
          toolCallsCount: accumulatedToolCallsCount + currentStepData.reduce((acc, step) => acc + step.toolCallsCount, 0),
          toolsCalled: Array.from(accumulatedToolsCalled),
          step_data: [...previousStepData, ...currentStepData],
        };

        // Merge client metadata (from streaming) with server metadata. (defensive)
        // Cause server metadata already has all the fields needed.
        const clientMetadata: Record<string, unknown> = (assistantMessage.metadata as Record<string, unknown>) ?? {};
        const fullMetadata: AssistantResponseMetadata = {
          ...clientMetadata,
          ...serverMetadata,
        };

        // Save with enriched metadata
        if (isContinuation && lastMessageFromDB && lastMessageFromDB.sender_type === 'assistant') {
          await updateMessage(lastMessageFromDB.id, {
            content: assistantMessage.parts,
            metadata: fullMetadata,
          });
        } else {
          await saveAssistantMessage({
            conversationId,
            assistantMessage,
            metadata: fullMetadata,
            previousMessageId: lastMessageFromDB?.id || null,
          });
        }

        // =========================================================================
        // ALLOWANCE DEDUCTION
        // =========================================================================
        // Use the server metadata for cost calculation
        try {
          const totalUsage = serverMetadata.totalUsage;

          if (totalUsage && route) {
            const pricing = getModelPricing(route.provider, route.id);
            let cost = 0;

            if (!pricing) {
              console.error(`Pricing not found for model ${route.provider}/${route.id}`);
            } else {
              cost = calculateCostCents(
                totalUsage.totalInputTokens || 0,
                totalUsage.totalOutputTokens || 0,
                pricing
              );
              if (cost > 0) {
                await deductAllowance(clerkUserId, cost);
              }
            }

            // Log token usage for analytics
            try {
              await logMessageTokenUsage({
                messageId: assistantMessage.id,
                tokenUsage: totalUsage,
                modelInfo: { provider, UIModelId, internalModelId },
                totalCostCents: cost,
                pricingUsed: pricing ?? { input: 0, output: 0 },
              });
            } catch (logErr) {
              console.error('Failed to log token usage:', logErr);
            }
          }
        } catch (err) {
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
