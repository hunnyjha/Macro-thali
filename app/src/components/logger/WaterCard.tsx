import { useWaterStore } from '../../store/useWaterStore';

export function WaterCard() {
  const glasses = useWaterStore((s) => s.glasses);
  const goal = useWaterStore((s) => s.goal);
  const inc = useWaterStore((s) => s.inc);
  const dec = useWaterStore((s) => s.dec);

  return (
    <section className="card mx-4 flex items-center gap-3 p-4">
      <div className="flex-1">
        <p className="text-sm font-semibold text-ink">💧 Water</p>
        <p className="text-xs text-ink-faint">{glasses} of {goal} glasses</p>
        <div className="mt-2 flex gap-1">
          {Array.from({ length: goal }).map((_, i) => (
            <button
              key={i}
              onClick={() => useWaterStore.getState().set(i + 1 === glasses ? i : i + 1)}
              className={`h-6 flex-1 rounded-md transition-colors ${i < glasses ? 'bg-sky-400/80' : 'bg-white/8'}`}
              aria-label={`Set ${i + 1} glasses`}
            />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <button onClick={inc} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg font-bold text-ink active:scale-90">＋</button>
        <button onClick={dec} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg font-bold text-ink active:scale-90">－</button>
      </div>
    </section>
  );
}
