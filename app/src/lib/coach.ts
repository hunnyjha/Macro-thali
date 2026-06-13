import { useProfileStore } from '../store/useProfileStore';
import { useLogStore } from '../store/useLogStore';
import { useWeightStore } from '../store/useWeightStore';
import { GOAL_META } from './calculator';
import { computeWeeklyInsights } from './insights';
import { coachAnswer, buildCoachSystemPrompt } from '../coach/engine';

export interface CoachContext {
  goalLabel: string;
  goal: 'loss' | 'maintain' | 'gain';
  speed: number;
  weightKg: number;
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
    weightKg: profile.weightKg,
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

// ── Adaptive review — follows Coach Brain plateau rules ─────────────────────
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

  // Coach Brain: a real fat-loss plateau = 7-day avg flat ≥14 days AND adherence ≥80%.
  const adherent = weekly.calorieAdherencePct >= 80;
  if (weightChangeKg != null && weightDays >= 14) {
    const perWeek = (weightChangeKg / weightDays) * 7;
    if (goal === 'loss' && perWeek > -0.15 && adherent) {
      stall = true;
      lines.push(`Weight has been flat (${weightChangeKg > 0 ? '+' : ''}${weightChangeKg} kg over ${weightDays} days) at ${weekly.calorieAdherencePct}% adherence.`);
      lines.push('Per the playbook: if steps dropped, restore movement first. Otherwise trim ~120 kcal/day OR add ~2,000 steps — not both.');
      suggestionLabel = 'Reduce daily target by 120 kcal';
      deltaKcal = -120;
    } else if (goal === 'gain' && perWeek < 0.1 && adherent) {
      stall = true;
      lines.push(`Weight hasn't risen (${weightChangeKg > 0 ? '+' : ''}${weightChangeKg} kg over ${weightDays} days) with high adherence.`);
      suggestionLabel = 'Increase daily target by 150 kcal';
      deltaKcal = 150;
    } else if (goal === 'loss' && perWeek > -0.15 && !adherent) {
      lines.push(`Scale is flat but adherence is ${weekly.calorieAdherencePct}% — that's the lever, not your calories. Tighten logging before we cut further.`);
    } else {
      lines.push(`Weight trend looks on track (${weightChangeKg > 0 ? '+' : ''}${weightChangeKg} kg over ${weightDays} days). Keep going.`);
    }
  } else {
    lines.push('Log your weight for ~2 weeks so I can judge the trend on a 7-day average (not single weigh-ins).');
  }

  return { show: true, stall, title: stall ? 'Possible plateau detected' : 'Weekly review', lines, suggestionLabel, deltaKcal };
}

// ── Rule-based coach (free, no key) — powered by the Coach Brain engine ──────
export function ruleReply(qRaw: string, ctx: CoachContext): string {
  return coachAnswer(qRaw, ctx).text;
}

// ── Optional Gemini text reply — grounded in the Coach Brain knowledge ───────
export async function geminiReply(question: string, ctx: CoachContext, apiKey: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const sys = buildCoachSystemPrompt(ctx);
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
