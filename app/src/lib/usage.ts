// ── Daily AI usage caps ──────────────────────────────────────────────────────
// Protects the shared (hosted) Gemini quota from a few users burning through it.
// Counts only calls that hit OUR key (the hosted /api/coach and /api/scan).
// Personal-key users spend their own quota and are never counted here.
// Per-device counter in localStorage — enough for a small, trusted user base.

export const DAILY_LIMITS = { coach: 30, scan: 20 } as const;
export type UsageKind = keyof typeof DAILY_LIMITS;

const KEY = 'mk-ai-usage';
const today = () => new Date().toISOString().slice(0, 10);

interface Usage { date: string; coach: number; scan: number }

function read(): Usage {
  try {
    const r = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (r && r.date === today()) return r;
  } catch { /* ignore */ }
  return { date: today(), coach: 0, scan: 0 };
}
function write(u: Usage) {
  try { localStorage.setItem(KEY, JSON.stringify(u)); } catch { /* ignore */ }
}

export function remaining(kind: UsageKind): number {
  return Math.max(0, DAILY_LIMITS[kind] - read()[kind]);
}
export function canUse(kind: UsageKind): boolean {
  return remaining(kind) > 0;
}
export function recordUse(kind: UsageKind): void {
  const u = read();
  u[kind] += 1;
  write(u);
}
