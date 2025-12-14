/**
 * Client-side executor for the getTime tool
 */

import type { GetTimeInput, GetTimeOutput } from '../get-time';
import type { ClientToolCall } from '../client-executors';

/**
 * Execute the getTime tool on the client side
 */
export async function executeGetTime(
  input: unknown,
  toolCall: ClientToolCall
): Promise<GetTimeOutput> {
  const typedInput = input as GetTimeInput;
  const timezone = typedInput.timezone || 'Asia/Dhaka';
  
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

  return {
    time: timeString,
    timezone: timezone,
    iso: now.toISOString(),
  };
}

