// ── Macro Katori Coaching Engine ────────────────────────────────────────────
// Reasons over the Coach Brain knowledge (knowledge.ts) + the user's context to
// produce coach-style answers (brief reasoning + one concrete next action +
// realistic Indian suggestions). This is a structured engine, not a chatbot.

import type { CoachContext } from '../lib/coach';
import {
  PRINCIPLES, GOAL_TARGETS, MEAL_LAYOUT, PROTEIN_FEEDINGS, HAND_MODEL,
  ADHERENCE_LADDER, COMB, PLATEAU, ARCHETYPES, INSIGHT_RULES, SINGLE_FOOD_CAP,
} from './knowledge.ts';
import { proteinGapSuggestions } from '../lib/proteinGap.ts';

type Topic =
  | 'plateau' | 'fatloss' | 'musclegain' | 'recomp' | 'meal' | 'training'
  | 'habit' | 'adherence' | 'progress' | 'protein' | 'remaining' | 'motivation' | 'general';

function detect(q: string): Topic {
  const s = q.toLowerCase();
  if (/(plateau|stall|stuck|not chang|scale.*(stuck|same)|weight.*(stuck|same|not))/.test(s)) return 'plateau';
  if (/(recomp|body recomp|lose fat.*(gain|build)|tone)/.test(s)) return 'recomp';
  if (/(fat loss|lose (weight|fat)|cut|deficit|slim)/.test(s)) return 'fatloss';
  if (/(muscle|bulk|gain (weight|mass)|size|hypertroph|strong)/.test(s)) return 'musclegain';
  if (/(workout|train|exercise|gym|lift|cardio|steps)/.test(s)) return 'training';
  if (/(what.*eat|meal|recipe|hungry|snack|dinner|lunch|breakfast|cook)/.test(s)) return 'meal';
  if (/(habit|consist|motivat|lazy|give up|discipline|routine)/.test(s)) return /motivat|give up|lazy/.test(s) ? 'motivation' : 'habit';
  if (/(adherence|logging|track)/.test(s)) return 'adherence';
  if (/(progress|review|how am i|this week|weekly|insight)/.test(s)) return 'progress';
  if (/protein/.test(s)) return 'protein';
  if (/(remaining|left|how much|budget|macros)/.test(s)) return 'remaining';
  return 'general';
}

// Concrete protein suggestions, guarded against extreme single-food quantities.
function proteinOptions(remProtein: number, used: string[]): string {
  const target = Math.max(remProtein, 20);
  const ok = proteinGapSuggestions(target, { used, limit: 5 }).filter((s) => {
    const n = parseFloat(s.text) || 1;
    if (/\begg/.test(s.text)) return n <= SINGLE_FOOD_CAP.eggsMax;
    if (/scoop/.test(s.text)) return n <= SINGLE_FOOD_CAP.scoopsMax;
    if (/\bg /.test(s.text)) return n <= SINGLE_FOOD_CAP.gramsMax;
    return n <= SINGLE_FOOD_CAP.servingsMax;
  });
  if (ok.length >= 2) return ok.slice(0, 3).map((s) => s.text).join(', ');
  // gap too big for one food → recommend a realistic combo
  return '2 eggs + 1 katori dal + a bowl of curd, or paneer/soy with your meal';
}

const round = (n: number) => Math.round(n);
function targetsLine(ctx: CoachContext, key: 'loss' | 'gain' | 'recomp' | 'maintain') {
  const t = GOAL_TARGETS[key];
  const lo = round((ctx.weightKg || 70) * t.proteinPerKg[0]);
  const hi = round((ctx.weightKg || 70) * t.proteinPerKg[1]);
  return { t, protein: `${lo}–${hi} g/day` };
}

export interface CoachAnswer { text: string; }

