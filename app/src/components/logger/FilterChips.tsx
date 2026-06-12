import type { SearchFilters, NutriFilter } from '../../search/searchEngine';
import type { DietType, Zone } from '../../types/food';

interface Props {
  filters: SearchFilters;
  onChange: (f: SearchFilters) => void;
}

const diets: { code: DietType; label: string }[] = [
  { code: 'veg', label: 'Veg' },
  { code: 'egg', label: 'Egg' },
  { code: 'non-veg', label: 'Non-veg' },
];
const meals = ['breakfast', 'lunch', 'snack', 'dinner'];
const regions: { code: Zone; label: string }[] = [
  { code: 'east', label: 'East' },
  { code: 'north', label: 'North' },
  { code: 'south', label: 'South' },
  { code: 'west', label: 'West' },
  { code: 'north-east', label: 'North-East' },
];
const nutris: { code: NutriFilter; label: string }[] = [
  { code: 'low-cal', label: 'Low Cal' },
  { code: 'high-fiber', label: 'High Fiber' },
  { code: 'high-carb', label: 'High Carb' },
  { code: 'low-fat', label: 'Low Fat' },
];

export function FilterChips({ filters, onChange }: Props) {
  const toggle = <K extends keyof SearchFilters>(key: K, val: SearchFilters[K]) =>
    onChange({ ...filters, [key]: filters[key] === val ? undefined : val });

  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1">
      <button
        className={`chip ${filters.highProtein ? 'chip-active' : ''}`}
        onClick={() => onChange({ ...filters, highProtein: filters.highProtein ? undefined : true })}
      >
        💪 High Protein
      </button>
      {diets.map((d) => (
        <button key={d.code} className={`chip ${filters.diet === d.code ? 'chip-active' : ''}`} onClick={() => toggle('diet', d.code)}>
          {d.label}
        </button>
      ))}
      {meals.map((m) => (
        <button key={m} className={`chip capitalize ${filters.meal === m ? 'chip-active' : ''}`} onClick={() => toggle('meal', m)}>
          {m}
        </button>
      ))}
      {nutris.map((n) => (
        <button key={n.code} className={`chip ${filters.nutri === n.code ? 'chip-active' : ''}`} onClick={() => toggle('nutri', n.code)}>
          {n.label}
        </button>
      ))}
      {regions.map((r) => (
        <button key={r.code} className={`chip ${filters.region === r.code ? 'chip-active' : ''}`} onClick={() => toggle('region', r.code)}>
          {r.label}
        </button>
      ))}
    </div>
  );
}
