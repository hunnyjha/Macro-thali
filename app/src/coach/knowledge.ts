// ── Macro Katori Coach Brain — knowledge base ───────────────────────────────
// Structured, maintainable encoding of the Coach Brain Document (philosophy,
// decision rules, targets, protein anchors, meal logic, plateau rules,
// behaviour frameworks, proactive-insight triggers, archetypes, budget order).
// The engine (engine.ts) reasons over THIS data — edit here to evolve the coach.

export type Goal = 'loss' | 'maintain' | 'gain';

// Coach identity / posture (Executive summary + Coach identity).
export const PRINCIPLES = [
  'Adherence first — pick the smallest plan the user can repeat.',
  'Food-first, Indian-first — optimise familiar foods, don’t replace them.',
  'Evidence over trends; trends over single snapshots.',
  'Protect or build strength while changing body composition.',
  'Safety before optimisation — escalate medical red flags early.',
];

// Default nutrition targets by pathway (Default nutrition targets table).
export const GOAL_TARGETS: Record<'loss' | 'maintain' | 'gain' | 'recomp', {
  label: string; calories: string; proteinPerKg: [number, number]; rate: string; note: string;
}> = {
  loss: {
    label: 'Fat loss',
    calories: 'maintenance − 300–500 kcal',
    proteinPerKg: [1.6, 2.2],
    rate: '~0.25–1.0% body weight / week',
    note: 'Keep the deficit modest so strength and adherence survive.',
  },
  recomp: {
    label: 'Recomposition',
    calories: 'maintenance (−100–250 if higher body fat)',
    proteinPerKg: [1.6, 2.2],
    rate: 'waist down, lifts up — the scale may stall',
    note: 'Judge progress by waist, photos and lifts, not the scale.',
  },
  maintain: {
    label: 'Maintenance',
    calories: 'around maintenance',
    proteinPerKg: [1.6, 2.0],
    rate: 'hold weight, build habits',
    note: 'Great time to lock in protein anchors and training consistency.',
  },
  gain: {
    label: 'Muscle gain',
    calories: 'maintenance + 150–300 kcal',
    proteinPerKg: [1.6, 2.0],
    rate: 'slow gain, minimal waist rise',
    note: 'Add calories slowly; a fast scale rise is mostly fat/water.',
  },
};

// Meal-level protein rule (3–5 feedings; layout) and hand model.
export const MEAL_LAYOUT = { breakfast: '25–35 g', lunch: '30–40 g', snack: '10–25 g', dinner: '30–45 g' };
export const HAND_MODEL = '1–2 palms protein · 1–2 fists veg · 1 cupped hand carbs (1–2 on training days) · 1 thumb fats';
export const PROTEIN_FEEDINGS = 'Aim for 3–5 protein feedings of ~20–40 g. Fix breakfast first — most Indian breakfasts are mostly carbs.';

// Indian protein anchors (per practical serving) — used for meal suggestions.
export const PROTEIN_ANCHORS = [
  { food: 'Soy chunks (50 g dry)', protein: 25, note: 'budget superstar' },
  { food: 'Chicken breast (100 g)', protein: 30, note: 'lean, efficient' },
  { food: 'Greek yoghurt / hung curd (200 g)', protein: 20, note: 'strong snack anchor' },
  { food: 'Paneer (100 g)', protein: 18, note: 'great for vegetarians' },
  { food: 'Fish (120 g)', protein: 26, note: 'good dinner' },
  { food: '2 eggs', protein: 12, note: 'convenient' },
  { food: '1 big katori dal', protein: 12, note: 'better with curd/egg' },
  { food: '1 big katori chana/rajma', protein: 13, note: 'fibre + satiety' },
  { food: 'Whey (1 scoop)', protein: 24, note: 'convenience only' },
];