export function coachAnswer(question: string, ctx: CoachContext): CoachAnswer {
  const topic = detect(question);
  const r = ctx.remaining;
  const used = ctx.usedFoods;
  const opts = () => proteinOptions(r.protein, used);
  const arch = ARCHETYPES.find((a) => a.match.test(question));

  let text: string;
  switch (topic) {
    case 'fatloss': {
      const { t, protein } = targetsLine(ctx, 'loss');
      text = `Fat loss is mostly calories + protein + lifts. Aim ${t.calories} (your goal ≈ ${ctx.targets.calories} kcal), protein ${protein}, losing ${t.rate}. The biggest lever after calories is protein consistency. Today you have ${Math.max(r.protein, 0)}g protein left — try ${opts()}. Keep the deficit modest so strength holds.`;
      break;
    }
    case 'musclegain': {
      const { t, protein } = targetsLine(ctx, 'gain');
      text = `For muscle gain, eat ${t.calories} and lift hard 2×/muscle/week. Protein ${protein}; a fast scale jump is mostly fat/water, so gain slowly. You have ${Math.max(r.protein, 0)}g protein left today — ${opts()}.`;
      break;
    }
    case 'recomp':
      text = `Recomp works best for beginners/returners above their preferred body-fat. Eat around maintenance, push protein (${targetsLine(ctx, 'recomp').protein}) and progress your lifts. Judge success by waist, photos and strength — the scale will look flat, and that's normal.`;
      break;
    case 'plateau': {
      if (ctx.weightChangeKg != null && ctx.weightDays >= 14) {
        const perWk = (ctx.weightChangeKg / ctx.weightDays) * 7;
        text = `Your 7-day weight is roughly ${ctx.weightChangeKg > 0 ? '+' : ''}${ctx.weightChangeKg}kg over ${ctx.weightDays} days (≈${perWk.toFixed(2)}kg/wk). ${ctx.goal === 'gain' ? PLATEAU.gain : PLATEAU.loss}`;
      } else {
        text = `Before calling it a plateau: a real fat-loss stall is the 7-day average flat for 14+ days at 80%+ adherence — not one weigh-in after salt, poor sleep or travel. Log weight a few more days, then ${PLATEAU.loss.toLowerCase()}`;
      }
      break;
    }
    case 'meal':
      text = `Build a plate the Indian way: ${HAND_MODEL}. e.g. paneer/chicken/egg/soy + sabzi + roti/rice + dahi. You have ${Math.max(r.calories, 0)} kcal and ${Math.max(r.protein, 0)}g protein left — quick protein: ${opts()}.${arch ? ` Since you mentioned your setup: ${arch.lever}` : ''}`;
      break;
    case 'protein':
      text = r.protein <= 0
        ? `You've hit your ${ctx.targets.protein}g protein target today — strong work. ${PROTEIN_FEEDINGS}`
        : `You still need ${r.protein}g protein. ${PROTEIN_FEEDINGS} Target per meal — breakfast ${MEAL_LAYOUT.breakfast}, lunch ${MEAL_LAYOUT.lunch}, dinner ${MEAL_LAYOUT.dinner}. Quick wins: ${opts()}.`;
      break;
    case 'training':
      text = `Train each muscle ~2×/week and pick a plan you'll actually repeat. For size: ~10+ hard sets/muscle/week across any rep range. For strength: heavier loads (~80% 1RM), 2–3 sets, key lifts first. Floor: 150 min/week activity + 2 strength sessions. Consistency beats the “perfect” split.`;
      break;
    case 'habit':
    case 'adherence': {
      const step = ctx.weekly.daysLogged < 4 ? ADHERENCE_LADDER[0]
        : ctx.weekly.proteinHitDays < ctx.weekly.daysLogged * 0.6 ? ADHERENCE_LADDER[1]
        : ADHERENCE_LADDER[2];
      text = `Let's not add complexity yet — climb the ladder in order. Right now: ${step} (COM-B check — ${COMB.opportunity}) Nail one repeatable action this week rather than a perfect plan.`;
      break;
    }
    case 'progress': {
      const w = ctx.weekly;
      const insight = proactiveInsights(ctx)[0];
      text = `This week: avg ${w.avgCalories} kcal, ${w.avgProtein}g protein, logged ${w.daysLogged}/7, ${w.streak}-day streak, protein goal on ${w.proteinHitDays} days.${insight ? ` ${insight}` : ' Keep the trend going — we review weight on a 7-day average, body on 28 days.'}`;
      break;
    }
    case 'motivation':
      text = `You're on a ${ctx.weekly.streak}-day streak and hit protein on ${ctx.weekly.proteinHitDays}/${ctx.weekly.daysLogged} days — that's real. Perfection isn't the goal; the next right action is. Pick one: a protein breakfast tomorrow, or a 20-min walk. Which feels easier?`;
      break;
    case 'remaining':
      text = `Today you have ${Math.max(r.calories, 0)} kcal left — ${Math.max(r.protein, 0)}g protein, ${Math.max(r.carbs, 0)}g carbs, ${Math.max(r.fat, 0)}g fat. Protein first: ${opts()}.`;
      break;
    default:
      text = `I'm your Macro Katori coach (goal: ${ctx.goalLabel}). I coach fat loss, muscle gain, recomp, meals, training, plateaus and habits — the Indian, sustainable way. Today: ${Math.max(r.calories, 0)} kcal and ${Math.max(r.protein, 0)}g protein left. Ask “what should I eat?”, “I need protein”, or “why has my weight stalled?”.`;
  }
  return { text };
}

