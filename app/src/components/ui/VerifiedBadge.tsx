import type { VerificationStatus } from '../../types/food';

const META: Record<VerificationStatus, { label: string; cls: string; icon: 'check' | 'dot' | 'people' }> = {
  verified: { label: 'Verified', cls: 'border-emerald/30 bg-emerald/12 text-emerald-light', icon: 'check' },
  estimated: { label: 'Estimated', cls: 'border-saffron/30 bg-saffron/10 text-saffron', icon: 'dot' },
  community: { label: 'Community', cls: 'border-white/12 bg-white/[0.05] text-ink-muted', icon: 'people' },
};

// Trust badge for a food's data reliability. `compact` shows icon-only on cards.
export function VerifiedBadge({ status, compact = false }: { status: VerificationStatus; compact?: boolean }) {
  const m = META[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${m.cls}`}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {m.icon === 'check' && <path d="M5 12l5 5L20 7" />}
        {m.icon === 'dot' && <circle cx="12" cy="12" r="7" />}
        {m.icon === 'people' && <path d="M16 19a4 4 0 00-8 0M12 11a3 3 0 100-6 3 3 0 000 6z" />}
      </svg>
      {!compact && m.label}
    </span>
  );
}
