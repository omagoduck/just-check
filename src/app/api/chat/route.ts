import { streamText, convertToModelMessages, UIMessage } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { getTimeTool } from '@/lib/tools/tools';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openrouter.chat('z-ai/glm-4.5-air:free'),
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