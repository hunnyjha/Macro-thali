import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet } from '../ui/Sheet';
import { useData } from '../../app/DataContext';
import { useAiSettings } from '../../store/useAiSettings';
import { getProvider } from '../../ai/providers';
import type { FoodPrediction, VisionDeps } from '../../ai/types';

type Phase = 'idle' | 'loading' | 'result' | 'error';

// AI Food Scanner. Real recognition via Gemini whenever a key is configured;
// never shows random/demo predictions. Never auto-logs — a chosen prediction
// opens the normal food detail sheet (serving size + confirm) via onPick.
export function FoodScanSheet({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (foodId: string) => void }) {
  const { search } = useData();
  const geminiKey = useAiSettings((s) => s.geminiKey);
  const nav = useNavigate();

  const [phase, setPhase] = useState<Phase>('idle');
  const [preview, setPreview] = useState<string | null>(null);
  const [preds, setPreds] = useState<FoodPrediction[]>([]);
  const [note, setNote] = useState<string | undefined>();
  const [error, setError] = useState('');
  const [needsKey, setNeedsKey] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => { setPhase('idle'); setPreview(null); setPreds([]); setError(''); setNote(undefined); setNeedsKey(false); };
  const close = () => { reset(); onClose(); };

  const deps: VisionDeps = {
    sampleFoods: () => [], // unused: scanner never shows demo/random foods
    matchFood: (name) => { const hit = search.search(name, {}, 1)[0]; return hit ? { id: hit.id, name: hit.name } : null; },
  };

  const onFile = async (file: File) => {
    const key = geminiKey.trim();
    console.log('[scan] gemini key present:', !!key, '| length:', key.length);
    setPreview(URL.createObjectURL(file));
    setError('');
    if (!key) {
      // No real AI configured → proper error, never fake predictions.
      setNeedsKey(true);
      setError('Real photo recognition needs a free Gemini API key.');
      setPhase('error');
      return;
    }
    setPhase('loading');
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(String(fr.result));
        fr.onerror = () => reject(new Error('Could not read the image.'));
        fr.readAsDataURL(file);
      });
      const base64 = dataUrl.split(',')[1] ?? '';
      const provider = getProvider('gemini'); // use real AI automatically when key exists
      const result = await provider.analyze({ base64, mime: file.type || 'image/jpeg' }, deps, { apiKey: key });
      console.log('[scan] predictions parsed:', result.predictions.length, result.predictions);
      if (!result.predictions.length) throw new Error('No food or product detected. Try a clearer, closer photo of the item or its label.');
      setPreds(result.predictions);
      setNote(result.note);
      setPhase('result');
    } catch (e) {
      console.error('[scan] failed:', e);
      setNeedsKey(false);
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setPhase('error');
    }
  };

  const pick = (p: FoodPrediction) => {
    const id = p.foodId ?? deps.matchFood(p.name)?.id;
    if (!id) { setNeedsKey(false); setError(`Recognised “${p.name}”, but it isn’t in the database yet. Search to log a close match.`); setPhase('error'); return; }
    close();
    onPick(id);
  };

  return (
    <Sheet open={open} onClose={close} title="Scan Food">
      <div className="space-y-4">
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        <input id="mk-gallery" type="file" accept="image/*" className="hidden"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />

        {preview && (
          <div className="overflow-hidden rounded-xl2 border border-white/[0.06]">
            <img src={preview} alt="meal" className="h-44 w-full object-cover" />
          </div>
        )}

        {phase === 'idle' && (
          <>
            <div className="rounded-xl2 border border-dashed border-white/12 p-6 text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-saffron/15">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f5a623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8a2 2 0 012-2h2l1-2h8l1 2h2a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><circle cx="12" cy="13" r="3.2" /></svg>
              </div>
              <p className="text-sm text-ink-muted">Take or upload a photo of your meal. We’ll suggest the top matches — you confirm before logging.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button className="btn-primary" onClick={() => fileRef.current?.click()}>📷 Camera</button>
              <button className="btn-ghost" onClick={() => document.getElementById('mk-gallery')?.click()}>🖼️ Gallery</button>
            </div>
          </>
        )}

        {phase === 'loading' && (
          <div className="space-y-2">
            <p className="text-center text-sm text-ink-muted">Analyzing your meal…</p>
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl2 border border-white/[0.06] bg-charcoal-700 p-3">
                <div className="h-9 w-9 animate-pulse rounded-full bg-white/10" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-2/3 animate-pulse rounded bg-white/10" />
                  <div className="h-2 w-1/3 animate-pulse rounded bg-white/[0.06]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {phase === 'result' && (
          <>
            <p className="text-sm font-semibold text-ink">Is it one of these?</p>
            <div className="space-y-2">
              {preds.map((p, i) => (
                <button key={i} onClick={() => pick(p)}
                  className="flex w-full items-center gap-3 rounded-xl2 border border-white/[0.06] bg-charcoal-700 p-3 text-left active:scale-[0.99] transition-transform">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-saffron/15 font-display text-sm font-bold text-saffron">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{p.name}</p>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                      <div className="h-full rounded-full bg-emerald" style={{ width: `${Math.round(p.confidence * 100)}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-ink-muted">{Math.round(p.confidence * 100)}%</span>
                </button>
              ))}
            </div>
            {note && <p className="text-[11px] text-ink-faint">{note}</p>}
            <button className="btn-ghost w-full" onClick={reset}>Retake photo</button>
          </>
        )}

        {phase === 'error' && (
          <div className="space-y-3 text-center">
            <p className="text-sm text-ink-muted">{error}</p>
            {needsKey ? (
              <>
                <button className="btn-primary w-full" onClick={() => { close(); nav('/account'); }}>Add Gemini key in Account</button>
                <p className="text-[11px] text-ink-faint">Get a free key at aistudio.google.com → API keys. Stored only on this device.</p>
                <button className="btn-ghost w-full" onClick={close}>Search manually instead</button>
              </>
            ) : (
              <>
                <button className="btn-primary w-full" onClick={reset}>Try again</button>
                <button className="btn-ghost w-full" onClick={close}>Search manually instead</button>
              </>
            )}
          </div>
        )}
      </div>
    </Sheet>
  );
}
