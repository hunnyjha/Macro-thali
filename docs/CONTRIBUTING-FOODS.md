# Contributing foods

A quick, copy-paste guide for adding records.

## 1. Pick the file
- Regional dish → `data/foods/by-region/<state>.json`
- Generic pan-India item (fruit, oil, supplement, packaged) → a `data/foods/by-category/*.json`

## 2. Minimal template
You can omit `proteinScore` and `healthTags` — `normalize.js` fills them.

```json
{
  "id": "bihar-example-dish",
  "name": "Example Dish",
  "localNames": { "hi": "Udaharan" },
  "region": "east",
  "state": "bihar",
  "category": "vegetables",
  "subcategory": "dry-sabzi",
  "dietType": "veg",
  "per100g": { "calories": 120, "protein": 3, "carbs": 14, "fat": 6, "fiber": 3 },
  "portions": [
    { "unit": "katori", "grams": 120, "default": true },
    { "unit": "gram", "grams": 1 }
  ],
  "oilSensitivity": "medium",
  "mealTags": ["lunch", "dinner", "home-cooked"],
  "confidence": "medium",
  "source": "recipe-analysis",
  "lastReviewed": "2026-06-11"
}
```

## 3. Rules of thumb
- **id**: `<state>-<short-name>`, kebab-case, unique. Pan-India: `pi-` (general) / `hp-` (high-protein).
- **region** is the zone; **state** is the specific state code — both from `regions.json`.
- **per100g**: macros for the *home-style* version (oil added later by the oil system).
- **portions**: include the realistic Indian default (`default: true`) + always add `gram`.
- **oilSensitivity**: `none` for raw/boiled/steamed/fruit/milk, `fried` for deep-fried, else low/medium/high.
- **source/confidence** must agree (see `confidence-and-sources.json`). Don't claim `high` without a government/published source.

## 4. Run the pipeline
```bash
node tools/normalize.js     # fills proteinScore + healthTags
npm run validate            # must pass (fix errors; review warnings)
npm run build               # refresh dist/
npm run stats               # see updated coverage
```

## 5. Common validation messages
- *"source X inconsistent with confidence Y"* — align them.
- *"stated calories vs macro-derived differ >25%"* — likely a macro typo.
- *"portion unit 'X' unknown"* — add the unit to `portions.json` first, or use an existing one.
- *"subcategory not listed under category"* — check `categories.json`.
