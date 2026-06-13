import { useProfileStore } from '../store/useProfileStore';
import { useLogStore } from '../store/useLogStore';
import { useWeightStore } from '../store/useWeightStore';
import { GOAL_META } from './calculator';
import { computeWeeklyInsights } from './insights';
import { proteinGapSuggestions } from './proteinGap';

export interface CoachContext {
  goalLabel: string;
  goal: 'loss' | 'maintain' | 'gain';
  speed: number;
  targets: { calories: number; protein: number; carbs: number; fat: number };
  remaining: { calories: number; protein: number; carbs: number; fat: number };
  weekly: { avgCalories: number; avgProtein: number; daysLogged: number; streak: number; calorieAdherencePct: number; proteinHitDays: number };
  weightChangeKg: number | null; // over the logged window
  weightDays: number;
  usedFoods: string[];
}

export async function getCoachContext(): Promise<CoachContext> {
  const profile = useProfileStore.getState().profile;
  const log = useLogStore.getState();
  const totals = log.totals();
  const targets = log.targets;
  const w = useWeightStore.getState();
  if (!w.loaded) await w.load();
  const weights = useWeightStore.getState().entries;
  const weekly = await computeWeeklyInsights(targets);

  let weightChangeKg: number | null = null;
  let weightDays = 0;
  if (weights.length >= 2) {
    const first = weights[0];
    const last = weights[weights.length - 1];
    weightChangeKg = Math.round((last.kg - first.kg) * 10) / 10;
    weightDays = Math.max(1, Math.round((new Date(last.date).getTime() - new Date(first.date).getTime()) / 86400000));
  }

  return {
    goalLabel: GOAL_META[profile.goal].label,
    goal: profile.goal,
    speed: profile.speed,
    targets,
    remaining: {
      calories: Math.round(targets.calories - totals.calories),
      protein: Math.round(targets.protein - totals.protein),
      carbs: Math.round(targets.carbs - totals.carbs),
      fat: Math.round(targets.fat - totals.fat),
    },
    weekly: {
      avgCalories: weekly.avgCalories, avgProtein: weekly.avgProtein, daysLogged: weekly.daysLogged,
      streak: weekly.streak, calorieAdherencePct: weekly.calorieAdherencePct, proteinHitDays: weekly.proteinHitDays,
    },
    weightChangeKg,
    weightDays,
    usedFoods: [...log.frequent, ...log.recents],
  };
}

const proteinIdeas = (rem: number, used: string[]) =>
  proteinGapSuggestions(rem, { used, limit: 3 }).map((s) => `${s.text} (+${s.protein}g)`).join(', ');

// ── Phase 3: Adaptive 7-day review ──────────────────────────────────────────
export interface AdaptiveReview {
  show: boolean;
  stall: boolean;
  title: string;
  lines: string[];
  suggestionLabel?: string;
  deltaKcal?: number; // applied only on user approval
}

export function adaptiveReview(ctx: CoachContext): AdaptiveReview {
  const { weekly, goal, weightChangeKg, weightDays } = ctx;
  if (weekly.daysLogged < 4) {
    return { show: true, stall: false, title: 'Weekly review', lines: ['Log at least 4 days this week to unlock a tailored review.'] };
  }
  const lines: string[] = [];
  lines.push(`This week: avg ${weekly.avgCalories} kcal/day, ${weekly.avgProtein}g protein, logged ${weekly.daysLogged}/7 days.`);

  let stall = false;
  let suggestionLabel: string | undefined;
  let deltaKcal: number | undefined;

  if (weightChangeKg != null && weightDays >= 7) {
    const perWeek = (weightChangeKg / weightDays) * 7;
    if (goal === 'loss' && perWeek > -0.15) {
      stall = true;
      lines.push(`Weight is roughly flat (${weightChangeKg > 0 ? '+' : ''}${weightChangeKg} kg in ${weightDays} days) while aiming to lose.`);
      suggestionLabel = 'Reduce daily target by 150 kcal';
      deltaKcal = -150;
    } else if (goal === 'gain' && perWeek < 0.1) {
      stall = true;
      lines.push(`Weight isn't rising (${weightChangeKg > 0 ? '+' : ''}${weightChangeKg} kg in ${weightDays} days) while aiming to gain.`);
      suggestionLabel = 'Increase daily target by 150 kcal';
      deltaKcal = 150;
    } else {
      lines.push(`Weight trend looks on track (${weightChangeKg > 0 ? '+' : ''}${weightChangeKg} kg in ${weightDays} days).`);
    }
  } else {
    lines.push('Add a few weight entries to detect stalls automatically.');
  }

  if (weekly.calorieAdherencePct < 60) lines.push('Consistency is the lever right now — aim to log every day before changing targets.');
  if (stall) lines.push('Other options: add ~2,000 steps/day, or stay consistent one more week before adjusting.');

  return { show: true, stall, title: stall ? 'Possible stall detected' : 'Weekly review', lines, suggestionLabel, deltaKcal };
}

