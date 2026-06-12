import { db } from './db';
import type { Food, SearchDoc, Thali } from '../types/food';
import type {
  OilModifiersFile, PortionsFile, CategoriesFile, RegionsFile, TagsFile,
} from '../types/reference';

// Loads + caches the food database. Strategy for scale:
//  - search-index.json (compact) is held in memory for instant search.
//  - full foods.json is streamed into IndexedDB once per DB version, then
//    food details are read by id on demand (not kept in memory).
//  - reference files are tiny and kept in memory.

const base = import.meta.env.BASE_URL || '/';
const url = (p: string) => `${base}data/${p}`.replace(/\/{2,}/g, '/');

export interface ReferenceData {
  oil: OilModifiersFile;
  portions: PortionsFile;
  categories: CategoriesFile;
  regions: RegionsFile;
  tags: TagsFile;
  portionName: Map<string, string>;
  categoryName: Map<string, string>;
  stateName: Map<string, string>;
}

let _searchDocs: SearchDoc[] | null = null;
let _thalis: Thali[] | null = null;
let _ref: ReferenceData | null = null;
let _ready: Promise<void> | null = null;

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(url(path));
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

async function populateFoods(): Promise<void> {
  const manifest = await fetchJSON<{ builtAt: string; counts: Record<string, number> }>('manifest.json');
  const cachedVersion = (await db.meta.get('foodsVersion'))?.value;
  const haveFoods = (await db.foods.count()) > 0;
  if (haveFoods && cachedVersion === manifest.builtAt) return; // up to date

  const foods = await fetchJSON<Food[]>('foods.json');
  await db.transaction('rw', db.foods, db.meta, async () => {
    await db.foods.clear();
    await db.foods.bulkPut(foods);
    await db.meta.put({ key: 'foodsVersion', value: manifest.builtAt });
  });
}

async function loadReference(): Promise<ReferenceData> {
  const [oil, portions, categories, regions, tags] = await Promise.all([
    fetchJSON<OilModifiersFile>('reference/oil-modifiers.json'),
    fetchJSON<PortionsFile>('reference/portions.json'),
    fetchJSON<CategoriesFile>('reference/categories.json'),
    fetchJSON<RegionsFile>('reference/regions.json'),
    fetchJSON<TagsFile>('reference/tags.json'),
  ]);
  return {
    oil, portions, categories, regions, tags,
    portionName: new Map(portions.units.map((u) => [u.code, u.name])),
    categoryName: new Map(categories.categories.map((c) => [c.code, c.name])),
    stateName: new Map(regions.regions.map((r) => [r.code, r.name])),
  };
}

// Idempotent: safe to call from multiple components; runs once.
export function initData(): Promise<void> {
  if (!_ready) {
    _ready = (async () => {
      const [docs, thalis, ref] = await Promise.all([
        fetchJSON<SearchDoc[]>('search-index.json'),
        fetchJSON<Thali[]>('thalis.json'),
        loadReference(),
      ]);
      _searchDocs = docs;
      _thalis = thalis;
      _ref = ref;
      await populateFoods();
    })();
  }
  return _ready;
}

export const getSearchDocs = (): SearchDoc[] => _searchDocs ?? [];
export const getThalis = (): Thali[] => _thalis ?? [];
export const getReference = (): ReferenceData => {
  if (!_ref) throw new Error('Reference data not loaded — call initData() first');
  return _ref;
};

export const getFood = (id: string): Promise<Food | undefined> => db.foods.get(id);
export const getFoods = (ids: string[]): Promise<(Food | undefined)[]> => db.foods.bulkGet(ids);
