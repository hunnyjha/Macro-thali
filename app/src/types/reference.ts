import type { OilStyle, OilSensitivity } from './food';

// Shapes of the reference JSON files (data/reference/*) the app fetches.

export interface OilModifiersFile {
  kcalPerGramOil: number;
  fatGramsPerGramOil: number;
  baseStyle: OilStyle;
  styles: { code: OilStyle; name: string; description: string }[];
  sensitivityLevels: Record<
    OilSensitivity,
    { oilGramsPer100g: Record<OilStyle, number> }
  >;
}

export interface PortionUnit {
  code: string;
  name: string;
  type: string;
  defaultGrams: number;
  note?: string;
}
export interface PortionsFile {
  units: PortionUnit[];
}

export interface RegionsFile {
  zones: string[];
  regions: { code: string; name: string; zone: string; languages: string[] }[];
}

export interface CategoriesFile {
  categories: { code: string; name: string; subcategories: string[] }[];
}

export interface TagsFile {
  mealTags: { code: string; name: string }[];
  healthTags: { code: string; name: string; rule?: string }[];
}
