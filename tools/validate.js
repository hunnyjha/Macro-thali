// Validates all food + thali records against schema-equivalent rules and
// cross-references (region/state/category/unit/source/tag codes must exist).
// Zero-dependency: implements the subset of JSON-Schema checks we rely on.

import { loadReference, loadAllFoods, loadAllThalis } from './lib.js';

const errors = [];
const warnings = [];
const err = (id, msg) => errors.push(`${id}: ${msg}`);
const warn = (id, msg) => warnings.push(`${id}: ${msg}`);

const ref = loadReference();
const zoneCodes = new Set(ref.regions.zones);
const stateCodes = new Set(ref.regions.regions.map((r) => r.code));
const categoryCodes = new Set(ref.categories.categories.map((c) => c.code));
const subcatByCat = new Map(ref.categories.categories.map((c) => [c.code, new Set(c.subcategories)]));
const unitCodes = new Set(ref.portions.units.map((u) => u.code));
const oilLevels = new Set(Object.keys(ref.oil.sensitivityLevels));
const oilStyles = new Set(ref.oil.styles.map((s) => s.code));
const sourceCodes = new Set(ref.confSrc.sources.map((s) => s.code));
const confLevels = new Map(ref.confSrc.confidenceLevels.map((c) => [c.code, new Set(c.validSources)]));
const mealTagCodes = new Set(ref.tags.mealTags.map((t) => t.code));
const healthTagCodes = new Set(ref.tags.healthTags.map((t) => t.code));

const dateRe = /^\d{4}-\d{2}-\d{2}$/;
const idRe = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const foods = loadAllFoods();
const ids = new Set();
const foodIds = new Set();

for (const f of foods) {
  const id = f.id || `<missing-id in ${f._file}>`;
  if (!f.id || !idRe.test(f.id)) err(id, 'invalid or missing id (kebab-case required)');
  if (f.id) {
    if (ids.has(f.id)) err(id, 'duplicate id');
    ids.add(f.id);
    foodIds.add(f.id);
  }
  if (!f.name) err(id, 'missing name');
  if (!zoneCodes.has(f.region)) err(id, `region '${f.region}' not a valid zone`);
  if (!stateCodes.has(f.state)) err(id, `state '${f.state}' not in regions.json`);
  if (!categoryCodes.has(f.category)) err(id, `category '${f.category}' unknown`);
  if (f.subcategory && subcatByCat.get(f.category) && !subcatByCat.get(f.category).has(f.subcategory)) {
    warn(id, `subcategory '${f.subcategory}' not listed under '${f.category}'`);
  }
  if (!['veg', 'non-veg', 'egg'].includes(f.dietType)) err(id, `dietType '${f.dietType}' invalid`);

  const m = f.per100g || {};
  for (const k of ['calories', 'protein', 'carbs', 'fat']) {
    if (typeof m[k] !== 'number' || m[k] < 0) err(id, `per100g.${k} missing/invalid`);
  }
  if (m.fiber != null && (typeof m.fiber !== 'number' || m.fiber < 0)) err(id, 'per100g.fiber invalid');
  // Sanity: macro-derived calories should be in the ballpark of stated calories.
  if (typeof m.calories === 'number') {
    const derived = (m.protein || 0) * 4 + (m.carbs || 0) * 4 + (m.fat || 0) * 9;
    if (m.calories >= 20 && Math.abs(derived - m.calories) / m.calories > 0.25) {
      warn(id, `stated calories ${m.calories} vs macro-derived ${Math.round(derived)} differ >25%`);
    }
  }

  if (!Array.isArray(f.portions) || f.portions.length === 0) err(id, 'portions must be a non-empty array');
  else {
    let defaults = 0;
    for (const p of f.portions) {
      if (!unitCodes.has(p.unit)) err(id, `portion unit '${p.unit}' unknown`);
      if (!(p.grams > 0)) err(id, `portion '${p.unit}' grams must be > 0`);
      if (p.default) defaults++;
    }
    if (defaults > 1) warn(id, 'more than one default portion');
  }

  if (!oilLevels.has(f.oilSensitivity)) err(id, `oilSensitivity '${f.oilSensitivity}' invalid`);
  if (f.oilModifiers) {
    for (const k of Object.keys(f.oilModifiers)) {
      if (!oilStyles.has(k)) err(id, `oilModifiers key '${k}' not a valid style`);
    }
  }

  if (!Array.isArray(f.mealTags) || f.mealTags.length === 0) err(id, 'mealTags required');
  else for (const t of f.mealTags) if (!mealTagCodes.has(t)) warn(id, `mealTag '${t}' not in tags.json`);
  for (const t of f.healthTags || []) if (!healthTagCodes.has(t)) warn(id, `healthTag '${t}' not in tags.json`);

  if (!Number.isInteger(f.proteinScore) || f.proteinScore < 0 || f.proteinScore > 10) err(id, 'proteinScore must be integer 0-10');
  if (!confLevels.has(f.confidence)) err(id, `confidence '${f.confidence}' invalid`);
  if (!sourceCodes.has(f.source)) err(id, `source '${f.source}' unknown`);
  if (f.confidence && f.source && confLevels.has(f.confidence) && !confLevels.get(f.confidence).has(f.source)) {
    warn(id, `source '${f.source}' inconsistent with confidence '${f.confidence}'`);
  }
  if (!dateRe.test(f.lastReviewed || '')) err(id, 'lastReviewed must be YYYY-MM-DD');
}

// Thalis: components must reference existing foods + valid units.
const thalis = loadAllThalis();
for (const t of thalis) {
  const id = t.id || `<missing-id in ${t._file}>`;
  if (!t.id || !idRe.test(t.id)) err(id, 'invalid/missing thali id');
  if (ids.has(t.id)) err(id, 'id collides with a food or another thali');
  ids.add(t.id);
  if (!Array.isArray(t.components) || t.components.length === 0) err(id, 'thali needs components');
  for (const c of t.components || []) {
    if (!foodIds.has(c.foodId)) err(id, `component foodId '${c.foodId}' not found`);
    if (!unitCodes.has(c.unit)) err(id, `component unit '${c.unit}' unknown`);
    if (!(c.quantity > 0)) err(id, `component '${c.foodId}' quantity must be > 0`);
    if (c.oilStyle && !oilStyles.has(c.oilStyle)) err(id, `component oilStyle '${c.oilStyle}' invalid`);
  }
  if (!dateRe.test(t.lastReviewed || '')) err(id, 'thali lastReviewed must be YYYY-MM-DD');
}

console.log(`Validated ${foods.length} foods, ${thalis.length} thalis.`);
if (warnings.length) {
  console.log(`\n⚠️  ${warnings.length} warning(s):`);
  for (const w of warnings) console.log('  - ' + w);
}
if (errors.length) {
  console.error(`\n❌ ${errors.length} error(s):`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log('\n✅ All records valid.');
