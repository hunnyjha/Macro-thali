import { useMemo } from 'react';
import { useLogStore } from '../../store/useLogStore';
import { useUiStore } from '../../store/useUiStore';
import { proteinGapSuggestions } from '../../lib/proteinGap';

// ── Macro Coach card ─────────────────────────────────────────────────────────
// Human, not a calculator. Turns the protein gap into a coach-style nudge plus
// 2–3 tappable Indian options, and a "View suggestions" button into the Coach.
export function GapCard({ onSelect }: { onSelect: (foodId: string) => void }) {
  const totals = useLogStore((s) => s.totals());
  const targets = useLogStore((s) => s.targets);
  const recents = useLogStore((s) => s.recents);
  const frequent = useLogStore((s) => s.frequent);
  const openCoach = useUiStore((s) => s.openCoach);

  const remPro = Math.round(targets.protein - totals.protein);
  const proteinDone = remPro <= 0;

  const suggestions = useMemo(
    () => proteinGapSuggestions(remPro, { used: [...frequent, ...recents], limit: 3 }),
    [remPro, frequent, recents],
  );

  // Human coaching line, e.g. "You're one scoop of whey away from your goal."
  const headline = proteinDone
    ? "You've hit your protein goal today — beautifully done. 🎉"
    : suggestions[0]
      ? `You're ${remPro}g short — about ${oneLine(suggestions[0].text)} away from your protein goal.`
      : `You're ${remPro}g of protein short for today.`;

  return (
    <section className="card overflow-hidden p-4">
      <div className="mb-2.5 flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald/15 text-lg">🍱</span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-light">Coach says</p>
          <p className="text-sm font-medium leading-snug text-ink">{headline}</p>
        </div>
      </div>

      {!proteinDone && suggestions.length > 0 && (
        <>
          <div className="space-y-2">
            {suggestions.map((s) => (
              <button key={s.foodId} onClick={() => onSelect(s.foodId)}
                className="flex w-full items-center gap-3 rounded-xl2 border border-white/[0.06] bg-charcoal-700 p-2.5 text-left active:scale-[0.99] transition-transform">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald/10 text-emerald-light">+</span>
                <p className="flex-1 truncate text-sm font-medium capitalize text-ink">{s.text}</p>
                <span className="text-xs font-semibold tabular-nums text-emerald-light">+{s.protein}g</span>
              </button>
            ))}
          </div>
          <button onClick={openCoach}
            className="mt-3 w-full rounded-xl2 border border-emerald/25 bg-emerald/10 py-2.5 text-sm font-semibold text-emerald-light active:scale-[0.99] transition-transform">
            View suggestions
          </button>
        </>
      )}
    </section>
  );
}

// "1 scoop whey" → "one scoop of whey"; keeps the headline conversational.
function oneLine(text: string): string {
  return text.replace(/^1\s+/, 'one ').replace(/^(\d+)\s+/, '$1 ');
}
