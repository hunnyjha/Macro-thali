// Shared library for Macro Katori food-database tooling.
// Zero external dependencies. Loads reference data, resolves oil styles,
// computes protein scores, derives health tags, and gathers all records.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(__dirname, '..');
export const DIR = {
  reference: join(ROOT, 'data', 'reference'),
  byRegion: join(ROOT, 'data', 'foods', 'by-region'),
  byCategory: join(ROOT, 'data', 'foods', 'by-category'),
  thalis: join(ROOT, 'data', 'thalis'),
  custom: join(ROOT, 'data', 'custom'),
  dist: join(ROOT, 'dist'),
};

export function readJSON(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function listJSON(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => join(dir, f));
}

export function loadReference() {
  const regions = readJSON(join(DIR.reference, 'regions.json'));
  const categories = readJSON(join(DIR.reference, 'categories.json'));
  const portions = readJSON(join(DIR.reference, 'portions.json'));
  const oil = readJSON(join(DIR.reference, 'oil-modifiers.json'));
  const confSrc = readJSON(join(DIR.reference, 'confidence-and-sources.json'));
  const tags = readJSON(join(DIR.reference, 'tags.json'));
  return { regions, categories, portions, oil, confSrc, tags };
}

// Load every food record from region + category files. Returns array with `_file`.
export function loadAllFoods() {
  const out = [];
  for (const file of [...listJSON(DIR.byRegion), ...listJSON(DIR.byCategory)]) {
    const arr = readJSON(file);
    if (!Array.isArray(arr)) {
      throw new Error(`${file} must be a JSON array of food records`);
    }
    for (const food of arr) out.push({ ...food, _file: file });
  }
  return out;
}

export function loadAllThalis() {
  const out = [];
  for (const file of listJSON(DIR.thalis)) {
    const arr = readJSON(file);
    if (!Array.isArray(arr)) throw new Error(`${file} must be a JSON array`);
    for (const t of arr) out.push({ ...t, _file: file });
  }
  return out;
}

// Source → user-facing verification status (Verified / Estimated / Community).
// Manufacturer labels and government/published databases are trusted (Verified);
// recipe/restaurant computations are Estimated; the rest are Community.
const VERIFIED_SOURCES = new Set(['ICMR', 'NIN', 'IFCT', 'FSSAI', 'USDA', 'published-database', 'brand-label']);
const ESTIMATED_SOURCES = new Set(['recipe-analysis', 'restaurant-menu']);

export function verificationFromSource(source) {
  if (VERIFIED_SOURCES.has(source)) return 'verified';
  if (ESTIMATED_SOURCES.has(source)) return 'estimated';
  return 'community';
}

// Source priority for search ordering (lower = shown first):
// 1 verified brand data, 2 official databases, 3 internal estimates, 4 community.
export function sourcePriority(source) {
  if (source === 'brand-label') return 1;
  if (['ICMR', 'NIN', 'IFCT', 'FSSAI', 'USDA', 'published-database'].includes(source)) return 2;
  if (ESTIMATED_SOURCES.has(source)) return 3;
  return 4;
}

// Resolve added cooking-oil grams per 100g for a given style.
export function oilGramsPer100g(food, oilRef, style) {
  if (food.oilModifiers && style in food.oilModifiers) return food.oilModifiers[style];
  const level = oilRef.sensitivityLevels[food.oilSensitivity];
  if (!level) return 0;
  return level.oilGramsPer100g[style] ?? 0;
}

// Compute macros for a given serving (grams) and oil style.
export function computeMacros(food, grams, style, oilRef) {
  const f = food.per100g;
  const factor = grams / 100;
  const oilG100 = oilGramsPer100g(food, oilRef, style);
  const addedOil = oilG100 * factor;
  const kcalOil = oilRef.kcalPerGramOil ?? 8.84;
  return {
    grams,
    style,
    calories: round(f.calories * factor + addedOil * kcalOil),
    protein: round(f.protein * factor),
    carbs: round(f.carbs * factor),
    fat: round(f.fat * factor + addedOil),
    fiber: f.fiber != null ? round(f.fiber * factor) : undefined,
  };
}

// Protein score 0-10: blends protein density (g/100g) and protein-to-calorie ratio.
// Density dominates; the ratio rewards lean protein sources. See docs/SCORING.md.
export function proteinScore(per100g) {
  const p = per100g.protein || 0;
  const kcal = per100g.calories || 1;
  // Density component: 0 at 0g, ~10 at 30g/100g.
  const density = Math.min(p / 3, 10);
  // Quality component: protein kcal share (protein*4/kcal), 0..1 -> 0..10.
  const share = Math.min((p * 4) / kcal, 1) * 10;
  const score = 0.6 * density + 0.4 * share;
  return Math.max(0, Math.min(10, Math.round(score)));
}

// Derive health tags from macros. Returns a sorted, de-duped array merged with manual tags.
export function deriveHealthTags(food) {
  const f = food.per100g;
  const tags = new Set(food.healthTags || []);
  const ps = food.proteinScore ?? proteinScore(f);
  if (f.protein >= 12 || ps >= 7) tags.add('high-protein');
  if (f.calories <= 100) tags.add('low-cal');
  if (f.calories >= 300) tags.add('high-cal');
  if (f.fiber != null && f.fiber >= 6) tags.add('high-fiber');
  if (f.fat >= 20) tags.add('high-fat');
  if (f.carbs >= 50) tags.add('high-carb');
  if (food.oilSensitivity === 'fried') tags.add('fried');
  return [...tags].sort();
}

export function round(n) {
  return Math.round(n * 100) / 100;
}

// Build a normalized search blob for a food (name + aliases + local names +
// brand + subcategory, so foods are findable by brand and sub-category too).
export function searchTokens(food) {
  const parts = [
    food.name,
    ...(food.aliases || []),
    ...Object.values(food.localNames || {}),
    food.brand,
    food.subcategory,
  ].filter(Boolean);
  return parts.join(' ').toLowerCase();
}
