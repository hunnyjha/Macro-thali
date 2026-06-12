import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionStore, useIsPro } from '../store/useSubscriptionStore';
import { useToast } from '../app/ToastContext';

const PRO_FEATURES = [
  { icon: '📊', title: 'Weekly & Monthly Insights', desc: 'Trends, streaks and smart tips' },
  { icon: '⚖️', title: 'Weight tracking + graphs', desc: 'See your progress over time' },
  { icon: '🎙️', title: 'Voice & natural-language logging', desc: '“2 roti aur dahi” → logged' },
  { icon: '🍱', title: 'Unlimited saved meals', desc: 'Save every combo you eat' },
];

export function PaywallScreen() {
  const nav = useNavigate();
  const redeem = useSubscriptionStore((s) => s.redeem);
  const isPro = useIsPro();
  const { showToast } = useToast();
  const [code, setCode] = useState('');

  const onRedeem = () => {
    const res = redeem(code);
    showToast(res.message);
    if (res.ok) nav(-1);
  };

  return (
    <div className="safe-top space-y-6 px-5 pb-10 pt-4">
      <button onClick={() => nav(-1)} className="text-sm text-ink-muted">‹ Back</button>

      <div className="text-center">
        <span className="inline-block rounded-full bg-saffron/15 px-3 py-1 text-xs font-bold text-saffron">MACRO KATORI PRO</span>
        <h1 className="mt-3 font-display text-2xl font-extrabold">Unlock your full potential</h1>
        <p className="mt-1 text-sm text-ink-muted">Everyday logging stays free, forever. Pro adds deeper insight.</p>
      </div>

      <div className="space-y-2">
        {PRO_FEATURES.map((f) => (
          <div key={f.title} className="flex items-center gap-3 rounded-xl2 border border-white/8 bg-charcoal-700 p-3">
            <span className="text-xl">{f.icon}</span>
            <div>
              <p className="text-sm font-semibold text-ink">{f.title}</p>
              <p className="text-xs text-ink-faint">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {isPro ? (
        <div className="rounded-xl2 border border-emerald/30 bg-emerald/10 p-4 text-center">
          <p className="font-semibold text-emerald-light">✓ You’re on Pro. Enjoy!</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl2 border border-white/10 bg-charcoal-700 p-4 text-center">
            <p className="font-display text-2xl font-extrabold text-ink">₹149<span className="text-sm font-medium text-ink-faint">/month</span></p>
            <p className="text-xs text-ink-faint">Online payments coming soon</p>
            <button className="btn-primary mt-3 w-full opacity-60" disabled>Subscribe (soon)</button>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Have a promo code?</p>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ENTER CODE"
                className="flex-1 rounded-xl2 border border-white/10 bg-charcoal-700 px-4 py-3 text-base uppercase tracking-wider text-ink placeholder:text-ink-faint focus:border-saffron/60 focus:outline-none"
              />
              <button className="btn-primary px-5" onClick={onRedeem} disabled={!code.trim()}>Redeem</button>
            </div>
            <p className="mt-2 text-[11px] text-ink-faint">Got an invite from the founder? Enter it here for free Pro.</p>
          </div>
        </>
      )}
    </div>
  );
}
