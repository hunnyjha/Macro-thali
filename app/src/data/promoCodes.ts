// ── PROMO CODES (owner-editable) ───────────────────────────────────────────
// Add/remove codes here to give people free Pro access. Codes are matched
// case-insensitively. `days: null` = lifetime; otherwise Pro lasts that many days.
//
// Example: give a friend 1 year free -> add  GIFT365: { days: 365, label: '...' }
//
// NOTE: because this runs on-device, codes ship inside the app and a technical
// user could read them. For unguessable/revocable codes you'll want the cloud
// backend (Supabase) upgrade. For inviting specific early users, this is fine.

export interface PromoCode {
  days: number | null; // null = lifetime
  label: string;
}

export const PROMO_CODES: Record<string, PromoCode> = {
  FOUNDER: { days: null, label: 'Founder — lifetime Pro' },
  MACRO100: { days: 365, label: 'Early supporter — 1 year Pro' },
  TRYPRO30: { days: 30, label: '30-day Pro trial' },
  KATORI7: { days: 7, label: '7-day Pro trial' },
};

export function lookupPromo(code: string): { key: string; promo: PromoCode } | null {
  const key = code.trim().toUpperCase();
  const promo = PROMO_CODES[key];
  return promo ? { key, promo } : null;
}
