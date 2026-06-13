// TypeScript interfaces for every food record — mirrors schemas/food.schema.json
// from the database project. These are the contract between the DB and the app.

export type DietType = 'veg' | 'non-veg' | 'egg';

export type Zone =
  | 'east' | 'north-east' | 'south' | 'north' | 'west' | 'central' | 'himalayan' | 'pan-india';

export type OilSensitivity = 'none' | 'low' | 'medium' | 'high' | 'fried';

export type OilStyle = 'very_light' | 'home_style' | 'medium' | 'heavy' | 'dhaba';

export type Confidence = 'high' | 'medium' | 'low';

export type VerificationStatus = 'verified' | 'estimated' | 'community';

export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

export interface Portion {
  unit: string;       // unit code from portions.json (katori, roti, idli, gram, …)
  grams: number;      // exact weight of one unit for THIS food
  label?: string;     // optional display override
  default?: boolean;  // the serving shown first in the UI
}

export interface OilModifiers {
  very_light?: number;
  home_style?: number;
  medium?: number;
  heavy?: number;
  dhaba?: number;
}

export interface Food {
  id: string;
  name: string;
  localNames?: Record<string, string>;
  aliases?: string[];
  region: Zone;
  state: string;
  category: string;
  subcategory?: string;
  dietType: DietType;
  per100g: Macros;
  portions: Portion[];
  oilSensitivity: OilSensitivity;
  oilModifiers?: OilModifiers;
  mealTags: string[];
  healthTags?: string[];
  proteinScore: number; // 0-10
  confidence: Confidence;
  source: string;
  sourceNote?: string;
  brand?: string;
  verificationStatus?: VerificationStatus; // derived from source at build time
  notes?: string;
  lastReviewed: string;
}

// Compact record from dist/search-index.json (lightweight, for fast search/scale).
export interface SearchDoc {
  id: string;
  name: string;
  t: string;        // pre-joined searchable token blob (name + aliases + localNames)
  cat: string;
  state: string;
  region: Zone;
  diet: DietType;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  ps: number;       // protein score
  meal: string[];
  vs: VerificationStatus;  // verified | estimated | community
  sp: number;              // source priority (1 brand … 4 community) for ranking
  brand?: string;
}

export interface ThaliComponent {
  foodId: string;
  unit: string;
  quantity: number;
  oilStyle?: OilStyle;
  optional?: boolean;
}

export interface Thali {
  id: string;
  name: string;
  localNames?: Record<string, string>;
  region: Zone;
  state?: string;
  dietType?: DietType;
  description?: string;
  components: ThaliComponent[];
  computedTotals?: Macros;
  mealTags?: string[];
  healthTags?: string[];
  confidence?: Confidence;
  source?: string;
  lastReviewed: string;
}