// Proactive one-at-a-time insights (Coach Brain trigger table, data we have).
export function proactiveInsights(ctx: CoachContext): string[] {
  return INSIGHT_RULES.filter((rule) => { try { return rule.when(ctx); } catch { return false; } }).map((r) => r.insight);
}

// Knowledge-grounded system prompt so the LLM path reasons via the Coach Brain.
export function buildCoachSystemPrompt(ctx: CoachContext): string {
  return [
    'You are "Macro Katori Coach": a warm, direct, non-shaming Indian nutrition & behaviour coach — NOT a macro calculator.',
    'Follow this knowledge base and reason through it before answering:',
    'PRINCIPLES: ' + PRINCIPLES.join(' '),
    `TARGETS by goal — fat loss: ${GOAL_TARGETS.loss.calories}, protein 1.6–2.2 g/kg, ${GOAL_TARGETS.loss.rate}. ` +
      `muscle gain: ${GOAL_TARGETS.gain.calories}, protein 1.6–2.0 g/kg, slow. recomp: maintenance, judge by waist/photos/lifts.`,
    `PROTEIN: 3–5 feedings of 20–40 g; fix breakfast first. Plate model: ${HAND_MODEL}.`,
    'ADHERENCE LADDER (stabilise in order): ' + ADHERENCE_LADDER.join(' '),
    'PLATEAU: ' + PLATEAU.loss,
    'RULES: Answer the SPECIFIC question the user asked — if they ask for a recipe, give a real recipe (ingredients + steps + rough macros); if they ask a general question, reason and answer it directly. Do NOT fall back to a generic "build a plate" template unless that is genuinely what they asked. Prefer Indian foods; give realistic meals; NEVER recommend extreme amounts of one food; explain reasoning briefly; focus on long-term adherence. Keep replies concise (≤120 words; a recipe or plan may go longer). Use the user numbers below only when relevant.',
    `USER NOW — goal: ${ctx.goalLabel}${ctx.speed ? ` @ ${ctx.speed} kg/wk` : ''}; targets ${ctx.targets.calories} kcal / ${ctx.targets.protein}g protein; ` +
      `remaining today ${ctx.remaining.calories} kcal, ${ctx.remaining.protein}g protein; this week avg ${ctx.weekly.avgCalories} kcal, ${ctx.weekly.avgProtein}g protein, ${ctx.weekly.daysLogged}/7 logged, ${ctx.weekly.streak}-day streak` +
      `${ctx.weightChangeKg != null ? `; weight ${ctx.weightChangeKg}kg/${ctx.weightDays}d` : ''}.`,
  ].join('\n');
}
