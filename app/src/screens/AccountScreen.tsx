import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useSubscriptionStore, useIsPro } from '../store/useSubscriptionStore';
import { useToast } from '../app/ToastContext';

export function AccountScreen() {
  const nav = useNavigate();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const sub = useSubscriptionStore();
  const isPro = useIsPro();
  const { showToast } = useToast();

  const proLabel = !isPro
    ? 'Free plan'
    : sub.proUntil == null
      ? 'Pro · lifetime'
      : `Pro · until ${new Date(sub.proUntil).toLocaleDateString('en-IN')}`;

  return (
    <div className="safe-top space-y-5 px-4 pb-10 pt-3">
      <div className="flex items-center gap-2">
        <button onClick={() => nav(-1)} className="text-sm text-ink-muted">‹ Back</button>
        <h1 className="font-display text-xl font-extrabold">Account</h1>
      </div>

      {/* profile */}
      <section className="card flex items-center gap-4 p-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-saffron/15 font-display text-xl font-extrabold text-saffron">
          {(user?.name?.[0] ?? '?').toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold text-ink">{user?.name ?? 'Guest'}</p>
          {user?.email && <p className="truncate text-sm text-ink-muted">{user.email}</p>}
        </div>
      </section>

      {/* subscription */}
      <section className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-muted">Subscription</h2>
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${isPro ? 'bg-emerald/15 text-emerald-light' : 'bg-white/10 text-ink-muted'}`}>
            {isPro ? 'PRO' : 'FREE'}
          </span>
        </div>
        <p className="text-sm text-ink">{proLabel}</p>
        {sub.promoCode && isPro && <p className="mt-1 text-xs text-ink-faint">Code: {sub.promoCode}</p>}
        {!isPro ? (
          <button className="btn-primary mt-3 w-full" onClick={() => nav('/paywall')}>Upgrade to Pro</button>
        ) : (
          <button className="btn-ghost mt-3 w-full" onClick={() => { sub.cancel(); showToast('Switched to Free'); }}>
            Switch to Free
          </button>
        )}
      </section>

      {/* actions */}
      <section className="card divide-y divide-white/5">
        <Row label="Goals & targets" onClick={() => nav('/calculator')} />
        <Row label="Weekly insights" onClick={() => nav('/insights')} />
      </section>

      <button
        className="btn-ghost w-full text-red-400"
        onClick={() => { signOut(); showToast('Signed out'); }}
      >
        Sign out
      </button>
      <p className="text-center text-[11px] text-ink-faint">Signing out keeps your logged data on this device.</p>
    </div>
  );
}

function Row({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between p-4 text-left active:bg-white/5">
      <span className="text-sm text-ink">{label}</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6" /></svg>
    </button>
  );
}
