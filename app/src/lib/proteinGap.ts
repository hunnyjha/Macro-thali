// Smart protein-gap suggestions: given grams of protein still needed, propose
// concrete Indian-friendly options ("4 eggs", "1 scoop whey", "150g chicken"),
// prioritising foods the user already logs.

export interface ProteinSuggestion {
  foodId: string;
  text: string;     // e.g. "4 eggs"
  protein: number;  // grams this option provides
}

type Kind = 'count' | 'scoop' | 'grams' | 'serving';
interface Source { foodId: string; label: string; per: number; kind: Kind; unit?: string; }

// per = grams of protein per unit (egg / scoop / 100g / serving)
const SOURCES: Source[] = [
  { foodId: 'whey-avvatar-whey', label: 'whey', per: 25, kind: 'scoop' },
  { foodId: 'pi-boiled-egg', label: 'egg', per: 6.5, kind: 'count' },
  { foodId: 'pi-grilled-chicken-breast', label: 'chicken breast', per: 31, kind: 'grams' },
  { foodId: 'pi-paneer-raw', label: 'paneer', per: 18, kind: 'grams' },
  { foodId: 'hp-greek-yogurt', label: 'Greek yogurt', per: 13.5, kind: 'serving', unit: 'katori' },
  { foodId: 'pi-soya-chunks-cooked', label: 'soya chunks', per: 23, kind: 'serving', unit: 'katori' },
  { foodId: 'hp-roasted-chana', label: 'roasted chana', per: 7.2, kind: 'serving', unit: 'katori' },
  { foodId: 'pi-curd-dahi', label: 'curd', per: 4.6, kind: 'serving', unit: 'katori' },
];

function describe(s: Source, rem: number): ProteinSuggestion {
  if (s.kind === 'count') {
    const n = Math.max(1, Math.round(rem / s.per));
    return { foodId: s.foodId, text: `${n} ${n > 1 ? 'eggs' : 'egg'}`, protein: Math.round(n * s.per) };
  }
  if (s.kind === 'scoop') {
    const n = Math.max(1, Math.round(rem / s.per));
    return { foodId: s.foodId, text: `${n} scoop ${s.label}`, protein: Math.round(n * s.per) };
  }
  if (s.kind === 'grams') {
    const grams = Math.max(50, Math.round(rem / s.per * 100 / 25) * 25);
    return { foodId: s.foodId, text: `${grams}g ${s.label}`, protein: Math.round((grams / 100) * s.per) };
  }
  const n = Math.max(1, Math.round(rem / s.per));
  return { foodId: s.foodId, text: `${n} ${s.unit} ${s.label}`, protein: Math.round(n * s.per) };
}

export function proteinGapSuggestions(
  remProtein: number,
  opts: { used?: string[]; limit?: number } = {},
): ProteinSuggestion[] {
  if (remProtein <= 0) return [];
  const used = new Set(opts.used ?? []);
  const ranked = [...SOURCES].sort((a, b) => Number(used.has(b.foodId)) - Number(used.has(a.foodId)));
  return ranked.slice(0, opts.limit ?? 4).map((s) => describe(s, remProtein));
}
