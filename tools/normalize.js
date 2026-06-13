// Normalizes source food files in place:
//   - fills proteinScore (0-10) when missing, from per100g via lib.proteinScore
//   - fills/merges derived healthTags
//   - sorts keys into a stable order for clean diffs
// Authors can omit proteinScore/healthTags; this makes records schema-valid.
// Run: node tools/normalize.js   (add --check to fail if anything would change)

import { writeFileSync } from 'node:fs';
import { listJSON, readJSON, DIR, proteinScore, deriveHealthTags } from './lib.js';

const check = process.argv.includes('--check');
const KEY_ORDER = [
  'id', 'name', 'localNames', 'aliases', 'region', 'state', 'category', 'subcategory',
  'dietType', 'per100g', 'portions', 'oilSensitivity', 'oilModifiers',
  'mealTags', 'healthTags', 'proteinScore', 'confidence', 'source', 'sourceNote',
  'brand', 'verificationStatus', 'notes', 'lastReviewed',
];

const orderKeys = (o) => {
  const out = {};
  for (const k of KEY_ORDER) if (k in o) out[k] = o[k];
  for (const k of Object.keys(o)) if (!(k in out)) out[k] = o[k];
  return out;
};

let changed = 0;
for (const file of [...listJSON(DIR.byRegion), ...listJSON(DIR.byCategory)]) {
  const arr = readJSON(file);
  if (!Array.isArray(arr)) continue;
  const next = arr.map((f) => {
    const ps = Number.isInteger(f.proteinScore) ? f.proteinScore : proteinScore(f.per100g);
    const withPs = { ...f, proteinScore: ps };
    return orderKeys({ ...withPs, healthTags: deriveHealthTags(withPs) });
  });
  const before = JSON.stringify(arr);
  const after = JSON.stringify(next);
  if (before !== after) {
    changed++;
    if (!check) writeFileSync(file, JSON.stringify(next, null, 2) + '\n');
    console.log(`${check ? 'WOULD UPDATE' : 'updated'}: ${file.split('/').slice(-3).join('/')}`);
  }
}

if (check && changed) {
  console.error(`\n❌ ${changed} file(s) need normalization. Run: node tools/normalize.js`);
  process.exit(1);
}
console.log(changed ? `\nNormalized ${changed} file(s).` : 'Already normalized.');
