import { mistral } from '@ai-sdk/mistral';
import { streamText, convertToModelMessages, UIMessage } from 'ai';

// Keep the model name in one place. We'll pin an explicit version later.
const MODEL = 'mistral-small-latest';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: mistral(MODEL),
    messages: await convertToModelMessages(messages),
    maxOutputTokens: 800, // cost safeguard, adjust later
  });

  return result.toUIMessageStreamResponse();
}