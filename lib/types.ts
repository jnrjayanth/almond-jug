import type { UIMessage } from 'ai';

export type UsageMetadata = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  model?: string;
};

export type ChatMessage = UIMessage<UsageMetadata>;