// Cheapest-first ordering (Budget logic).
export const BUDGET_ORDER = ['Soy chunks', 'Eggs', 'Curd/Milk', 'Dal + chana + rajma', 'Chicken', 'Paneer/Tofu', 'Fish', 'Greek yoghurt', 'Whey'];

// Behaviour-change ladder (Adherence framework) — stabilise in order.
export const ADHERENCE_LADDER = [
  'Stabilise logging before changing calories.',
  'Stabilise meal timing + protein anchors before chasing perfect macros.',
  'Stabilise training frequency before adding complexity.',
  'Stabilise sleep + weekly schedule before assuming the plan isn’t working.',
];

// COM-B diagnostic (capability / opportunity / motivation).
export const COMB = {
  capability: 'Do you know what to cook, how much, and how to train?',
  opportunity: 'Do you have the groceries, time, equipment and sleep?',
  motivation: 'Do you actually want it today, or only in theory?',
};

// Trend windows (don’t react to one weigh-in).
export const TREND_WINDOWS = { weight: '7-day average', review: '14-day adherence/recovery', body: '28-day waist/photos/strength' };

// Plateau rules (Operational plateau rules) used by the engine + adaptive review.
export const PLATEAU = {
  loss: 'Only a real plateau if the 7-day average weight is flat ≥14 days AND adherence ≥80%. If steps drifted down, restore movement first. Then trim 100–150 kcal/day OR add 1,000–2,000 steps — not both. If strength is crashing, ease the deficit instead.',
  gain: 'If weight hasn’t moved for 2–3 weeks with high adherence and stalled lifts, add 100–150 kcal/day.',
  recomp: 'Weigh the scale less; trust waist, photos and lifts.',
};

// Proactive insight triggers (subset we have data for). ctx is CoachContext.
export interface InsightRule { id: string; when: (c: any) => boolean; insight: string; }
export const INSIGHT_RULES: InsightRule[] = [
  { id: 'protein-consistency', when: (c) => c.weekly.daysLogged >= 4 && c.weekly.proteinHitDays / c.weekly.daysLogged < 0.5,
    insight: 'Your result is probably limited more by protein consistency than calories right now. Anchor breakfast protein first.' },
  { id: 'losing-too-fast', when: (c) => c.goal === 'loss' && c.weightChangeKg != null && c.weightDays >= 14 && (c.weightChangeKg / c.weightDays) * 7 < -0.012 * (c.weightKg || 70),
    insight: 'You may be losing too fast — let’s protect performance and ease the deficit a little.' },
  { id: 'low-adherence', when: (c) => c.weekly.daysLogged > 0 && c.weekly.calorieAdherencePct < 60,
    insight: 'Consistency is the lever right now — aim to log every day before we change targets.' },
];

// User archetypes (best initial lever + tone).
export const ARCHETYPES = [
  { id: 'hostel', match: /hostel|pg|mess|cafeteria|college/i, lever: 'Eggs, curd, soy chunks, milk — cheap protein you can get in a mess.', tone: 'practical, budget-aware' },
  { id: 'desk', match: /office|desk|sitting|work late|stress eat/i, lever: 'Packed high-protein lunch, step breaks, a structured dinner.', tone: 'direct, time-efficient' },
  { id: 'veg', match: /vegetarian|veg only|no egg|paneer/i, lever: 'Distribute paneer/tofu/curd/pulses across the day for protein.', tone: 'educational, positive' },
  { id: 'beginner', match: /beginner|overweight|new to gym|start/i, lever: 'A simple deficit, full-body lifting, daily walks.', tone: 'reassuring' },
  { id: 'hardgainer', match: /skinny|hardgainer|gain weight|low appetite/i, lever: 'Liquid calories (milk shakes), more frequent meals.', tone: 'encouraging' },
];

// Guardrail: never recommend extreme quantities of one food (rule #7).
export const SINGLE_FOOD_CAP = { eggsMax: 4, scoopsMax: 2, gramsMax: 200, servingsMax: 3 };
