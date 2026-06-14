import { useLogStore } from '../../store/useLogStore';
import { LivingKatori } from '../ui/LivingKatori';
import { kcal, g } from '../../lib/format';

// Macro accent colours — protein leads (emerald), carbs amber, fat rose.
// Gold is reserved for CTAs/scan/selection, never for data.
const C_PROTEIN = '#1fb574';
const C_CARB = '#e3a13a';
const C_FAT = '#fb7185';

export function DailySummary() {
  const totals = useLogStore((s) => s.totals());
  const targets = useLogStore((s) => s.targets);
  const entries = useLogStore((s) => s.entries);

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
  const remaining = Math.max(targets.calories - totals.calories, 0);
  const over = totals.calories > targets.calories;
  const now = new Date();
  const dayPct = Math.round(((now.getHours() * 60 + now.getMinutes()) / (24 * 60)) * 100);

  const remPro = Math.round(targets.protein - totals.protein);
  const proDone = remPro <= 0;
  const proPct = targets.protein > 0 ? Math.min((totals.protein / targets.protein) * 100, 100) : 0;
  const proLine = proDone
    ? 'Protein goal smashed — strong day. 💪'
    : remPro <= 20
      ? `Almost there — about ${remPro}g to go. 💪`
      : `${remPro}g to go — anchor it at your next meal.`;

  return (
    <div className="space-y-3">
      {/* ── Living Katori hero ── */}
      <section className="card-hero mx-4 mt-3 p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">Today’s Katori · {today}</p>
          <span className="rounded-full border border-white/5 bg-white/[0.04] px-2.5 py-1 text-[11px] text-ink-muted">
            {entries.length} item{entries.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <LivingKatori value={totals.calories} target={targets.calories} />
          <div className="min-w-0 flex-1">
            <p className="font-display text-[34px] font-extrabold leading-none tracking-tightish">
              {over ? `+${kcal(totals.calories - targets.calories)}` : kcal(remaining)}
            </p>
            <p className="mt-1 text-xs font-medium" style={{ color: over ? C_FAT : '#cfd3da' }}>
              {over ? 'kcal over budget' : 'kcal left'}
            </p>
            <p className="mt-1 text-[11px] text-ink-faint">{kcal(totals.calories)} of {kcal(targets.calories)} kcal</p>
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-[10px] text-ink-faint">
                <span>Day progress</span><span className="tabular-nums">{dayPct}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full bg-white/25" style={{ width: `${dayPct}%` }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Protein-first card ── */}
      <section className="mx-4 rounded-xl2 border border-emerald/20 bg-emerald/[0.05] p-4 shadow-glow-emerald">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-light">Protein left</p>
            <p className="mt-0.5 font-display text-[30px] font-extrabold leading-none text-ink">
              {proDone ? <span className="text-emerald-light">Done ✓</span> : <>{g(remPro)}<span className="text-base font-bold text-ink-muted">g</span></>}
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-base font-bold tabular-nums text-ink">{g(totals.protein)}<span className="text-ink-faint">/{g(targets.protein)}g</span></p>
            <p className="text-[10px] text-ink-faint">daily goal</p>
          </div>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${proPct}%`, backgroundColor: C_PROTEIN }} />
        </div>
        <p className="mt-2 text-xs text-ink-muted">{proLine}</p>
      </section>

      {/* ── Macro mini-cards (secondary) ── */}
      <div className="mx-4 grid grid-cols-2 gap-3">
        <MiniMacro label="Carbs" value={totals.carbs} target={targets.carbs} color={C_CARB} />
        <MiniMacro label="Fat" value={totals.fat} target={targets.fat} color={C_FAT} />
      </div>
    </div>
  );
}

function MiniMacro({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0;
  return (
    <div className="card p-3.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="mt-1 font-display text-lg font-extrabold tabular-nums text-ink">
        {g(value)}<span className="text-xs font-semibold text-ink-faint"> / {g(target)}g</span>
      </p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
