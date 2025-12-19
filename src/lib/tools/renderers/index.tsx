'use client';

/**
 * Tool renderer registry
 * 
 * This module provides a centralized way to register tool renderers.
 * Each tool should export its renderer component and register it here.
 */

import React, { type ReactNode } from 'react';
import type { UIMessage } from 'ai';
import { GetTimeRenderer } from './GetTimeRenderer';
import { GetWeatherRenderer } from './GetWeatherRenderer';
import { WebSearchRenderer } from './WebSearchRenderer';

/**
 * Type for a tool renderer component
 * Uses the part type from UIMessage to ensure type compatibility
 */
export type ToolRenderer = (props: {
  part: UIMessage['parts'][number];
  isStreaming?: boolean;
}) => ReactNode | null;

/**
 * Registry of tool renderers
 * Add new tools here by importing their renderer and registering it
 */
export const toolRenderers: Record<string, ToolRenderer> = {
  'tool-getTime': GetTimeRenderer,
  'tool-getWeather': GetWeatherRenderer,
  'tool-webSearch': WebSearchRenderer,
  // Add more tool renderers here as you create them
  // 'tool-getLocation': GetLocationRenderer,
};

/**
 * Render a tool part using the appropriate renderer
 * 
 * @param part - The tool part from the message
 * @param isStreaming - Whether the message is currently streaming
 * @returns The rendered component or null if no renderer is found
 */
export function renderToolPart(
  part: UIMessage['parts'][number],
  isStreaming?: boolean
): ReactNode | null {
  if (part.type === 'dynamic-tool') {
    // Handle dynamic tools generically
    return (
      <div className="bg-muted/50 p-3 rounded-lg">
        <div className="text-sm font-medium">Tool: {part.toolName}</div>
        {part.state === 'input-streaming' && (
          <pre className="text-xs mt-2">{JSON.stringify(part.input, null, 2)}</pre>
        )}
        {part.state === 'output-available' && (
          <pre className="text-xs mt-2">{JSON.stringify(part.output, null, 2)}</pre>
        )}
        {part.state === 'output-error' && (
          <div className="text-destructive text-sm mt-2">Error: {part.errorText}</div>
        )}
      </div>
    );
  }

  const renderer = toolRenderers[part.type];
  
  if (!renderer) {
    // No renderer found - return null to indicate it should be handled elsewhere
    return null;
  }

  return renderer({ part, isStreaming });
}
