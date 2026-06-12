// Nutrition science for goals. BMR via Mifflin–St Jeor, TDEE via activity
// multiplier, then calorie + macro targets per goal and weight-change speed.
// Protein is set per kg of body weight (higher in a deficit to protect
// muscle) — important for the veg/Indian context where protein is hard to hit.

export type Sex = 'male' | 'female';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete';
export type Goal = 'loss' | 'maintain' | 'gain';

export interface Profile {
  age: number;
  sex: Sex;
  weightKg: number;
  heightCm: number;
  activity: Activity;
  goal: Goal;
  speed: number; // kg/week (0 for maintain)
}

export const ACTIVITY_META: Record<Activity, { label: string; hint: string; factor: number }> = {
  sedentary: { label: 'Sedentary', hint: 'Mostly sitting — desk job or study', factor: 1.2 },
  light: { label: 'Lightly active', hint: 'Some walking, light chores', factor: 1.375 },
  moderate: { label: 'Moderately active', hint: 'Exercise / gym 3–5× a week', factor: 1.55 },
  active: { label: 'Very active', hint: 'Hard training or physical job', factor: 1.725 },
  athlete: { label: 'Extremely active', hint: 'Twice-a-day training', factor: 1.9 },
};

export interface SpeedOption {
  kgPerWeek: number;
  recommended?: boolean;
}

export const GOAL_META: Record<Goal, { label: string; hint: string; speeds: SpeedOption[] }> = {
  loss: {
    label: 'Lose Fat',
    hint: 'Steady fat loss while keeping muscle',
    speeds: [{ kgPerWeek: 0.5, recommended: true }, { kgPerWeek: 0.75 }, { kgPerWeek: 1 }],
  },
  maintain: {
    label: 'Maintain Weight',
    hint: 'Stay at your current weight',
    speeds: [],
  },
  gain: {
    label: 'Gain Muscle',
    hint: 'Build muscle with a controlled surplus',
    speeds: [{ kgPerWeek: 0.25, recommended: true }, { kgPerWeek: 0.5 }, { kgPerWeek: 0.75 }],
  },
};

export function defaultSpeed(goal: Goal): number {
  return GOAL_META[goal].speeds.find((s) => s.recommended)?.kgPerWeek ?? 0;
}

export interface MacroTarget {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface CalcResult {
  bmr: number;
  maintenance: number;
  loss: number;       // fat-loss calories at the recommended speed
  gain: number;       // muscle-gain calories at the recommended speed
  target: MacroTarget; // full macro target for the chosen goal + speed
}

function round(n: number, step = 1) {
  return Math.round(n / step) * step;
}

export function bmr(p: Pick<Profile, 'age' | 'sex' | 'weightKg' | 'heightCm'>): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return base + (p.sex === 'male' ? 5 : -161);
}

// 1 kg of body mass ≈ 7700 kcal, so kg/week × 7700 / 7 = kg/week × 1100 kcal/day.
// Spec values: loss 0.5/0.75/1.0 → 550/825/1100; gain 0.25/0.5/0.75 → 275/550/825.
export function dailyDelta(goal: Goal, speed: number): number {
  if (goal === 'maintain') return 0;
  const magnitude = round(speed * 1100, 5);
  return goal === 'loss' ? -magnitude : magnitude;
}

// Macro split per goal (protein g/kg within spec ranges; fat 25% of calories
// with a 0.6 g/kg hormonal floor; carbs take the remainder).
function macros(calories: number, weightKg: number, goal: Goal): MacroTarget {
  const perKg = goal === 'loss' ? 2.0 : 1.8; // loss 2.0–2.2 / maintain 1.6–2.0 / gain 1.8–2.0
  const protein = round(weightKg * perKg);
  const fat = Math.max(round((calories * 0.25) / 9), round(weightKg * 0.6));
  const remaining = calories - protein * 4 - fat * 9;
  const carbs = Math.max(round(remaining / 4), 0);
  return { calories: round(calories, 5), protein, carbs, fat };
}

// Calories for a goal at a given speed, clamped to a safe floor (M 1500 / F 1200).
export function caloriesForGoal(maintenance: number, sex: Sex, goal: Goal, speed: number): number {
  const floor = sex === 'male' ? 1500 : 1200;
  return Math.max(round(maintenance + dailyDelta(goal, speed), 5), floor);
}

export function calculate(p: Profile): CalcResult {
  const b = bmr(p);
  const maintenance = round(b * ACTIVITY_META[p.activity].factor, 5);
  const loss = caloriesForGoal(maintenance, p.sex, 'loss', defaultSpeed('loss'));
  const gain = caloriesForGoal(maintenance, p.sex, 'gain', defaultSpeed('gain'));
  const goalCalories = caloriesForGoal(maintenance, p.sex, p.goal, p.speed);
  return { bmr: Math.round(b), maintenance, loss, gain, target: macros(goalCalories, p.weightKg, p.goal) };
}

export const DEFAULT_PROFILE: Profile = {
  age: 25, sex: 'male', weightKg: 70, heightCm: 170, activity: 'moderate', goal: 'maintain', speed: 0,
};