// ── Phase 2: rule-based coach (free, no key) ────────────────────────────────
export function ruleReply(qRaw: string, ctx: CoachContext): string {
  const q = qRaw.toLowerCase();
  const r = ctx.remaining;
  const ideas = proteinIdeas(Math.max(r.protein, 20), ctx.usedFoods);

  if (/protein/.test(q)) {
    if (r.protein <= 0) return `You've already hit your ${ctx.targets.protein}g protein target today — nice work! 💪`;
    return `You still need ${r.protein}g protein today. Quick wins: ${ideas}.`;
  }
  if (/(remaining|left|how much|budget)/.test(q)) {
    return `Today you have ${Math.max(r.calories, 0)} kcal left — ${Math.max(r.protein, 0)}g protein, ${Math.max(r.carbs, 0)}g carbs, ${Math.max(r.fat, 0)}g fat to go.`;
  }
  if (/(weight|stall|plateau|not chang|stuck|scale)/.test(q)) {
    const rev = adaptiveReview(ctx);
    return rev.lines.join(' ') + (rev.suggestionLabel ? ` Suggested: ${rev.suggestionLabel} (you approve it in Insights).` : '');
  }
  if (/(ate|had|eaten|khaya|biryani|lunch|dinner|breakfast)/.test(q)) {
    return r.calories >= 0
      ? `Got it. After today's logs you have ${r.calories} kcal and ${Math.max(r.protein, 0)}g protein left. ${r.protein > 0 ? `To top up protein: ${ideas}.` : 'Protein target met 👍'}`
      : `You're ${Math.abs(r.calories)} kcal over budget today — a lighter, high-protein dinner (${ideas}) keeps you on track.`;
  }
  if (/(what.*eat|suggest|hungry|snack|meal)/.test(q)) {
    return `With ${Math.max(r.calories, 0)} kcal and ${Math.max(r.protein, 0)}g protein left, good picks: ${ideas}.`;
  }
  if (/(motivat|give up|hard|lazy|consistent|streak)/.test(q)) {
    return `You're on a ${ctx.weekly.streak}-day logging streak and hit protein on ${ctx.weekly.proteinHitDays} of ${ctx.weekly.daysLogged} days. Small consistent wins beat perfect days — keep going! 🔥`;
  }
  // default
  return `I'm your Macro Coach. Today: ${Math.max(r.calories, 0)} kcal and ${Math.max(r.protein, 0)}g protein left (goal: ${ctx.goalLabel}). Ask me "what should I eat?", "I need protein", or "why isn't my weight changing?".`;
}

// ── Optional Gemini text reply (free tier) ──────────────────────────────────
export async function geminiReply(question: string, ctx: CoachContext, apiKey: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const sys = `You are "Macro Coach", a friendly, concise Indian nutrition coach inside the Macro Katori app.
User goal: ${ctx.goalLabel}${ctx.speed ? ` at ${ctx.speed} kg/week` : ''}.
Daily targets: ${ctx.targets.calories} kcal, ${ctx.targets.protein}g protein.
Remaining today: ${ctx.remaining.calories} kcal, ${ctx.remaining.protein}g protein.
This week: avg ${ctx.weekly.avgCalories} kcal, ${ctx.weekly.avgProtein}g protein, ${ctx.weekly.daysLogged}/7 days logged, ${ctx.weekly.streak}-day streak.
${ctx.weightChangeKg != null ? `Weight change: ${ctx.weightChangeKg} kg over ${ctx.weightDays} days.` : ''}
Prefer Indian foods. Keep replies under 80 words. Never tell the user to drastically under-eat. Be encouraging.`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: sys }] },
      contents: [{ parts: [{ text: question }] }],
      generationConfig: { temperature: 0.5 },
    }),
  });
  if (!res.ok) throw new Error(`Coach unavailable (${res.status}).`);
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Sorry, I could not answer that.';
}
