import { useEffect, useState } from 'react';
import { useWeightStore } from '../../store/useWeightStore';
import { useToast } from '../../app/ToastContext';
import { LineChart } from '../ui/LineChart';

export function WeightSection() {
  const entries = useWeightStore((s) => s.entries);
  const loaded = useWeightStore((s) => s.loaded);
  const load = useWeightStore((s) => s.load);
  const logWeight = useWeightStore((s) => s.logWeight);
  const { showToast } = useToast();
  const [val, setVal] = useState('');

  useEffect(() => { if (!loaded) load(); }, [loaded, load]);

  const latest = entries[entries.length - 1];
  const first = entries[0];
  const change = latest && first ? Math.round((latest.kg - first.kg) * 10) / 10 : 0;

  const save = async () => {
    const kg = parseFloat(val);
    if (!kg || kg < 25 || kg > 300) { showToast('Enter a weight in kg'); return; }
    await logWeight(kg);
    setVal('');
    showToast('Weight logged');
  };

  return (
    <section className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">Weight</h2>
        {latest && (
          <span className="text-xs text-ink-faint">
            {latest.kg} kg{entries.length > 1 && (
              <span className={change <= 0 ? 'text-emerald-light' : 'text-saffron'}> · {change > 0 ? '+' : ''}{change} kg</span>
            )}
          </span>
        )}
      </div>

      {entries.length >= 2 ? (
        <LineChart points={entries.map((e) => ({ label: e.date, value: e.kg }))} color="#36d995" />
      ) : (
        <p className="py-3 text-center text-xs text-ink-faint">Log your weight a few times to see your trend.</p>
      )}

      <div className="mt-3 flex gap-2">
        <input
          type="number" inputMode="decimal" value={val} onChange={(e) => setVal(e.target.value)}
          placeholder="Today's weight (kg)"
          className="flex-1 rounded-xl2 border border-white/10 bg-charcoal-700 px-3 py-2.5 text-center text-ink placeholder:text-ink-faint focus:border-saffron/60 focus:outline-none"
        />
        <button className="btn-primary px-5" onClick={save}>Log</button>
      </div>
    </section>
  );
}
