'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

export default function Page() {
  const [input, setInput] = useState('');
const { messages, sendMessage, status } = useChat({ id: 'almond-chat' });

  return (
    <main className="mx-auto flex h-screen max-w-2xl flex-col p-4">
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
    </main>
  );
}