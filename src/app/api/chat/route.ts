import { streamText, convertToModelMessages, UIMessage } from 'ai';
import { google } from '@ai-sdk/google';
import { getTimeTool } from '@/lib/tools/tools';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: google('gemini-2.5-flash'),
    messages: convertToModelMessages(messages),
    system: `You are Lumy, a helpful AI assistant built with the AI SDK. 
             You are friendly, knowledgeable, and provide helpful responses.
             You can help with coding, writing, analysis, and answering questions.
             You have access to a getTime tool that can provide the current date and time.
             Always be respectful and helpful in your responses.`,
    tools: {
      getTime: getTimeTool,
    },
  });

  return result.toUIMessageStreamResponse();
}