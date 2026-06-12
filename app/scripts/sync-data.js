// Copies the committed food-database artifacts into app/public/data/ so the
// app can fetch them as static files (and the service worker can cache them
// for offline use). Runs automatically before `dev` and `build`.
//
// Source of truth = the database project at repo root (../dist + ../data/reference).
// If ../dist is missing (e.g. a fresh clone where it wasn't committed), we
// rebuild it by invoking the root build script.

import { existsSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = join(__dirname, '..');
const repoRoot = join(appRoot, '..');
const distDir = join(repoRoot, 'dist');
const refDir = join(repoRoot, 'data', 'reference');
const outDir = join(appRoot, 'public', 'data');
const outRefDir = join(outDir, 'reference');

mkdirSync(outDir, { recursive: true });
mkdirSync(outRefDir, { recursive: true });

if (!existsSync(distDir)) {
  console.log('[sync-data] dist/ missing — building database from root…');
  execSync('node tools/build-index.js', { cwd: repoRoot, stdio: 'inherit' });
}

const distFiles = [
  'foods.json',
  'search-index.json',
  'thalis.json',
  'by-category.json',
  'by-region.json',
  'by-meal.json',
  'manifest.json',
];
for (const f of distFiles) {
  const src = join(distDir, f);
  if (existsSync(src)) copyFileSync(src, join(outDir, f));
  else console.warn(`[sync-data] WARN missing ${src}`);
}

const refFiles = ['oil-modifiers.json', 'portions.json', 'regions.json', 'categories.json', 'tags.json'];
for (const f of refFiles) {
  const src = join(refDir, f);
  if (existsSync(src)) copyFileSync(src, join(outRefDir, f));
  else console.warn(`[sync-data] WARN missing ${src}`);
}

const count = readdirSync(outDir).filter((f) => f.endsWith('.json')).length;
console.log(`[sync-data] copied ${count} data files + ${refFiles.length} reference files into app/public/data/`);
