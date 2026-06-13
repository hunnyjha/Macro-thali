// One-off importer: converts the uploaded Macro Katori spreadsheet (Food_DB sheet,
// macros already per-100g) into a catalog file the app already consumes, and
// extends the category taxonomy with any new sub-categories.
//
// Usage: node tools/import-xlsx.js <path-to.xlsx>
// Output: data/foods/by-category/imported.json  (+ updates data/reference/categories.json)
//
// Rules honoured: import 100% of rows; never mark estimated as verified; keep the
// sheet's source_type; fall back to 'estimated' when missing; don't touch existing
// foods (ids are namespaced `imp-`).

import XLSX from 'xlsx';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, DIR, readJSON } from './lib.js';

const file = process.argv[2];
if (!file) { console.error('Provide the .xlsx path'); process.exit(1); }

const rows = XLSX.utils.sheet_to_json(XLSX.readFile(file).Sheets['Food_DB'], { defval: null });

const GENERIC_BRANDS = new Set(['Raw Ingredient', 'Homemade', 'Homemade/Restaurant', 'Restaurant Estimate', 'Generic', '']);
const CAT_MAP = {
  Grains: 'grains-breads', Flours: 'staples-basics', 'Pulses & Legumes': 'dal-legumes',
  Vegetables: 'vegetables', Fruits: 'staples-basics', 'Nuts & Seeds': 'snacks',
  'Cooking Staples': 'staples-basics', 'Spices & Masalas': 'staples-basics',
  'Dairy/Egg/Meat': 'staples-basics', 'Dairy & Breakfast': 'breakfast', Munchies: 'snacks',
  'Cold Drinks & Juices': 'drinks', 'Tea, Coffee & Milk Drinks': 'drinks',
  'Bakery & Biscuits': 'snacks', 'Sweet Tooth': 'desserts', 'Instant & Frozen Food': 'snacks',
  'Atta Rice Dal Oil Masala': 'staples-basics', 'Protein & Fitness': 'high-protein',
};
const MEAL_TAGS = {
  drinks: ['drink'], desserts: ['dessert'], breakfast: ['breakfast'],
  snacks: ['snack'], 'street-food': ['snack', 'street'], 'high-protein': ['snack', 'post-workout'],
  'rice-dishes': ['lunch', 'dinner', 'main'], 'dal-legumes': ['lunch', 'dinner', 'main'],
  vegetables: ['lunch', 'dinner', 'side'], 'non-veg': ['lunch', 'dinner', 'main'],
  'paneer-dairy-veg': ['lunch', 'dinner', 'main'], 'grains-breads': ['lunch', 'dinner', 'main'],
  'staples-basics': ['side'],
};
const NONVEG = /\b(chicken|mutton|lamb|goat|fish|prawn|shrimp|meat|beef|buff|pork|keema|kheema|seafood|crab|tandoori|kebab|tikka|rohu|hilsa|ilish)\b/i;
const EGG = /\b(egg|anda|omelet|omelette|bhurji)\b/i;

const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const title = (s) => String(s || '').trim().replace(/\s+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const num = (v) => Math.max(0, typeof v === 'number' && isFinite(v) ? Math.round(v * 10) / 10 : 0);

function inferCookedCat(name) {
  const n = name.toLowerCase();
  if (/(biryani|pulao|pulav|fried rice|khichdi|rice)/.test(n)) return 'rice-dishes';
  if (/(dal|daal|sambar|rasam|kadhi|chana|rajma|chole)/.test(n)) return 'dal-legumes';
  if (/(roti|paratha|naan|kulcha|puri|poori|dosa|idli|uttapam|chapati|thepla|bhatura)/.test(n)) return 'grains-breads';
  if (/paneer/.test(n)) return 'paneer-dairy-veg';
  if (NONVEG.test(n) || EGG.test(n)) return 'non-veg';
  return 'vegetables';
}
function dietType(name) {
  if (NONVEG.test(name)) return 'non-veg';
  if (EGG.test(name)) return 'egg';
  return 'veg';
}
function mapSource(sourceType, confidence) {
  if (sourceType === 'government_database') return { source: 'IFCT', confidence: 'high', verificationStatus: 'verified' };
  // estimated (default for anything else / missing)
  const c = ['high', 'medium', 'low'].includes(confidence) ? confidence : 'medium';
  const source = c === 'high' ? 'published-database' : c === 'low' ? 'community-estimate' : 'recipe-analysis';
  return { source, confidence: c, verificationStatus: 'estimated' };
}

// Track new subcategories to merge into the taxonomy.
const newSubs = new Map(); // catCode -> Set(subSlug)
const out = [];
let withBrand = 0;

for (const r of rows) {
  const name = title(r.food_name);
  if (!name) continue; // (none expected)
  const catCode = r.category === 'Cooked Indian Foods' ? inferCookedCat(name) : (CAT_MAP[r.category] || 'staples-basics');
  const subSlug = slug(r.sub_category) || undefined;
  if (subSlug) { (newSubs.get(catCode) ?? newSubs.set(catCode, new Set()).get(catCode)).add(subSlug); }

  const servingGrams = num(r.serving_size) || 100; // g or ml (1ml≈1g)
  const unitLabel = `${r.serving_size ?? 100} ${r.serving_unit || 'g'}`;
  const { source, confidence, verificationStatus } = mapSource(r.source_type, r.confidence);
  const brand = r.brand && !GENERIC_BRANDS.has(r.brand) ? r.brand : undefined;
  if (brand) withBrand++;

  const food = {
    id: `imp-${String(r.food_id || `r${out.length}`).toLowerCase()}`,
    name,
    aliases: [String(r.food_name || '').toLowerCase()].filter(Boolean),
    region: 'pan-india',
    state: 'pan-india',
    category: catCode,
    subcategory: subSlug,
    dietType: dietType(name),
    per100g: {
      calories: num(r.calories_per_100),
      protein: num(r.protein_g_per_100),
      carbs: num(r.carbs_g_per_100),
      fat: num(r.fat_g_per_100),
      ...(r.fiber_g_per_100 != null ? { fiber: num(r.fiber_g_per_100) } : {}),
    },
    portions: [
      { unit: 'serving', grams: servingGrams, default: true, label: unitLabel },
      { unit: 'gram', grams: 1 },
    ],
    oilSensitivity: 'none',
    mealTags: MEAL_TAGS[catCode] ?? ['snack'],
    confidence,
    source,
    ...(brand ? { brand } : {}),
    verificationStatus,
    ...(r.notes ? { notes: String(r.notes) } : {}),
    lastReviewed: '2026-06-13',
  };
  out.push(food);
}

writeFileSync(join(DIR.byCategory, 'imported.json'), JSON.stringify(out, null, 2) + '\n');

// Merge new subcategories into categories.json (keeps validation clean).
const catFile = join(DIR.reference, 'categories.json');
const cats = readJSON(catFile);
let added = 0;
for (const c of cats.categories) {
  const adds = newSubs.get(c.code);
  if (!adds) continue;
  for (const s of adds) if (!c.subcategories.includes(s)) { c.subcategories.push(s); added++; }
}
writeFileSync(catFile, JSON.stringify(cats, null, 2) + '\n');

// Report
console.log(`Imported ${out.length} foods → data/foods/by-category/imported.json`);
console.log(`With real brand: ${withBrand}. New subcategories added: ${added}.`);
