import { useNavigate } from 'react-router-dom';

// Friendly lock shown in place of a Pro-only feature.
export function UpgradeGate({ title, desc }: { title: string; desc: string }) {
  const nav = useNavigate();
  return (
    <div className="mx-4 mt-4 rounded-xl2 border border-saffron/25 bg-saffron/5 p-6 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-saffron/15">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f5a623" strokeWidth="2" strokeLinecap="round">
          <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" />
        </svg>
      </div>
      <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
      <p className="mx-auto mt-1 max-w-xs text-sm text-ink-muted">{desc}</p>
      <button className="btn-primary mt-4 w-full max-w-xs" onClick={() => nav('/paywall')}>Unlock with Pro</button>
      <p className="mt-2 text-[11px] text-ink-faint">Have a promo code? Enter it on the next screen.</p>
    </div>
  );
}
