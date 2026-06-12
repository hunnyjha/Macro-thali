import type { MealSlot } from '../types/log';

// Parses free text / Hinglish meal descriptions into structured segments.
//   "2 roti + dahi"            -> [{qty:2, unit:'roti', query:'roti'}, {qty:1, query:'dahi'}]
//   "3 eggs and 250ml milk"    -> [{qty:3, query:'eggs'}, {qty:250, unit:'ml', query:'milk'}]
//   "breakfast mein 4 eggs aur chai" -> slot:breakfast + segments

export interface ParsedSegment {
  qty: number;
  unit?: string;
  query: string;
}
export interface ParsedMeal {
  slot?: MealSlot;
  segments: ParsedSegment[];
}

const NUM_WORDS: Record<string, number> = {
  a: 1, an: 1, one: 1, ek: 1, two: 2, do: 2, three: 3, teen: 3, four: 4, char: 4, chaar: 4,
  five: 5, paanch: 5, panch: 5, six: 6, che: 6, half: 0.5, aadha: 0.5, adha: 0.5,
};

const UNIT_WORDS: Record<string, string> = {
  ml: 'ml', g: 'g', gm: 'g', gms: 'g', gram: 'g', grams: 'g', kg: 'kg',
  katori: 'katori', katoris: 'katori', bowl: 'bowl', bowls: 'bowl',
  glass: 'glass', glasses: 'glass', cup: 'cup', cups: 'cup',
  plate: 'plate', plates: 'plate', roti: 'roti', rotis: 'roti', rotti: 'roti',
  phulka: 'phulka', chapati: 'roti', chapatis: 'roti',
  piece: 'piece', pieces: 'piece', pcs: 'piece', pc: 'piece',
  tbsp: 'tablespoon', tablespoon: 'tablespoon', tsp: 'teaspoon', teaspoon: 'teaspoon',
  scoop: 'scoop', scoops: 'scoop', idli: 'idli', idlis: 'idli', dosa: 'dosa',
  slice: 'slice', slices: 'slice', ladle: 'ladle',
};

const SLOT_WORDS: Record<string, MealSlot> = {
  breakfast: 'breakfast', nashta: 'breakfast', subah: 'breakfast',
  lunch: 'lunch', dopahar: 'lunch', dinner: 'dinner', raat: 'dinner',
  snack: 'snack', snacks: 'snack', evening: 'snack',
};

const FILLER = new Set(['mein', 'me', 'of', 'some', 'with', 'and', 'aur', 'plus', 'ka', 'ki', 'aur']);

export function parseMeal(input: string): ParsedMeal {
  let text = ` ${input.toLowerCase().trim()} `;
  let slot: MealSlot | undefined;
  for (const [w, s] of Object.entries(SLOT_WORDS)) {
    if (text.includes(` ${w} `)) { slot = s; text = text.replace(` ${w} `, ' '); }
  }
  // normalise separators to | and split number-letter joins (250ml -> 250 ml)
  text = text
    .replace(/\+|,|&|\band\b|\baur\b|\bwith\b/g, '|')
    .replace(/(\d)([a-z])/g, '$1 $2')
    .replace(/([a-z])(\d)/g, '$1 $2');

  const segments: ParsedSegment[] = [];
  for (const raw of text.split('|')) {
    const tokens = raw.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) continue;
    let qty = 1;
    let unit: string | undefined;

    if (/^\d+(\.\d+)?$/.test(tokens[0])) { qty = parseFloat(tokens[0]); tokens.shift(); }
    else if (tokens[0] in NUM_WORDS) { qty = NUM_WORDS[tokens[0]]; tokens.shift(); }

    // Only treat the next token as a unit if a food name still follows it.
    // (So "2 roti" keeps "roti" as the food, while "1 katori dal" uses katori.)
    if (tokens.length > 1 && tokens[0] in UNIT_WORDS) { unit = UNIT_WORDS[tokens[0]]; tokens.shift(); }

    const query = tokens.filter((t) => !FILLER.has(t)).join(' ').trim();
    if (!query) continue;
    segments.push({ qty: qty > 0 ? qty : 1, unit, query });
  }
  return { slot, segments };
}
