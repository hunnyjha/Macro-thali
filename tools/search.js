// CLI search across the catalog. Demonstrates the searchability requirements:
// by English/Hindi/local name, category, region, protein level, calories, meal type.
//
// Usage:
//   node tools/search.js "paneer"
//   node tools/search.js --region bihar --diet veg
//   node tools/search.js --category high-protein --min-protein 15
//   node tools/search.js --meal breakfast --max-cal 200
//   node tools/search.js "dal" --state bihar --high-protein

import { loadAllFoods, proteinScore, searchTokens } from './lib.js';

const args = process.argv.slice(2);
const opts = { terms: [] };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a.startsWith('--')) opts[a.slice(2)] = args[i + 1]?.startsWith('--') || i + 1 >= args.length ? true : args[++i];
  else opts.terms.push(a);
}
const query = opts.terms.join(' ').toLowerCase();

let foods = loadAllFoods();
const num = (v) => (v === true || v == null ? null : Number(v));

foods = foods.filter((f) => {
  if (query && !searchTokens(f).includes(query)) return false;
  if (opts.region && f.region !== opts.region) return false;
  if (opts.state && f.state !== opts.state) return false;
  if (opts.category && f.category !== opts.category) return false;
  if (opts.diet && f.dietType !== opts.diet) return false;
  if (opts.meal && !f.mealTags.includes(opts.meal)) return false;
  const ps = f.proteinScore ?? proteinScore(f.per100g);
  if (opts['high-protein'] && !(f.per100g.protein >= 12 || ps >= 7)) return false;
  if (num(opts['min-protein']) != null && f.per100g.protein < num(opts['min-protein'])) return false;
  if (num(opts['max-cal']) != null && f.per100g.calories > num(opts['max-cal'])) return false;
  if (num(opts['min-cal']) != null && f.per100g.calories < num(opts['min-cal'])) return false;
  return true;
});

foods.sort((a, b) => b.per100g.protein - a.per100g.protein);

console.log(`\n${foods.length} result(s):\n`);
for (const f of foods.slice(0, Number(opts.limit) || 40)) {
  const m = f.per100g;
  console.log(
    `${f.name.padEnd(28)} ${String(m.calories).padStart(4)}kcal  ` +
      `P${String(m.protein).padStart(4)} C${String(m.carbs).padStart(4)} F${String(m.fat).padStart(4)}  ` +
      `[${f.state}/${f.category}] ${f.dietType}`
  );
}
console.log();
