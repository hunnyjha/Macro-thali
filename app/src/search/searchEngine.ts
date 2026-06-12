import Fuse from 'fuse.js';
import type { SearchDoc, DietType, Zone } from '../types/food';
import type { ReferenceData } from '../data/dataService';

// Search layer optimized for Indian food queries:
//  - fuzzy text + alias/Hindi/local matching (Fuse over the pre-joined token blob)
//  - misspelling tolerance (Fuse threshold)
//  - synonym expansion (buttermilk -> chaas, flattened rice -> poha, …)
//  - intent detection (protein / breakfast / bihar / veg -> structured filters)

export interface SearchFilters {
  diet?: DietType;
  region?: Zone;
  category?: string;
  meal?: string;
  highProtein?: boolean;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Query-term synonyms appended before fuzzy search (data already has many aliases,
// these cover gaps and English descriptive phrases).
const SYNONYMS: Record<string, string> = {
  buttermilk: 'chaas',
  yogurt: 'curd dahi',
  curd: 'dahi',
  'cottage cheese': 'paneer',
  'flattened rice': 'poha chura chiwda',
  'fox nut': 'makhana',
  'fox nuts': 'makhana',
  'lotus seed': 'makhana',
  'finger millet': 'ragi marua',
  'pigeon pea': 'arhar toor',
  'kidney bean': 'rajma',
  'chickpea': 'chana chole',
  'gram flour': 'besan sattu',
  'clarified butter': 'ghee',
  'lentil': 'dal',
  'lentils': 'dal',
  shake: 'lassi milkshake',
  egg: 'anda',
  chicken: 'murgh kukda',
  fish: 'machhli macher maach',
  rice: 'chawal bhat',
  bread: 'roti chapati',
};

export class FoodSearch {
  private docs: SearchDoc[];
  private regionAliases: Map<string, Zone>;
  private stateAliases: Map<string, string>;
  private categoryAliases: Map<string, string>;

  constructor(docs: SearchDoc[], ref: ReferenceData) {
    this.docs = docs;

    // state name / code -> state code
    this.stateAliases = new Map();
    for (const r of ref.regions.regions) {
      this.stateAliases.set(normalize(r.code), r.code);
      this.stateAliases.set(normalize(r.name), r.code);
    }
    // common demonyms
    const demonyms: Record<string, string> = {
      bihari: 'bihar',
      bengali: 'west-bengal',
      bengal: 'west-bengal',
      punjabi: 'punjab',
      gujarati: 'gujarat',
      rajasthani: 'rajasthan',
      marathi: 'maharashtra',
      maharashtrian: 'maharashtra',
      tamil: 'tamil-nadu',
      malayali: 'kerala',
      keralan: 'kerala',
      odia: 'odisha',
      kashmiri: 'jammu-kashmir',
      assamese: 'assam',
    };
    for (const [k, v] of Object.entries(demonyms)) this.stateAliases.set(k, v);

    // region/zone words
    this.regionAliases = new Map<string, Zone>([
      ['south', 'south'], ['south indian', 'south'],
      ['north', 'north'], ['north indian', 'north'],
      ['east', 'east'], ['eastern', 'east'],
      ['west', 'west'], ['western', 'west'],
      ['north east', 'north-east'], ['northeast', 'north-east'],
      ['central', 'central'], ['himalayan', 'himalayan'],
    ]);

    // category name -> category code
    this.categoryAliases = new Map();
    for (const c of ref.categories.categories) {
      this.categoryAliases.set(normalize(c.name), c.code);
      this.categoryAliases.set(normalize(c.code), c.code);
    }
    // Friendly category words — intentionally EXCLUDES common ingredient words
    // (rice, dal, sabzi, biryani…) so queries like "flattened rice" stay as
    // text search and aren't narrowed to a single category.
    const catWords: Record<string, string> = {
      sweet: 'desserts', sweets: 'desserts', dessert: 'desserts',
      beverage: 'drinks',
      'street food': 'street-food',
      thali: 'thali-combo',
    };
    for (const [k, v] of Object.entries(catWords)) this.categoryAliases.set(k, v);
  }

  // Detect structured intent from the raw query; returns filters + residual text.
  private detectIntent(q: string): { filters: SearchFilters; residual: string } {
    const filters: SearchFilters = {};
    let residual = ` ${q} `;
    const consume = (phrase: string) => {
      residual = residual.replace(` ${phrase} `, ' ');
    };

    // multi-word phrases first
    const tryPhrases = (table: Map<string, unknown>, apply: (val: unknown) => void) => {
      const phrases = [...table.keys()].sort((a, b) => b.length - a.length);
      for (const p of phrases) {
        if (p.includes(' ') && residual.includes(` ${p} `)) {
          apply(table.get(p));
          consume(p);
        }
      }
      for (const p of phrases) {
        if (!p.includes(' ') && residual.includes(` ${p} `)) {
          apply(table.get(p));
          consume(p);
        }
      }
    };

    if (residual.includes(' high protein ') || residual.includes(' protein ') || residual.includes(' proteins ')) {
      filters.highProtein = true;
      consume('high protein'); consume('protein'); consume('proteins'); consume('high');
    }
    if (residual.includes(' veg ') || residual.includes(' vegetarian ')) { filters.diet = 'veg'; consume('veg'); consume('vegetarian'); }
    if (residual.includes(' nonveg ') || residual.includes(' non veg ')) { filters.diet = 'non-veg'; consume('nonveg'); consume('non veg'); consume('non'); }

    for (const meal of ['breakfast', 'lunch', 'dinner', 'snack']) {
      if (residual.includes(` ${meal} `)) { filters.meal = meal; consume(meal); }
    }

    tryPhrases(this.regionAliases, (v) => { filters.region = v as Zone; });
    tryPhrases(this.stateAliases as Map<string, unknown>, (v) => {
      // state implies its zone too; store as region filter via state match in applyFilters
      (filters as SearchFilters & { state?: string }).state = v as string;
    });
    tryPhrases(this.categoryAliases as Map<string, unknown>, (v) => { filters.category = v as string; });

    return { filters, residual: residual.trim() };
  }

  private applyFilters(docs: SearchDoc[], f: SearchFilters & { state?: string }): SearchDoc[] {
    return docs.filter((d) => {
      if (f.diet && d.diet !== f.diet) return false;
      if (f.region && d.region !== f.region) return false;
      if (f.state && d.state !== f.state) return false;
      if (f.category && d.cat !== f.category) return false;
      if (f.meal && !d.meal.includes(f.meal)) return false;
      if (f.highProtein && !(d.protein >= 12 || d.ps >= 7)) return false;
      return true;
    });
  }

  // Main entry. `uiFilters` come from filter chips; query is the text box.
  search(query: string, uiFilters: SearchFilters = {}, limit = 60): SearchDoc[] {
    const q = normalize(query);
    const { filters: intentFilters, residual } = q ? this.detectIntent(q) : { filters: {}, residual: '' };
    const merged: SearchFilters & { state?: string } = { ...intentFilters, ...uiFilters };

    let pool = this.applyFilters(this.docs, merged);

    let results: SearchDoc[];
    if (residual && residual.length >= 2) {
      // expand synonyms then fuzzy-search within the filtered pool
      let expanded = residual;
      for (const [k, v] of Object.entries(SYNONYMS)) {
        if (residual.includes(k)) expanded += ` ${v}`;
      }
      const sub = new Fuse(pool, {
        keys: [{ name: 'name', weight: 0.6 }, { name: 't', weight: 0.4 }],
        threshold: 0.4, ignoreLocation: true, minMatchCharLength: 2, includeScore: true,
      });
      results = sub.search(expanded).map((r) => r.item);
    } else {
      // no text — sort sensibly: high-protein intent sorts by protein, else by name
      results = [...pool];
      if (merged.highProtein) results.sort((a, b) => b.protein - a.protein);
      else results.sort((a, b) => a.name.localeCompare(b.name));
    }
    return results.slice(0, limit);
  }

  // Suggestions when the search box is empty and no filters: popular/high-protein picks.
  defaults(limit = 40): SearchDoc[] {
    return [...this.docs].sort((a, b) => b.ps - a.ps || b.protein - a.protein).slice(0, limit);
  }
}
