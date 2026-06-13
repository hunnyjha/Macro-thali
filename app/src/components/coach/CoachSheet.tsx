import { useEffect, useRef, useState } from 'react';
import { Sheet } from '../ui/Sheet';
import { useCoachStore } from '../../store/useCoachStore';

const PROMPTS = ['I need protein', 'What should I eat?', 'How much is left today?', "Why isn't my weight changing?"];

export function CoachSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const messages = useCoachStore((s) => s.messages);
  const loading = useCoachStore((s) => s.loading);
  const send = useCoachStore((s) => s.send);
  const clear = useCoachStore((s) => s.clear);
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading, open]);

  const submit = (t: string) => { const v = t.trim(); if (!v || loading) return; setText(''); send(v); };

  return (
    <Sheet open={open} onClose={onClose} title="Macro Coach">
      <div className="flex max-h-[70vh] flex-col">
        <div className="min-h-[180px] flex-1 space-y-3 overflow-y-auto pb-2">
          {messages.length === 0 && (
            <div className="rounded-xl2 border border-white/[0.06] bg-charcoal-700 p-4 text-center">
              <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-saffron/15 text-xl">🍱</div>
              <p className="text-sm text-ink-muted">Hi! I’m your Macro Coach. Ask me about your macros, meals, or progress.</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm ${m.role === 'user' ? 'bg-saffron text-charcoal-900' : 'border border-white/[0.06] bg-charcoal-700 text-ink'}`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-white/[0.06] bg-charcoal-700 px-4 py-3">
                <span className="inline-flex gap-1">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-ink-faint" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-ink-faint" style={{ animationDelay: '0.15s' }} />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-ink-faint" style={{ animationDelay: '0.3s' }} />
                </span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* suggested prompts */}
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-2">
          {PROMPTS.map((p) => (
            <button key={p} onClick={() => submit(p)} className="chip shrink-0">{p}</button>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit(text)}
            placeholder="Ask your coach…"
            className="input-surface flex-1 px-3.5 py-3 text-sm"
          />
          <button className="btn-primary px-4" onClick={() => submit(text)} disabled={loading || !text.trim()} aria-label="Send">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
          </button>
        </div>
        {messages.length > 0 && (
          <button onClick={clear} className="mt-2 text-center text-[11px] text-ink-faint">Clear chat history</button>
        )}
      </div>
    </Sheet>
  );
}
