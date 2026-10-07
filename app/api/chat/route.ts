import { mistral } from '@ai-sdk/mistral';
import { streamText, convertToModelMessages } from 'ai';
import type { ChatMessage } from '@/lib/types';

// Keep the model name in one place. We'll pin an explicit version later.
const MODEL = 'mistral-small-latest';

export async function POST(req: Request) {
  const { messages }: { messages: ChatMessage[] } = await req.json();

  const result = streamText({
    model: mistral(MODEL),
    messages: await convertToModelMessages(messages),
    maxOutputTokens: 800,
    maxRetries: 0,
  });

  return result.toUIMessageStreamResponse({
    // Attach token usage to the message once the response finishes.
    messageMetadata: ({ part }) => {
      if (part.type === 'finish') {
        return {
          inputTokens: part.totalUsage.inputTokens,
          outputTokens: part.totalUsage.outputTokens,
          totalTokens: part.totalUsage.totalTokens,
          model: MODEL,
        };
      }
    },
  });
}