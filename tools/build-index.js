// Builds the dist/ artifacts the app consumes:
//   dist/foods.json        - all foods, enriched (proteinScore + healthTags filled in)
//   dist/by-category.json  - { categoryCode: [ids] }
//   dist/by-region.json    - { stateCode: [ids] }
//   dist/by-meal.json       - { mealTag: [ids] }
//   dist/search-index.json - lightweight tokens for client-side search
//   dist/thalis.json       - thalis with computedTotals (home_style)
//   dist/manifest.json     - counts + build timestamp
// Run: npm run build

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  DIR, loadReference, loadAllFoods, loadAllThalis,
  proteinScore, deriveHealthTags, computeMacros, searchTokens,
  verificationFromSource, sourcePriority,
} from './lib.js';

const ref = loadReference();
mkdirSync(DIR.dist, { recursive: true });

const rawFoods = loadAllFoods();
const foods = rawFoods.map(({ _file, ...f }) => {
  const ps = Number.isInteger(f.proteinScore) ? f.proteinScore : proteinScore(f.per100g);
  return {
    ...f,
    proteinScore: ps,
    healthTags: deriveHealthTags({ ...f, proteinScore: ps }),
    // verificationStatus may be set explicitly on a record; otherwise derive from source.
    verificationStatus: f.verificationStatus ?? verificationFromSource(f.source),
  };
});

const byCategory = {};
const byRegion = {};
const byMeal = {};
for (const f of foods) {
  (byCategory[f.category] ??= []).push(f.id);
  (byRegion[f.state] ??= []).push(f.id);
  for (const t of f.mealTags) (byMeal[t] ??= []).push(f.id);
}

const searchIndex = foods.map((f) => ({
  id: f.id,
  name: f.name,
  t: searchTokens(f),
  cat: f.category,
  state: f.state,
  region: f.region,
  diet: f.dietType,
  kcal: f.per100g.calories,
  protein: f.per100g.protein,
  carbs: f.per100g.carbs,
  fat: f.per100g.fat,
  fiber: f.per100g.fiber ?? 0,
  ps: f.proteinScore,
  meal: f.mealTags,
  vs: f.verificationStatus,           // verified | estimated | community
  sp: sourcePriority(f.source),       // 1 brand, 2 govt, 3 estimate, 4 community
  brand: f.brand,                     // present for branded products (e.g. whey)
}));

// Thalis: compute totals at home_style using default (or first) portion per component.
const foodById = new Map(foods.map((f) => [f.id, f]));
const thalis = loadAllThalis().map(({ _file, ...t }) => {
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  for (const c of t.components) {
    const food = foodById.get(c.foodId);
    if (!food) continue;
    const portion = food.portions.find((p) => p.unit === c.unit) || food.portions[0];
    const grams = portion.grams * c.quantity;
    const m = computeMacros(food, grams, c.oilStyle || 'home_style', ref.oil);
    totals.calories += m.calories;
    totals.protein += m.protein;
    totals.carbs += m.carbs;
    totals.fat += m.fat;
    totals.fiber += m.fiber || 0;
  }
  for (const k of Object.keys(totals)) totals[k] = Math.round(totals[k] * 10) / 10;
  return { ...t, computedTotals: totals };
});

const write = (name, data) => writeFileSync(join(DIR.dist, name), JSON.stringify(data, null, 2) + '\n');
write('foods.json', foods);
write('by-category.json', byCategory);
write('by-region.json', byRegion);
write('by-meal.json', byMeal);
write('search-index.json', searchIndex);
write('thalis.json', thalis);
write('manifest.json', {
  builtAt: new Date().toISOString(),
  counts: {
    foods: foods.length,
    thalis: thalis.length,
    categories: Object.keys(byCategory).length,
    statesCovered: Object.keys(byRegion).length,
  },
});

console.log(`Built dist/: ${foods.length} foods, ${thalis.length} thalis, ${Object.keys(byRegion).length} states.`);
