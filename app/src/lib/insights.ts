import { db } from '../data/db';
import type { Macros } from '../types/food';
import type { DailyTargets } from '../types/log';
import { addMacros, emptyMacros } from './nutrition';
import { todayISO } from './format';

export interface DayBucket {
  date: string;
  label: string;     // e.g. "Mon"
  macros: Macros;
  logged: boolean;
}

export interface InsightMsg {
  tone: 'good' | 'warn' | 'tip';
  text: string;
}

export interface WeeklyInsights {
  days: DayBucket[];
  daysLogged: number;
  avgCalories: number;
  avgProtein: number;
  avgFatSharePct: number;
  streak: number;
  messages: InsightMsg[];
}

// Consecutive-day streaks ending today: any-log streak and protein-goal streak.
export async function computeStreaks(targets: DailyTargets): Promise<{ daily: number; protein: number }> {
  const logs = await db.logs.toArray();
  const cal = new Map<string, Macros>();
  for (const e of logs) cal.set(e.date, addMacros(cal.get(e.date) ?? emptyMacros(), e.macros));

  let daily = 0;
  let protein = 0;
  let dailyBroken = false;
  let proteinBroken = false;
  const d = new Date();
  for (let i = 0; i < 400; i++) {
    const date = todayISO(new Date(d.getFullYear(), d.getMonth(), d.getDate() - i));
    const m = cal.get(date);
    const logged = !!m;
    // Today not yet logged shouldn't break the streak; skip today if empty.
    if (i === 0 && !logged) { continue; }
    if (!dailyBroken) { if (logged) daily++; else dailyBroken = true; }
    if (!proteinBroken) {
      if (m && m.protein >= targets.protein) protein++;
      else if (i === 0 && (!m || m.protein < targets.protein)) { /* today in progress: don't break */ }
      else proteinBroken = true;
    }
    if (dailyBroken && proteinBroken) break;
  }
  return { daily, protein };
}

function lastNDates(n: number): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d);
    x.setDate(d.getDate() - i);
    out.push(todayISO(x));
  }
  return out;
}

export async function computeWeeklyInsights(targets: DailyTargets): Promise<WeeklyInsights> {
  const dates = lastNDates(7);
  const logs = await db.logs.where('date').anyOf(dates).toArray();

  const byDate = new Map<string, Macros>();
  for (const e of logs) byDate.set(e.date, addMacros(byDate.get(e.date) ?? emptyMacros(), e.macros));

  const days: DayBucket[] = dates.map((date) => ({
    date,
    label: new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' }),
    macros: byDate.get(date) ?? emptyMacros(),
    logged: byDate.has(date),
  }));

  const loggedDays = days.filter((d) => d.logged);
  const daysLogged = loggedDays.length;
  const sum = loggedDays.reduce((acc, d) => addMacros(acc, d.macros), emptyMacros());
  const avgCalories = daysLogged ? Math.round(sum.calories / daysLogged) : 0;
  const avgProtein = daysLogged ? Math.round(sum.protein / daysLogged) : 0;
  const avgFat = daysLogged ? sum.fat / daysLogged : 0;
  const avgFatSharePct = avgCalories ? Math.round(((avgFat * 9) / avgCalories) * 100) : 0;

  // streak: consecutive logged days ending today
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].logged) streak++;
    else break;
  }

  const messages: InsightMsg[] = [];
  if (daysLogged === 0) {
    messages.push({ tone: 'tip', text: 'Log a few meals this week and your insights will appear here.' });
    return { days, daysLogged, avgCalories, avgProtein, avgFatSharePct, streak, messages };
  }

  messages.push({ tone: 'good', text: `You averaged ${avgProtein}g protein and ${avgCalories} kcal per day.` });

  if (avgProtein < targets.protein * 0.85) {
    messages.push({ tone: 'warn', text: `Protein is below your ${targets.protein}g goal. Adding curd, sattu, paneer or soya could close the gap.` });
  } else if (avgProtein >= targets.protein) {
    messages.push({ tone: 'good', text: `Great — you're hitting your protein goal of ${targets.protein}g. Keep it up!` });
  }

  if (avgFatSharePct >= 38) {
    messages.push({ tone: 'warn', text: `About ${avgFatSharePct}% of your calories came from fat/oil. Try Home Style or Very Light oil to cut calories without losing food.` });
  }

  if (avgCalories > targets.calories * 1.1) {
    messages.push({ tone: 'tip', text: `You're averaging ${avgCalories - targets.calories} kcal above your target. Smaller portions or lighter oil will help.` });
  } else if (avgCalories > 0 && avgCalories < targets.calories * 0.8) {
    messages.push({ tone: 'tip', text: `You're eating well under your target — make sure you're fuelling enough.` });
  }

  if (streak >= 3) messages.push({ tone: 'good', text: `🔥 ${streak}-day logging streak. Consistency is everything.` });

  return { days, daysLogged, avgCalories, avgProtein, avgFatSharePct, streak, messages };
}
