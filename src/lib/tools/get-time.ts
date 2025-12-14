import { z } from 'zod';

// Type definitions for getTime tool
export interface GetTimeInput {
  timezone?: string;
}

export interface GetTimeOutput {
  time: string;
  timezone: string;
  iso: string;
}

// Client-side tool that gets the current time
export const getTimeTool = {
  description: 'Get the current date and time',
  inputSchema: z.object({
    timezone: z.string().optional().describe('Optional timezone (e.g., "Asia/Dhaka", "UTC")'),
  }) as z.ZodType<GetTimeInput>,
};