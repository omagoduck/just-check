import { streamText, convertToModelMessages, UIMessage } from 'ai';
import { getTimeTool, getWeatherTool, webSearchTool, viewWebsiteTool } from '@/lib/tools';
import { chatRatelimit } from '@/lib/ratelimit';
import { NextResponse } from 'next/server';
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
import { getRemainingAllowance, deductAllowance, getModelPricing, calculateCost } from '@/lib/allowance';
import { buildSystemPrompt } from '@/lib/system-prompt';
import { DEFAULT_AI_CUSTOMIZATION_SETTINGS, type AICustomizationSettings } from '@/types/settings';
import { getSupabaseAdminClient } from '@/lib/supabase-client';
import { resolveMessagesAttachments } from '@/lib/storage/attachment-resolver';

// Import raw executors for tool charging
import { executeWebSearch } from '@/lib/tools/executor/web-search-executor';
import { executeViewWebsite } from '@/lib/tools/executor/view-website-executor';

// Import tool input types
import type { WebSearchInput } from '@/lib/tools/web-search';
import type { ViewWebsiteInput } from '@/lib/tools/view-website';

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { success } = await chatRatelimit.limit(clerkUserId);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
    }

    const { messages, id: conversationId, UIModelId } = await req.json();

    // Verify conversation ownership
    const supabase = getSupabaseAdminClient();
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
    }

    // Get the last message from the client
    const lastMessageInArray = messages[messages.length - 1];
    const isNewUserTurn = lastMessageInArray.role === 'user';

    // Only check allowance for new user messages, not continuations (tool results)
    if (isNewUserTurn) {
      const remainingAllowance = await getRemainingAllowance(clerkUserId);
      if (remainingAllowance <= 0) {
        return NextResponse.json({ error: 'Insufficient allowance' }, { status: 402 });
      }
    }

    // Calculate Routing Context
    const hasImages = messages.some((m: UIMessage) =>
      m.parts.some(p => p.type === 'file' && p.mediaType.startsWith('image/'))
    );

    const hasFiles = messages.some((m: UIMessage) =>
      m.parts.some(p => p.type === 'file')
    );

    // Resolve the UI Model to a technical route using the context
    const route = resolveModelRoute(UIModelId, { hasImages });
    
    // Create the model instance using the route
    const modelInstance = getLanguageModel(route);

    // Get model info for metadata
    const internalModelId = route.id;
    const provider = route.provider;

    // Extract provider options for streamText (e.g., for thinking mode)
    // Format: { openrouter: { reasoning: { type: 'enabled' } } }
    const providerOptions = route.providerOptions;

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

    let streamOnFinishUsage: { totalTokens?: number; inputTokens?: number; outputTokens?: number; inputTokenDetails?: any; outputTokenDetails?: any } | undefined;

    // =========================================================================
    // RESOLVE ATTACHMENT URLs (NEW STEP)
    // =========================================================================
    // Convert attachment:// URLs to fresh signed URLs before sending to AI
    const attachmentResolvedMessages = await resolveMessagesAttachments(messages, clerkUserId);
    
    const modelMessages = await convertToModelMessages(attachmentResolvedMessages, {
      // safety net for incomplete tool calls. incomplete tool call may cause errors. 
      // TODO: take a look if our model provider supports incomplete tool calls. cause many returns error. right now ignoring is okay and safe.
      ignoreIncompleteToolCalls: true
    });

    // Build personalized system prompt from user settings
    const systemPrompt = buildSystemPrompt(userAISettings);

    // Generate assistant message ID upfront for tool charging
    // For new user turns: generate new ID
    // For continuations: reuse existing ID from last assistant message, or generate new if not found
    const assistantMessageId = isNewUserTurn 
      ? uuidv4() 
      : lastMessageFromDB?.id ?? uuidv4();

    // Create wrapped tools with user context for charging
    const tools = {
      // Client side tools (made disabled due to some issue need to be considered)
      // TODO: consider what will happen if user get's disconnected. what is user doesn't send back result. also what about charging.
      // getTime: getTimeTool, // No charging for it.
      // getWeather: getWeatherTool, // It is costly and will be charged but it's a client tool. It need to be handled carefully.
      
      // Server side tools with charging via thin wrappers
      webSearch: {
        ...webSearchTool,
        execute: async (input: WebSearchInput) =>
          await executeWebSearch(input, clerkUserId, assistantMessageId)
      },
      viewWebsite: {
        ...viewWebsiteTool,
        execute: async (input: ViewWebsiteInput) =>
          await executeViewWebsite(input, clerkUserId, assistantMessageId)
      }
    };

    const result = streamText({
      model: modelInstance,
      messages: modelMessages,
      system: systemPrompt,
      tools,
      providerOptions,

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
      generateMessageId: () => assistantMessageId,
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
        // Use streamOnFinishUsage for cost calculation (only current request tokens)
        // Do NOT use accumulated total - that would cause double-charging!
        try {

          if (streamOnFinishUsage && route) {
            const pricing = getModelPricing(route.provider, route.id);
            let cost = 0;

            if (!pricing) {
              console.error(`Pricing not found for model ${route.provider}/${route.id}`);
            } else {
              cost = calculateCost(
                streamOnFinishUsage.inputTokens || 0,
                streamOnFinishUsage.outputTokens || 0,
                pricing
              );
              if (cost > 0) {
                await deductAllowance(clerkUserId, cost);
              }
            }

            // Log token usage for analytics
            try {
              const currentUsageTotal: TotalUsage = {
                totalUsedTokens: streamOnFinishUsage.totalTokens || 0,
                totalInputTokens: streamOnFinishUsage.inputTokens || 0,
                totalOutputTokens: streamOnFinishUsage.outputTokens || 0,
                inputTokenDetails: streamOnFinishUsage.inputTokenDetails,
                outputTokenDetails: streamOnFinishUsage.outputTokenDetails,
              };
              await logMessageTokenUsage({
                messageId: assistantMessage.id,
                tokenUsage: currentUsageTotal,
                modelInfo: { provider, UIModelId, internalModelId },
                totalCost: cost,
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
    return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 });
  }
}
