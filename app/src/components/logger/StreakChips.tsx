import { useEffect, useState } from 'react';
import { useLogStore } from '../../store/useLogStore';
import { computeStreaks } from '../../lib/insights';

// Daily + protein streaks, surfaced on the Log screen for habit formation.
export function StreakChips() {
  const targets = useLogStore((s) => s.targets);
  const entries = useLogStore((s) => s.entries);
  const [streaks, setStreaks] = useState({ daily: 0, protein: 0 });

  useEffect(() => {
    computeStreaks(targets).then(setStreaks);
  }, [targets, entries]);

  if (streaks.daily === 0 && streaks.protein === 0) return null;

  return (
    <div className="flex gap-2 px-4">
      {streaks.daily > 0 && (
        <span className="inline-flex items-center gap-1 rounded-full bg-saffron/15 px-3 py-1 text-xs font-semibold text-saffron">
          🔥 {streaks.daily}-day streak
        </span>
      )}
      {streaks.protein > 0 && (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald/15 px-3 py-1 text-xs font-semibold text-emerald-light">
          💪 {streaks.protein}-day protein
        </span>
      )}
    </div>
  );
}
