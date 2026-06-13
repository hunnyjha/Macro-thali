import { useEffect, useState } from 'react';
import { useLogStore } from '../../store/useLogStore';
import { useToast } from '../../app/ToastContext';
import { getCoachContext, adaptiveReview, type AdaptiveReview } from '../../lib/coach';

// Phase 3: every-week review. Detects stalls and proposes a change the user must
// approve — targets are never changed automatically.
export function AdaptiveCard() {
  const targets = useLogStore((s) => s.targets);
  const setTargets = useLogStore((s) => s.setTargets);
  const entries = useLogStore((s) => s.entries);
  const { showToast } = useToast();
  const [rev, setRev] = useState<AdaptiveReview | null>(null);
  const [applied, setApplied] = useState(false);

  useEffect(() => { getCoachContext().then((ctx) => setRev(adaptiveReview(ctx))); }, [targets, entries]);

  if (!rev || !rev.show) return null;

  const apply = () => {
    if (!rev.deltaKcal) return;
    const calories = Math.max(1200, targets.calories + rev.deltaKcal);
    const carbs = Math.max(0, Math.round((calories - targets.protein * 4 - targets.fat * 9) / 4));
    setTargets({ ...targets, calories, carbs });
    setApplied(true);
    showToast(`Daily target updated to ${calories} kcal`);
  };

  return (
    <section className={`card p-4 ${rev.stall ? 'border-saffron/30' : ''}`}>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-base">{rev.stall ? '🧭' : '📅'}</span>
        <h2 className="font-display text-base font-bold">{rev.title}</h2>
      </div>
      <div className="space-y-1.5">
        {rev.lines.map((l, i) => <p key={i} className="text-sm text-ink-muted">{l}</p>)}
      </div>
      {rev.suggestionLabel && rev.deltaKcal != null && (
        <button className="btn-primary mt-3 w-full" onClick={apply} disabled={applied}>
          {applied ? '✓ Applied' : `${rev.suggestionLabel} (tap to approve)`}
        </button>
      )}
    </section>
  );
}
