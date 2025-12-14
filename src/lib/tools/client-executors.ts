/**
 * Client-side tool executor registry
 * 
 * This module provides a centralized way to register and execute client-side tools.
 * Each tool should export its executor function and register it here.
 */

import { executeGetTime } from './executor/get-time-executor';
import { executeGetWeatherClient } from './executor/get-weather-client-executor';

/**
 * Type for a tool call from useChat's onToolCall callback
 */
export type ClientToolCall = {
  toolName: string;
  toolCallId: string;
  input: unknown;
  dynamic?: boolean;
};

/**
 * Type for a client-side tool executor function
 */
export type ClientToolExecutor<TInput = unknown, TOutput = unknown> = (
  input: TInput,
  toolCall: ClientToolCall
) => Promise<TOutput>;

/**
 * Registry of client-side tool executors
 * Add new tools here by importing their executor and registering it
 */
export const clientToolExecutors: Record<string, ClientToolExecutor> = {
  getTime: executeGetTime,
  getWeather: executeGetWeatherClient,
  // Add more client-side tool executors here as you create them
  // getLocation: executeGetLocation,
};

/**
 * Execute a client-side tool call
 * 
 * @param toolCall - The tool call from useChat's onToolCall callback
 * @returns The result of the tool execution, or null if the tool is not found
 */
export async function executeClientTool(
  toolCall: ClientToolCall
): Promise<{ output?: unknown; error?: { state: 'output-error'; errorText: string } } | null> {
  // Check if it's a dynamic tool
  if (toolCall.dynamic) {
    return null;
  }

  const executor = clientToolExecutors[toolCall.toolName];
  
  if (!executor) {
    // Tool not found in registry - return null to indicate it should be handled elsewhere
    return null;
  }

  try {
    const output = await executor(toolCall.input, toolCall);
    return { output };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      error: {
        state: 'output-error' as const,
        errorText: errorMessage,
      },
    };
  }
}
