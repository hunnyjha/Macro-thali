// Nutrition science for goals. BMR via Mifflin–St Jeor, TDEE via activity
// multiplier, then calorie + macro targets per goal. Protein is set per kg of
// body weight (higher in a deficit to protect muscle) — important for the
// veg/Indian context where hitting protein is the hard part.

export type Sex = 'male' | 'female';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete';
export type Goal = 'loss' | 'maintain' | 'gain' | 'muscle-gain';

export interface Profile {
  age: number;
  sex: Sex;
  weightKg: number;
  heightCm: number;
  activity: Activity;
  goal: Goal;
}

export const ACTIVITY_META: Record<Activity, { label: string; hint: string; factor: number }> = {
  sedentary: { label: 'Sedentary', hint: 'Mostly sitting — desk job or study', factor: 1.2 },
  light: { label: 'Lightly active', hint: 'Some walking, light chores', factor: 1.375 },
  moderate: { label: 'Active', hint: 'Exercise / gym 3–5× a week', factor: 1.55 },
  active: { label: 'Very active', hint: 'Hard training or physical job', factor: 1.725 },
  athlete: { label: 'Athlete', hint: 'Twice-a-day training', factor: 1.9 },
};

export const GOAL_META: Record<Goal, { label: string; hint: string; delta: number }> = {
  loss: { label: 'Fat Loss', hint: 'Lose fat steadily (~0.5 kg/week)', delta: -500 },
  maintain: { label: 'Maintenance', hint: 'Stay at current weight', delta: 0 },
  gain: { label: 'Lean Bulk', hint: 'Slow clean muscle gain', delta: 300 },
  'muscle-gain': { label: 'Muscle Gain', hint: 'Faster surplus for bulking', delta: 500 },
};

export interface MacroTarget {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface CalcResult {
  bmr: number;
  maintenance: number;
  loss: number;       // healthy fat-loss calories
  gain: number;       // lean-gain calories
  target: MacroTarget; // full macro target for the chosen goal
}

function round(n: number, step = 1) {
  return Math.round(n / step) * step;
}

export function bmr(p: Profile): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return base + (p.sex === 'male' ? 5 : -161);
}

// Macro split for a goal at a given calorie level.
function macros(calories: number, weightKg: number, goal: Goal): MacroTarget {
  // protein per kg: more in a deficit or hard bulk; solid for lean gain
  const perKg = goal === 'loss' || goal === 'muscle-gain' ? 2.0 : goal === 'gain' ? 1.8 : 1.6;
  const protein = round(weightKg * perKg);
  // fat = 25% of calories (min 0.6 g/kg for hormones)
  const fat = Math.max(round((calories * 0.25) / 9), round(weightKg * 0.6));
  const remaining = calories - protein * 4 - fat * 9;
  const carbs = Math.max(round(remaining / 4), 0);
  return { calories: round(calories, 5), protein, carbs, fat };
}

// Calories for a goal, clamped to a safe floor for deficits.
export function caloriesForGoal(maintenance: number, sex: Sex, goal: Goal): number {
  const floor = sex === 'male' ? 1500 : 1200;
  const c = maintenance + GOAL_META[goal].delta;
  return Math.max(round(c, 5), floor);
}

export function calculate(p: Profile): CalcResult {
  const b = bmr(p);
  const maintenance = round(b * ACTIVITY_META[p.activity].factor, 5);
  const loss = caloriesForGoal(maintenance, p.sex, 'loss');
  const gain = caloriesForGoal(maintenance, p.sex, 'gain');
  const goalCalories = caloriesForGoal(maintenance, p.sex, p.goal);
  return { bmr: Math.round(b), maintenance, loss, gain, target: macros(goalCalories, p.weightKg, p.goal) };
}

export const DEFAULT_PROFILE: Profile = {
  age: 25, sex: 'male', weightKg: 70, heightCm: 170, activity: 'moderate', goal: 'maintain',
};
