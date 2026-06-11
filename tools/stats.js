// Prints coverage stats: totals, per-region, per-category, per-confidence,
// diet split, and progress toward the 2,000-food target.
// Run: npm run stats

import { loadReference, loadAllFoods, loadAllThalis } from './lib.js';

const TARGET = 2000;
const ref = loadReference();
const foods = loadAllFoods();
const thalis = loadAllThalis();

const tally = (arr, key) => {
  const m = {};
  for (const x of arr) m[key(x)] = (m[key(x)] || 0) + 1;
  return m;
};
const printTable = (title, obj, order) => {
  console.log(`\n${title}`);
  const keys = order ? order.filter((k) => k in obj) : Object.keys(obj).sort();
  const extra = Object.keys(obj).filter((k) => !keys.includes(k));
  for (const k of [...keys, ...extra]) console.log(`  ${k.padEnd(22)} ${obj[k]}`);
};

console.log('='.repeat(48));
console.log('  MACRO KATORI — FOOD DATABASE STATS');
console.log('='.repeat(48));
console.log(`\nTotal foods : ${foods.length}`);
console.log(`Total thalis: ${thalis.length}`);
const pct = ((foods.length / TARGET) * 100).toFixed(1);
const filled = Math.round((foods.length / TARGET) * 30);
console.log(`\nProgress to ${TARGET}: [${'#'.repeat(filled)}${'.'.repeat(30 - filled)}] ${pct}%`);

printTable('By region (state):', tally(foods, (f) => f.state), ref.regions.regions.map((r) => r.code));
printTable('By category:', tally(foods, (f) => f.category), ref.categories.categories.map((c) => c.code));
printTable('By diet type:', tally(foods, (f) => f.dietType), ['veg', 'egg', 'non-veg']);
printTable('By confidence:', tally(foods, (f) => f.confidence), ['high', 'medium', 'low']);

const missingStates = ref.regions.regions
  .map((r) => r.code)
  .filter((c) => c !== 'pan-india' && !foods.some((f) => f.state === c));
if (missingStates.length) {
  console.log(`\n⚠️  States with 0 foods (${missingStates.length}): ${missingStates.join(', ')}`);
}
console.log();
