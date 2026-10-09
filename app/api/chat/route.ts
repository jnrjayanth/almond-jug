import { mistral } from '@ai-sdk/mistral';
import { streamText, convertToModelMessages } from 'ai';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { ChatMessage } from '@/lib/types';
import { MODEL_ID } from '@/lib/water';

export const maxDuration = 30;

const MAX_BODY_CHARS = 7_000_000; // ~5 MB of base64 attachment plus overhead
const MAX_TEXT_CHARS = 2000;
const MAX_MESSAGES = 40;

// Built once per instance, not per request.
// Falls back to no limiting when Redis isn't configured (local dev).
const ratelimit = process.env.UPSTASH_REDIS_REST_URL
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(8, '1 m'),
      prefix: 'almond-jug',
      analytics: true,
    })
  : null;

function clientIp(req: Request) {
  // Vercel injects x-forwarded-for; there is no request.ip.
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
}

function fail(message: string, status: number, headers?: HeadersInit) {
  return Response.json({ error: message }, { status, headers });
}

export async function POST(req: Request) {
  if (ratelimit) {
    const { success, reset } = await ratelimit.limit(clientIp(req));
    if (!success) {
      const wait = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
      return fail(`Too many messages. Try again in ${wait} seconds.`, 429, {
        'Retry-After': String(wait),
      });
    }
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY_CHARS) {
    return fail('That request is too large. Keep attachments under 5 MB.', 413);
  }

  let messages: ChatMessage[];
  try {
    ({ messages } = JSON.parse(raw));
  } catch {
    return fail('Could not read that request.', 400);
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return fail('No messages to send.', 400);
  }
  if (messages.length > MAX_MESSAGES) {
    return fail('This conversation is too long. Start a new session.', 400);
  }

  const overlong = messages.some((m) =>
    m.parts?.some((p) => p.type === 'text' && p.text.length > MAX_TEXT_CHARS)
  );
  if (overlong) {
    return fail(`Messages must stay under ${MAX_TEXT_CHARS} characters.`, 400);
  }

  const result = streamText({
    model: mistral(MODEL_ID),
    messages: await convertToModelMessages(messages),
    maxOutputTokens: 800,
    maxRetries: 0,
  });

  return result.toUIMessageStreamResponse({
    messageMetadata: ({ part }) => {
      if (part.type === 'finish') {
        return {
          inputTokens: part.totalUsage.inputTokens,
          outputTokens: part.totalUsage.outputTokens,
          totalTokens: part.totalUsage.totalTokens,
          model: MODEL_ID,
        };
      }
    },
    onError: (error) => {
      console.error(error);
      return 'The model could not answer that. Try again in a moment.';
    },
  });
}