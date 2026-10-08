'use client';

import { useChat } from '@ai-sdk/react';
import dynamic from 'next/dynamic';
import { useMemo, useRef, useState } from 'react';
import type { ChatMessage } from '@/lib/types';
import { waterFromTokens, formatMl, ML_PER_GALLON } from '@/lib/water';

const Jug3D = dynamic(() => import('@/components/Jug3D'), {
  ssr: false,
  loading: () => <div className="h-56" />,
});

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export default function Page() {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<FileList | undefined>();
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { messages, sendMessage, status, error } = useChat<ChatMessage>({
    id: 'almond-chat',
  });
  const busy = status !== 'ready';

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
    return { queries, inputTokens, outputTokens, totalTokens: inputTokens + outputTokens };
  }, [messages]);

  const water = waterFromTokens(totals.totalTokens);
  const fillPercent = Math.min((water.central / ML_PER_GALLON) * 100, 100);
  const gallonPercent = (water.central / ML_PER_GALLON) * 100;

  function chooseFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const total = Array.from(list).reduce((sum, f) => sum + f.size, 0);
    if (total > MAX_UPLOAD_BYTES) {
      setFileError('Attachments must total under 5 MB.');
      return;
    }
    setFileError(null);
    setFiles(list);
  }

  function clearFiles() {
    setFiles(undefined);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function submit() {
    if (busy) return;
    if (!input.trim() && !files?.length) return;
    sendMessage({ text: input, files });
    setInput('');
    clearFiles();
  }

  return (
         <main className="relative flex h-screen w-full justify-center px-10 py-8">
      {/* Chat */}
          <section className="flex h-full w-full max-w-3xl flex-col">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Almond Jug</h1>
          <p className="text-sm text-gray-500">A chat that shows the water behind every answer.</p>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto pr-2">
          {messages.length === 0 && (
            <p className="text-gray-500">
              Ask anything. The jug on the right fills as the conversation uses water.
            </p>
          )}
          {messages.map((m) => (
            <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : ''}>
              <div
                className={
                  m.role === 'user'
                    ? 'max-w-[80%] rounded-2xl rounded-br-sm bg-sky-100 px-4 py-2'
                    : 'max-w-[90%] leading-relaxed'
                }
              >
                {m.parts.map((part, i) => {
                  if (part.type === 'text') {
                    return <p key={i} className="whitespace-pre-wrap">{part.text}</p>;
                  }
                  if (part.type === 'file') {
                    return part.mediaType.startsWith('image/') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={part.url} alt={part.filename ?? 'attachment'} className="mt-2 max-h-48 rounded-lg" />
                    ) : (
                      <span key={i} className="mt-2 inline-block rounded bg-white/70 px-2 py-1 text-xs">
                        {part.filename ?? 'Attached file'}
                      </span>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          ))}
        </div>

        {error && <p className="mt-2 text-sm text-red-600">Something went wrong: {error.message}</p>}

        <form
          className="mt-4 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm focus-within:border-sky-400"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          {files && files.length > 0 && (
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
              {Array.from(files).map((f) => (
                <span key={f.name} className="rounded-full bg-gray-100 px-3 py-1">{f.name}</span>
              ))}
              <button type="button" onClick={clearFiles} className="text-gray-500 hover:text-gray-900">
                Remove
              </button>
            </div>
          )}

          <textarea
            className="w-full resize-none bg-transparent px-1 py-1 text-base outline-none"
            rows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Ask something, or attach an image or PDF"
            maxLength={2000}
          />

          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-gray-600 hover:text-gray-900"
              >
                Attach file
              </button>
                            <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                multiple
                className="hidden"
                onChange={(e) => chooseFiles(e.target.files)}
              />
              {fileError && <span className="text-red-600">{fileError}</span>}
            </div>

            <button
              type="submit"
              disabled={busy || (!input.trim() && !files?.length)}
              className="rounded-full bg-sky-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:opacity-40"
            >
              {busy ? 'Sending' : 'Send'}
            </button>
          </div>
        </form>
      </section>

      {/* Water panel */}
      {/* Water panel */}
      <aside className="absolute right-10 top-8 w-64">
        <div className="w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <Jug3D fillPercent={fillPercent} />

          <div className="mt-2 text-center">
            <div className="text-3xl font-semibold tabular-nums">{formatMl(water.central)}</div>
            <div className="mt-1 text-xs text-gray-500">
              {gallonPercent.toFixed(3)}% of a one-gallon jug
            </div>
          </div>

          <details className="mt-5 border-t border-gray-100 pt-4 text-sm">
            <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
              Session details
            </summary>
            <dl className="mt-3 space-y-2 text-gray-600">
              <div className="flex justify-between">
                <dt>Queries</dt>
                <dd className="tabular-nums">{totals.queries}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Input tokens</dt>
                <dd className="tabular-nums">{totals.inputTokens.toLocaleString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Output tokens</dt>
                <dd className="tabular-nums">{totals.outputTokens.toLocaleString()}</dd>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-2 font-medium text-gray-900">
                <dt>Total tokens</dt>
                <dd className="tabular-nums">{totals.totalTokens.toLocaleString()}</dd>
              </div>
            </dl>
          </details>
        </div>
      </aside>
    </main>
  );
}