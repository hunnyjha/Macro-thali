# Food record schema

Authoritative definition: `schemas/food.schema.json`. This doc is the human-readable
companion. All macros are **per 100 g** of edible portion, measured at the **base oil
style** (`home_style`).

| Field | Req | Type | Notes |
| --- | --- | --- | --- |
| `id` | ✓ | string | Unique kebab-case slug. Convention `<state>-<name>` (e.g. `bihar-litti`); pan-India uses `pi-`/`hp-` prefixes. |
| `name` | ✓ | string | Primary English/transliterated name. |
| `localNames` | | object | `{ langCode: name }`, e.g. `{ "hi": "Roti", "bn": "Ruti" }`. Drives Hindi/local search. |
| `aliases` | | string[] | Alternate spellings/common names for search. |
| `region` | ✓ | enum | Zone: `east`, `north-east`, `south`, `north`, `west`, `central`, `himalayan`, `pan-india`. |
| `state` | ✓ | string | State code from `regions.json` (or `pan-india`). |
| `category` | ✓ | string | Category code from `categories.json`. |
| `subcategory` | | string | Subcategory code (validated against the parent category). |
| `dietType` | ✓ | enum | `veg` \| `non-veg` \| `egg`. |
| `per100g` | ✓ | object | `{ calories, protein, carbs, fat, fiber? }`. Fiber optional. |
| `portions` | ✓ | array | `{ unit, grams, label?, default? }`. ≥1 entry; `gram` always available. |
| `oilSensitivity` | ✓ | enum | `none` \| `low` \| `medium` \| `high` \| `fried`. |
| `oilModifiers` | | object | Optional per-food override of oil grams/100g by style. |
| `mealTags` | ✓ | string[] | From `tags.json` mealTags (≥1). |
| `healthTags` | | string[] | Auto-derived by `normalize.js`; manual additions preserved. |
| `proteinScore` | ✓ | int 0–10 | Auto-filled by `normalize.js` if omitted. |
| `confidence` | ✓ | enum | `high` \| `medium` \| `low`. |
| `source` | ✓ | enum | Source code (see `confidence-and-sources.json`). |
| `sourceNote` | | string | Free-text citation detail. |
| `lastReviewed` | ✓ | string | `YYYY-MM-DD`. |

## Validation rules (beyond shape)
- `state`, `category`, `subcategory`, portion `unit`, `source`, tags must exist in the reference files.
- `confidence` must be consistent with `source` (e.g. `USDA` ⇒ high, `recipe-analysis` ⇒ medium).
- Stated `calories` must be within 25% of macro-derived calories (4/4/9) for items ≥20 kcal — catches typos.
- `id` must be globally unique across all foods **and** thalis.

## Thali schema
`schemas/thali.schema.json`. Key field is `components: [{ foodId, unit, quantity, oilStyle?, optional? }]`.
`foodId` must reference an existing food. `computedTotals` is a regenerated cache, not hand-authored.

## Custom-food schema
`schemas/custom-food.schema.json`. Adds `ownerId`, `kind` (`custom-food` | `family-recipe` |
`moms-recipe` | `saved-meal` | `saved-combo`), `isPrivate`, timestamps, and an optional
`components` array (for saved meals/combos). Defaults to `confidence: low`, `source: user-created`.
