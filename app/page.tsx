'use client';

import { useChat } from '@ai-sdk/react';
import { useMemo, useState } from 'react';
import type { ChatMessage } from '@/lib/types';
import dynamic from 'next/dynamic';
import { waterFromTokens, formatMl, DISPLAY_CAPACITY_ML, ML_PER_GALLON } from '@/lib/water';

const Jug3D = dynamic(() => import('@/components/Jug3D'), {
  ssr: false,
  loading: () => <div className="h-64" />,
});
export default function Page() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status, error } = useChat<ChatMessage>({
    id: 'almond-chat',
  });

  // Session totals are derived from the usage attached to each reply.
  const totals = useMemo(() => {

    let queries = 0;
    let inputTokens = 0;
    let outputTokens = 0;
    for (const m of messages) {
      if (m.role === 'assistant' && m.metadata?.totalTokens !== undefined) {
        queries += 1;
        inputTokens += m.metadata.inputTokens ?? 0;
        outputTokens += m.metadata.outputTokens ?? 0;
      }
    }
    return {
      queries,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
    };
  }, [messages]);

  const water = waterFromTokens(totals.totalTokens);
  const jugFillPercent = Math.min((water.central /ML_PER_GALLON) * 100, 100);
  const gallonPercent = (water.central / ML_PER_GALLON) * 100;


  return (
    <main className="mx-auto flex h-screen max-w-4xl gap-4 p-4">
      <section className="flex flex-1 flex-col">
        <h1 className="mb-4 text-xl font-semibold">Almond Jug Chat</h1>

        <div className="flex-1 space-y-3 overflow-y-auto">
          {messages.map((m) => (
            <div key={m.id}>
              <div className="text-xs text-gray-500">
                {m.role === 'user' ? 'You' : 'AI'}
              </div>
              <div className="whitespace-pre-wrap">
                {m.parts.map((part, i) =>
                  part.type === 'text' ? <span key={i}>{part.text}</span> : null
                )}
              </div>
            </div>
          ))}
        </div>

        {error && <p className="mt-2 text-red-600">Error: {error.message}</p>}

        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!input.trim()) return;
            sendMessage({ text: input });
            setInput('');
          }}
        >
          <input
            className="flex-1 rounded border p-2"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask something..."
            maxLength={1000}
          />
          <button
            className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
            disabled={status !== 'ready'}
          >
            Send
          </button>
        </form>
      </section>

      <aside className="w-72 shrink-0 rounded border p-4 text-sm">
       <Jug3D fillPercent={jugFillPercent} />
       <div className="mb-4 text-center">
        <div className="text-2xl font-semibold">{formatMl(water.central)}</div>
        <div className="text-xs text-gray-500">
          est. range {formatMl(water.low)} – {formatMl(water.high)}
        </div>
        <div className="mt-1 text-xs text-gray-500">
          {gallonPercent.toFixed(3)}% of a one-gallon jug
        </div>
      </div>
      
        <h2 className="mb-3 font-semibold">Session usage</h2>
        <dl className="space-y-2">
          <div className="flex justify-between">
            <dt>Queries</dt>
            <dd>{totals.queries}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Input tokens</dt>
            <dd>{totals.inputTokens}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Output tokens</dt>
            <dd>{totals.outputTokens}</dd>
          </div>
          <div className="flex justify-between border-t pt-2 font-semibold">
            <dt>Total tokens</dt>
            <dd>{totals.totalTokens}</dd>
          </div>
        </dl>
      </aside>
    </main>
  );
}