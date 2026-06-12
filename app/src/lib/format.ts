// Small display helpers.

export const kcal = (n: number) => Math.round(n).toLocaleString('en-IN');
export const g = (n: number) => (Math.round(n * 10) / 10).toString();

export function todayISO(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export const DIET_META: Record<string, { label: string; dot: string }> = {
  veg: { label: 'Veg', dot: '#1fb574' },
  egg: { label: 'Egg', dot: '#f5a623' },
  'non-veg': { label: 'Non-veg', dot: '#e0533d' },
};

// Infer the most likely meal slot from a food's meal tags (for default placement).
export function inferSlot(mealTags: string[]): 'breakfast' | 'lunch' | 'snack' | 'dinner' {
  if (mealTags.includes('breakfast')) return 'breakfast';
  if (mealTags.includes('dinner')) return 'dinner';
  if (mealTags.includes('lunch')) return 'lunch';
  return 'snack';
}

// Pick the meal slot based on current time of day (for the quick-add default).
export function slotForNow(d = new Date()): 'breakfast' | 'lunch' | 'snack' | 'dinner' {
  const h = d.getHours();
  if (h < 11) return 'breakfast';
  if (h < 16) return 'lunch';
  if (h < 19) return 'snack';
  return 'dinner';
}
